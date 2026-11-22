/**
 * Operasi MP4 terfragmentasi (keluaran MediaRecorder) TANPA menyandikan ulang.
 *
 * Kamera merekam dengan SATU MediaRecorder yang dijeda/dilanjutkan, jadi biasanya hasilnya sudah satu berkas utuh
 * dan modul ini tidak dipakai. Modul ini hanya dipakai setelah "hapus klip terakhir":
 *   - ekor sebuah rekaman dipotong pada detik tertentu (jumlah sampel di trun dikurangi, moof disusun ulang);
 *   - rekaman berikutnya (perekam baru) disambungkan: trek dipetakan menurut JENIS (video/suara) karena urutan id
 *     trek bisa berbeda antar-perekam, waktu dekode (tfdt) digeser, nomor urut (mfhd) dibuat naik terus.
 *
 * Mengembalikan null bila strukturnya tidak dikenali atau tidak aman digabung (mis. WebM, konfigurasi codec berbeda)
 * — pemanggil lalu memakai cara cadangan.
 */
const u32 = (b, o) => (((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0);
const w32 = (b, o, v) => { b[o] = (v >>> 24) & 255; b[o + 1] = (v >>> 16) & 255; b[o + 2] = (v >>> 8) & 255; b[o + 3] = v & 255; };
const fourcc = (b, o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

function listBoxes(buf, start = 0, end = buf.length) {
  const out = [];
  let o = start;
  while (o + 8 <= end) {
    let size = u32(buf, o);
    let hdr = 8;
    if (size === 1) { size = u32(buf, o + 8) * 2 ** 32 + u32(buf, o + 12); hdr = 16; }
    else if (size === 0) size = end - o;
    if (size < hdr || o + size > end) throw new Error('kotak tidak utuh');
    out.push({ type: fourcc(buf, o + 4), start: o, size, hdr, end: o + size });
    o += size;
  }
  return out;
}
const kids = (buf, box, type) => listBoxes(buf, box.start + box.hdr, box.end).filter((b) => !type || b.type === type);
const sameBytes = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Baca berkas: bagian awal (ftyp+moov), info trek, dan daftar fragmen (moof + mdat). */
function parseFile(buf) {
  const top = listBoxes(buf);
  const firstMoof = top.findIndex((b) => b.type === 'moof');
  const moov = top.find((b) => b.type === 'moov');
  if (!top.length || top[0].type !== 'ftyp' || !moov || firstMoof < 0 || moov.start > top[firstMoof].start) throw new Error('bukan fMP4');
  const tracks = new Map();
  for (const trak of kids(buf, moov, 'trak')) {
    const tkhd = kids(buf, trak, 'tkhd')[0];
    const mdia = kids(buf, trak, 'mdia')[0];
    const mdhd = kids(buf, mdia, 'mdhd')[0];
    const hdlr = kids(buf, mdia, 'hdlr')[0];
    const minf = kids(buf, mdia, 'minf')[0];
    const stbl = kids(buf, minf, 'stbl')[0];
    const stsd = kids(buf, stbl, 'stsd')[0];
    const tp = tkhd.start + tkhd.hdr; const mp = mdhd.start + mdhd.hdr;
    const id = u32(buf, tp + (buf[tp] === 1 ? 20 : 12));
    tracks.set(id, {
      id,
      kind: fourcc(buf, hdlr.start + hdlr.hdr + 8),
      timescale: u32(buf, mp + (buf[mp] === 1 ? 20 : 12)),
      stsd: buf.subarray(stsd.start, stsd.end),
      defDur: 0
    });
  }
  for (const mvex of kids(buf, moov, 'mvex')) {
    for (const t of kids(buf, mvex, 'trex')) {
      const p = t.start + t.hdr;
      const tr = tracks.get(u32(buf, p + 4));
      if (tr) tr.defDur = u32(buf, p + 12);
    }
  }
  const frags = [];
  for (let i = firstMoof; i < top.length; i += 1) {
    const b = top[i];
    if (b.type === 'moof') frags.push({ moof: buf.slice(b.start, b.end), data: [] });
    else if (b.type === 'mdat' && frags.length) frags[frags.length - 1].data.push(buf.subarray(b.start, b.end));
    // mfra / lainnya setelah fragmen pertama dibuang: isinya (offset) tidak berlaku lagi
  }
  return { init: buf.slice(0, top[firstMoof].start), tracks, frags };
}

/** Uraikan satu moof menjadi mfhd + daftar traf (tfhd, tfdt, satu trun). */
function parseMoof(m, tracks) {
  const root = { start: 0, hdr: 8, end: m.length };
  const mfhd = kids(m, root, 'mfhd')[0];
  const trafs = [];
  for (const traf of kids(m, root, 'traf')) {
    const parts = kids(m, traf);
    const tfhd = parts.find((b) => b.type === 'tfhd');
    const tfdt = parts.find((b) => b.type === 'tfdt');
    const truns = parts.filter((b) => b.type === 'trun');
    if (!tfhd || !tfdt || truns.length !== 1 || parts.length !== 3) throw new Error('traf tidak dikenal');
    const p = tfhd.start + tfhd.hdr;
    const flags = (m[p + 1] << 16) | (m[p + 2] << 8) | m[p + 3];
    if ((flags & 0x1) || !(flags & 0x020000)) throw new Error('offset data absolut');
    const id = u32(m, p + 4);
    const track = tracks.get(id);
    if (!track) throw new Error('trek tidak dikenal');
    let q = p + 8;
    if (flags & 0x2) q += 4;
    const defDur = (flags & 0x8) ? u32(m, q) : track.defDur;
    const t = tfdt.start + tfdt.hdr;
    const wide = m[t] === 1;
    const base = wide ? u32(m, t + 4) * 2 ** 32 + u32(m, t + 8) : u32(m, t + 4);
    const run = truns[0];
    const r = run.start + run.hdr;
    const rf = (m[r + 1] << 16) | (m[r + 2] << 8) | m[r + 3];
    const count = u32(m, r + 4);
    let s = r + 8;
    const dataOffPos = (rf & 0x1) ? s : -1;
    if (rf & 0x1) s += 4;
    if (rf & 0x4) s += 4;
    const entry = 4 * (((rf & 0x100) ? 1 : 0) + ((rf & 0x200) ? 1 : 0) + ((rf & 0x400) ? 1 : 0) + ((rf & 0x800) ? 1 : 0));
    const durs = [];
    for (let i = 0; i < count; i += 1) durs.push((rf & 0x100) ? u32(m, s + i * entry) : defDur);
    trafs.push({ id, track, tfhd, tfdt, run, base, wide, basePos: t + 4, idPos: p + 4, count, entry, entriesStart: s, dataOffPos, durs });
  }
  return { mfhd, trafs };
}

/** Potong ekor: buang semua sampel yang mulai pada/atau setelah `seconds`. */
function truncate(file, seconds) {
  const out = [];
  for (const frag of file.frags) {
    const { mfhd, trafs } = parseMoof(frag.moof, file.tracks);
    const keep = trafs.map((tf) => {
      const cut = Math.round(seconds * tf.track.timescale);
      let t = tf.base; let k = 0;
      while (k < tf.count && t < cut) { t += tf.durs[k]; k += 1; }
      return k;
    });
    if (keep.every((k, i) => k === trafs[i].count)) { out.push(frag); continue; }        // utuh
    if (keep.every((k) => k === 0)) break;                                               // seluruhnya setelah titik potong
    // Susun ulang moof dengan trun yang lebih pendek; mdat dibiarkan (sisa byte di ujung tidak dirujuk lagi)
    const m = frag.moof;
    const pieces = [m.slice(mfhd.start, mfhd.end)];
    const patches = [];
    let len = 8 + mfhd.size;
    trafs.forEach((tf, i) => {
      const k = keep[i];
      if (!k) return;
      const head = m.slice(tf.run.start, tf.entriesStart);                               // kotak trun sampai sebelum entri
      const body = m.slice(tf.entriesStart, tf.entriesStart + k * tf.entry);
      w32(head, 0, head.length + body.length);
      w32(head, tf.run.hdr + 4, k);
      const tfhd = m.slice(tf.tfhd.start, tf.tfhd.end);
      const tfdt = m.slice(tf.tfdt.start, tf.tfdt.end);
      const size = 8 + tfhd.length + tfdt.length + head.length + body.length;
      const hdr = new Uint8Array(8); w32(hdr, 0, size); hdr.set([116, 114, 97, 102], 4);  // 'traf'
      if (tf.dataOffPos >= 0) patches.push({ at: len + 8 + tfhd.length + tfdt.length + (tf.dataOffPos - tf.run.start), old: u32(m, tf.dataOffPos) });
      pieces.push(hdr, tfhd, tfdt, head, body);
      len += size;
    });
    const moof = new Uint8Array(len);
    w32(moof, 0, len); moof.set([109, 111, 111, 102], 4);                                // 'moof'
    let o = 8;
    for (const p of pieces) { moof.set(p, o); o += p.length; }
    const shrink = m.length - len;                                                       // mdat kini lebih dekat ke awal moof
    for (const p of patches) w32(moof, p.at, p.old - shrink);
    out.push({ moof, data: frag.data });
    break;                                                                               // setelah fragmen terpotong tidak ada lagi
  }
  return { ...file, frags: out };
}

/**
 * Gabungkan beberapa rekaman fMP4 menjadi satu.
 * parts: [{ blob, keep }] — keep (detik) = potong ekor rekaman itu sebelum disambung; null = pakai seluruhnya.
 */
export async function joinFmp4(parts) {
  try {
    const files = [];
    for (const part of parts) {
      let file = parseFile(new Uint8Array(await part.blob.arrayBuffer()));
      if (part.keep != null) file = truncate(file, part.keep);
      if (file.frags.length) files.push(file);
    }
    if (!files.length) return null;
    // Trek dicocokkan menurut jenis; skala waktu dan konfigurasi codec harus sama persis
    const byKind = new Map([...files[0].tracks.values()].map((t) => [t.kind, t]));
    for (const f of files.slice(1)) {
      if (f.tracks.size !== byKind.size) return null;
      for (const t of f.tracks.values()) {
        const ref = byKind.get(t.kind);
        if (!ref || ref.timescale !== t.timescale || !sameBytes(ref.stsd, t.stsd)) return null;
      }
    }
    const out = [zeroMovieDuration(files[0].init)];
    const ends = new Map();           // id trek (berkas pertama) → akhir, dalam satuan trek
    let seq = 0;
    for (const f of files) {
      // Satu geseran waktu untuk semua trek berkas ini: sinkron suara–gambar di dalamnya tetap terjaga
      let offset = 0;
      for (const [id, end] of ends) offset = Math.max(offset, end / files[0].tracks.get(id).timescale);
      for (const frag of f.frags) {
        const m = frag.moof.slice();
        const { mfhd, trafs } = parseMoof(m, f.tracks);
        w32(m, mfhd.start + mfhd.hdr + 4, ++seq);
        for (const tf of trafs) {
          const ref = byKind.get(tf.track.kind);
          const base = tf.base + Math.round(offset * ref.timescale);
          if (tf.wide) { w32(m, tf.basePos, Math.floor(base / 2 ** 32)); w32(m, tf.basePos + 4, base % 2 ** 32); }
          else { if (base > 0xFFFFFFFF) return null; w32(m, tf.basePos, base); }
          w32(m, tf.idPos, ref.id);
          ends.set(ref.id, base + tf.durs.reduce((a, d) => a + d, 0));
        }
        out.push(m, ...frag.data);
      }
    }
    return new Blob(out, { type: 'video/mp4' });
  } catch {
    return null;
  }
}

/** Durasi di mvhd/mehd hanya milik rekaman pertama; nolkan supaya pemutar menghitung dari seluruh fragmen. */
function zeroMovieDuration(init) {
  const top = listBoxes(init);
  const moov = top.find((b) => b.type === 'moov');
  const mvhd = kids(init, moov, 'mvhd')[0];
  if (mvhd) {
    const p = mvhd.start + mvhd.hdr;
    if (init[p] === 1) { w32(init, p + 20, 0); w32(init, p + 24, 0); } else w32(init, p + 16, 0);
  }
  for (const mvex of kids(init, moov, 'mvex')) {
    for (const mehd of kids(init, mvex, 'mehd')) {
      const p = mehd.start + mehd.hdr;
      if (init[p] === 1) { w32(init, p + 4, 0); w32(init, p + 8, 0); } else w32(init, p + 4, 0);
    }
  }
  return init;
}

export async function concatFmp4(inputs) {
  if (!Array.isArray(inputs) || !inputs.length) return null;
  const parts = inputs.map((item) => (item instanceof Blob ? { blob: item, keep: null } : item));
  return joinFmp4(parts);
}

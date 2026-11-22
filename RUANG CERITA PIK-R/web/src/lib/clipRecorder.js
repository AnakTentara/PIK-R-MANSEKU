import { baseMime } from './camera.js';
import { joinFmp4 } from './fmp4.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sum = (a) => a.reduce((x, y) => x + y, 0);
const CUT_EPS = 0.03;      // potong sedikit sebelum batas klip supaya bingkai klip yang dihapus tidak ikut

/**
 * Sesi rekaman berklip (mulai → jeda → lanjut → … → selesai, dengan "hapus klip terakhir").
 *
 * Rancangan (hasil pengujian di Chrome):
 *  - SATU MediaRecorder untuk seluruh sesi, dijeda/dilanjutkan dengan pause()/resume(). Hasilnya langsung satu
 *    berkas utuh dengan durasi tepat — tidak ada penggabungan sama sekali. (Membuat perekam baru per klip lalu
 *    menggabungkan berkasnya tidak andal: enkoder butuh waktu menyala, urutan trek bisa berbeda antar-berkas.)
 *  - Jeda/selesai DITUNDA sampai perekam benar-benar mulai (peristiwa 'start'). Menjeda lebih awal merusak rekaman.
 *  - Hapus klip terakhir: perekam ditutup, ekor berkasnya dipotong di batas klip (aman tanpa encode ulang), dan klip
 *    berikutnya memakai perekam baru. Saat selesai, berkas-berkas itu disambung oleh joinFmp4. Bila tidak bisa
 *    (WebM / konfigurasi berbeda), dipakai cara cadangan: putar ulang lalu rekam lagi.
 */
export class ClipSession {
  constructor(stream, { type, videoBps, audioBps = 64_000, width, height, maxBytes = 0, onFull } = {}) {
    this.stream = stream;
    this.type = type;
    this.opts = { videoBps, audioBps, width, height, maxBytes, onFull };
    this.parts = [];        // perekam yang sudah ditutup dan masih punya klip
    this.cur = null;        // perekam aktif (sedang merekam atau dijeda)
    this.finishing = false;
    this.cancelled = false;
  }

  /** Durasi (detik) tiap klip yang sudah selesai, berurutan. */
  get clips() { return [...this.parts.flatMap((p) => p.clips), ...(this.cur ? this.cur.clips : [])]; }
  get running() { return !!this.cur?.running; }
  /** Total detik terekam, termasuk klip yang sedang berjalan (jeda tidak dihitung). */
  get elapsed() { return sum(this.clips) + (this.running ? (performance.now() - this.cur.t0) / 1000 : 0); }
  get bytes() { return sum(this.parts.map((p) => p.bytes)) + (this.cur ? this.cur.bytes : 0); }

  /** Mulai klip: lanjutkan perekam yang dijeda, atau buat perekam baru. Melempar bila perekam tidak bisa dibuat. */
  begin() {
    if (this.finishing || this.running) return;
    if (this.cur) {
      this.cur.recorder.resume();
      this.cur.t0 = performance.now();
      this.cur.running = true;
      return;
    }
    const recorder = new MediaRecorder(this.stream, { ...(this.type ? { mimeType: this.type } : {}), videoBitsPerSecond: this.opts.videoBps, audioBitsPerSecond: this.opts.audioBps });
    const cur = { recorder, chunks: [], clips: [], t0: performance.now(), running: true, started: false, busy: false, bytes: 0, keep: null, blob: null, mime: '' };
    cur.ready = new Promise((res) => { recorder.onstart = () => { cur.started = true; res(); }; });
    cur.done = new Promise((res) => {
      recorder.onstop = () => {
        cur.mime = baseMime(recorder.mimeType || this.type);
        cur.blob = new Blob(cur.chunks, { type: cur.mime });
        cur.chunks = [];
        res();
      };
    });
    recorder.ondataavailable = (e) => {
      if (!e.data.size) return;
      cur.chunks.push(e.data);
      cur.bytes += e.data.size;
      if (this.opts.maxBytes && this.bytes >= this.opts.maxBytes && !this.finishing) this.opts.onFull?.();
    };
    recorder.start(1000);
    this.cur = cur;
  }

  /** Enkoder belum siap: tunggu dulu (maks. 6 detik). */
  async #ready(cur) {
    if (!cur.started) await Promise.race([cur.ready, sleep(6000)]);
  }

  /** Tutup klip yang sedang direkam (jeda). → durasi klip, atau null bila tidak ada yang ditutup. */
  async end() {
    const cur = this.cur;
    if (!cur || !cur.running || cur.busy || this.finishing) return null;
    cur.busy = true;
    await this.#ready(cur);
    cur.busy = false;
    if (this.cur !== cur || !cur.running || this.finishing) return null;
    const dur = (performance.now() - cur.t0) / 1000;
    try { cur.recorder.pause(); } catch { /* abaikan */ }
    cur.running = false;
    cur.clips.push(dur);
    return dur;
  }

  /** Hapus klip terakhir. → true bila ada yang dihapus. */
  undo() {
    if (this.running || this.finishing) return false;
    const cur = this.cur;
    if (cur) {
      if (!cur.clips.length) return false;
      const before = sum(cur.clips);
      cur.clips.pop();
      this.cur = null;
      const keep = sum(cur.clips);
      cur.bytes = before > 0 ? cur.bytes * (keep / before) : 0;
      if (cur.clips.length) { cur.keep = keep; this.parts.push(cur); }
      try { cur.recorder.stop(); } catch { /* sudah berhenti */ }
      return true;
    }
    const last = this.parts[this.parts.length - 1];
    if (!last) return false;
    const before = sum(last.clips);
    last.clips.pop();
    const keep = sum(last.clips);
    last.bytes = before > 0 ? last.bytes * (keep / before) : 0;
    if (last.clips.length) last.keep = keep; else this.parts.pop();
    return true;
  }

  /**
   * Selesai. → { blob, mime, duration } atau null (terlalu singkat / dibatalkan).
   * onProgress(0..1) hanya dipanggil bila harus memakai cara cadangan (encode ulang).
   */
  async finish(onProgress) {
    if (this.finishing) return null;
    this.finishing = true;
    try {
      const cur = this.cur;
      if (cur) {
        if (cur.running) {
          await this.#ready(cur);
          cur.clips.push((performance.now() - cur.t0) / 1000);
          cur.running = false;
        }
        this.cur = null;
        if (cur.clips.length) this.parts.push(cur);
        try { cur.recorder.stop(); } catch { /* sudah berhenti */ }
      }
      await Promise.all(this.parts.map((p) => p.done));
      if (this.cancelled) return null;
      const parts = this.parts.filter((p) => p.blob && p.blob.size > 0 && p.clips.length);
      const duration = sum(parts.flatMap((p) => p.clips));
      if (!parts.length || duration < 0.5) return null;
      let blob = parts[0].blob;
      let mime = parts[0].mime;
      if (parts.length > 1 || parts[0].keep != null) {
        const spec = parts.map((p) => ({ blob: p.blob, keep: p.keep == null ? null : Math.max(0.05, p.keep - CUT_EPS) }));
        blob = parts.every((p) => p.mime.includes('mp4')) ? await joinFmp4(spec) : null;
        if (!blob) blob = await replayMerge(spec, { ...this.opts, type: this.type }, onProgress);
        mime = baseMime(blob.type || mime);
      }
      return { blob, mime, duration };
    } catch (err) {
      this.finishing = false;      // boleh dicoba lagi: berkas tiap perekam masih tersimpan
      throw err;
    }
  }

  cancel() {
    this.cancelled = true;
    const cur = this.cur;
    this.cur = null;
    try { if (cur && cur.recorder.state !== 'inactive') cur.recorder.stop(); } catch { /* abaikan */ }
  }
}

/** Cadangan: putar tiap berkas (sampai batas `keep`) ke kanvas + audio, lalu rekam sekali lagi. Berjalan real-time. */
async function replayMerge(spec, { width, height, type, videoBps, audioBps }, onProgress) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const out = canvas.captureStream(30);
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  const dest = ac.createMediaStreamDestination();
  await ac.resume().catch(() => {});
  dest.stream.getAudioTracks().forEach((t) => out.addTrack(t));
  const rec = new MediaRecorder(out, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: videoBps, audioBitsPerSecond: audioBps });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const started = new Promise((res) => { rec.onstart = res; });
  const stopped = new Promise((res) => { rec.onstop = res; });
  rec.start(1000);
  await Promise.race([started, sleep(6000)]);
  const lens = [];
  for (const part of spec) {
    const v = document.createElement('video');
    v.playsInline = true; v.preload = 'auto';
    const url = URL.createObjectURL(part.blob);
    v.src = url;
    part.v = v; part.url = url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('klip')); });
    lens.push(part.keep ?? (Number.isFinite(v.duration) ? v.duration : 0));
  }
  const total = sum(lens) || 1;
  let done = 0;
  try {
    for (let i = 0; i < spec.length; i += 1) {
      const { v, keep } = spec[i];
      const src = ac.createMediaElementSource(v);
      src.connect(dest);
      let raf = 0;
      let finished = false;
      const end = new Promise((res) => {
        v.onended = res;
        const draw = () => {
          if (finished) return;
          ctx.drawImage(v, 0, 0, width, height);
          onProgress?.(Math.min(1, (done + v.currentTime) / total));
          if (keep != null && v.currentTime >= keep) { res(); return; }
          raf = requestAnimationFrame(draw);
        };
        v.play().then(draw).catch(res);
      });
      await Promise.race([end, sleep((lens[i] || 600) * 1000 + 5000)]);   // jaga-jaga bila 'ended' tidak datang
      finished = true;
      cancelAnimationFrame(raf);
      v.pause();
      done += lens[i];
      try { src.disconnect(); } catch { /* abaikan */ }
    }
  } finally {
    rec.stop();
    await stopped;
    out.getVideoTracks().forEach((t) => t.stop());
    ac.close().catch(() => {});
    for (const part of spec) { part.v?.removeAttribute('src'); part.v?.load(); if (part.url) URL.revokeObjectURL(part.url); }
  }
  return new Blob(chunks, { type: baseMime(rec.mimeType || type) });
}

/**
 * Pengolah foto di perangkat (tanpa pustaka): potong, putar, cermin, filter, penyesuaian, teks.
 * Satu fungsi render dipakai untuk pratinjau DAN hasil akhir, jadi yang terlihat = yang diunggah.
 * Warna diolah per piksel (bukan ctx.filter) supaya hasilnya sama di Chrome, Safari, dan Firefox.
 */

export const ADJUST = [
  { key: 'brightness', label: 'Kecerahan', min: -100, max: 100 },
  { key: 'contrast', label: 'Kontras', min: -100, max: 100 },
  { key: 'saturation', label: 'Saturasi', min: -100, max: 100 },
  { key: 'warmth', label: 'Kehangatan', min: -100, max: 100 },
  { key: 'fade', label: 'Pudar', min: 0, max: 100 },
  { key: 'vignette', label: 'Vinyet', min: 0, max: 100 }
];

/** Filter bawaan = kombinasi penyesuaian (ditambahkan ke slider "Atur"). */
export const FILTERS = [
  { key: 'none', label: 'Asli', v: {} },
  { key: 'hangat', label: 'Hangat', v: { warmth: 35, saturation: 10, brightness: 4 } },
  { key: 'senja', label: 'Senja', v: { warmth: 55, contrast: 12, saturation: 18, vignette: 25 } },
  { key: 'sejuk', label: 'Sejuk', v: { warmth: -35, brightness: 6, saturation: -5 } },
  { key: 'cerah', label: 'Cerah', v: { brightness: 14, contrast: 8, saturation: 14 } },
  { key: 'pudar', label: 'Pudar', v: { fade: 45, saturation: -20, contrast: -10 } },
  { key: 'film', label: 'Film', v: { fade: 22, warmth: 18, contrast: 14, vignette: 30 } },
  { key: 'kontras', label: 'Tegas', v: { contrast: 35, saturation: 8, vignette: 15 } },
  { key: 'klasik', label: 'Klasik', v: { saturation: -100, contrast: 18 } },
  { key: 'arang', label: 'Arang', v: { saturation: -100, contrast: 40, fade: 10, vignette: 35 } }
];

export const TEXT_COLORS = ['#ffffff', '#000000', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#f43f5e'];

/** fit: 'cover' = memenuhi bingkai (terpotong), 'contain' = utuh di atas latar gradasi warna foto (cerita). */
export const emptyEdit = (fitMode = 'cover') => ({ rot: 0, flip: false, zoom: 1, px: 0, py: 0, fit: fitMode, filter: 'none', adj: {}, texts: [] });

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gambar tidak bisa dibuka'));
    img.src = url;
  });
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Ukuran gambar setelah diputar + skala "cover" untuk bingkai w×h. */
function fit(img, st, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const turned = st.rot % 180 !== 0;
  const rw = turned ? ih : iw;
  const rh = turned ? iw : ih;
  const base = st.fit === 'contain' ? Math.min(w / rw, h / rh) : Math.max(w / rw, h / rh);
  return { iw, ih, rw, rh, s: base * st.zoom };
}

/** Batas geser (dinormalisasi terhadap bingkai) supaya gambar selalu menutupi bingkai. */
export function clampPan(img, st, aspect) {
  const w = 1;
  const h = 1 / aspect;
  const { rw, rh, s } = fit(img, st, w, h);
  // Mode utuh: boleh digeser bebas sampai setengah bingkai
  const mx = st.fit === 'contain' ? 0.5 : Math.max(0, (rw * s - w) / 2 / w);
  const my = st.fit === 'contain' ? 0.5 : Math.max(0, (rh * s - h) / 2 / h);
  return { ...st, px: clamp(st.px, -mx, mx), py: clamp(st.py, -my, my) };
}

/** Penyesuaian akhir = filter + slider pengguna. */
function totals(st) {
  const f = FILTERS.find((x) => x.key === st.filter)?.v || {};
  const out = {};
  for (const { key, min, max } of ADJUST) out[key] = clamp((f[key] || 0) + (st.adj?.[key] || 0), min, max);
  return out;
}

/** Olah warna per piksel: LUT per kanal (kehangatan, kecerahan, kontras, pudar) lalu saturasi. */
function colorPass(ctx, w, h, a) {
  if (!a.brightness && !a.contrast && !a.saturation && !a.warmth && !a.fade) return;
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const lut = [new Uint8ClampedArray(256), new Uint8ClampedArray(256), new Uint8ClampedArray(256)];
  const bright = 1 + a.brightness * 0.006;
  const contrast = 1 + a.contrast * 0.01;
  const fade = a.fade / 100;
  const warm = a.warmth / 100;
  for (let c = 0; c < 3; c++) {
    const shift = c === 0 ? warm * 0.09 : c === 2 ? -warm * 0.09 : warm * 0.015;
    for (let i = 0; i < 256; i++) {
      let v = i / 255 + shift;
      v *= bright;
      v = (v - 0.5) * contrast + 0.5;
      v = fade * 0.13 + v * (1 - fade * 0.22);
      lut[c][i] = v * 255;
    }
  }
  const sat = 1 + a.saturation * 0.01;
  const [lr, lg, lb] = lut;
  for (let i = 0; i < px.length; i += 4) {
    let r = lr[px[i]];
    let g = lg[px[i + 1]];
    let b = lb[px[i + 2]];
    if (sat !== 1) {
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat;
    }
    px[i] = r; px[i + 1] = g; px[i + 2] = b;
  }
  ctx.putImageData(data, 0, 0);
}

const edgeCache = new WeakMap();
/** Rata-rata warna sepertiga atas & bawah foto (diperkecil ke 1×3 piksel). */
function edgeColors(img) {
  if (edgeCache.has(img)) return edgeCache.get(img);
  const c = document.createElement('canvas');
  c.width = 1; c.height = 3;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, 1, 3);
  const d = x.getImageData(0, 0, 1, 3).data;
  const dim = (i) => `rgb(${d[i] * 0.8 | 0},${d[i + 1] * 0.8 | 0},${d[i + 2] * 0.8 | 0})`;
  const out = [dim(0), dim(8)];
  edgeCache.set(img, out);
  return out;
}

/** Salinan kecil untuk pratinjau cepat (sisi terpanjang max px). */
export function downscale(img, max = 1280) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const k = Math.min(1, max / Math.max(iw, ih));
  if (k === 1) return img;
  const c = document.createElement('canvas');
  c.width = Math.round(iw * k); c.height = Math.round(ih * k);
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** Rasio foto setelah diputar. */
export function naturalAspect(img, rot = 0) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  return rot % 180 ? ih / iw : iw / ih;
}

function vignette(ctx, w, h, amount) {
  if (!amount) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) / 2);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${(amount / 100) * 0.75})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Teks: ukuran, posisi, rotasi, skala & efek relatif terhadap bingkai. */
export function drawTexts(ctx, w, h, texts) {
  for (const t of texts || []) {
    if (!t.text?.trim()) continue;
    const baseSize = (t.size || 0.07) * w;
    const scale = t.scale || 1;
    const size = baseSize * scale;
    const rot = (t.rot || 0) * (Math.PI / 180);

    ctx.save();
    // Koordinat berpusat di (t.x * w, t.y * h)
    ctx.translate(t.x * w, t.y * h);
    if (rot) ctx.rotate(rot);

    const isBold = t.bold !== false;
    const isItalic = !!t.italic;
    const fontWeight = isBold ? '800' : '400';
    const fontStyle = isItalic ? 'italic' : 'normal';
    ctx.font = `${fontStyle} ${fontWeight} ${size}px Outfit, Inter, system-ui, sans-serif`;

    const align = t.align || 'center';
    const lh = size * 1.28;

    // Batas maksimal lebar konten agar wrap otomatis (84% dari lebar foto)
    const maxContentWidth = w * 0.84;

    // Word wrap otomatis: setiap baris dicek, jika kepanjangan dipecah ke baris baru
    const rawParagraphs = t.text.split('\n');
    const wrappedLines = [];

    for (const para of rawParagraphs) {
      if (!para.trim()) {
        wrappedLines.push('');
        continue;
      }
      const words = para.split(/\s+/);
      let curLine = '';
      for (const word of words) {
        const testLine = curLine ? `${curLine} ${word}` : word;
        const testW = ctx.measureText(testLine).width;
        if (testW <= maxContentWidth || !curLine) {
          curLine = testLine;
        } else {
          wrappedLines.push(curLine);
          curLine = word;
        }
      }
      if (curLine) wrappedLines.push(curLine);
    }

    const lines = wrappedLines.length ? wrappedLines : [''];

    // Hitung dimensi bounding box
    const lineMetrics = lines.map((l) => ({ text: l, width: ctx.measureText(l).width }));
    const maxLineWidth = Math.max(...lineMetrics.map((m) => m.width));

    const padX = size * 0.45;
    const padY = size * 0.28;
    const totalWidth = maxLineWidth + padX * 2;
    const totalHeight = lines.length * lh + padY * 2;

    // Kotak background selalu berpusat simetris di (0, 0)
    // agar 100% konsisten dengan transform: translate(-50%, -50%) di DOM
    const bgX = -totalWidth / 2;
    const bgY = -totalHeight / 2;
    const bgStyle = t.bgStyle || (t.bg ? 'rounded' : 'none');

    if (bgStyle !== 'none') {
      ctx.save();
      const radius = Math.min(size * 0.35, 18);
      if (bgStyle === 'semi') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        roundRect(ctx, bgX, bgY, totalWidth, totalHeight, radius);
        ctx.fill();
      } else if (bgStyle === 'rounded') {
        ctx.fillStyle = t.color || '#fff';
        roundRect(ctx, bgX, bgY, totalWidth, totalHeight, radius);
        ctx.fill();
      } else if (bgStyle === 'box') {
        ctx.fillStyle = t.color || '#fff';
        ctx.fillRect(bgX, bgY, totalWidth, totalHeight);
      }
      ctx.restore();
    }

    // Warna isi teks
    if (bgStyle === 'rounded' || bgStyle === 'box') {
      ctx.fillStyle = isLight(t.color || '#fff') ? '#111' : '#fff';
    } else {
      ctx.fillStyle = t.color || '#ffffff';
    }

    // Efek bersinar (glow) / bayangan halus
    if (t.glow) {
      ctx.shadowColor = t.color || '#ffffff';
      ctx.shadowBlur = size * 0.5;
    } else if (bgStyle === 'none') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = size * 0.25;
      ctx.shadowOffsetY = size * 0.05;
    }

    ctx.textBaseline = 'middle';

    // Gambar setiap baris di dalam area teks yang terpusat
    lines.forEach((l, i) => {
      if (!l) return;
      const y = bgY + padY + (i + 0.5) * lh;
      const m = ctx.measureText(l);
      let x = 0;

      if (align === 'center') {
        ctx.textAlign = 'center';
        x = 0;
        ctx.fillText(l, x, y);
      } else if (align === 'left') {
        ctx.textAlign = 'left';
        x = bgX + padX;
        ctx.fillText(l, x, y);
      } else if (align === 'right') {
        ctx.textAlign = 'right';
        x = bgX + totalWidth - padX;
        ctx.fillText(l, x, y);
      } else if (align === 'justify') {
        const words = l.trim().split(/\s+/);
        const isLastLine = i === lines.length - 1;
        if (words.length <= 1 || isLastLine) {
          ctx.textAlign = 'left';
          x = bgX + padX;
          ctx.fillText(l, x, y);
        } else {
          ctx.textAlign = 'left';
          const wordsW = words.reduce((acc, w) => acc + ctx.measureText(w).width, 0);
          const gap = (maxLineWidth - wordsW) / (words.length - 1);
          let curX = bgX + padX;
          for (const w of words) {
            ctx.fillText(w, curX, y);
            curX += ctx.measureText(w).width + gap;
          }
        }
      }

      // Garis bawah (underline)
      if (t.underline) {
        ctx.save();
        let ux = x;
        if (align === 'center') ux = x - m.width / 2;
        else if (align === 'right') ux = x - m.width;
        ctx.lineWidth = Math.max(1.5, size * 0.08);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.beginPath();
        ctx.moveTo(ux, y + lh * 0.42);
        ctx.lineTo(ux + (align === 'justify' ? maxLineWidth : m.width), y + lh * 0.42);
        ctx.stroke();
        ctx.restore();
      }
    });

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150;
}

/**
 * Gambar foto + semua suntingan ke kanvas berukuran w×h.
 * withText=false dipakai saat menyunting (teks tampil sebagai elemen yang bisa digeser).
 */
export function renderPhoto(canvas, img, st, w, h, { withText = true } = {}) {
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  if (st.fit === 'contain') {
    // Latar foto di-blur seperti Instagram
    try {
      ctx.save();
      const bgScale = Math.max(w / (img.naturalWidth || img.width), h / (img.naturalHeight || img.height)) * 1.15;
      const bgW = (img.naturalWidth || img.width) * bgScale;
      const bgH = (img.naturalHeight || img.height) * bgScale;
      ctx.filter = 'blur(24px) brightness(0.55) saturate(1.5)';
      ctx.drawImage(img, (w - bgW) / 2, (h - bgH) / 2, bgW, bgH);
      ctx.filter = 'none';
      ctx.restore();
    } catch {
      const [top, bottom] = edgeColors(img);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, top);
      g.addColorStop(1, bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
  }
  const { iw, ih, s } = fit(img, st, w, h);
  ctx.save();
  ctx.translate(w / 2 + st.px * w, h / 2 + st.py * h);
  ctx.rotate((st.rot * Math.PI) / 180);
  ctx.scale(st.flip ? -s : s, s);
  ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
  ctx.restore();
  const a = totals(st);
  colorPass(ctx, canvas.width, canvas.height, a);
  vignette(ctx, w, h, a.vignette);
  if (withText) drawTexts(ctx, w, h, st.texts);
  return canvas;
}

/** Ukuran hasil: sisi terpanjang `long`, rasio `aspect` (lebar/tinggi). */
export function outputSize(aspect, long) {
  return aspect >= 1 ? { w: long, h: Math.round(long / aspect) } : { w: Math.round(long * aspect), h: long };
}

/** Hasil akhir sebagai File JPEG (server mengubahnya ke WebP & membuang metadata). */
export async function exportPhoto(img, st, aspect, long = 1440) {
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await document.fonts?.load('800 40px Outfit');
    await document.fonts?.load('400 40px Outfit');
  } catch { /* huruf cadangan */ }
  const { w, h } = outputSize(aspect, long);
  const canvas = renderPhoto(document.createElement('canvas'), img, st, w, h);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Gagal menyimpan foto');
  return { file: new File([blob], `ruang-cerita-${Date.now()}.jpg`, { type: 'image/jpeg' }), w, h };
}

/** Rasio asli dibatasi ke rentang yang didukung feed (9:16 … 16:9). */
export const clampAspect = (a) => clamp(a, 9 / 16, 16 / 9);

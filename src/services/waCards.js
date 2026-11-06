/**
 * Kartu dan tabel bergambar untuk bot WhatsApp.
 *
 * Pesan tombol, daftar, carousel, dan tabel "asli" WhatsApp hanya resmi lewat WhatsApp Business Platform
 * (Cloud API). Lewat WhatsApp Web (Baileys) pesan itu sering tidak sampai atau tidak tampil di HP penerima,
 * dan pustaka modifikasi yang memaksakannya (mis. ourin-baileys) sudah ditandai malware.
 * Jadi kartu dan tabel di sini digambar sebagai PNG (SVG -> resvg) dan dikirim sebagai gambar biasa:
 * tampil sama di semua HP, tanpa pustaka tidak resmi. Teksnya tetap dikirim sebagai caption supaya bisa disalin.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'fonts');
const FONT_FILES = fs.existsSync(FONT_DIR)
  ? fs.readdirSync(FONT_DIR).filter((f) => f.endsWith('.ttf')).map((f) => path.join(FONT_DIR, f))
  : [];

const C = {
  bg: '#fff7ed',
  card: '#ffffff',
  ink: '#1c1917',
  sub: '#57534e',
  muted: '#a8a29e',
  line: '#f1e4d6',
  accent: '#f97316',
  accentDark: '#c2410c',
  soft: '#ffedd5',
  green: '#15803d', greenSoft: '#dcfce7',
  red: '#b91c1c', redSoft: '#fee2e2',
  blue: '#1d4ed8', blueSoft: '#dbeafe',
  amber: '#a16207', amberSoft: '#fef3c7'
};
export const TONES = {
  green: [C.green, C.greenSoft], red: [C.red, C.redSoft], blue: [C.blue, C.blueSoft],
  amber: [C.amber, C.amberSoft], accent: [C.accentDark, C.soft], gray: [C.sub, '#f5f5f4']
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// Perkiraan lebar teks (px) untuk memotong teks panjang tanpa mengukur font
const charW = (size, bold) => size * (bold ? 0.6 : 0.55);
function fit(text, maxPx, size, bold = false) {
  const s = String(text ?? '');
  const max = Math.max(1, Math.floor(maxPx / charW(size, bold)));
  return s.length > max ? `${s.slice(0, Math.max(1, max - 1)).trimEnd()}…` : s;
}
function wrap(text, maxPx, size, maxLines = 3) {
  const max = Math.max(4, Math.floor(maxPx / charW(size)));
  const lines = [];
  let cur = '';
  for (const word of String(text ?? '').split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > max && cur) { lines.push(cur); cur = word; } else cur = next;
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && lines.join(' ').length < String(text).trim().length) lines[maxLines - 1] = fit(`${lines[maxLines - 1]}…`, maxPx, size);
  return lines;
}

function render(svg, width) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * 2 },
    font: { fontFiles: FONT_FILES, loadSystemFonts: FONT_FILES.length === 0, defaultFontFamily: 'Inter' }
  });
  return r.render().asPng();
}

const header = (W, title, subtitle) => `
  <rect x="0" y="0" width="${W}" height="96" fill="url(#hd)"/>
  <circle cx="${W - 40}" cy="8" r="70" fill="#ffffff" fill-opacity="0.08"/>
  <circle cx="${W - 120}" cy="96" r="44" fill="#ffffff" fill-opacity="0.07"/>
  <text x="28" y="36" font-family="Inter" font-weight="700" font-size="13" fill="#ffffff" fill-opacity="0.85" letter-spacing="1.6">PIK-R MANSEKU</text>
  <text x="28" y="68" font-family="Outfit" font-weight="800" font-size="26" fill="#ffffff">${esc(fit(title, W - 56, 26, true))}</text>
  ${subtitle ? `<text x="28" y="88" font-family="Inter" font-size="13" fill="#ffffff" fill-opacity="0.9">${esc(fit(subtitle, W - 56, 13))}</text>` : ''}`;

const defs = `<defs>
  <linearGradient id="hd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#c2410c"/></linearGradient>
  <filter id="sh" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#9a3412" flood-opacity="0.12"/></filter>
</defs>`;

const footerText = (W, H, text) => `<text x="${W / 2}" y="${H - 18}" text-anchor="middle" font-family="Inter" font-size="11" fill="${C.muted}">${esc(text)}</text>`;

/**
 * Kartu info.
 * { title, subtitle?, badge?: { text, tone }, rows: [{ label, value, tone? }], note?, footer? }
 */
export function renderCard({ title, subtitle, badge, rows = [], note, footer = 'Bot resmi PIK-R MANSEKU · MAN 1 Muara Enim' }) {
  const W = 640;
  const rowH = 46;
  const noteLines = note ? wrap(note, W - 96, 14, 4) : [];
  const badgeH = badge ? 54 : 0;
  const bodyH = 24 + badgeH + rows.length * rowH + (noteLines.length ? 22 + noteLines.length * 20 : 0) + 16;
  const H = 96 + 20 + bodyH + 52;
  let y = 96 + 20 + 24;
  let body = '';
  if (badge) {
    const [fg, bg] = TONES[badge.tone] || TONES.accent;
    const bw = Math.min(W - 96, 40 + String(badge.text).length * 10);
    body += `<rect x="48" y="${y - 6}" width="${bw}" height="34" rx="17" fill="${bg}"/>
      <text x="${48 + bw / 2}" y="${y + 16}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="15" fill="${fg}">${esc(fit(badge.text, bw - 20, 15, true))}</text>`;
    y += badgeH;
  }
  rows.forEach((r, i) => {
    const [fg] = TONES[r.tone] || [C.ink];
    body += `${i ? `<line x1="48" y1="${y - 14}" x2="${W - 48}" y2="${y - 14}" stroke="${C.line}" stroke-width="1"/>` : ''}
      <text x="48" y="${y + 8}" font-family="Inter" font-weight="600" font-size="13" fill="${C.sub}">${esc(fit(r.label, 190, 13, true))}</text>
      <text x="${W - 48}" y="${y + 8}" text-anchor="end" font-family="Inter" font-weight="700" font-size="16" fill="${fg}">${esc(fit(r.value, W - 300, 16, true))}</text>`;
    y += rowH;
  });
  if (noteLines.length) {
    y += 6;
    body += `<rect x="40" y="${y - 18}" width="${W - 80}" height="${noteLines.length * 20 + 20}" rx="14" fill="${C.soft}"/>`;
    noteLines.forEach((l, i) => { body += `<text x="56" y="${y + i * 20 + 4}" font-family="Inter" font-size="14" fill="${C.accentDark}">${esc(l)}</text>`; });
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${header(W, title, subtitle)}
    <rect x="24" y="${96 + 20}" width="${W - 48}" height="${bodyH}" rx="22" fill="${C.card}" filter="url(#sh)"/>
    ${body}
    ${footerText(W, H, footer)}
  </svg>`;
  return render(svg, W);
}

/**
 * Tabel. columns: [{ key, label, width (bagian relatif), align?: 'left'|'center'|'right', tone?: (row)=>tone }]
 * Baris di atas `maxRows` diringkas menjadi "+N lainnya".
 */
export function renderTable({ title, subtitle, columns, rows = [], maxRows = 30, footer = 'Bot resmi PIK-R MANSEKU · MAN 1 Muara Enim' }) {
  const W = 760;
  const pad = 40;
  const rowH = 38;
  const shown = rows.slice(0, maxRows);
  const more = rows.length - shown.length;
  const total = columns.reduce((a, c) => a + (c.width || 1), 0);
  const inner = W - pad * 2;
  let x = pad;
  const cols = columns.map((c) => { const w = (inner * (c.width || 1)) / total; const col = { ...c, x, w }; x += w; return col; });
  const tableTop = 96 + 24;
  const H = tableTop + 44 + Math.max(1, shown.length) * rowH + (more > 0 ? 34 : 0) + 64;
  const cellX = (c) => (c.align === 'right' ? c.x + c.w - 12 : c.align === 'center' ? c.x + c.w / 2 : c.x + 12);
  const anchor = (c) => (c.align === 'right' ? 'end' : c.align === 'center' ? 'middle' : 'start');
  let body = `<rect x="${pad}" y="${tableTop}" width="${inner}" height="40" rx="12" fill="${C.soft}"/>`;
  cols.forEach((c) => {
    body += `<text x="${cellX(c)}" y="${tableTop + 25}" text-anchor="${anchor(c)}" font-family="Inter" font-weight="800" font-size="12" letter-spacing="0.6" fill="${C.accentDark}">${esc(fit(String(c.label).toUpperCase(), c.w - 16, 12, true))}</text>`;
  });
  let y = tableTop + 44;
  if (!shown.length) {
    body += `<text x="${W / 2}" y="${y + 24}" text-anchor="middle" font-family="Inter" font-size="14" fill="${C.muted}">Tidak ada data.</text>`;
  }
  shown.forEach((r, i) => {
    if (i % 2) body += `<rect x="${pad}" y="${y}" width="${inner}" height="${rowH}" rx="8" fill="#fffaf5"/>`;
    cols.forEach((c) => {
      const v = r[c.key];
      const tone = c.tone?.(r);
      if (tone) {
        const [fg, bg] = TONES[tone] || TONES.gray;
        const t = fit(v, c.w - 24, 12, true);
        const bw = Math.min(c.w - 12, 22 + t.length * 7.4);
        const bx = c.align === 'center' ? c.x + (c.w - bw) / 2 : c.align === 'right' ? c.x + c.w - bw - 6 : c.x + 6;
        body += `<rect x="${bx}" y="${y + 8}" width="${bw}" height="22" rx="11" fill="${bg}"/>
          <text x="${bx + bw / 2}" y="${y + 23}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="12" fill="${fg}">${esc(t)}</text>`;
      } else {
        body += `<text x="${cellX(c)}" y="${y + 24}" text-anchor="${anchor(c)}" font-family="Inter" font-weight="${c.bold ? 700 : 400}" font-size="14" fill="${c.bold ? C.ink : C.sub}">${esc(fit(v, c.w - 20, 14, c.bold))}</text>`;
      }
    });
    y += rowH;
  });
  if (more > 0) body += `<text x="${W / 2}" y="${y + 22}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="13" fill="${C.sub}">+${more} baris lainnya</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}
    <rect width="${W}" height="${H}" fill="${C.bg}"/>
    ${header(W, title, subtitle)}
    <rect x="${pad - 16}" y="${tableTop - 12}" width="${inner + 32}" height="${H - tableTop - 40}" rx="22" fill="${C.card}" filter="url(#sh)"/>
    ${body}
    ${footerText(W, H, footer)}
  </svg>`;
  return render(svg, W);
}

/** Gambar QR untuk menghubungkan bot (dipakai jika dibutuhkan sebagai PNG, mis. diunduh). */
export function renderSvg(svg, width) {
  return render(svg, width);
}

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

/**
 * Render 4:3 Landscape Card Rekapitulasi Presensi PIK-R MANSEKU untuk WhatsApp.
 * W: 1200, H: 900
 */
export function renderRekapCard({ dateStr, sessionTitle, sessionType, totals, totalAnggota }) {
  const W = 1200;
  const H = 900;
  const totalPresensi = totals.HADIR + totals.ALFA + totals.IZIN + totals.SAKIT;
  const pct = totalPresensi > 0 ? Math.round((totals.HADIR / totalPresensi) * 100) : 0;

  // Donut Arc calculation (Radius 105)
  const circ = 2 * Math.PI * 105; // ~659.73
  const dashOffset = circ * (1 - pct / 100);

  // Logo base64
  const logoPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'media', 'logos', 'logo_pik-r.png');
  const logoBase64 = fs.existsSync(logoPath) ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}` : null;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fbf8f5"/><stop offset="1" stop-color="#ede5dc"/>
      </linearGradient>
      <linearGradient id="hadirGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f0fdf4"/><stop offset="1" stop-color="#dcfce7"/>
      </linearGradient>
      <linearGradient id="izinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fffbeb"/><stop offset="1" stop-color="#fef3c7"/>
      </linearGradient>
      <linearGradient id="sakitGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eff6ff"/><stop offset="1" stop-color="#dbeafe"/>
      </linearGradient>
      <linearGradient id="alfaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fef2f2"/><stop offset="1" stop-color="#fee2e2"/>
      </linearGradient>
      <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'}"/>
        <stop offset="1" stop-color="${pct >= 75 ? '#15803d' : pct >= 50 ? '#d97706' : '#dc2626'}"/>
      </linearGradient>
      <filter id="shClay" x="-5%" y="-5%" width="112%" height="116%">
        <feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#96785f" flood-opacity="0.18"/>
      </filter>
      <filter id="shMini" x="-5%" y="-5%" width="112%" height="116%">
        <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#96785f" flood-opacity="0.15"/>
      </filter>
      <clipPath id="logoClip">
        <circle cx="111" cy="108" r="41"/>
      </clipPath>
    </defs>

    <!-- Background -->
    <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
    <circle cx="160" cy="140" r="300" fill="#f97316" fill-opacity="0.06"/>
    <circle cx="1080" cy="780" r="320" fill="#2563eb" fill-opacity="0.05"/>

    <!-- 1. Header Card -->
    <rect x="45" y="40" width="1110" height="136" rx="26" fill="#fdfbf9" stroke="rgba(255,255,255,0.95)" stroke-width="2" filter="url(#shClay)"/>
    
    <!-- Logo -->
    <circle cx="111" cy="108" r="44" fill="#ffffff" filter="url(#shMini)"/>
    ${logoBase64 ? `<image href="${logoBase64}" x="70" y="67" width="82" height="82" clip-path="url(#logoClip)"/>` : `<text x="111" y="116" text-anchor="middle" font-family="Outfit" font-weight="900" font-size="24" fill="#ea580c">PIK-R</text>`}

    <!-- Header Text -->
    <rect x="176" y="60" width="148" height="26" rx="13" fill="#ffe6d3" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
    <text x="250" y="77" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="12" fill="#b8430a">PIK-R MANSEKU</text>
    <text x="176" y="118" font-family="Outfit" font-weight="800" font-size="26" fill="#2a1f17">${esc(fit(sessionTitle, 580, 26, true))}</text>
    <text x="176" y="146" font-family="Inter" font-weight="600" font-size="16" fill="#62523f">🗓️ ${esc(dateStr)}</text>

    <!-- Header Badge Kanan -->
    <rect x="930" y="87" width="190" height="42" rx="21" fill="#ffffff" stroke="rgba(249,115,22,0.3)" stroke-width="1.5" filter="url(#shMini)"/>
    <circle cx="952" cy="108" r="5" fill="#f97316"/>
    <text x="965" y="113" font-family="Outfit" font-weight="700" font-size="13" fill="#b8430a">${esc(sessionType)}</text>

    <!-- 2. KIRI ATAS: HADIR (Memanjang) -->
    <rect x="45" y="198" width="705" height="245" rx="26" fill="url(#hadirGrad)" stroke="rgba(34,197,94,0.55)" stroke-width="2" filter="url(#shClay)"/>
    <circle cx="103" cy="260" r="22" fill="#16a34a" filter="url(#shMini)"/>
    <path d="M 95 260 L 101 266 L 112 254" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="140" y="267" font-family="Outfit" font-weight="800" font-size="20" fill="#15803d">HADIR</text>
    <text x="81" y="323" font-family="Inter" font-weight="500" font-size="14" fill="#166534">Anggota hadir tepat waktu di kegiatan</text>
    
    <rect x="81" y="353" width="160" height="36" rx="12" fill="rgba(34,197,94,0.16)" stroke="rgba(34,197,94,0.35)" stroke-width="1.5"/>
    <text x="161" y="375" text-anchor="middle" font-family="Outfit" font-weight="700" font-size="13" fill="#15803d">${pct}% dari total presensi</text>

    <text x="595" y="343" text-anchor="end" font-family="Outfit" font-weight="900" font-size="84" fill="#15803d">${totals.HADIR}</text>
    <text x="607" y="329" text-anchor="start" font-family="Inter" font-weight="700" font-size="20" fill="#166534">Orang</text>

    <!-- 3. KIRI BAWAH: IZIN, SAKIT, ALFA (3 Berjejer) -->
    <!-- IZIN -->
    <rect x="45" y="465" width="223" height="273" rx="22" fill="url(#izinGrad)" stroke="rgba(245,158,11,0.5)" stroke-width="2" filter="url(#shMini)"/>
    <circle cx="84" cy="510" r="17" fill="#d97706"/>
    <rect x="75" y="504" width="18" height="13" fill="none" stroke="#ffffff" stroke-width="2.2" rx="2"/>
    <path d="M 75 505 L 84 511 L 93 505" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
    <text x="112" y="516" font-family="Outfit" font-weight="800" font-size="16" fill="#b45309">IZIN</text>
    <text x="156.5" y="605" text-anchor="middle" font-family="Outfit" font-weight="900" font-size="62" fill="#b45309">${totals.IZIN}</text>
    <text x="156.5" y="633" text-anchor="middle" font-family="Inter" font-weight="700" font-size="15" fill="#b45309">Orang</text>
    <text x="156.5" y="714" text-anchor="middle" font-family="Inter" font-weight="500" font-size="12" fill="#62523f">Izin resmi / surat</text>

    <!-- SAKIT -->
    <rect x="286" y="465" width="223" height="273" rx="22" fill="url(#sakitGrad)" stroke="rgba(59,130,246,0.5)" stroke-width="2" filter="url(#shMini)"/>
    <circle cx="325" cy="510" r="17" fill="#2563eb"/>
    <path d="M 317 510 L 333 510 M 325 502 L 325 518" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <text x="353" y="516" font-family="Outfit" font-weight="800" font-size="16" fill="#1d4ed8">SAKIT</text>
    <text x="397.5" y="605" text-anchor="middle" font-family="Outfit" font-weight="900" font-size="62" fill="#1d4ed8">${totals.SAKIT}</text>
    <text x="397.5" y="633" text-anchor="middle" font-family="Inter" font-weight="700" font-size="15" fill="#1d4ed8">Orang</text>
    <text x="397.5" y="714" text-anchor="middle" font-family="Inter" font-weight="500" font-size="12" fill="#62523f">Kondisi sakit</text>

    <!-- ALFA -->
    <rect x="527" y="465" width="223" height="273" rx="22" fill="url(#alfaGrad)" stroke="rgba(239,68,68,0.5)" stroke-width="2" filter="url(#shMini)"/>
    <circle cx="566" cy="510" r="17" fill="#dc2626"/>
    <path d="M 559 503 L 573 517 M 573 503 L 559 517" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <text x="594" y="516" font-family="Outfit" font-weight="800" font-size="16" fill="#b91c1c">ALFA</text>
    <text x="638.5" y="605" text-anchor="middle" font-family="Outfit" font-weight="900" font-size="62" fill="#b91c1c">${totals.ALFA}</text>
    <text x="638.5" y="633" text-anchor="middle" font-family="Inter" font-weight="700" font-size="15" fill="#b91c1c">Orang</text>
    <text x="638.5" y="714" text-anchor="middle" font-family="Inter" font-weight="500" font-size="12" fill="#62523f">${totals.ALFA > 0 ? 'Tanpa keterangan' : 'Nihil / Tertib'}</text>

    <!-- 4. KANAN: PERSENTASE KEHADIRAN (DONUT CHART) -->
    <rect x="770" y="198" width="385" height="540" rx="28" fill="#fcf9f6" stroke="rgba(255,255,255,0.95)" stroke-width="2" filter="url(#shClay)"/>
    <text x="962.5" y="242" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="22" fill="#2a1f17">Persentase Kehadiran</text>
    <text x="962.5" y="268" text-anchor="middle" font-family="Inter" font-weight="500" font-size="13" fill="#766759">Rasio kehadiran anggota presensi</text>

    <!-- Donut Circle -->
    <circle cx="962.5" cy="415" r="105" fill="none" stroke="#ebe4dc" stroke-width="26"/>
    ${pct > 0 ? `<circle cx="962.5" cy="415" r="105" fill="none" stroke="url(#arcGrad)" stroke-width="26" stroke-linecap="round" stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}" transform="rotate(-90 962.5 415)"/>` : ''}
    <circle cx="962.5" cy="415" r="76" fill="#ffffff" filter="url(#shMini)"/>
    <text x="962.5" y="423" text-anchor="middle" font-family="Outfit" font-weight="900" font-size="48" fill="#2a1f17">${pct}%</text>
    <text x="962.5" y="445" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="13" fill="${pct >= 75 ? '#15803d' : pct >= 50 ? '#b45309' : '#b91c1c'}">TINGKAT KEHADIRAN</text>

    <!-- Pill Ringkasan -->
    <rect x="794" y="593" width="337" height="46" rx="16" fill="#f3eee8" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"/>
    <text x="812" y="622" font-family="Inter" font-weight="600" font-size="13" fill="#766759">Total Peserta Terabsen</text>
    <text x="1113" y="622" text-anchor="end" font-family="Outfit" font-weight="800" font-size="15" fill="#2a1f17">${totalPresensi} Orang</text>

    <rect x="794" y="651" width="337" height="46" rx="16" fill="#f3eee8" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"/>
    <text x="812" y="680" font-family="Inter" font-weight="600" font-size="13" fill="#766759">Total Anggota Terdaftar</text>
    <text x="1113" y="680" text-anchor="end" font-family="Outfit" font-weight="800" font-size="15" fill="#2a1f17">${totalAnggota} Anggota</text>

    <!-- 5. FOOTER CARD -->
    <rect x="45" y="768" width="1110" height="92" rx="24" fill="#fcf9f6" stroke="rgba(255,255,255,0.95)" stroke-width="2" filter="url(#shClay)"/>
    
    <!-- Instagram -->
    <rect x="75" y="803" width="22" height="22" rx="6" fill="none" stroke="#e1306c" stroke-width="2.4"/>
    <circle cx="86" cy="814" r="5.5" fill="none" stroke="#e1306c" stroke-width="2.4"/>
    <circle cx="92" cy="808" r="1.4" fill="#e1306c"/>
    <text x="107" y="819" font-family="Outfit" font-weight="800" font-size="16" fill="#2a1f17">@pikrmanseku_official</text>

    <!-- Motto -->
    <text x="600" y="819" text-anchor="middle" font-family="Inter" font-style="italic" font-weight="600" font-size="15" fill="#766759">“Beriman, Bertanggung Jawab, Berencana”</text>

    <!-- Website -->
    <text x="1125" y="819" text-anchor="end" font-family="Outfit" font-weight="800" font-size="16" fill="#2563eb">pikr-manseku.my.id</text>
    <circle cx="965" cy="814" r="10" fill="none" stroke="#2563eb" stroke-width="2.4"/>
    <line x1="955" y1="814" x2="975" y2="814" stroke="#2563eb" stroke-width="2.4"/>
    <ellipse cx="965" cy="814" rx="4.5" ry="9.8" fill="none" stroke="#2563eb" stroke-width="2.4"/>
  </svg>`;

  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONT_FILES, loadSystemFonts: FONT_FILES.length === 0, defaultFontFamily: 'Inter' }
  });
  return r.render().asPng();
}


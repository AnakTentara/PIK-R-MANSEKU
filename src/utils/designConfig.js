/**
 * Desain situs & kartu biodata.
 *
 *  - SITE_DESIGN (Setting)   : tema warna situs, font, sudut, bayangan, gaya kartu biodata bawaan, tampilan halaman /@slug.
 *  - Member.cardConfig (JSON): kustomisasi kartu biodata per anggota (cover, foto kartu, kartu info, bagian yang disembunyikan).
 *
 * SEMUA nilai disaring di sini (daftar putih). Frontend memakainya sebagai variabel CSS, jadi tidak boleh
 * ada nilai bebas yang bisa menyuntik CSS/HTML.
 */
import prisma from '../config/db.js';

const SETTING_KEY = 'SITE_DESIGN';

export const THEMES = {
  jingga:   { label: 'Jingga PIK-R', accent: '#f97316', hover: '#ea580c', dark: '#c2410c', soft: '#fff1e6', bg: '#f8fafc', ink: '#0f172a' },
  laut:     { label: 'Biru Laut',    accent: '#0ea5e9', hover: '#0284c7', dark: '#0369a1', soft: '#e0f2fe', bg: '#f8fafc', ink: '#0f172a' },
  hutan:    { label: 'Hijau Hutan',  accent: '#16a34a', hover: '#15803d', dark: '#166534', soft: '#dcfce7', bg: '#f7fdf9', ink: '#052e16' },
  ungu:     { label: 'Ungu Senja',   accent: '#8b5cf6', hover: '#7c3aed', dark: '#6d28d9', soft: '#ede9fe', bg: '#faf8ff', ink: '#1e1b4b' },
  mawar:    { label: 'Merah Mawar',  accent: '#e11d48', hover: '#be123c', dark: '#9f1239', soft: '#ffe4e6', bg: '#fffafa', ink: '#4c0519' },
  tosca:    { label: 'Tosca Segar',  accent: '#14b8a6', hover: '#0d9488', dark: '#0f766e', soft: '#ccfbf1', bg: '#f6fefd', ink: '#042f2e' },
  emas:     { label: 'Emas Hangat',  accent: '#d97706', hover: '#b45309', dark: '#92400e', soft: '#fef3c7', bg: '#fffdf7', ink: '#451a03' },
  malam:    { label: 'Malam Gelap',  accent: '#fb923c', hover: '#f97316', dark: '#fdba74', soft: 'rgba(251,146,60,.14)', bg: '#0f172a', ink: '#f1f5f9', dark_mode: true }
};

export const FONTS = {
  bawaan:  { label: 'Bawaan (Outfit + Inter)', display: "'Outfit', 'Inter', sans-serif", sans: "'Inter', system-ui, sans-serif" },
  klasik:  { label: 'Klasik (Georgia)',        display: "Georgia, 'Times New Roman', serif", sans: "'Inter', system-ui, sans-serif" },
  modern:  { label: 'Modern (Segoe UI)',       display: "'Segoe UI', system-ui, sans-serif", sans: "'Segoe UI', system-ui, sans-serif" },
  ramah:   { label: 'Ramah (Trebuchet)',       display: "'Trebuchet MS', 'Segoe UI', sans-serif", sans: "'Trebuchet MS', 'Segoe UI', sans-serif" }
};

export const RADII = { tegas: 6, sedang: 10, lembut: 14, bulat: 20 };
export const SHADOWS = { datar: 'none', halus: '0 4px 16px rgba(0,0,0,.08)', timbul: '0 12px 32px rgba(0,0,0,.14)' };

export const CARD_STYLES = ['portofolio', 'klasik', 'kaca', 'minimal'];
export const COVERS = {
  gradasi:  { label: 'Gradasi tema' },
  garis:    { label: 'Garis diagonal' },
  titik:    { label: 'Titik-titik' },
  gelombang:{ label: 'Gelombang' },
  polos:    { label: 'Polos' },
  foto:     { label: 'Foto sendiri' }
};
export const CARD_SECTIONS = ['bio', 'kelas', 'gender', 'asalSekolah', 'angkatan', 'idAnggota'];
export const INFO_ICONS = ['star', 'heart', 'book', 'music', 'camera', 'trophy', 'code', 'game', 'sport', 'food', 'travel', 'quote'];

export const DEFAULT_DESIGN = {
  theme: 'jingga',
  customAccent: null,
  font: 'bawaan',
  radius: 'lembut',
  shadow: 'halus',
  card: {
    style: 'portofolio',
    cover: 'gradasi',
    defaultThumb: null,           // URL foto bawaan untuk anggota tanpa foto
    showMemberCode: true,
    allowMemberEdit: true,        // anggota boleh mengatur kartunya sendiri
    hidden: []                    // bagian yang disembunyikan untuk semua kartu
  }
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const isUpload = (v) => typeof v === 'string' && /^\/uploads\/[A-Za-z0-9/_\-.]+$/.test(v) && !v.includes('..');
const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);
const text = (v, max) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Warna dasar -> turunan hover/dark/soft (dipakai saat admin memilih warna bebas). */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2, '0');
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
}
export function deriveTheme(accent) {
  const n = parseInt(accent.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  return { accent, hover: shade(accent, -22), dark: shade(accent, -55), soft: `rgba(${r},${g},${b},.12)`, bg: '#f8fafc', ink: '#0f172a' };
}

export function sanitizeDesign(input = {}) {
  const d = DEFAULT_DESIGN;
  const c = input.card || {};
  return {
    theme: pick(input.theme, Object.keys(THEMES), d.theme),
    customAccent: HEX.test(input.customAccent || '') ? input.customAccent.toLowerCase() : null,
    font: pick(input.font, Object.keys(FONTS), d.font),
    radius: pick(input.radius, Object.keys(RADII), d.radius),
    shadow: pick(input.shadow, Object.keys(SHADOWS), d.shadow),
    card: {
      style: pick(c.style, CARD_STYLES, d.card.style),
      cover: pick(c.cover, Object.keys(COVERS).filter((k) => k !== 'foto'), d.card.cover),
      defaultThumb: isUpload(c.defaultThumb) ? c.defaultThumb : null,
      showMemberCode: c.showMemberCode !== false,
      allowMemberEdit: c.allowMemberEdit !== false,
      hidden: Array.isArray(c.hidden) ? [...new Set(c.hidden.filter((h) => CARD_SECTIONS.includes(h)))] : []
    }
  };
}

/** Kustomisasi kartu satu anggota. */
export function sanitizeCardConfig(input = {}) {
  // Buang butir kosong DULU, baru batasi 6, supaya butir kosong tidak memakan slot
  const info = (Array.isArray(input.info) ? input.info : [])
    .map((i) => ({
      icon: pick(i?.icon, INFO_ICONS, 'star'),
      label: text(i?.label, 30),
      value: text(i?.value, 80)
    }))
    .filter((i) => i.label && i.value)
    .slice(0, 6);
  return {
    cover: pick(input.cover, Object.keys(COVERS), null),
    coverPhoto: isUpload(input.coverPhoto) ? input.coverPhoto : null,
    cardPhoto: isUpload(input.cardPhoto) ? input.cardPhoto : null,   // foto khusus kartu (terpisah dari foto profil)
    accent: HEX.test(input.accent || '') ? input.accent.toLowerCase() : null,
    hidden: Array.isArray(input.hidden) ? [...new Set(input.hidden.filter((h) => CARD_SECTIONS.includes(h)))] : [],
    info
  };
}

export async function getDesign() {
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!row) return DEFAULT_DESIGN;
  try { return sanitizeDesign(JSON.parse(row.value)); } catch { return DEFAULT_DESIGN; }
}

export async function saveDesign(input) {
  const clean = sanitizeDesign(input);
  const value = JSON.stringify(clean);
  await prisma.setting.upsert({ where: { key: SETTING_KEY }, update: { value }, create: { key: SETTING_KEY, value } });
  return clean;
}

/** Variabel CSS siap pakai (frontend menaruhnya di :root). */
export function toCssVars(design) {
  const t = design.customAccent ? deriveTheme(design.customAccent) : (THEMES[design.theme] || THEMES.jingga);
  const f = FONTS[design.font] || FONTS.bawaan;
  const vars = {
    '--color-accent': t.accent,
    '--color-accent-hover': t.hover,
    '--color-accent-light': t.light || shade(t.accent, 45),
    '--color-accent-dark': t.dark,
    '--color-accent-subtle': t.soft,
    '--color-accent-border': `${t.accent}40`,
    '--font-display': f.display,
    '--font-sans': f.sans,
    '--radius-md': `${RADII[design.radius]}px`,
    '--radius-lg': `${RADII[design.radius] + 4}px`,
    '--shadow-md': SHADOWS[design.shadow]
  };
  if (!design.customAccent && t.dark_mode) {
    Object.assign(vars, {
      '--color-bg': t.bg, '--color-surface': '#1e293b', '--color-surface-2': '#273449', '--color-surface-3': '#334155',
      '--color-text-primary': t.ink, '--color-text-secondary': '#cbd5e1', '--color-text-muted': '#94a3b8',
      '--color-border': 'rgba(255,255,255,.08)', '--color-border-strong': '#334155'
    });
  }
  return vars;
}

export function catalogForClient() {
  return {
    themes: Object.entries(THEMES).map(([key, v]) => ({ key, ...v })),
    fonts: Object.entries(FONTS).map(([key, v]) => ({ key, label: v.label })),
    radii: Object.keys(RADII),
    shadows: Object.keys(SHADOWS),
    cardStyles: CARD_STYLES,
    covers: Object.entries(COVERS).map(([key, v]) => ({ key, ...v })),
    sections: CARD_SECTIONS,
    infoIcons: INFO_ICONS
  };
}

/**
 * Tema situs dari halaman Desain.
 *
 * Variabel CSS terakhir disimpan di localStorage dan dipasang SEBELUM React tampil,
 * supaya halaman tidak berkedip dari oranye ke tema pilihan. Setelah itu tema segar diambil dari server.
 * Dashboard admin tidak ikut ditema (tetap oranye PIK-R) agar tampilan kerja stabil.
 */
const KEY = 'pikr_site_theme_vars';
const STYLE_ID = 'pikr-site-theme';

// Hanya variabel ini yang boleh dipasang (lapis kedua setelah daftar putih di server)
const ALLOWED = /^--(color-[a-z0-9-]+|font-(display|sans)|radius-(md|lg)|shadow-md)$/;
const SAFE_VALUE = /^[#a-zA-Z0-9\s,.%()'\-+/]+$/;

export function applyThemeVars(vars) {
  if (!vars || typeof vars !== 'object') return;
  const css = Object.entries(vars)
    .filter(([k, v]) => ALLOWED.test(k) && typeof v === 'string' && SAFE_VALUE.test(v) && !/url\s*\(|javascript:|expression/i.test(v))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  // Tidak menimpa dashboard admin
  el.textContent = css ? `html:not([data-admin]){${css}}` : '';
}

export function loadCachedTheme() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) applyThemeVars(JSON.parse(raw));
  } catch { /* abaikan */ }
}

export async function refreshTheme() {
  try {
    const res = await fetch('/api/public/design', { headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const { vars } = await res.json();
    applyThemeVars(vars);
    try { localStorage.setItem(KEY, JSON.stringify(vars)); } catch { /* abaikan */ }
  } catch { /* offline: pakai cache */ }
}

export function previewTheme(vars) {
  applyThemeVars(vars);
}

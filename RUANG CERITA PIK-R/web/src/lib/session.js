import { create } from 'zustand';

/** Penyimpanan aman: localStorage bisa melempar error di mode privat. */
export const store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* abaikan */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* abaikan */ } }
};

/**
 * Sesi anggota. Token sama dengan situs utama (login NISN) tapi disimpan terpisah,
 * karena Ruang Cerita ada di subdomain sendiri.
 */
export const useSession = create((set) => ({
  token: store.get('rc_token'),
  me: null,         // { user, counts, settings, isCounselor, frozen, ... } dari /rc/me
  badges: { notifs: 0, dms: 0, dmRequests: 0, counselWaiting: 0 },
  login(token) { store.set('rc_token', token); set({ token }); },
  setMe(me) { set({ me }); },
  patchMe(fn) { set((s) => ({ me: s.me ? fn(s.me) : s.me })); },
  setBadges(b) { set((s) => ({ badges: { ...s.badges, ...b } })); },
  logout() { store.remove('rc_token'); set({ token: null, me: null }); }
}));

/** Tema: bawaan mode terang; pengguna bisa memilih gelap (atau mengikuti sistem) dari menu Lainnya. */
function applyTheme(t) {
  const dark = t === 'dark' || (t === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1b1714' : '#f4f1ee');
}
const initialTheme = store.get('rc_theme', 'light');
applyTheme(initialTheme);
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(useTheme.getState().theme));

export const useTheme = create((set) => ({
  theme: initialTheme,
  setTheme(theme) { store.set('rc_theme', theme); applyTheme(theme); set({ theme }); }
}));

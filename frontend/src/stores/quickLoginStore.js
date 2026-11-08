import { create } from 'zustand';
import { useAuthStore } from './authStore';

/**
 * Login cepat: popup masuk tanpa meninggalkan halaman.
 * Pemakaian: `requireLogin(() => follow())` — bila belum login, popup muncul; setelah berhasil
 * aksi yang tertunda langsung dijalankan dan pengguna tetap di halaman yang sedang dilihat.
 */
export const useQuickLogin = create((set, get) => ({
  open: false,
  reason: '',
  pending: null,
  ask: (reason = '', pending = null) => set({ open: true, reason, pending }),
  close: () => set({ open: false, pending: null }),
  done: () => {
    const fn = get().pending;
    set({ open: false, pending: null });
    if (fn) setTimeout(fn, 0);
  }
}));

/** Jalankan `fn` bila sudah login sebagai anggota, kalau belum tampilkan popup login cepat dulu. */
export function requireLogin(fn, reason) {
  if (useAuthStore.getState().isCandidateAuthenticated) return fn();
  useQuickLogin.getState().ask(reason, fn);
  return undefined;
}

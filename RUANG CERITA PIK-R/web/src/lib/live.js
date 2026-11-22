import { useEffect } from 'react';
import { rc } from './api.js';
import { useSession } from './session.js';

/**
 * Sambungan realtime (Server-Sent Events) ke /api/rc/stream.
 * Pesan baru, tanda dibaca, sedang mengetik, notifikasi, dan konseling datang lewat sini.
 * Komponen berlangganan dengan useLive('message', handler).
 */
const listeners = new Map();
let es = null;
let retry = 0;
let badgeTimer = null;

function emit(event, data) {
  for (const fn of listeners.get(event) || []) fn(data);
}

export function refreshBadges() {
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => {
    rc.badges().then((r) => useSession.getState().setBadges(r.data)).catch(() => {});
  }, 250);
}

export function connectLive() {
  const token = useSession.getState().token;
  if (!token || es) return;
  es = new EventSource(`/api/rc/stream?token=${encodeURIComponent(token)}`);
  es.addEventListener('hello', () => { retry = 0; refreshBadges(); });
  for (const ev of ['message', 'message-update', 'read', 'typing', 'notification', 'counsel']) {
    es.addEventListener(ev, (e) => {
      let data = {};
      try { data = JSON.parse(e.data); } catch { /* abaikan */ }
      emit(ev, data);
      if (ev === 'message' || ev === 'notification' || ev === 'counsel') refreshBadges();
    });
  }
  es.onerror = () => {
    // Putus (Wi-Fi sekolah, HP tidur): sambung ulang dengan jeda yang makin panjang
    es?.close();
    es = null;
    retry = Math.min(retry + 1, 6);
    if (useSession.getState().token) setTimeout(connectLive, 1000 * 2 ** retry);
  };
}

export function disconnectLive() {
  es?.close();
  es = null;
}

export function useLive(event, handler) {
  useEffect(() => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => listeners.get(event)?.delete(handler);
  }, [event, handler]);
}

// HP kembali dari latar belakang: perbarui lencana
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && useSession.getState().token) { refreshBadges(); if (!es) connectLive(); }
});

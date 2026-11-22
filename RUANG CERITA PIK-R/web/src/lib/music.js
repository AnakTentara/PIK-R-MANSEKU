/**
 * Pustaka musik Ruang Cerita. Katalog ada di /music/catalog.json (dibuat oleh scripts/gen-music.py,
 * atau isi sendiri dengan lagu berlisensi). File diunduh sekali menjadi blob supaya bisa digeser (seek)
 * di semua browser — server statis tidak mendukung Range — dan dipakai lagi tanpa unduh ulang.
 */
let catalog = null;
export function loadCatalog() {
  if (!catalog) {
    catalog = fetch('/music/catalog.json', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error('katalog'); return r.json(); })
      .then((j) => j.tracks || [])
      .catch((e) => { catalog = null; throw e; });
  }
  return catalog;
}

const blobs = new Map();
export async function trackUrl(track) {
  if (blobs.has(track.id)) return blobs.get(track.id);
  const res = await fetch('/' + track.file);
  if (!res.ok) throw new Error('lagu');
  const type = /\.mp3$/i.test(track.file) ? 'audio/mpeg' : /\.(m4a|aac)$/i.test(track.file) ? 'audio/mp4' : /\.ogg$/i.test(track.file) ? 'audio/ogg' : 'audio/wav';
  const url = URL.createObjectURL(new Blob([await res.arrayBuffer()], { type }));
  blobs.set(track.id, url);
  return url;
}

/**
 * Pemutar musik tunggal yang hidup lintas layar: dimulai di kamera, masih berbunyi di penyunting foto,
 * berhenti saat penyunting ditutup. Untuk video, lagu dicampur ke trek audio rekaman lewat WebAudio.
 */
let player = null;
const loopFrom = (el, start) => { el.onended = () => { el.currentTime = start || 0; el.play().catch(() => {}); }; };
const seekWhenReady = (el, start) => { if (start) el.addEventListener('loadedmetadata', () => { el.currentTime = start; }, { once: true }); };

export function stopMusic() {
  if (!player) return;
  const { el, ctx } = player;
  player = null;
  el.onended = null;
  el.pause();
  el.removeAttribute('src');
  el.load();
  ctx?.close().catch(() => {});
}
/** Putar biasa (foto → penyunting). */
export function startMusic(m) {
  stopMusic();
  const el = new Audio(m.url);
  seekWhenReady(el, m.start);
  loopFrom(el, m.start);
  el.play().catch(() => {});
  player = { el, m, ctx: null };
  return el;
}
/** Putar + kembalikan MediaStream audio untuk dicampur ke rekaman video. */
export function startMusicForRecording(m, mic) {
  stopMusic();
  const el = new Audio(m.url);
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const src = ctx.createMediaElementSource(el);
  const dest = ctx.createMediaStreamDestination();
  src.connect(dest);
  src.connect(ctx.destination);                   // tetap terdengar oleh perekam
  // Suara mikrofon ikut dicampur (tidak diteruskan ke speaker supaya tidak menggema)
  if (mic && mic.getAudioTracks().length) ctx.createMediaStreamSource(new MediaStream(mic.getAudioTracks())).connect(dest);
  seekWhenReady(el, m.start);
  loopFrom(el, m.start);
  ctx.resume().catch(() => {});
  el.play().catch(() => {});
  player = { el, m, ctx };
  return dest.stream;
}
export const pauseMusic = () => player?.el.pause();
export const resumeMusic = () => { player?.ctx?.resume().catch(() => {}); player?.el.play().catch(() => {}); };
export const musicElement = () => player?.el || null;

export const fmtTime = (s) => {
  const n = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
};

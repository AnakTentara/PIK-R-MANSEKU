/**
 * Akses kamera & mikrofon untuk Buat (cerita/postingan/pesan).
 * Video dan suara dibuka terpisah: pratinjau kamera tidak memicu izin mikrofon,
 * dan mikrofon diminta saat layar kamera dibuka (bukan di tengah menahan tombol rekam).
 */
let cam = null; // { stream, facing }
let mic = null; // MediaStream | null

export function releaseCamera() {
  cam?.stream.getTracks().forEach((t) => t.stop());
  cam = null;
  mic?.getTracks().forEach((t) => t.stop());
  mic = null;
}

/** Status izin tanpa memunculkan dialog ('granted' | 'prompt' | 'denied' | 'unknown'). */
export async function permissionState(name = 'camera') {
  try {
    return (await navigator.permissions.query({ name })).state;
  } catch {
    return 'unknown';
  }
}

const VIDEO = { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } };
const FRONT = /front|depan|user|selfie|facetime/i;
const BACK = /back|rear|belakang|environment/i;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Buka kamera depan/belakang. Urutan:
 *  1. facingMode PERSIS — dengan "ideal" saja, HP yang kamera depannya beresolusi rendah tetap diberi kamera
 *     belakang (browser menimbang resolusi lebih berat daripada arah kamera), jadi tombol balik tidak berpengaruh;
 *  2. pilih dari daftar perangkat menurut labelnya (HP/WebView yang tidak melaporkan facingMode);
 *  3. "ideal" — laptop dengan satu webcam.
 */
async function openCamera(facing) {
  const gum = (video) => navigator.mediaDevices.getUserMedia({ video, audio: false });
  const fatal = (err) => err?.name === 'NotAllowedError' || err?.name === 'SecurityError' || err?.name === 'NotReadableError' || err?.name === 'AbortError';
  try {
    return await gum({ ...VIDEO, facingMode: { exact: facing } });
  } catch (err) { if (fatal(err)) throw err; }
  try {
    const cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput' && d.deviceId);
    if (cams.length > 1) {
      const pick = cams.find((d) => (facing === 'user' ? FRONT : BACK).test(d.label)) || (facing === 'user' ? cams[0] : cams[cams.length - 1]);
      return await gum({ ...VIDEO, deviceId: { exact: pick.deviceId } });
    }
  } catch (err) { if (fatal(err)) throw err; }
  return gum({ ...VIDEO, facingMode: { ideal: facing } });
}

export async function getCamera(facing = 'environment') {
  if (cam && cam.facing === facing && cam.stream.active) return cam.stream;
  cam?.stream.getTracks().forEach((t) => t.stop());
  cam = null;
  if (!window.isSecureContext) throw Object.assign(new Error('insecure'), { name: 'SecurityError' });
  if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('unsupported'), { name: 'NotSupportedError' });
  let stream;
  try {
    stream = await openCamera(facing);
  } catch (err) {
    // Sebagian HP butuh jeda setelah kamera sebelumnya dilepas sebelum kamera lain bisa dibuka
    if (err?.name !== 'NotReadableError' && err?.name !== 'AbortError') throw err;
    await wait(400);
    stream = await openCamera(facing);
  }
  cam = { stream, facing };
  return stream;
}

/**
 * Nyalakan enkoder video lebih dulu (perekam kecil sekali pakai). Enkoder pertama butuh ±1–3 detik untuk siap;
 * tanpa ini klip pertama baru benar-benar bisa dijeda setelah enkoder menyala.
 */
let warmed = false;
export function warmRecorder() {
  if (warmed) return;
  warmed = true;
  const type = pickRecorderType();
  if (type === null) return;
  try {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 568;
    const x = c.getContext('2d');
    let n = 0;
    const iv = setInterval(() => { x.fillStyle = (n++ % 2) ? '#111' : '#222'; x.fillRect(0, 0, 320, 568); }, 40);
    const s = c.captureStream(25);
    const r = new MediaRecorder(s, type ? { mimeType: type } : undefined);
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      clearInterval(iv);
      try { if (r.state !== 'inactive') r.stop(); } catch { /* abaikan */ }
      s.getTracks().forEach((t) => t.stop());
    };
    r.onstart = () => setTimeout(end, 150);
    r.onerror = end;
    r.start();
    setTimeout(end, 8000);
  } catch { /* abaikan: pemanasan hanya optimasi */ }
}

/** Mikrofon untuk rekaman video. Ditolak/tidak ada = video tanpa suara (tetap bisa merekam). */
export async function getMic() {
  if (mic?.active) return mic;
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch {
    mic = null;
  }
  return mic;
}

/** Format rekaman yang didukung (Safari: MP4, Chrome/Firefox: WebM). null = browser tidak bisa merekam. */
export function pickRecorderType() {
  if (typeof MediaRecorder === 'undefined') return null;
  const list = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return list.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? '';
}

/** Pesan galat kamera yang bisa ditindaklanjuti. */
export function cameraError(err) {
  switch (err?.name) {
    case 'NotAllowedError': return 'Izin kamera ditolak. Ketuk ikon gembok di bilah alamat, izinkan Kamera, lalu coba lagi.';
    case 'NotFoundError': case 'OverconstrainedError': return 'Kamera tidak ditemukan di perangkat ini.';
    case 'NotReadableError': return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu coba lagi.';
    case 'SecurityError': return 'Kamera hanya bisa dibuka lewat alamat https.';
    case 'NotSupportedError': return 'Browser ini belum mendukung kamera. Pakai Chrome atau Safari terbaru.';
    default: return 'Kamera tidak bisa dibuka. Coba lagi atau pilih dari galeri.';
  }
}

/**
 * Area sumber yang dipotong sesuai rasio bingkai (di tengah), dibagi zoom digital.
 * Sama dengan pratinjau (object-fit: cover + scale), jadi hasil = yang terlihat.
 */
export function cropRect(vw, vh, aspect, zoom = 1) {
  let w = vw;
  let h = vw / aspect;
  if (h > vh) { h = vh; w = vh * aspect; }
  w /= zoom; h /= zoom;
  return { sx: (vw - w) / 2, sy: (vh - h) / 2, sw: w, sh: h };
}

/** Bersihkan tipe MIME rekaman ("video/webm;codecs=vp8" → "video/webm") supaya diterima server. */
export const baseMime = (t) => (t || '').split(';')[0] || 'video/webm';

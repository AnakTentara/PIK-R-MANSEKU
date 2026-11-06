/**
 * Bot WhatsApp PIK-R MANSEKU (Baileys resmi: @whiskeysockets/baileys).
 *
 * - Dikendalikan dari dashboard (Pengaturan → Atur Bot WhatsApp): nyala/mati, hubungkan lewat QR atau
 *   kode pairing, putuskan, profil bot, dan terminal debug (log langsung).
 * - Status nyala/mati disimpan di Setting `wa_enabled`; .env `DISABLE_WHATSAPP=1` mengunci bot mati
 *   (mis. komputer uji, supaya tidak berebut sesi dengan server utama).
 * - Kartu dan tabel dikirim sebagai gambar (lihat waCards.js), tanpa pustaka tidak resmi.
 * - Pengiriman massal diberi jeda acak dan dibatasi supaya akun tidak ditandai spam.
 */
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import prisma from '../config/db.js';
import { findSimilarCandidates } from '../utils/similarity.js';
import { SITE_URL } from '../config/site.js';
import { wibDate } from '../utils/wib.js';
import { renderCard, renderTable } from './waCards.js';

const AUTH_DIR = path.join(process.cwd(), '.baileys_auth');
const MAX_RECONNECT_DELAY = 5 * 60 * 1000;

// ─── Status & log (dibaca halaman Atur Bot) ─────────────────────────────────
export const waEvents = new EventEmitter();
waEvents.setMaxListeners(50);

const state = {
  status: 'off',          // off | starting | qr | pairing | connecting | open | closed | logged_out | locked
  qr: null,               // string QR mentah (dashboard menggambarnya)
  qrSvg: null,
  pairingCode: null,
  me: null,               // { id, phone, name, verifiedName, picture, about, business }
  lastError: null,
  connectedAt: null,
  startedAt: null,
  sent: 0,
  received: 0
};
let sock = null;
let reconnectTimer = null;
let reconnectDelay = 5000;
let wantPairing = null;   // nomor yang minta kode pairing pada koneksi berikutnya
let stopping = false;

const LOG_MAX = 400;
const logs = [];
let logSeq = 0;
export function waLog(level, msg) {
  const entry = { id: ++logSeq, at: new Date().toISOString(), level, msg: String(msg).slice(0, 2000) };
  logs.push(entry);
  if (logs.length > LOG_MAX) logs.shift();
  waEvents.emit('log', entry);
  (level === 'error' ? console.error : console.log)(`[WA] ${entry.msg}`);
}
export const getWaLogs = (after = 0) => logs.filter((l) => l.id > after);

function setState(patch) {
  Object.assign(state, patch);
  waEvents.emit('status', getWaStatus());
}
export function getWaStatus() {
  const { qr, ...rest } = state;
  return { ...rest, hasQr: !!qr, locked: isLockedOff(), uptimeSec: state.connectedAt ? Math.round((Date.now() - state.connectedAt) / 1000) : 0 };
}

export const isLockedOff = () => process.env.DISABLE_WHATSAPP === '1';
export function isWhatsAppReady() {
  return state.status === 'open';
}

// Bawaan MATI: bot baru menyambung setelah dinyalakan dari dashboard (mencegah dua server berebut sesi)
async function getEnabled() {
  const row = await prisma.setting.findUnique({ where: { key: 'wa_enabled' } }).catch(() => null);
  return row?.value === '1';
}
async function setEnabled(on) {
  await prisma.setting.upsert({ where: { key: 'wa_enabled' }, update: { value: on ? '1' : '0' }, create: { key: 'wa_enabled', value: on ? '1' : '0' } });
}

// ─── Nomor & pencarian pengirim (dipakai juga oleh modul lain) ──────────────
export function formatPhoneNumber(num) {
  let cleaned = String(num || '').replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  else if (cleaned.startsWith('8')) cleaned = '62' + cleaned;
  return cleaned + '@s.whatsapp.net';
}

export function extractSenderPhone(msg) {
  const candidates = [
    msg?.key?.remoteJidAlt,
    msg?.key?.participantAlt,
    msg?.key?.participant,
    msg?.key?.remoteJid,
    msg?.message?.extendedTextMessage?.contextInfo?.participant
  ].filter(Boolean);
  for (const jid of candidates) {
    if (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@c.us')) {
      const clean = jid.replace(/@.*$/, '').replace(/:\d+$/, '').replace(/\D/g, '');
      if (clean.length >= 9 && clean.length <= 15) return clean;
    }
  }
  return '';
}

export async function findUserFromWA(msg, extraText = '') {
  const cleanPhone = extractSenderPhone(msg);
  const query = extraText.trim();
  // 1. Nomor pengirim (paling aman)
  if (cleanPhone) {
    const slice = cleanPhone.length > 9 ? cleanPhone.slice(-9) : cleanPhone;
    const where = { OR: [{ whatsappNumber: { contains: slice } }, { whatsappNumber: cleanPhone }] };
    const m = await prisma.member.findFirst({ where });
    if (m) return m;
    const c = await prisma.candidate.findFirst({ where });
    if (c) return c;
  }
  // 2. NISN yang diketik (verifikasi OTP)
  if (query && /^\d+$/.test(query)) {
    const m = await prisma.member.findUnique({ where: { nisn: query } });
    if (m) return m;
    const c = await prisma.candidate.findUnique({ where: { nisn: query } });
    if (c) return c;
  }
  return null;
}

// ─── Koneksi ────────────────────────────────────────────────────────────────
const silentLogger = pino({ level: 'silent' });

async function connect() {
  clearTimeout(reconnectTimer);
  stopping = false;
  setState({ status: 'starting', startedAt: Date.now(), lastError: null });
  const { state: auth, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch { /* luring: pakai versi bawaan Baileys */ }
  waLog('info', `Menghubungkan ke WhatsApp${version ? ` (protokol ${version.join('.')})` : ''}…`);

  const s = makeWASocket({
    ...(version ? { version } : {}),
    auth: auth,
    logger: silentLogger,
    // Tampil sebagai "Chrome (Windows)" di Perangkat Tertaut, sama seperti WhatsApp Web biasa
    browser: Browsers.windows('Chrome'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false
  });
  sock = s;

  s.ev.on('creds.update', saveCreds);

  s.ev.on('connection.update', async (u) => {
    if (s !== sock) return; // socket lama (sudah diganti)
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      if (wantPairing && !s.authState.creds.registered) {
        const phone = wantPairing;
        wantPairing = null;
        try {
          const code = await s.requestPairingCode(phone);
          const pretty = code?.match(/.{1,4}/g)?.join('-') || code;
          setState({ status: 'pairing', pairingCode: pretty, qr: null, qrSvg: null });
          waLog('info', `Kode pairing untuk ${phone}: ${pretty}. Buka WhatsApp → Perangkat tertaut → Tautkan dengan nomor telepon.`);
        } catch (err) {
          waLog('error', `Gagal meminta kode pairing: ${err.message}`);
          setState({ lastError: 'Gagal meminta kode pairing. Periksa nomor, lalu coba lagi.' });
        }
      } else if (state.status !== 'pairing') {
        const qrSvg = await QRCode.toString(qr, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }).catch(() => null);
        setState({ status: 'qr', qr, qrSvg, pairingCode: null });
        waLog('info', 'QR baru siap. Pindai dari WhatsApp → Perangkat tertaut → Tautkan perangkat.');
      }
    }
    if (connection === 'connecting') setState({ status: state.status === 'qr' || state.status === 'pairing' ? state.status : 'connecting' });
    if (connection === 'open') {
      reconnectDelay = 5000;
      setState({ status: 'open', qr: null, qrSvg: null, pairingCode: null, connectedAt: Date.now(), lastError: null });
      waLog('info', 'Bot TERHUBUNG dan aktif.');
      refreshProfile().catch(() => {});
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const reason = Object.entries(DisconnectReason).find(([, v]) => v === code)?.[0] || lastDisconnect?.error?.message || 'tidak diketahui';
      setState({ connectedAt: null });
      if (stopping) { setState({ status: 'off' }); waLog('info', 'Bot dimatikan.'); return; }
      if (code === DisconnectReason.loggedOut) {
        waLog('warn', 'Bot dikeluarkan dari WhatsApp (perangkat tertaut dihapus). Sesi dihapus; hubungkan ulang dari dashboard.');
        clearSession();
        setState({ status: 'logged_out', me: null });
        return;
      }
      if (code === DisconnectReason.connectionReplaced) {
        waLog('error', 'Sesi dipakai di tempat lain (dua server menyalakan bot yang sama). Bot dihentikan supaya tidak saling memutus.');
        setState({ status: 'closed', lastError: 'Sesi bot sedang dipakai perangkat/server lain. Matikan bot di sana, lalu nyalakan lagi di sini.' });
        return;
      }
      // 515 (restartRequired) normal sesudah pairing: sambung lagi segera
      const delay = code === DisconnectReason.restartRequired ? 500 : reconnectDelay;
      waLog('warn', `Koneksi terputus (${reason}). Menyambung lagi dalam ${Math.round(delay / 1000)} detik…`);
      setState({ status: 'connecting' });
      reconnectTimer = setTimeout(() => connect().catch((e) => waLog('error', e.message)), delay);
      if (code !== DisconnectReason.restartRequired) reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
    }
  });

  s.ev.on('messages.upsert', (m) => {
    if (m.type !== 'notify') return;
    for (const msg of m.messages) onMessage(msg).catch((err) => waLog('error', `Gagal memproses pesan: ${err.message}`));
  });
}

function clearSession() {
  try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (e) { waLog('error', `Gagal menghapus sesi: ${e.message}`); }
}

async function refreshProfile() {
  if (!sock?.user) return;
  const jid = sock.user.id.replace(/:\d+@/, '@');
  const phone = jid.replace(/@.*/, '');
  const me = { id: jid, phone, name: sock.user.name || sock.user.notify || sock.authState.creds.me?.name || null, verifiedName: sock.user.verifiedName || null };
  const [picture, status, business] = await Promise.all([
    sock.profilePictureUrl(jid, 'image').catch(() => null),
    sock.fetchStatus(jid).then((r) => r?.[0]?.status?.status || null).catch(() => null),
    sock.getBusinessProfile(jid).catch(() => null)
  ]);
  setState({ me: { ...me, picture, about: status, business: business ? { description: business.description || null, category: business.category || null, website: business.website?.[0] || null } : null } });
}

// ─── Kendali dari dashboard ─────────────────────────────────────────────────
export async function initWhatsApp() {
  if (isLockedOff()) {
    setState({ status: 'locked' });
    waLog('info', 'Bot dikunci mati oleh .env (DISABLE_WHATSAPP=1).');
    return;
  }
  if (!(await getEnabled())) {
    setState({ status: 'off' });
    waLog('info', 'Bot dimatikan dari dashboard. Nyalakan di Pengaturan → Atur Bot WhatsApp.');
    return;
  }
  await connect();
}

const httpError = (message, status) => Object.assign(new Error(message), { status });

export async function startBot({ pairingPhone } = {}) {
  if (isLockedOff()) throw httpError('Bot dikunci mati oleh .env (DISABLE_WHATSAPP=1) di server ini.', 409);
  await setEnabled(true);
  if (pairingPhone) {
    const phone = formatPhoneNumber(pairingPhone).replace(/@.*/, '');
    if (phone.length < 10) throw httpError('Nomor telepon tidak valid.', 400);
    if (state.status === 'open') throw httpError('Bot sudah terhubung. Putuskan dulu untuk menautkan nomor lain.', 409);
    wantPairing = phone;
    await stopSocket();
    clearSession(); // kode pairing butuh sesi baru
  } else if (['open', 'starting', 'connecting', 'qr', 'pairing'].includes(state.status)) {
    return getWaStatus();
  }
  await connect();
  return getWaStatus();
}

async function stopSocket() {
  clearTimeout(reconnectTimer);
  if (!sock) return;
  stopping = true;
  const s = sock;
  sock = null;
  try { s.end(undefined); } catch { /* sudah tertutup */ }
}

export async function stopBot() {
  await setEnabled(false);
  wantPairing = null;
  await stopSocket();
  setState({ status: 'off', qr: null, qrSvg: null, pairingCode: null, connectedAt: null });
  waLog('info', 'Bot dimatikan dari dashboard. Sesi tetap tersimpan; menyalakan lagi tidak perlu scan ulang.');
  return getWaStatus();
}

/** Putuskan tautan: keluar dari WhatsApp dan hapus sesi (perlu QR/kode lagi untuk menyambung). */
export async function logoutBot() {
  wantPairing = null;
  if (sock && state.status === 'open') {
    stopping = true;
    try { await sock.logout('Diputus dari dashboard'); } catch { /* lanjut hapus sesi */ }
  }
  await stopSocket();
  clearSession();
  await setEnabled(false);
  setState({ status: 'off', me: null, qr: null, qrSvg: null, pairingCode: null, connectedAt: null });
  waLog('warn', 'Tautan bot diputus dan sesi dihapus.');
  return getWaStatus();
}

export async function restartBot() {
  if (isLockedOff()) throw httpError('Bot dikunci mati oleh .env (DISABLE_WHATSAPP=1) di server ini.', 409);
  await stopSocket();
  await setEnabled(true);
  await connect();
  return getWaStatus();
}

export async function updateBotProfile({ name, about }) {
  if (!sock || state.status !== 'open') throw httpError('Bot belum terhubung.', 409);
  if (name !== undefined && name.trim() && name.trim() !== state.me?.name) {
    await sock.updateProfileName(name.trim().slice(0, 25));
    waLog('info', `Nama bot diubah menjadi "${name.trim()}".`);
  }
  if (about !== undefined && about.trim() !== (state.me?.about || '')) {
    await sock.updateProfileStatus(about.trim().slice(0, 139));
    waLog('info', 'Info (about) bot diperbarui.');
  }
  await refreshProfile();
  return getWaStatus();
}

export async function updateBotPicture(buffer) {
  if (!sock || state.status !== 'open') throw httpError('Bot belum terhubung.', 409);
  await sock.updateProfilePicture(sock.user.id.replace(/:\d+@/, '@'), buffer);
  waLog('info', 'Foto profil bot diperbarui.');
  await refreshProfile();
  return getWaStatus();
}

// ─── Kirim pesan ────────────────────────────────────────────────────────────
// Antrean tunggal: tiap pesan diberi jeda acak supaya pola kirim tidak seperti spam
const MIN_GAP = 1200;
let queue = Promise.resolve();
let lastSend = 0;
function enqueue(fn) {
  const run = queue.then(async () => {
    const wait = lastSend + MIN_GAP + Math.random() * 800 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try { return await fn(); } finally { lastSend = Date.now(); }
  });
  queue = run.catch(() => {});
  return run;
}

async function rawSend(jid, content, opts) {
  if (!sock || state.status !== 'open') throw new Error('bot belum terhubung');
  // Tampak "sedang mengetik" sebentar seperti manusia
  if (content.text) {
    await sock.presenceSubscribe(jid).catch(() => {});
    await sock.sendPresenceUpdate('composing', jid).catch(() => {});
    await new Promise((r) => setTimeout(r, Math.min(1800, 300 + content.text.length * 8)));
    await sock.sendPresenceUpdate('paused', jid).catch(() => {});
  }
  const res = await sock.sendMessage(jid, content, opts);
  setState({ sent: state.sent + 1 });
  return res;
}

const send = (jid, content, opts) => enqueue(() => rawSend(jid, content, opts));

async function reply(msg, content) {
  try {
    await send(msg.key.remoteJid, typeof content === 'string' ? { text: content } : content, { quoted: msg });
  } catch (err) {
    waLog('error', `Gagal membalas ${msg.key.remoteJid}: ${err.message}`);
  }
}

/** Kirim kartu gambar + teks yang bisa disalin sebagai caption. */
async function replyCard(msg, card, caption) {
  let image;
  try {
    image = renderCard(card);
  } catch (err) {
    waLog('error', `Gagal membuat kartu: ${err.message}`);
    return reply(msg, caption);
  }
  return reply(msg, { image, caption, mimetype: 'image/png' });
}

async function replyTable(msg, table, caption) {
  let image;
  try {
    image = renderTable(table);
  } catch (err) {
    waLog('error', `Gagal membuat tabel: ${err.message}`);
    return reply(msg, caption);
  }
  return reply(msg, { image, caption, mimetype: 'image/png' });
}

export async function sendWhatsApp(to, text) {
  if (state.status !== 'open') { waLog('warn', `Pesan ke ${to} tidak terkirim: bot belum terhubung.`); return false; }
  try { await send(formatPhoneNumber(to), { text }); return true; } catch (err) { waLog('error', `Gagal mengirim ke ${to}: ${err.message}`); return false; }
}

export async function sendWhatsAppWithAttachments(to, text, attachments = []) {
  if (state.status !== 'open') { waLog('warn', `Pesan/dokumen ke ${to} tidak terkirim: bot belum terhubung.`); return false; }
  try {
    const jid = formatPhoneNumber(to);
    if (text && text.trim()) await send(jid, { text: text.trim() });
    for (const att of Array.isArray(attachments) ? attachments : []) {
      if (!att.path || !fs.existsSync(att.path)) continue;
      await send(jid, { document: fs.readFileSync(att.path), mimetype: att.mimetype || 'application/pdf', fileName: att.filename || path.basename(att.path) });
    }
    return true;
  } catch (err) {
    waLog('error', `Gagal mengirim dokumen ke ${to}: ${err.message}`);
    return false;
  }
}

export async function sendWhatsAppGroupBroadcast(toJid, text, mediaObj = null) {
  if (state.status !== 'open') { waLog('warn', `Broadcast ke ${toJid} tidak terkirim: bot belum terhubung.`); return false; }
  try {
    const jid = toJid.includes('@') ? toJid : formatPhoneNumber(toJid);
    if (mediaObj?.url && fs.existsSync(mediaObj.url)) {
      const buffer = fs.readFileSync(mediaObj.url);
      const mimetype = mediaObj.mimetype || 'application/octet-stream';
      const type = (mediaObj.type || '').toUpperCase();
      if (type === 'IMAGE' || mimetype.startsWith('image/')) await send(jid, { image: buffer, caption: text || '' });
      else if (type === 'VIDEO' || mimetype.startsWith('video/')) await send(jid, { video: buffer, caption: text || '' });
      else await send(jid, { document: buffer, mimetype, fileName: mediaObj.name || path.basename(mediaObj.url), caption: text || '' });
    } else if (text && text.trim()) {
      await send(jid, { text: text.trim() });
    }
    return true;
  } catch (err) {
    waLog('error', `Gagal broadcast ke ${toJid}: ${err.message}`);
    return false;
  }
}

/** Kirim pesan uji dari dashboard (kartu contoh) untuk memastikan bot benar-benar mengirim. */
export async function sendTestMessage(to) {
  if (state.status !== 'open') throw httpError('Bot belum terhubung.', 409);
  const jid = formatPhoneNumber(to);
  const image = renderCard({
    title: 'Pesan Uji Bot', subtitle: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    badge: { text: 'BOT AKTIF', tone: 'green' },
    rows: [{ label: 'Nomor bot', value: state.me?.phone ? `+${state.me.phone}` : '-' }, { label: 'Dikirim ke', value: `+${jid.replace(/@.*/, '')}` }],
    note: 'Pesan ini dikirim dari dashboard (Pengaturan → Atur Bot WhatsApp).'
  });
  await send(jid, { image, caption: '✅ Bot PIK-R MANSEKU aktif dan bisa mengirim pesan.', mimetype: 'image/png' });
  waLog('info', `Pesan uji terkirim ke ${jid.replace(/@.*/, '')}.`);
}

// ─── Perintah ───────────────────────────────────────────────────────────────
const STATUS_TONE = { HADIR: 'green', SAKIT: 'amber', IZIN: 'blue', ALFA: 'red' };
const STATUS_LABEL = { HADIR: 'Hadir', SAKIT: 'Sakit', IZIN: 'Izin', ALFA: 'Alfa' };
const PRIVATE_ONLY = (cmd) => `🛑 *PERINTAH PRIBADI*\n\nDemi keamanan akun, perintah *${cmd}* tidak bisa dipakai di grup.\n🔒 Kirim langsung (japri) ke nomor bot ini.`;
const NOT_MEMBER = (name) => `⏳ *BELUM JADI ANGGOTA*\n\nHalo *${name}*, kamu masih berstatus *Pendaftar* dan belum memiliki akun anggota PIK-R MANSEKU.\nTunggu pengumuman kelulusan dari panitia, ya! 💪`;

function textOf(msg) {
  const m = msg.message || {};
  return (m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || '').trim();
}

async function logGroupMessage(msg, jid, text) {
  let name = `Grup WhatsApp (${jid.slice(0, 12)})`;
  try { name = (await sock.groupMetadata(jid))?.subject || name; } catch { /* metadata gagal */ }
  await prisma.whatsAppGroup.upsert({
    where: { jid },
    create: { jid, name, memberCount: 0, lastMsgAt: new Date() },
    update: { name, lastMsgAt: new Date() }
  });
  await prisma.announcementLog.create({
    data: { receiverJid: jid, sender: msg.pushName || extractSenderPhone(msg) || 'Anggota Grup', content: text || '[Pesan Media/Sticker]', type: 'INCOMING_MSG' }
  });
  return name;
}

async function onMessage(msg) {
  if (!msg.message || msg.key.fromMe) return;
  const jid = msg.key.remoteJid;
  if (!jid || jid === 'status@broadcast' || jid.endsWith('@newsletter')) return;
  setState({ received: state.received + 1 });
  const text = textOf(msg);
  const isGroup = jid.endsWith('@g.us');
  let groupName = null;
  if (isGroup) groupName = await logGroupMessage(msg, jid, text).catch((err) => { waLog('error', `Gagal mencatat pesan grup: ${err.message}`); return null; });

  const m = text.match(/^[/!]\s*([a-z]+)(?:\s+([\s\S]*))?$/i);
  if (!m) return;
  const cmd = m[1].toLowerCase();
  const arg = (m[2] || '').trim();
  const who = msg.pushName || extractSenderPhone(msg) || 'pengguna';
  waLog('info', `Perintah /${cmd}${arg && cmd !== 'sandi' ? ` "${arg.slice(0, 40)}"` : ''} dari ${who}${isGroup ? ` di ${groupName || 'grup'}` : ''}.`);

  switch (cmd) {
    case 'menu': case 'help': case 'bantuan': return cmdMenu(msg, isGroup);
    case 'id': case 'group': case 'groupinfo': case 'info': return isGroup ? cmdGroupId(msg, jid, groupName) : undefined;
    case 'cek': return cmdCek(msg, arg);
    case 'sandi': return /^ganti\b/i.test(arg) ? cmdSandiGanti(msg, isGroup, arg.replace(/^ganti\s*/i, '')) : cmdSandi(msg, isGroup, arg, text);
    case 'absen': return cmdAbsen(msg, isGroup);
    case 'rekap': return cmdRekap(msg, isGroup);
    default: return undefined;
  }
}

async function cmdMenu(msg, isGroup) {
  const rows = [
    { label: '/cek [nama/NISN]', value: 'Hasil seleksi' },
    { label: '/absen', value: 'Kehadiranmu (japri)' },
    { label: '/sandi', value: 'Lihat sandi akun (japri)' },
    { label: '/sandi ganti', value: 'Kode OTP ganti sandi' },
    ...(isGroup ? [{ label: '!id', value: 'ID grup ini (admin)' }] : [])
  ];
  return replyCard(msg, { title: 'Menu Bot', subtitle: 'Ketik salah satu perintah di bawah', rows, note: `Situs: ${SITE_URL}` },
    `📋 *MENU BOT PIK-R MANSEKU*\n\n${rows.map((r) => `• *${r.label}* — ${r.value}`).join('\n')}\n\n🌐 ${SITE_URL}`);
}

async function cmdGroupId(msg, jid, groupName) {
  return reply(msg, `📌 *INFO ID GRUP WHATSAPP*\n\nNama Grup: *${groupName || jid}*\nGroup JID:\n\`${jid}\`\n\n💡 Salin Group JID di atas ke tab *Pengumuman Scheduled* di dashboard untuk mengirim pengumuman terjadwal ke grup ini.`);
}

const STATUS_CEK = { LULUS: ['LULUS', 'green', 'Diterima'], TIDAK_LULUS: ['TIDAK LULUS', 'red', 'Belum diterima'], PENDING: ['MENUNGGU', 'amber', 'Belum diumumkan'] };

async function cekCard(msg, person) {
  const link = `${SITE_URL}/cek-kelulusan?nisn=${person.nisn}`;
  // Sama dengan halaman /cek-kelulusan: anggota = LULUS, pendaftar sesuai statusnya
  const [badge, tone, label] = person.kind === 'member' ? ['LULUS', 'green', 'Anggota aktif'] : STATUS_CEK[person.status] || STATUS_CEK.PENDING;
  return replyCard(msg, {
    title: 'Cek Kelulusan', subtitle: 'Pendaftaran PIK-R MANSEKU',
    badge: { text: badge, tone },
    rows: [{ label: 'Nama', value: person.name }, { label: 'Kelas', value: person.className || '-' }, { label: 'Status', value: label, tone }],
    note: 'Buka tautan di bawah gambar untuk detail resmi.'
  },`Halo *${person.name}*,\n\nHasil kelulusan pendaftaran PIK-R MANSEKU dapat dicek di:\n🔗 ${link}`);
}

async function cmdCek(msg, query) {
  if (!query) return reply(msg, 'Format: */cek [Nama atau NISN]*\nContoh: `/cek Haikal Mabrur` atau `/cek 3102603365`');
  try {
    if (/^\d+$/.test(query)) {
      const c = await prisma.candidate.findFirst({ where: { nisn: query } });
      const mm = c ? null : await prisma.member.findFirst({ where: { nisn: query } });
      const p = c ? { ...c, kind: 'candidate' } : mm ? { ...mm, kind: 'member' } : null;
      return p ? cekCard(msg, p) : reply(msg, `Maaf, data dengan NISN *${query}* tidak ditemukan.`);
    }
    const [candidates, members] = await Promise.all([
      prisma.candidate.findMany({ select: { id: true, name: true, nisn: true, className: true, status: true } }),
      prisma.member.findMany({ select: { id: true, name: true, nisn: true, className: true } })
    ]);
    const nisns = new Set(candidates.map((c) => c.nisn));
    const people = [...candidates.map((c) => ({ ...c, kind: 'candidate' })), ...members.filter((x) => !nisns.has(x.nisn)).map((x) => ({ ...x, kind: 'member' }))];
    const matches = findSimilarCandidates(query, people);
    if (!matches.length) return reply(msg, `Maaf, nama *"${query}"* tidak ditemukan. Pastikan ejaan sama dengan saat mendaftar.`);
    if (matches[0].exact || matches[0].score >= 0.65 || matches.length === 1) return cekCard(msg, matches[0].candidate);
    const top = matches.slice(0, 6).map((x) => x.candidate);
    return replyTable(msg, {
      title: 'Beberapa Nama Cocok', subtitle: `Pencarian: "${query}"`,
      columns: [{ key: 'no', label: 'No', width: 0.5, align: 'center' }, { key: 'name', label: 'Nama', width: 3, bold: true }, { key: 'cls', label: 'Kelas', width: 1 }],
      rows: top.map((p, i) => ({ no: i + 1, name: p.name, cls: p.className || '-' }))
    }, `Ditemukan beberapa nama yang mirip dengan *"${query}"*:\n${top.map((p, i) => `\n${i + 1}. *${p.name}* (${p.className || '-'})\n🔗 ${SITE_URL}/cek-kelulusan?nisn=${p.nisn}`).join('\n')}`);
  } catch (err) {
    waLog('error', `/cek gagal: ${err.message}`);
    return reply(msg, 'Terjadi kesalahan sistem saat mencari data.');
  }
}

async function cmdSandiGanti(msg, isGroup, extra) {
  if (isGroup) return reply(msg, PRIVATE_ONLY('/sandi ganti'));
  try {
    const user = await findUserFromWA(msg, extra);
    if (!user) return reply(msg, `❌ *DATA TIDAK DITEMUKAN*\n\nNomor WhatsApp kamu belum terhubung dengan akun mana pun.\n💡 Ketik */sandi ganti [NISN kamu]* untuk verifikasi.`);
    if (!(await prisma.member.findUnique({ where: { id: user.id } }))) return reply(msg, NOT_MEMBER(user.name));
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.passwordResetOtp.create({
      data: { identifier: user.nisn || user.whatsappNumber || extractSenderPhone(msg), otpCode, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }
    });
    const link = `${SITE_URL}/reset-sandi?${user.nisn ? `nisn=${user.nisn}` : `wa=${user.whatsappNumber}`}`;
    return replyCard(msg, {
      title: 'Kode OTP Ganti Sandi', subtitle: `Untuk ${user.name}`,
      badge: { text: otpCode.replace(/(\d{3})(\d{3})/, '$1 $2'), tone: 'accent' },
      rows: [{ label: 'Berlaku', value: '10 menit' }],
      note: 'Rahasiakan kode ini. Panitia tidak pernah meminta kode OTP.'
    }, `🔐 *KODE OTP GANTI SANDI*\n\nKode: *${otpCode}* (berlaku 10 menit)\n\nBuka tautan ini lalu masukkan kodenya:\n🔗 ${link}\n\n⚠️ Rahasiakan kode ini dari siapa pun.`);
  } catch (err) {
    waLog('error', `/sandi ganti gagal: ${err.message}`);
    return reply(msg, 'Terjadi kesalahan sistem saat membuat kode OTP.');
  }
}

async function cmdSandi(msg, isGroup, extra, fullText) {
  if (isGroup) return reply(msg, PRIVATE_ONLY('/sandi'));
  try {
    const fromWebButton = fullText.toUpperCase().includes('KIRIMKAN PESAN INI UNTUK MENGECEK SANDI');
    // Tidak boleh melihat sandi orang lain lewat nama; hanya NISN sendiri atau nomor pengirim
    if (extra && !/^\d+$/.test(extra) && !fromWebButton) {
      return reply(msg, '🛑 *AKSES DITOLAK*\n\n*/sandi* tidak bisa dipakai untuk melihat sandi orang lain.\nKetik */sandi* saja untuk melihat sandi akunmu sendiri.');
    }
    const user = await findUserFromWA(msg, fromWebButton ? '' : extra);
    if (!user) return reply(msg, '❌ *NOMOR TIDAK TERDAFTAR*\n\nNomor WhatsApp kamu belum terdaftar sebagai akun anggota. Jika nomor saat mendaftar berbeda, hubungi panitia untuk memperbaruinya.');
    if (!(await prisma.member.findUnique({ where: { id: user.id } }))) return reply(msg, NOT_MEMBER(user.name));
    const readMore = '​'.repeat(4000);
    // Sandi sengaja hanya dikirim sebagai teks tersembunyi (Baca Selengkapnya), tidak digambar di kartu
    return reply(msg, `🔒 *PEMBERITAHUAN KEAMANAN SANDI*\n\nHalo *${user.name}*, pastikan kamu di tempat aman sebelum membuka sandi.\n💡 Ketik */sandi ganti* untuk mengganti sandi.\n\nTekan *Baca Selengkapnya* untuk melihat sandi.${readMore}\n\n👤 Nama: *${user.name}*\n${user.nisn ? `📌 NISN: *${user.nisn}*\n` : ''}🔑 Sandi: *${user.plainPassword || '(sudah diganti / belum diatur)'}*\n\n⚠️ Jangan bagikan sandi kepada siapa pun.`);
  } catch (err) {
    waLog('error', `/sandi gagal: ${err.message}`);
    return reply(msg, 'Terjadi kesalahan sistem saat memeriksa sandi.');
  }
}

async function cmdAbsen(msg, isGroup) {
  if (isGroup) return reply(msg, PRIVATE_ONLY('/absen'));
  try {
    const user = await findUserFromWA(msg);
    const member = user && (await prisma.member.findUnique({ where: { id: user.id } }));
    if (!member) return reply(msg, user ? NOT_MEMBER(user.name) : '❌ Nomor WhatsApp kamu belum terdaftar sebagai anggota.');
    const { buildRecap } = await import('../controllers/absen.js');
    const to = wibDate();
    const from = wibDate(new Date(Date.now() - 90 * 864e5));
    const recap = await buildRecap(from, to);
    const row = recap.rows.find((r) => r.id === member.id);
    const c = row?.counts || { HADIR: 0, SAKIT: 0, IZIN: 0, ALFA: 0 };
    const total = c.HADIR + c.SAKIT + c.IZIN + c.ALFA;
    const pct = total ? Math.round((c.HADIR / total) * 100) : 0;
    const last = (row?.days || []).map((d, i) => ({ ...d, s: recap.sessions[i] })).filter((d) => d.status).slice(-5).reverse();
    return replyCard(msg, {
      title: 'Kehadiranku', subtitle: `${member.name.trim()} · 90 hari terakhir`,
      badge: { text: `${pct}% HADIR`, tone: pct >= 75 ? 'green' : pct >= 50 ? 'amber' : 'red' },
      rows: [
        { label: 'Hadir', value: String(c.HADIR), tone: 'green' }, { label: 'Sakit', value: String(c.SAKIT), tone: 'amber' },
        { label: 'Izin', value: String(c.IZIN), tone: 'blue' }, { label: 'Alfa', value: String(c.ALFA), tone: 'red' },
        ...last.map((d) => ({ label: d.date, value: `${STATUS_LABEL[d.status]}${d.checkIn ? ` ${d.checkIn}` : ''}`, tone: STATUS_TONE[d.status] }))
      ]
    }, `📊 *KEHADIRAN ${member.name.trim().toUpperCase()}* (90 hari)\nHadir ${c.HADIR} · Sakit ${c.SAKIT} · Izin ${c.IZIN} · Alfa ${c.ALFA} (${pct}% hadir)`);
  } catch (err) {
    waLog('error', `/absen gagal: ${err.message}`);
    return reply(msg, 'Terjadi kesalahan sistem saat mengambil data kehadiran.');
  }
}

/** Rekap kegiatan hari ini (hanya untuk pengurus inti yang nomornya terdaftar). */
async function cmdRekap(msg, isGroup) {
  try {
    const user = await findUserFromWA(msg);
    const org = user && (await prisma.orgMember.findFirst({ where: { memberId: user.id, isCurrent: true } }));
    if (!org || !['KETUA', 'WAKIL', 'KABINET', 'PEMBINA'].includes(org.role)) {
      return isGroup ? undefined : reply(msg, '🔒 */rekap* hanya untuk pengurus inti (Ketua, Wakil, Kabinet, Pembina).');
    }
    const { buildRecap } = await import('../controllers/absen.js');
    const today = wibDate();
    const recap = await buildRecap(today, today);
    const session = recap.sessions[0];
    if (!session) return reply(msg, 'Belum ada kegiatan hari ini.');
    const rows = recap.rows.map((r) => ({ name: r.name.trim(), cls: r.className, status: r.days[0]?.status, in: r.days[0]?.checkIn || '-' }))
      .sort((a, b) => (a.status ? 0 : 1) - (b.status ? 0 : 1) || a.name.localeCompare(b.name, 'id'));
    const count = (k) => rows.filter((r) => r.status === k).length;
    return replyTable(msg, {
      title: 'Rekap Kehadiran', subtitle: `${session.title} · ${today} · H ${count('HADIR')} S ${count('SAKIT')} I ${count('IZIN')} A ${count('ALFA')}`,
      columns: [
        { key: 'no', label: 'No', width: 0.5, align: 'center' }, { key: 'name', label: 'Nama', width: 3, bold: true }, { key: 'cls', label: 'Kelas', width: 1 },
        { key: 'statusLabel', label: 'Status', width: 1.3, align: 'center', tone: (r) => STATUS_TONE[r.status] || 'gray' }, { key: 'in', label: 'Masuk', width: 1, align: 'center' }
      ],
      rows: rows.map((r, i) => ({ ...r, no: i + 1, statusLabel: STATUS_LABEL[r.status] || 'Belum' })),
      maxRows: 40
    }, `📋 *REKAP ${session.title.toUpperCase()}* (${today})\nHadir ${count('HADIR')} · Sakit ${count('SAKIT')} · Izin ${count('IZIN')} · Alfa ${count('ALFA')} · Belum ${rows.filter((r) => !r.status).length}`);
  } catch (err) {
    waLog('error', `/rekap gagal: ${err.message}`);
    return reply(msg, 'Terjadi kesalahan sistem saat membuat rekap.');
  }
}

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
  Browsers,
  proto
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import prisma from '../config/db.js';
import { findSimilarCandidates } from '../utils/similarity.js';
import { callGemini } from '../rc/aiRotator.js';
import { SITE_URL } from '../config/site.js';
import { wibDate, isValidDate } from '../utils/wib.js';
import { renderCard, renderTable, renderRekapCard } from './waCards.js';
import { getCatalog } from '../utils/orgCatalog.js';
// @ryuu-reinzz/button-helper tidak dipakai: native_flow tidak render body text
// di WA Business personal. Gunakan teks berformat biasa saja.

const AUTH_DIR = path.join(process.cwd(), '.baileys_auth');
const MAX_RECONNECT_DELAY = 5 * 60 * 1000;
const CURHAT_DIR = path.join(process.cwd(), '.curhat_sessions');
const REPORTS_DIR = path.join(process.cwd(), '.reports');
const CARDS_DIR = path.resolve('E:/PIKR-MANSEKU.MY.ID/PIK-R-ABSEN/ID CARD PIK-R OK');
const CARDS_BACK_DIR = path.join(CARDS_DIR, '[BELAKANG] ID CARD PIK-R');
// Ensure dirs exist
[CURHAT_DIR, REPORTS_DIR].forEach(d => { try { fs.mkdirSync(d, { recursive: true }); } catch {} });

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

// ─── Session-based state maps ─────────────────────────────────────────────────
const curhatSessions = new Map(); // senderJid -> session object (in-memory, backed by files)
const curhatTimers = new Map();   // senderJid -> timeout handle
const bcStates = new Map();       // sender phone -> bc flow state
const gameStates = new Map();     // jid -> game state
const laporStates = new Map();    // sender phone -> lapor state

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
// ─── Kebijakan bot: grup, batas laju, allowlist /rekap (Setting `wa_policy`) ──
/**
 * groupMode : 'all'  semua grup boleh memakai perintah
 *             'listed' hanya grup di allowedGroups (grup lain: bot diam)
 *             'off'  perintah di grup dimatikan (bot hanya membalas japri)
 * rekapAllow: nomor (62…) yang boleh memakai /rekap selain pengurus inti
 * rekapCore : pengurus inti (Ketua/Wakil/Kabinet/Pembina) otomatis boleh /rekap
 * rekapInGroups: /rekap boleh dipakai di grup (bawaan tidak: data kehadiran semua anggota)
 */
export const DEFAULT_POLICY = { groupMode: 'listed', allowedGroups: [], rekapAllow: [], rekapCore: true, rekapInGroups: false };
let policyCache = null;
export async function getPolicy() {
  if (policyCache) return policyCache;
  const row = await prisma.setting.findUnique({ where: { key: 'wa_policy' } }).catch(() => null);
  let p = {};
  try { p = row ? JSON.parse(row.value) : {}; } catch { /* rusak: pakai bawaan */ }
  policyCache = sanitizePolicy(p);
  return policyCache;
}
const normPhone = (v) => formatPhoneNumber(v).replace(/@.*/, '');
export function sanitizePolicy(p = {}) {
  const phones = Array.isArray(p.rekapAllow) ? p.rekapAllow : [];
  const groups = Array.isArray(p.allowedGroups) ? p.allowedGroups : [];
  return {
    groupMode: ['all', 'listed', 'off'].includes(p.groupMode) ? p.groupMode : DEFAULT_POLICY.groupMode,
    allowedGroups: [...new Set(groups.map(String).filter((j) => /^[\d-]+@g\.us$/.test(j)))].slice(0, 100),
    rekapAllow: [...new Set(phones.map(normPhone).filter((n) => n.length >= 10 && n.length <= 15))].slice(0, 200),
    rekapCore: p.rekapCore !== false,
    rekapInGroups: p.rekapInGroups === true
  };
}
export async function savePolicy(p) {
  const clean = sanitizePolicy(p);
  await prisma.setting.upsert({ where: { key: 'wa_policy' }, update: { value: JSON.stringify(clean) }, create: { key: 'wa_policy', value: JSON.stringify(clean) } });
  policyCache = clean;
  waLog('info', `Pengaturan bot disimpan: grup=${clean.groupMode}, ${clean.allowedGroups.length} grup diizinkan, ${clean.rekapAllow.length} nomor allowlist /rekap.`);
  return clean;
}

// ─── Batas laju (anti-spam): per pengirim dan per grup ───────────────────────
// Di grup publik siapa pun bisa mengetik perintah. Tanpa batas, satu orang bisa membuat bot membalas
// puluhan kali per menit (akun bot dianggap spam dan diblokir WhatsApp).
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 10 * 60 * 1000)) hits.delete(k);
  return arr.length > max;
}
const warned = new Map();
function warnOnce(key, ms = 60 * 1000) {
  const now = Date.now();
  if (now - (warned.get(key) || 0) < ms) return false;
  warned.set(key, now);
  return true;
}

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


// ─── Button & Group Guard Helpers ──────────────────────────────────────────
export function isBotMentionedOrQuoted(msg) {
  if (!sock?.user) return false;
  const botJid = sock.user.id.replace(/:\d+@/, '@');
  const botPhone = botJid.replace(/@.*/, '');

  const m = msg.message || {};
  const context = m.extendedTextMessage?.contextInfo ||
                  m.interactiveResponseMessage?.contextInfo ||
                  m.viewOnceMessage?.message?.interactiveResponseMessage?.contextInfo;

  // 1. Quoted / replied to message sent by the bot
  if (context?.participant) {
    const quotedParticipant = context.participant.replace(/:\d+@/, '@');
    if (quotedParticipant === botJid || (botPhone && quotedParticipant.startsWith(botPhone))) return true;
  }

  // 2. Mentioned / tagged in text (@bot)
  const mentionedJid = context?.mentionedJid || [];
  if (mentionedJid.some(j => {
    const clean = j.replace(/:\d+@/, '@');
    return clean === botJid || (botPhone && clean.startsWith(botPhone));
  })) return true;

  // 3. Fallback: raw text contains @botPhone
  const rawText = m.conversation || m.extendedTextMessage?.text || '';
  if (botPhone && rawText.includes(`@${botPhone}`)) return true;

  return false;
}

export async function replyButtons(msg, bodyText, buttons = [], footer = 'PIK-R MANSEKU', title = '') {
  // Gunakan teks berformat — andal di semua klien WA (personal & Business).
  // Native interactive buttons (native_flow) tidak render body text di WA
  // non-Business-API sehingga pesan tampak kosong; pendekatan teks lebih aman.
  const non_action_ids = new Set(['batal', 'cancel', 'selesai']);
  const actionBtns = buttons.filter(b => !non_action_ids.has(String(b.id).toLowerCase()));
  const cancelBtns = buttons.filter(b => non_action_ids.has(String(b.id).toLowerCase()));

  // Susun baris tombol — tampilkan label + cara memilihnya
  const fmtBtn = (b) => {
    const label = b.text || b.label || b.id;
    const id = String(b.id);
    // Kalau id adalah satu huruf kapital (A/B/C/D) → "ketik A"
    // Kalau id adalah kata bermakna (anonim, selesai) → "ketik anonim"
    return `  *•* ${label}  —  _ketik_ *${id}*`;
  };

  const allLines = [
    ...actionBtns.map(fmtBtn),
    ...(cancelBtns.length > 0 ? [''] : []),
    ...cancelBtns.map(fmtBtn)
  ].join('\n');

  let fullText = bodyText;
  if (buttons.length > 0) {
    fullText += `\n\n${allLines}`;
  }
  if (footer && footer !== 'PIK-R MANSEKU') fullText += `\n\n_${footer}_`;

  return reply(msg, fullText);
}

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

/** Kirim pesan uji dari dashboard (pesan custom atau kartu contoh bawaan) untuk memastikan bot benar-benar mengirim. */
export async function sendTestMessage(to, customMessage = '') {
  if (state.status !== 'open') throw httpError('Bot belum terhubung.', 409);
  const jid = formatPhoneNumber(to);
  const custom = typeof customMessage === 'string' && customMessage.trim() ? customMessage.trim() : null;
  if (custom) {
    await send(jid, { text: custom });
    waLog('info', `Pesan uji kustom terkirim ke ${jid.replace(/@.*/, '')}.`);
  } else {
    const image = renderCard({
      title: 'Pesan Uji Bot', subtitle: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      badge: { text: 'BOT AKTIF', tone: 'green' },
      rows: [{ label: 'Nomor bot', value: state.me?.phone ? `+${state.me.phone}` : '-' }, { label: 'Dikirim ke', value: `+${jid.replace(/@.*/, '')}` }],
      note: 'Pesan ini dikirim dari dashboard (Pengaturan → Atur Bot WhatsApp).'
    });
    await send(jid, { image, caption: '✅ Bot PIK-R MANSEKU aktif dan bisa mengirim pesan.', mimetype: 'image/png' });
    waLog('info', `Pesan uji terkirim ke ${jid.replace(/@.*/, '')}.`);
  }
}

// ─── Perintah ───────────────────────────────────────────────────────────────
const STATUS_TONE = { HADIR: 'green', SAKIT: 'amber', IZIN: 'blue', ALFA: 'red' };
const STATUS_LABEL = { HADIR: 'Hadir', SAKIT: 'Sakit', IZIN: 'Izin', ALFA: 'Alfa' };
const PRIVATE_ONLY = (cmd) => `🛑 *PERINTAH PRIBADI*\n\nDemi keamanan akun, perintah *${cmd}* tidak bisa dipakai di grup.\n🔒 Kirim langsung (japri) ke nomor bot ini.`;
const NOT_MEMBER = (name) => `⏳ *BELUM JADI ANGGOTA*\n\nHalo *${name}*, kamu masih berstatus *Pendaftar* dan belum memiliki akun anggota PIK-R MANSEKU.\nTunggu pengumuman kelulusan dari panitia, ya! 💪`;

function textOf(msg) {
  const m = msg.message || {};
  // 1. Interactive quick_reply response
  const intResp = m.interactiveResponseMessage || m.viewOnceMessage?.message?.interactiveResponseMessage;
  if (intResp?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const p = JSON.parse(intResp.nativeFlowResponseMessage.paramsJson);
      if (p.id) return String(p.id).trim();
    } catch {}
  }
  // 2. Standard buttons response
  const btnResp = m.buttonsResponseMessage || m.viewOnceMessage?.message?.buttonsResponseMessage;
  if (btnResp?.selectedButtonId) return btnResp.selectedButtonId.trim();
  if (btnResp?.selectedDisplayText) return btnResp.selectedDisplayText.trim();
  // 3. Template button reply
  const tplResp = m.templateButtonReplyMessage || m.viewOnceMessage?.message?.templateButtonReplyMessage;
  if (tplResp?.selectedId) return tplResp.selectedId.trim();
  if (tplResp?.selectedDisplayText) return tplResp.selectedDisplayText.trim();
  // 4. List single select reply
  const listResp = m.listResponseMessage || m.viewOnceMessage?.message?.listResponseMessage;
  if (listResp?.singleSelectReply?.selectedRowId) return listResp.singleSelectReply.selectedRowId.trim();

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

const KNOWN_COMMANDS = new Set(['menu', 'help', 'bantuan', 'id', 'group', 'groupinfo', 'info', 'cek', 'sandi', 'absen', 'rekap', 'curhat', 'selesai', 'kartu', 'card', 'pengurus', 'divisi', 'bc', 'games', 'kuis', 'trivia', 'lapor', 'fun', 'level', 'scoreboard', 'top']);

async function onMessage(msg) {
  if (!msg.message || msg.key.fromMe) return;
  const jid = msg.key.remoteJid;
  if (!jid || jid === 'status@broadcast' || jid.endsWith('@newsletter')) return;
  setState({ received: state.received + 1 });
  const text = textOf(msg);
  const isGroup = jid.endsWith('@g.us');
  let groupName = null;
  if (isGroup) groupName = await logGroupMessage(msg, jid, text).catch((err) => { waLog('error', `Gagal mencatat pesan grup: ${err.message}`); return null; });

  const sender = extractSenderPhone(msg) || msg.key.participant || jid;
  const senderJid = sender.includes('@') ? sender : (sender ? sender + '@s.whatsapp.net' : jid);

  // ─── XP Tracking (passive, non-command messages in tracked groups) ───────
  if (isGroup && text && !text.match(/^[/!]\s*[a-z]+/i)) {
    trackXP(msg, jid, sender).catch(() => {}); // fire & forget
  }

  // --- Session-based routing (before command parsing) ---
  // Curhat session routing (Grup diidentifikasi via jid, Japri via senderJid)
  const curhatKey = isGroup ? jid : senderJid;
  const curhatSess = curhatSessions.get(curhatKey);
  if (curhatSess && ['active', 'awaiting_identity', 'awaiting_group_confirm'].includes(curhatSess.status)) {
    const cmdCheck = text.match(/^[/!]\s*([a-z]+)/i);
    if (!cmdCheck || !['selesai', 'curhat'].includes(cmdCheck[1].toLowerCase())) {
      // Di grup: SEMUA status session (active, awaiting_identity, awaiting_group_confirm)
      // wajib di-tag (@bot) atau di-reply pesannya!
      if (isGroup && !isBotMentionedOrQuoted(msg)) {
        // Jangan respon pembicaraan grup biasa
      } else {
        return handleCurhatMessage(msg, curhatKey, curhatSess, text, sender, isGroup);
      }
    }
  }
  // BC state routing
  if (bcStates.has(sender) && !isGroup) {
    const bcCheck = text.match(/^[/!]\s*([a-z]+)/i);
    if (!bcCheck || bcCheck[1].toLowerCase() !== 'bc') {
      return handleBcStep(msg, sender, text);
    }
  }
  // Games routing
  if (gameStates.has(jid)) {
    const gCheck = text.match(/^[/!]\s*([a-z]+)/i);
    if (!gCheck || !['games', 'kuis', 'trivia'].includes(gCheck[1].toLowerCase())) {
      if (isGroup) {
        const gs = gameStates.get(jid);
        const lowerText = text.trim().toLowerCase();
        // Selalu proses jika: "batal", atau jawaban yang valid secara konten
        const isValidAnswer = (() => {
          if (lowerText === 'batal' || lowerText === 'cancel') return true;
          if (gs?.step === 'menu') {
            // Pilihan menu valid: angka 1-9, atau keyword nama game
            return /^[1-9]$/.test(lowerText) ||
              ['game_1','game_2','game_3','game_4','game_5','game_6','game_7','game_8','game_9',
               'trivia','tebak kata','singkatan','mitos fakta','mitos','tod','kuis',
               'susun kata','susunkata','scramble',
               'tebak emoji','emoji',
               'tebak tebakan','tebak-tebakan','tebakan','asah otak',
               'hitung kilat','hitung','math'].includes(lowerText);
          }
          if (gs?.type === 'susunkata') {
            const curQ = gs.questions?.[gs.qIndex];
            const clean = lowerText.replace(/\s+/g, '');
            return clean === curQ?.word?.toLowerCase() || lowerText === 'nyerah';
          }
          if (gs?.type === 'emoji') {
            const curQ = gs.questions?.[gs.qIndex];
            const isMatch = curQ && (lowerText === curQ.ans.toLowerCase() || (curQ.aliases && curQ.aliases.some(a => lowerText.includes(a))));
            return Boolean(isMatch) || lowerText === 'nyerah';
          }
          if (gs?.type === 'tebaktebakan') {
            const curQ = gs.questions?.[gs.qIndex];
            const isMatch = curQ && (lowerText.includes(curQ.ans.toLowerCase()) || (curQ.aliases && curQ.aliases.some(a => lowerText.includes(a))));
            return Boolean(isMatch) || lowerText === 'nyerah';
          }
          if (gs?.type === 'hitungkilat') {
            const curQ = gs.questions?.[gs.qIndex];
            return String(curQ?.ans) === lowerText.replace(/\s+/g, '') || lowerText === 'nyerah';
          }
          if (gs?.type === 'trivia' || gs?.type === 'singkatan') {
            // Jawaban valid: A, B, C, D (dengan atau tanpa emoji)
            return /^[a-d🅐🅑🅒🅓]/i.test(lowerText);
          }
          if (gs?.type === 'mitos') {
            return /^(fakta|mitos|1|2)/.test(lowerText);
          }
          if (gs?.type === 'tod' || gs?.step === 'tod_choice') {
            return /^(truth|dare|1|2)/.test(lowerText);
          }
          if (gs?.type === 'kuis') {
            return /^[a-d🅐🅑🅒🅓]/i.test(lowerText);
          }
          return false;
        })();
        // Jika bukan jawaban valid: wajib di-tag atau di-reply
        if (!isValidAnswer && !isBotMentionedOrQuoted(msg)) return;
      }
      return handleGameAnswer(msg, jid, text);
    }
  }
  // Lapor state routing
  if (laporStates.has(sender) && !isGroup) {
    const lCheck = text.match(/^[/!]\s*([a-z]+)/i);
    if (!lCheck || lCheck[1].toLowerCase() !== 'lapor') {
      return handleLaporStep(msg, sender, text);
    }
  }

  const m = text.match(/^[/!]\s*([a-z]+)(?:\s+([\s\S]*))?$/i);
  if (!m) return;
  const cmd = m[1].toLowerCase();
  if (!KNOWN_COMMANDS.has(cmd)) return; // perintah bot lain di grup yang sama: diam
  const arg = (m[2] || '').trim();
  const who = msg.pushName || extractSenderPhone(msg) || 'pengguna';

  if (isGroup) {
    const policy = await getPolicy();
    // !id selalu dijawab supaya admin bisa mendapatkan JID grup baru untuk didaftarkan
    const isIdCmd = ['id', 'group', 'groupinfo', 'info'].includes(cmd);
    if (!isIdCmd && (policy.groupMode === 'off' || (policy.groupMode === 'listed' && !policy.allowedGroups.includes(jid)))) {
      waLog('info', `Perintah /${cmd} dari ${who} di ${groupName || 'grup'} diabaikan (grup tidak diizinkan).`);
      return;
    }
    // Grup: maks. 12 perintah/menit untuk seluruh grup
    if (limited(`g:${jid}`, 12, 60 * 1000)) {
      if (warnOnce(`gw:${jid}`)) waLog('warn', `Batas perintah grup ${groupName || jid} tercapai; perintah berikutnya diabaikan sebentar.`);
      return;
    }
  }
  // Progressive Cooldown Anti-Spam: 3s -> 1m -> 3m -> 10m -> 30m -> 1h -> 3h -> 10h -> 30h -> 30d
  const spamCheck = checkProgressiveCooldown(sender, who);
  if (spamCheck.blocked) {
    if (spamCheck.shouldWarn) {
      startCooldownCountdown(msg, who, spamCheck.cooldownUntil);
    }
    return;
  }  waLog('info', `Perintah /${cmd}${arg && cmd !== 'sandi' ? ` "${arg.slice(0, 40)}"` : ''} dari ${who}${isGroup ? ` di ${groupName || 'grup'}` : ''}.`);

  switch (cmd) {
    case 'menu': case 'help': case 'bantuan': return cmdMenu(msg, isGroup);
    case 'id': case 'group': case 'groupinfo': case 'info': return isGroup ? cmdGroupId(msg, jid, groupName) : undefined;
    case 'cek': return cmdCek(msg, arg, isGroup);
    case 'sandi': return /^ganti\b/i.test(arg) ? cmdSandiGanti(msg, isGroup, arg.replace(/^ganti\s*/i, '')) : cmdSandi(msg, isGroup, arg, text);
    case 'absen': return cmdAbsen(msg, isGroup);
    case 'rekap': return cmdRekap(msg, isGroup, arg);
    case 'curhat': return cmdCurhat(msg, senderJid, sender, arg, isGroup);
    case 'selesai': return cmdSelesai(msg, senderJid, sender, isGroup);
    case 'kartu': case 'card': return cmdKartu(msg, arg, isGroup);
    case 'pengurus': return cmdPengurus(msg);
    case 'divisi': return cmdDivisi(msg, arg);
    case 'bc': return cmdBc(msg, sender, isGroup);
    case 'games': case 'kuis': case 'trivia': return cmdGames(msg, jid);
    case 'fun': return cmdFun(msg, arg, isGroup, jid);
    case 'level': return cmdLevel(msg, arg, isGroup, sender, who);
    case 'scoreboard': case 'top': return cmdScoreboard(msg, arg, isGroup, jid);
    case 'lapor': return cmdLapor(msg, arg, sender, isGroup);
    default: return undefined;
  }
}

async function cmdMenu(msg, isGroup) {
  const rows = [
    { label: '/cek [nama/NISN]', value: 'Hasil seleksi & status pendaftar' },
    { label: '/absen', value: 'Kehadiranmu (japri)' },
    { label: '/sandi', value: 'Lihat sandi akun (japri)' },
    { label: '/sandi ganti', value: 'Kode OTP ganti sandi akun' },
    { label: '/curhat', value: 'Ruang Curhat AI Konselor (japri/grup)' },
    { label: '/kartu [nama/NISN]', value: 'Kirim ID Card fisik (japri)' },
    { label: '/pengurus', value: 'Struktur kepengurusan aktif' },
    { label: '/divisi [nama]', value: 'Info detail divisi & anggota' },
    { label: '/fun', value: 'Fun Zone: Games, Level, Scoreboard!' },
    { label: '/lapor [pesan]', value: 'Layanan aduan & laporan' },
    ...(isGroup ? [{ label: '!id', value: 'ID grup ini (admin)' }] : [])
  ];

  const caption = `📋 *MENU BOT PIK-R MANSEKU*\n\n${rows.map((r) => `• *${r.label}* — ${r.value}`).join('\n')}\n\n🌐 ${SITE_URL}`;

  // Kirim kartu menu + tombol cepat
  await replyCard(msg, { title: 'Menu Bot', subtitle: 'Ketik salah satu perintah di bawah', rows, note: `Situs: ${SITE_URL}` }, caption);
  return replyButtons(msg, '💡 *Akses Cepat Menu Populer:*', [
    { id: '/curhat', text: '💬 Mulai Curhat' },
    { id: '/fun', text: '🎮 Fun Zone' },
    { id: '/pengurus', text: '🏛️ Pengurus' }
  ]);
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

async function cmdCek(msg, query, isGroup = false) {
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
    // Di grup tidak menampilkan daftar banyak nama + kelas (privasi); minta cek lewat japri atau NISN
    if (isGroup) return reply(msg, `Ada beberapa nama yang mirip dengan *"${query}"*. Ketik */cek NISN-kamu* atau kirim */cek nama lengkap* lewat japri ke bot ini.`);
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

/** Rekapitulasi absensi dalam bentuk gambar laporan 4:3 dan caption pengumuman resmi. */
async function cmdRekap(msg, isGroup, arg) {
  try {
    const policy = await getPolicy();
    const phone = extractSenderPhone(msg);
    let allowed = !!phone && policy.rekapAllow.includes(phone);
    if (!allowed && policy.rekapCore) {
      const user = await findUserFromWA(msg);
      const org = user && (await prisma.orgMember.findFirst({ where: { memberId: user.id, isCurrent: true } }));
      allowed = !!org && ['KETUA', 'WAKIL', 'KABINET', 'PEMBINA'].includes(org.role);
    }
    if (!allowed) {
      waLog('warn', `/rekap ditolak untuk ${phone || 'nomor tidak dikenal'} (tidak ada di allowlist).`);
      return isGroup ? undefined : reply(msg, '🔒 */rekap* hanya untuk pengurus atau nomor yang diizinkan.');
    }

    // Parsing target date dari arg (bisa kosong = hari ini, dd/mm/yyyy, atau dd/mm)
    const today = wibDate();
    let targetDate = today;
    if (arg && arg.trim()) {
      const str = arg.trim();
      const curYear = today.slice(0, 4);
      const fullMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      const shortMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
      if (fullMatch) {
        const d = fullMatch[1].padStart(2, '0');
        const m = fullMatch[2].padStart(2, '0');
        const y = fullMatch[3];
        targetDate = `${y}-${m}-${d}`;
      } else if (shortMatch) {
        const d = shortMatch[1].padStart(2, '0');
        const m = shortMatch[2].padStart(2, '0');
        targetDate = `${curYear}-${m}-${d}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        targetDate = str;
      } else {
        return reply(msg, '⚠️ Format tanggal tidak dikenali.\n\nContoh format yang didukung:\n• */rekap* (hari ini)\n• */rekap 20/11/2026*\n• */rekap 20/11*');
      }
    }

    if (!isValidDate(targetDate)) {
      return reply(msg, '⚠️ Tanggal yang dimasukkan tidak valid. Harap periksa kembali.');
    }

    const { buildRecap } = await import('../controllers/absen.js');
    const recap = await buildRecap(targetDate, targetDate);
    const session = recap.sessions?.[0];
    const dateStr = new Date(`${targetDate}T12:00:00+07:00`).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta'
    });

    if (!session) {
      return reply(msg, `ℹ️ Tidak ada kegiatan / presensi terdaftar pada hari *${dateStr}*.`);
    }

    const totals = { HADIR: 0, SAKIT: 0, IZIN: 0, ALFA: 0 };
    recap.rows.forEach(r => {
      const st = r.days?.[0]?.status;
      if (st && totals[st] !== undefined) totals[st]++;
    });
    const totalAnggota = recap.rows?.length || 0;

    const statItems = [];
    if (totals.HADIR > 0) statItems.push(`- 🟢 Hadir: ${totals.HADIR}`);
    if (totals.ALFA > 0) statItems.push(`- 🔴 Alfa: ${totals.ALFA}`);
    if (totals.IZIN > 0) statItems.push(`- 🟡 Izin: ${totals.IZIN}`);
    if (totals.SAKIT > 0) statItems.push(`- 🔵 Sakit: ${totals.SAKIT}`);
    if (statItems.length === 0) statItems.push('- ⚪ Belum ada data presensi');

    const caption = `*📢PENGUMUMAN REKAPITULASI ABSENSI PIK-R MANSEKU*

Disampaikan kepada seluruh anggota PIK-R MANSEKU, berikut merupakan hasil rekapitulasi absensi pada hari:

*🗓️ ${dateStr}*
*📌 Agenda:* ${session.title}

📊 Rekapitulasi Kehadiran:
${statItems.join('\n')}

Demikianlah hasil rekapitulasi absensi hari ini. Diharapkan seluruh anggota PIK-R MANSEKU dapat terus meningkatkan kedisiplinan dan tanggung jawab dalam mengikuti setiap kegiatan organisasi.

Terima kasih atas perhatian dan kerja samanya.

*PIK-R MANSEKU*
> Beriman, Bertanggung Jawab, Berencana.

@pikrmanseku_official`;

    const sessionType = { PERTEMUAN: 'Pertemuan Rutin', WAJIB: 'Kegiatan Wajib', TAMBAHAN: 'Kegiatan Tambahan' }[session.type] || 'Presensi Harian';
    let image;
    try {
      image = renderRekapCard({
        dateStr,
        sessionTitle: session.title,
        sessionType,
        totals,
        totalAnggota
      });
    } catch (errRender) {
      waLog('error', `Gagal render gambar rekap: ${errRender.message}`);
      return reply(msg, caption);
    }

    return reply(msg, { image, caption, mimetype: 'image/png' });
  } catch (err) {
    waLog('error', `/rekap gagal: ${err.message}`);
    return reply(msg, 'Terjadi kesalahan sistem saat membuat rekap.');
  }
}

// ─── Helper: curhat session file management (folder per nomor WhatsApp) ──────
function curhatUserDir(phone) {
  const safeId = String(phone || 'unknown').replace(/\D/g, '') || 'anonymous';
  const dir = path.join(CURHAT_DIR, safeId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadCurhatHistory(phone) {
  try {
    const dir = curhatUserDir(phone);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('active'));
    files.sort();
    const sessions = [];
    for (const f of files.slice(-4)) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        sessions.push(data);
      } catch {}
    }
    return { phone, sessions };
  } catch {}
  return null;
}

function saveCurhatSession(sess) {
  try {
    const dir = curhatUserDir(sess.phone);
    fs.writeFileSync(path.join(dir, 'active_session.json'), JSON.stringify(sess, null, 2), 'utf8');
  } catch (e) {
    waLog('error', `Gagal menyimpan sesi curhat: ${e.message}`);
  }
}

function endCurhatSession(senderJid, reason = 'manual') {
  const sess = curhatSessions.get(senderJid);
  if (!sess) return;
  clearTimeout(curhatTimers.get(senderJid));
  curhatTimers.delete(senderJid);
  sess.status = 'ended';
  sess.endedAt = new Date().toISOString();
  sess.endReason = reason;

  const dir = curhatUserDir(sess.phone);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionFile = path.join(dir, `session_${ts}.json`);

  try {
    fs.writeFileSync(sessionFile, JSON.stringify(sess, null, 2), 'utf8');
    const activeFile = path.join(dir, 'active_session.json');
    if (fs.existsSync(activeFile)) fs.unlinkSync(activeFile);
  } catch (e) {
    waLog('error', `Gagal menyimpan sesi akhir curhat: ${e.message}`);
  }

  curhatSessions.delete(senderJid);
}

function resetCurhatTimer(senderJid) {
  clearTimeout(curhatTimers.get(senderJid));
  const timer = setTimeout(async () => {
    const sess = curhatSessions.get(senderJid);
    if (!sess) return;
    const name = sess.identity?.name || 'Sobat';
    endCurhatSession(senderJid, 'timeout');
    try {
      await send(senderJid, { text: `⏰ *Sesi curhat berakhir otomatis.*\n\nHai *${name}*, karena tidak ada pesan selama 3 jam, sesi curhatmu berakhir ya.\nSemua ceritamu tersimpan aman 💚\nKetik */curhat* kapan saja untuk mulai curhat lagi!` });
    } catch {}
  }, 3 * 60 * 60 * 1000);
  curhatTimers.set(senderJid, timer);
}

// ─── Sesi Curhat AI (Mendukung Japri & Mode Grup dengan Tombol) ──────────────

// ─── Progressive Anti-Spam Cooldown Ladder ──────────────────────────────────
// Level 0: 3s, Level 1: 1m, Level 2: 3m, Level 3: 10m, Level 4: 30m,
// Level 5: 1h, Level 6: 3h, Level 7: 10h, Level 8: 30h, Level 9: 30 hari
const SPAM_COOLDOWNS = [
  3,                       // 3 detik
  60,                      // 1 menit
  3 * 60,                  // 3 menit
  10 * 60,                 // 10 menit
  30 * 60,                 // 30 menit
  60 * 60,                 // 1 jam
  3 * 60 * 60,             // 3 jam
  10 * 60 * 60,            // 10 jam
  30 * 60 * 60,            // 30 jam
  30 * 24 * 60 * 60        // 30 hari
];

const userCooldowns = new Map();

function formatTimeRemaining(seconds) {
  if (seconds < 60) return `${Math.ceil(seconds)} detik`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.ceil(seconds % 60);
    return s > 0 ? `${m} mnt ${s} dtk` : `${m} menit`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  if (seconds < 86400) return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`;
  const d = Math.floor(seconds / 86400);
  const hRem = Math.ceil((seconds % 86400) / 3600);
  return hRem > 0 ? `${d} hari ${hRem} jam` : `${d} hari`;
}

// Cooldown countdown: edit pesan tiap detik (jika ≤15s) atau tiap menit (jika >15s)
// Batas edit WA = 15 menit → setelah itu biarkan
function buildCooldownText(who, remainingSec) {
  const timeStr = formatTimeRemaining(remainingSec);
  if (remainingSec <= 0) {
    return `✅ *Cooldown Selesai!*\n\nHai *${who}*, kamu sudah bisa mengirim perintah lagi! 🎉`;
  }
  // Angka hitung mundur besar jika <= 10 detik
  const bigNum = remainingSec <= 10 ? `\n\n*${Math.ceil(remainingSec)}* ⏱️` : '';
  return `⏳ *Cooldown Spam Bot*\n\nHai *${who}*, tunggu \`${timeStr}\` sebelum kirim perintah lagi ya! 🙏${bigNum}`;
}

async function startCooldownCountdown(msg, who, cooldownUntil) {
  const jid = msg.key.remoteJid;
  if (!sock || state.status !== 'open') return;

  const remainingSec = Math.ceil((cooldownUntil - Date.now()) / 1000);
  const initialText = buildCooldownText(who, remainingSec);

  let sentMsg;
  try {
    sentMsg = await sock.sendMessage(jid, { text: initialText }, { quoted: msg });
  } catch { return; }

  if (!sentMsg?.key) return;

  const sentKey = sentMsg.key;
  const isShort = remainingSec <= 15; // ≤15s: countdown detik per detik
  const isLong  = remainingSec > 15;  // >15s: update tiap menit
  const MAX_EDIT_MS = 14.5 * 60 * 1000; // edit hanya sampai 14.5 menit (batas WA 15 mnt)
  const editDeadline = Date.now() + MAX_EDIT_MS;

  if (isShort) {
    // Hitung mundur detik per detik
    for (let rem = remainingSec - 1; rem >= 0; rem--) {
      await new Promise(r => setTimeout(r, 1000));
      if (Date.now() > editDeadline) break;
      const text = buildCooldownText(who, rem);
      sock.sendMessage(jid, { text, edit: sentKey }).catch(() => {});
      if (rem === 0) break;
    }
  } else if (isLong) {
    // Update tiap 60 detik sampai habis atau melewati batas edit
    const tick = async () => {
      const rem = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (rem <= 0 || Date.now() > editDeadline) {
        if (rem <= 0 && Date.now() <= editDeadline) {
          sock.sendMessage(jid, { text: buildCooldownText(who, 0), edit: sentKey }).catch(() => {});
        }
        return; // biarkan pesan terakhir apa adanya jika sudah lewat batas edit
      }
      sock.sendMessage(jid, { text: buildCooldownText(who, rem), edit: sentKey }).catch(() => {});
      setTimeout(tick, 60 * 1000);
    };
    setTimeout(tick, 60 * 1000);
  }
}

function checkProgressiveCooldown(sender, who) {
  const now = Date.now();
  let u = userCooldowns.get(sender);

  if (!u) {
    u = { level: 0, cooldownUntil: 0, lastTriggerAt: 0, lastWarnAt: 0, rapidCount: 0 };
    userCooldowns.set(sender, u);
  }

  // Jika sedang dalam masa cooldown
  if (now < u.cooldownUntil) {
    // Pelanggaran berulang saat masih cooldown: naikkan tangga!
    u.level = Math.min(SPAM_COOLDOWNS.length - 1, u.level + 1);
    const newPenalty = SPAM_COOLDOWNS[u.level];
    u.cooldownUntil = now + (newPenalty * 1000);
    u.lastTriggerAt = now;

    const remainingSec = Math.ceil((u.cooldownUntil - now) / 1000);
    const timeText = formatTimeRemaining(remainingSec);

    const canWarn = (now - u.lastWarnAt) >= 2000;
    if (canWarn) u.lastWarnAt = now;

    waLog('warn', `${who} melanggar cooldown (Level ${u.level}); ditahan selama ${timeText}.`);
    return { blocked: true, shouldWarn: canWarn, timeText, cooldownUntil: u.cooldownUntil };
  }

  const isFirst = u.lastTriggerAt === 0;
  const diff = isFirst ? 9999 : (now - u.lastTriggerAt) / 1000;
  u.lastTriggerAt = now;

  if (diff < 1.5) {
    u.rapidCount = (u.rapidCount || 0) + 1;
  } else if (diff > 10) {
    u.rapidCount = 0;
    if (diff > 120 && u.level > 0) u.level = Math.max(0, u.level - 1);
  }

  // Jika spam cepat (2 pesan berturut-turut < 1.5s atau jeda < 0.8s)
  if (u.rapidCount >= 2 || diff < 0.8) {
    const penalty = SPAM_COOLDOWNS[u.level];
    u.cooldownUntil = now + (penalty * 1000);
    u.lastWarnAt = now;
    const timeText = formatTimeRemaining(penalty);

    waLog('warn', `${who} terdeteksi spam (Level ${u.level}); diberi cooldown ${timeText}.`);
    return { blocked: true, shouldWarn: true, timeText, cooldownUntil: u.cooldownUntil };
  }

  return { blocked: false };
}

// ─── System Prompt Curhat AI Konselor PIK-R MANSEKU ─────────────────────────
const CURHAT_SYSTEM = `Kamu adalah "Sahabat AI", konselor sebaya virtual resmi dari PIK-R (Pusat Informasi dan Konseling Remaja) MAN 1 Muara Enim (MANSEKU).

### Peran & Persona:
1. Sahabat Sebaya yang Tulus:
   - Bersikap sebagai sahabat sebaya yang hangat, santai, penuh empati, dan pengertian.
   - Gunakan gaya bahasa santai dan akrab yang nyaman bagi remaja/siswa madrasah ("aku" dan "kamu").
   - Jangan kaku, jangan menggurui, dan jangan berbicara seperti robot atau dokumen formal.
   - Gunakan emoji secukupnya agar suasana percakapan terasa hidup, hangat, dan menenangkan 😊✨.

2. Pendekatan Konseling Sebaya (Active Listening & Empathy):
   - Selalu mulai dengan memvalidasi dan mengapresiasi perasaan mereka terlebih dahulu (contoh: "Pasti berat banget ya rasanya ada di posisi itu...", "Wajar banget kok kalau kamu ngerasa capek/bingung...").
   - Berikan tanggapan yang hangat, ringkas (2-4 paragraf santai), lalu ajak mereka mengeksplorasi perasaan dengan pertanyaan pemantik yang reflektif.
   - Dampingi temanmu agar ia merasa didengarkan seutuhnya dan bisa menemukan sudut pandang positif serta solusinya sendiri.

3. Konteks Remaja & PIK-R:
   - Pahami dinamika kehidupan remaja: beban tugas sekolah/madrasah, overthinking masa depan, ujian, pertemanan, rasa insecure, hubungan keluarga, hingga asmara remaja.
   - Terapkan semangat nilai GenRe (Generasi Berencana) & Triad KRR: Katakan Tidak pada Pernikahan Dini, Seks Pranikah, dan Napza.

4. Standar Format Teks WhatsApp:
   - Gunakan format WhatsApp: *bold* untuk penekanan, _italic_ untuk istilah santai, ~strikethrough~ jika perlu.
   - Jangan gunakan format markdown **bold** (gunakan *bold*).
`;

async function processCurhatAI(msg, key, sess, text, isGroup) {
  const contents = [];
  const recentLogs = (sess.logs || []).slice(-10);
  for (const l of recentLogs) {
    contents.push({ role: l.role === 'assistant' ? 'model' : 'user', parts: [{ text: l.text }] });
  }
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text }] });
  }

  let systemPrompt = CURHAT_SYSTEM;
  if (sess.isGroup) {
    systemPrompt += `\n\n[Catatan Mode Grup: Anda sedang merespons di dalam grup WhatsApp PIK-R MANSEKU. Berikan respons yang hangat, suportif, tetap menjaga privasi, dan menguatkan anggota grup.]`;
  }
  if (sess.previousContext) {
    systemPrompt += `\n\n[Konteks dari sesi-sesi curhat sebelumnya:\n${sess.previousContext}\n]`;
  }

  try {
    const aiReply = await callGemini(contents, systemPrompt);
    sess.logs.push({ role: 'assistant', text: aiReply, timestamp: new Date().toISOString() });
    saveCurhatSession(sess);

    return replyButtons(msg, aiReply, [
      { id: 'selesai', text: '❌ Selesai Curhat' }
    ]);
  } catch (err) {
    waLog('error', `Curhat AI error: ${err.message}`);
    return reply(msg, '😔 Maaf, aku sedang ada kendala koneksi sebentar. Coba kirim pesanmu lagi ya, aku tetap mendengarkan! 💚');
  }
}

async function handleCurhatMessage(msg, key, sess, text, sender, isGroup) {
  const lower = text.trim().toLowerCase();

  // Tombol batal
  if (lower === 'batal' || lower === 'cancel') {
    endCurhatSession(key, 'cancelled');
    return reply(msg, '❌ Sesi curhat dibatalkan. Kapan pun kamu butuh teman cerita, ketik */curhat* ya 💚');
  }

  // Tombol selesai
  if (lower === 'selesai' || lower === '/selesai') {
    return cmdSelesai(msg, key, sender, isGroup);
  }

  // Mode konfirmasi grup
  if (sess.status === 'awaiting_group_confirm') {
    if (lower === 'curhat_grup_start' || lower.includes('buka curhat') || lower === '1') {
      sess.status = 'active';
      sess.identity = { name: 'Teman-teman Grup', isAnon: false };
      resetCurhatTimer(key);
      saveCurhatSession(sess);

      const welcome = `✅ *Mode Curhat Grup Aktif!* 👥\n\nSilakan ceritakan apa yang sedang kalian rasakan atau diskusikan bersama AI Konselor PIK-R 💚\n\n📌 *Catatan Khusus di Grup:*\n• Wajib *reply (balas)* pesan bot ini atau tag *@bot* agar bot merespons ceritamu.\n• Ketik */selesai* atau tekan tombol di bawah kapan saja untuk mengakhiri.`;
      return replyButtons(msg, welcome, [
        { id: 'selesai', text: '❌ Selesai Curhat' }
      ]);
    }
    if (lower === 'anonim' || lower === '2') {
      sess.status = 'active';
      sess.identity = { name: 'Sobat Anonim', isAnon: true };
      resetCurhatTimer(key);
      saveCurhatSession(sess);

      const welcome = `✅ *Mode Curhat Anonim Grup Aktif!* 👤\n\nIdentitas pengirim disamarkan sebagai *Sobat Anonim* 💚\n\n📌 *Catatan Khusus di Grup:*\n• Wajib *reply (balas)* pesan bot ini atau tag *@bot* agar bot merespons.\n• Ketik */selesai* kapan saja untuk mengakhiri.`;
      return replyButtons(msg, welcome, [
        { id: 'selesai', text: '❌ Selesai Curhat' }
      ]);
    }
    return reply(msg, 'Silakan pilih tombol di atas atau ketik *batal* untuk membatalkan.');
  }

  // Mode menunggu identitas nama/anonim (japri)
  if (sess.status === 'awaiting_identity') {
    const isAnon = lower === 'anonim' || lower === '1';
    const name = isAnon ? 'Sobat Anonim' : (text.trim().slice(0, 50) || 'Sobat');
    sess.identity = { name, isAnon };
    sess.status = 'active';
    sess.logs.push({ role: 'user', text, timestamp: new Date().toISOString() });
    saveCurhatSession(sess);
    resetCurhatTimer(key);

    const pendingMsg = sess.pendingMessage;

    const opening = `✨ *Halo, ${name}!* ✨\n\nSelamat datang di Ruang Curhat Bot PIK-R MANSEKU 💚\nAku siap mendengarkan ceritamu dengan sepenuh hati, tanpa menghakimi.\n\n📌 *Panduan Sesi:*\n• Ketik */selesai* atau tekan tombol di bawah bila sudah selesai\n• Sesi berakhir otomatis jika didiamkan selama 3 jam\n• Semua ceritamu tersimpan aman & terjaga kerahasiaannya\n\nSekarang, ceritakan apa yang lagi mengganjal di hatimu... aku siap mendengarkan 🤗`;

    sess.logs.push({ role: 'assistant', text: opening, timestamp: new Date().toISOString() });
    saveCurhatSession(sess);

    if (pendingMsg) {
      delete sess.pendingMessage;
      sess.logs.push({ role: 'user', text: pendingMsg, timestamp: new Date().toISOString() });
      saveCurhatSession(sess);
      resetCurhatTimer(key);
      await reply(msg, opening);
      return processCurhatAI(msg, key, sess, pendingMsg, isGroup);
    }

    return replyButtons(msg, opening, [
      { id: 'selesai', text: '❌ Selesai Curhat' }
    ]);
  }

  // Sesi Aktif — Tanggapi via AI
  sess.logs.push({ role: 'user', text, timestamp: new Date().toISOString() });
  sess.lastActivity = new Date().toISOString();
  saveCurhatSession(sess);
  resetCurhatTimer(key);

  return processCurhatAI(msg, key, sess, text, isGroup);
}

async function cmdCurhat(msg, key, sender, arg, isGroup) {
  const existing = curhatSessions.get(key);
  if (existing && existing.status !== 'ended') {
    return replyButtons(msg, `💚 Kamu sudah memiliki sesi curhat yang aktif!\n\nSilakan kirim ceritamu, atau tekan tombol di bawah untuk mengakhiri.`, [
      { id: 'selesai', text: '❌ Selesai Curhat' }
    ]);
  }

  // 1. Jika di GRUP: Tampilkan konfirmasi keamanan privasi terlebih dahulu!
  if (isGroup) {
    const newSession = {
      jid: key,
      phone: sender,
      isGroup: true,
      identity: null,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: 'awaiting_group_confirm',
      logs: [],
      previousContext: null
    };
    if (arg) newSession.pendingMessage = arg;
    curhatSessions.set(key, newSession);
    resetCurhatTimer(key);

    const warnText = `⚠️ *PERHATIAN: CURHAT DI DALAM GRUP*\n\nPesan curhat di grup dapat dibaca oleh seluruh anggota grup ini.\nApakah kamu yakin ingin membuka sesi curhat bersama di grup ini?\n\n💡 _Untuk privasi penuh, kamu disarankan curhat secara pribadi (japri) langsung ke bot ini._`;

    return replyButtons(msg, warnText, [
      { id: 'curhat_grup_start', text: '👥 Buka Curhat Grup' },
      { id: 'anonim', text: '👤 Mode Anonim' },
      { id: 'batal', text: '❌ Batal' }
    ]);
  }

  // 2. Jika di JAPRI (Pribadi): Muat riwayat sesi sebelumnya untuk konteks AI
  let previousContext = '';
  const hist = loadCurhatHistory(sender);
  if (hist?.sessions?.length) {
    const lastSessions = hist.sessions.slice(-2);
    const contextLines = [];
    for (const s of lastSessions) {
      if (s.identity?.name) contextLines.push(`Nama pengguna: ${s.identity.name}`);
      for (const l of (s.logs || []).slice(-6)) {
        if (l.role === 'user') contextLines.push(`Pengguna: ${l.text.slice(0, 120)}`);
      }
    }
    if (contextLines.length) previousContext = contextLines.join('\n');
  }

  const newSession = {
    jid: key,
    phone: sender,
    isGroup: false,
    identity: null,
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    status: 'awaiting_identity',
    logs: [],
    previousContext: previousContext || null,
    previousSessions: hist?.sessions?.length || 0
  };

  if (arg) newSession.pendingMessage = arg;
  curhatSessions.set(key, newSession);
  resetCurhatTimer(key);

  const greeting = arg
    ? `Halo! 👋\n\nAku sudah terima pesanmu: _"${arg.slice(0, 80)}${arg.length > 80 ? '...' : ''}"_\n\nSebelum kita mulai, boleh aku tahu *nama panggilan kamu*? Atau ingin curhat secara *Anonim*? 🤗`
    : `Halo! 👋\n\nSelamat datang di Ruang Curhat Bot PIK-R MANSEKU 💚\n\nSebelum kita mulai curhat, kamu ingin disapa dengan nama siapa? Atau ingin curhat secara *Anonim*? 🤗`;

  return replyButtons(msg, greeting, [
    { id: 'anonim', text: '👤 Anonim' },
    { id: 'batal', text: '❌ Batal' }
  ]);
}

async function cmdSelesai(msg, key, sender, isGroup) {
  const sess = curhatSessions.get(key);
  if (!sess || sess.status === 'ended') {
    return reply(msg, '💬 Belum ada sesi curhat aktif saat ini. Ketik */curhat* untuk mulai berbagi 💚');
  }

  const name = sess.identity?.name || (sess.isGroup ? 'Teman-teman' : 'Sobat');
  const msgCount = (sess.logs || []).filter(l => l.role === 'user').length;
  endCurhatSession(key, 'manual');

  return reply(msg, `💚 *Terima kasih sudah berbagi, ${name}!*\n\n_${msgCount > 0 ? `Sesi ini mencatat ${msgCount} pesan curhat.` : 'Semua ceritamu tersimpan aman.'}_\n\nIngat: kamu tidak pernah sendirian. PIK-R MANSEKU selalu ada untukmu 🫂\nKalau butuh teman ngobrol lagi, ketik */curhat* kapan saja ya!\n\n_Tetap semangat dan jaga kesehatan mentalmu_ ✨`);
}

// ─── /kartu & /card ──────────────────────────────────────────────────────────
async function cmdKartu(msg, query, isGroup) {
  if (isGroup) return reply(msg, PRIVATE_ONLY('/kartu'));
  if (!query) return reply(msg, '📋 Format: */kartu [nama atau NISN]*\nContoh: */kartu Hasan Ajri* atau */kartu 3102603365*');

  try {
    let member = null;
    if (/^\d+$/.test(query)) {
      member = await prisma.member.findFirst({ where: { nisn: query }, select: { id: true, name: true, nisn: true, className: true, slug: true } });
    } else {
      const allMembers = await prisma.member.findMany({ select: { id: true, name: true, nisn: true, className: true, slug: true } });
      const matches = findSimilarCandidates(query, allMembers);
      if (matches.length === 1 || (matches[0] && matches[0].score >= 0.75)) {
        member = matches[0].candidate;
      } else if (matches.length > 1) {
        const top3 = matches.slice(0, 3).map(m => `• *${m.candidate.name}* (${m.candidate.nisn})`).join('\n');
        return reply(msg, `🔍 Ditemukan beberapa nama yang mirip:\n${top3}\n\nSilakan tulis lebih spesifik atau gunakan NISN!`);
      }
    }

    if (!member) return reply(msg, `❌ Data anggota untuk *"${query}"* tidak ditemukan.\nPastikan nama/NISN terdaftar di PIK-R MANSEKU.`);

    const sanitizedName = member.name.replace(/[/\\?%*:|"<>]/g, '');
    let frontFile = null;
    let backFile = null;

    if (fs.existsSync(CARDS_DIR)) {
      const files = fs.readdirSync(CARDS_DIR);
      frontFile = files.find(f => {
        const lower = f.toLowerCase();
        return (member.nisn && lower.includes(member.nisn)) || lower.includes(sanitizedName.toLowerCase());
      });
    }

    if (fs.existsSync(CARDS_BACK_DIR)) {
      const backFiles = fs.readdirSync(CARDS_BACK_DIR);
      backFile = backFiles.find(f => {
        const lower = f.toLowerCase();
        return (member.nisn && lower.includes(member.nisn)) || lower.includes(sanitizedName.toLowerCase());
      });
      if (!backFile && backFiles.length > 0) {
        const def = backFiles.find(f => /default|belakang|card/i.test(f));
        backFile = def || backFiles[0];
      }
    }

    const caption = `🪪 *ID CARD ANGGOTA PIK-R MANSEKU*\n\n👤 Nama: *${member.name}*\n🔢 NISN: *${member.nisn || '-'}*\n🏫 Kelas: *${member.className || '-'}*\n\n📌 _Simpan kartu ini dan bawa saat absensi kegiatan ya!_`;

    if (frontFile) {
      const frontPath = path.join(CARDS_DIR, frontFile);
      await send(msg.key.remoteJid, { image: fs.readFileSync(frontPath), caption, mimetype: 'image/jpeg' }, { quoted: msg });
      if (backFile) {
        const backPath = path.join(CARDS_BACK_DIR, backFile);
        if (fs.existsSync(backPath)) {
          await new Promise(r => setTimeout(r, 600));
          await send(msg.key.remoteJid, { image: fs.readFileSync(backPath), caption: '🔄 *Bagian Belakang ID Card*', mimetype: 'image/jpeg' }, { quoted: msg });
        }
      }
      return;
    }

    return reply(msg, `${caption}\n\n⚠️ _Berkas gambar ID card fisik belum tersedia di arsip digital panitia._`);
  } catch (err) {
    waLog('error', `/kartu error: ${err.message}`);
    return reply(msg, 'Terjadi kesalahan saat memproses kartu.');
  }
}

// ─── /pengurus (Diperbaiki: Tanpa Error Prisma Order) ────────────────────────
async function cmdPengurus(msg) {
  try {
    const orgMembers = await prisma.orgMember.findMany({
      where: { isCurrent: true },
      include: { member: { select: { name: true, className: true } } }
    });

    if (!orgMembers.length) return reply(msg, '📋 Data kepengurusan belum tersedia.');

    const catalog = await getCatalog();
    const ROLE_WEIGHT = { PEMBINA: 1, KETUA: 2, WAKIL: 3, KABINET: 4, ANGGOTA: 5 };

    orgMembers.sort((a, b) => {
      const posA = catalog.find(p => p.label.toLowerCase() === a.jabatan.toLowerCase());
      const posB = catalog.find(p => p.label.toLowerCase() === b.jabatan.toLowerCase());
      if (posA && posB) {
        if (posA.level !== posB.level) return posA.level - posB.level;
        return posA.order - posB.order;
      }
      return (ROLE_WEIGHT[a.role] || 99) - (ROLE_WEIGHT[b.role] || 99);
    });

    const pembina = orgMembers.filter(m => m.role === 'PEMBINA');
    const ketua = orgMembers.filter(m => m.role === 'KETUA');
    const wakil = orgMembers.filter(m => m.role === 'WAKIL');
    const sekretaris = orgMembers.filter(m => /sekretaris/i.test(m.jabatan || ''));
    const bendahara = orgMembers.filter(m => /bendahara/i.test(m.jabatan || ''));
    const kabinet = orgMembers.filter(m => m.role === 'KABINET' && !sekretaris.includes(m) && !bendahara.includes(m));

    const fmt = (arr) => arr.map(m => `  • *${m.member?.name || m.name}*${m.member?.className ? ` (${m.member.className})` : ''} — _${m.jabatan}_`).join('\n');

    let text = `🏛️ *STRUKTUR KEPENGURUSAN PIK-R MANSEKU*\n_Periode Aktif_\n`;
    if (pembina.length) text += `\n👨‍🏫 *Pembina:*\n${fmt(pembina)}`;
    if (ketua.length) text += `\n\n👑 *Ketua Umum:*\n${fmt(ketua)}`;
    if (wakil.length) text += `\n\n🤝 *Wakil Ketua:*\n${fmt(wakil)}`;
    if (sekretaris.length) text += `\n\n📝 *Sekretaris:*\n${fmt(sekretaris)}`;
    if (bendahara.length) text += `\n\n💰 *Bendahara:*\n${fmt(bendahara)}`;
    if (kabinet.length) text += `\n\n🗂️ *Koordinator Bidang / Divisi:*\n${fmt(kabinet)}`;
    text += `\n\n💡 Ketik */divisi [nama]* untuk info anggota divisi tertentu.\n🔗 Bagan lengkap: ${SITE_URL}/kami`;

    return reply(msg, text);
  } catch (err) {
    waLog('error', `/pengurus error: ${err.message}`);
    return reply(msg, 'Terjadi kesalahan saat mengambil data pengurus.');
  }
}

// ─── /divisi ─────────────────────────────────────────────────────────────────
async function cmdDivisi(msg, divName) {
  try {
    const catalog = await getCatalog();
    const activeHolders = await prisma.orgMember.findMany({
      where: { isCurrent: true },
      include: { member: { select: { name: true, className: true } } }
    });

    const divisionPositions = catalog.filter(p => !p.parent && (p.role === 'KABINET' || /koordinator|ketua bidang|divisi/i.test(p.label)));

    if (!divName || !divName.trim()) {
      const list = divisionPositions.map((p, i) => {
        const holder = activeHolders.find(h => h.jabatan.toLowerCase() === p.label.toLowerCase());
        const tagHint = (p.tags && p.tags.length) ? ` _(${p.tags.slice(0, 3).join(', ')})_` : '';
        const nameStr = holder ? ` — *${holder.member?.name || holder.name}*` : '';
        return `${i + 1}. *${p.label}*${nameStr}${tagHint}`;
      }).join('\n');

      return reply(msg, `📂 *DAFTAR DIVISI PIK-R MANSEKU*\n\n${list}\n\n💡 _Ketik */divisi [nama/alias]* untuk info detail dan daftar anggota._\nContoh: */divisi pdd* atau */divisi konselor*`);
    }

    const kw = divName.toLowerCase().trim();

    // 1. Cari kecocokan di katalog: label atau tags
    let matchedPos = catalog.find(p => {
      const l = p.label.toLowerCase();
      if (l === kw || l.includes(kw)) return true;
      if (p.tags && Array.isArray(p.tags)) {
        return p.tags.some(t => t.toLowerCase() === kw || t.toLowerCase().includes(kw) || kw.includes(t.toLowerCase()));
      }
      return false;
    });

    // Jika yang cocok adalah posisi anak (misal "Anggota PDD"), arahkan ke induknya jika ada
    if (matchedPos && matchedPos.parent) {
      const parentPos = catalog.find(p => p.label.toLowerCase() === matchedPos.parent.toLowerCase());
      if (parentPos) matchedPos = parentPos;
    }

    // 2. Tentukan posisi koordinator dan posisi anggota divisi
    const coordLabel = matchedPos ? matchedPos.label : null;
    const childPositions = matchedPos ? catalog.filter(p => p.parent && p.parent.toLowerCase() === matchedPos.label.toLowerCase()).map(p => p.label.toLowerCase()) : [];

    // Koordinator
    const coord = activeHolders.find(h => {
      const j = h.jabatan.toLowerCase();
      if (coordLabel && j === coordLabel.toLowerCase()) return true;
      return j.includes(kw) && /koordinator|ketua/i.test(j);
    });

    // Anggota divisi
    const divAnggota = activeHolders.filter(h => {
      const j = h.jabatan.toLowerCase();
      if (coord && h.id === coord.id) return false;
      if (childPositions.length && childPositions.includes(j)) return true;
      if (kw === 'pdd' && (j.includes('pdd') || j.includes('medinfo'))) return true;
      return j.includes(kw) && !/koordinator|ketua umum|pembina/i.test(j);
    });

    if (!matchedPos && !coord && !divAnggota.length) {
      return reply(msg, `❌ Divisi atau jabatan *"${divName}"* tidak ditemukan.\n\nKetik */divisi* untuk melihat daftar divisi dan alias kata kunci yang tersedia.`);
    }

    const title = (matchedPos?.label || coord?.jabatan || divName).toUpperCase();
    let text = `📂 *DIVISI ${title}*\n`;

    if (matchedPos?.description) {
      text += `\n📝 _${matchedPos.description}_\n`;
    }

    if (coord) {
      text += `\n🎯 *Koordinator / Ketua:*\n  • *${coord.member?.name || coord.name}*`;
      if (coord.member?.className) text += ` (${coord.member.className})`;
      text += '\n';
    }

    if (divAnggota.length) {
      text += `\n👥 *Anggota Divisi (${divAnggota.length} orang):*\n`;
      divAnggota.forEach((m) => {
        text += `  • ${m.member?.name || m.name}`;
        if (m.member?.className) text += ` _(${m.member.className})_`;
        text += '\n';
      });
    } else {
      text += `\n👥 *Anggota Divisi:* _(Belum ada data anggota)_\n`;
    }

    if (matchedPos?.tags && matchedPos.tags.length) {
      text += `\n🏷️ *Kata kunci pencarian:* ${matchedPos.tags.join(', ')}\n`;
    }

    text += `\n🌐 ${SITE_URL}/kami`;
    return reply(msg, text);
  } catch (err) {
    waLog('error', `/divisi error: ${err.message}`);
    return reply(msg, 'Terjadi kesalahan saat mengambil data divisi.');
  }
}

// ─── /bc broadcast ───────────────────────────────────────────────────────────
async function isLeadership(senderPhone) {
  if (!senderPhone) return false;
  try {
    const slice = senderPhone.length > 9 ? senderPhone.slice(-9) : senderPhone;
    const member = await prisma.member.findFirst({ where: { whatsappNumber: { contains: slice } } });
    if (!member) return false;
    const org = await prisma.orgMember.findFirst({
      where: { memberId: member.id, isCurrent: true, role: { in: ['PEMBINA', 'KETUA', 'WAKIL', 'KABINET'] } }
    });
    return !!org;
  } catch { return false; }
}

async function cmdBc(msg, sender, isGroup) {
  if (isGroup) return reply(msg, PRIVATE_ONLY('/bc'));

  const isLead = await isLeadership(sender);
  if (!isLead) return reply(msg, '🛑 *AKSES DITOLAK*\n\nPerintah /bc hanya untuk pengurus aktif PIK-R MANSEKU.');

  const policy = await getPolicy();
  const groups = policy.allowedGroups;

  if (!groups.length) return reply(msg, '❌ Belum ada grup WhatsApp yang terdaftar.\nTambahkan grup di Dashboard → Pengaturan → Bot WhatsApp.');

  const groupData = await Promise.all(groups.map(async (gjid) => {
    const g = await prisma.whatsAppGroup.findUnique({ where: { jid: gjid } }).catch(() => null);
    return { jid: gjid, name: g?.name || gjid };
  }));

  bcStates.set(sender, { step: 'pick_group', groups: groupData, selectedGroup: null, message: null });

  const list = groupData.map((g, i) => `${i + 1}. ${g.name}`).join('\n');
  return reply(msg, `📢 *BROADCAST BOT PIK-R*\n\n*Pilih grup tujuan:*\n${list}\n0. Semua Grup Terdaftar\n\nBalas dengan nomor pilihan, atau ketik *batal* untuk membatalkan.`);
}

async function handleBcStep(msg, sender, text) {
  const state_bc = bcStates.get(sender);
  if (!state_bc) return;

  if (/^batal$/i.test(text.trim())) {
    bcStates.delete(sender);
    return reply(msg, '❌ Broadcast dibatalkan.');
  }

  if (state_bc.step === 'pick_group') {
    const num = parseInt(text.trim(), 10);
    if (isNaN(num) || num < 0 || num > state_bc.groups.length) {
      return reply(msg, `❌ Pilihan tidak valid. Balas dengan angka 0–${state_bc.groups.length} atau ketik *batal*.`);
    }
    state_bc.selectedGroup = num === 0 ? 'all' : state_bc.groups[num - 1];
    state_bc.step = 'type_message';
    const target = num === 0 ? 'Semua Grup Terdaftar' : state_bc.groups[num - 1].name;
    return reply(msg, `📝 *Tujuan: ${target}*\n\nSekarang tulis pesan yang ingin dikirim.\n_(Ketik *batal* untuk membatalkan)_`);
  }

  if (state_bc.step === 'type_message') {
    state_bc.message = text.trim();
    state_bc.step = 'confirm';
    const target = state_bc.selectedGroup === 'all' ? 'Semua Grup Terdaftar' : state_bc.selectedGroup.name;
    return reply(msg, `✅ *Konfirmasi Broadcast*\n\nKirim ke: *${target}*\n\n📄 Pesan:\n${state_bc.message}\n\n---\nKetik *YA* untuk kirim, atau *BATAL* untuk membatalkan.`);
  }

  if (state_bc.step === 'confirm') {
    if (/^ya$/i.test(text.trim())) {
      const { selectedGroup, message, groups } = state_bc;
      bcStates.delete(sender);
      const targets = selectedGroup === 'all' ? groups : [selectedGroup];
      let sent = 0;
      for (const g of targets) {
        const ok = await sendWhatsAppGroupBroadcast(g.jid, message);
        if (ok) sent++;
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
      }
      return reply(msg, `✅ *Broadcast selesai!*\n\nTerkirim ke *${sent}/${targets.length}* grup.`);
    } else {
      bcStates.delete(sender);
      return reply(msg, '❌ Broadcast dibatalkan.');
    }
  }
}

// ─── /games (Game Hub PIK-R: 5 Game Lengkap dengan Tombol Interaktif) ─────────
const GAME1_TRIVIA = [
  { q: 'Apa kepanjangan dari PIK-R?', opts: ['A. Pusat Informasi Kesehatan Remaja', 'B. Pusat Informasi dan Konseling Remaja', 'C. Program Ilmu dan Kreasi Remaja', 'D. Pusat Ilmu Kesehatan Remaja'], ans: 'B' },
  { q: 'Triad KRR dalam PIK-R terdiri dari pencegahan apa saja?', opts: ['A. Narkoba, Pornografi, Kekerasan', 'B. Pernikahan dini, seks pranikah, narkoba/napza', 'C. Bullying, rokok, alkohol', 'D. Depresi, stres, kecemasan'], ans: 'B' },
  { q: 'Nomor hotline konseling nasional SEJIWA yang benar adalah?', opts: ['A. 119 ext 8', 'B. 110', 'C. 112', 'D. 129'], ans: 'A' },
  { q: 'Remaja yang sehat secara mental ditandai dengan?', opts: ['A. Tidak pernah sedih sama sekali', 'B. Mampu mengelola emosi dan menjalin hubungan positif', 'C. Selalu ceria setiap saat', 'D. Tidak memiliki masalah apapun'], ans: 'B' },
  { q: 'GenRe adalah singkatan dari?', opts: ['A. Generasi Remaja', 'B. Generasi Berencana', 'C. Generasi Rencana', 'D. Gender Remaja'], ans: 'B' },
  { q: 'Berapa usia minimum pernikahan bagi perempuan & laki-laki menurut UU Perkawinan terbaru?', opts: ['A. 16 tahun', 'B. 17 tahun', 'C. 19 tahun', 'D. 21 tahun'], ans: 'C' },
  { q: 'Fungsi utama dari Konselor Sebaya di PIK-R adalah?', opts: ['A. Menghukum teman yang salah', 'B. Menjadi pendengar yang baik dan membantu teman mencari jalan keluar', 'C. Memberikan obat dan resep dokter', 'D. Mengatur absensi madrasah'], ans: 'B' }
];

const GAME2_SINGKATAN = [
  { q: 'Apa kepanjangan dari *PUP* dalam program BKKBN/GenRe?', opts: ['A. Pendampingan Usia Perkawinan', 'B. Pendewasaan Usia Perkawinan', 'C. Pencegahan Usia Pernikahan', 'D. Perencanaan Usia Pelajar'], ans: 'B', exp: 'Pendewasaan Usia Perkawinan (PUP) menganjurkan usia minimal menikah 21 tahun bagi perempuan dan 25 tahun bagi laki-laki.' },
  { q: 'Apa kepanjangan dari *PDD* di PIK-R MANSEKU?', opts: ['A. Publikasi, Dekorasi, dan Dokumentasi', 'B. Pusat Data dan Dokumentasi', 'C. Program Desain dan Digital', 'D. Pendidik dan Dokter Daearah'], ans: 'A', exp: 'PDD adalah divisi Publikasi, Dekorasi, dan Dokumentasi (sebelumnya bernama MedInfo).' },
  { q: 'Apa kepanjangan dari *KIE*?', opts: ['A. Konseling, Informasi, dan Edukasi', 'B. Komunikasi, Informasi, dan Edukasi', 'C. Kegiatan, Inovasi, dan Evaluasi', 'D. Konseling, Inovasi, dan Empati'], ans: 'B', exp: 'KIE (Komunikasi, Informasi, dan Edukasi) adalah metode penyampaian pesan kesehatan remaja secara efektif.' },
  { q: 'Apa kepanjangan dari *BKKBN*?', opts: ['A. Badan Kependudukan dan Keluarga Berencana Nasional', 'B. Badan Kesejahteraan Keluarga Berencana Nasional', 'C. Balai Kesehatan Keluarga Berencana Nasional', 'D. Badan Koordinasi Keluarga Bersama Nasional'], ans: 'A', exp: 'BKKBN menaungi program GenRe dan pembinaan remaja seluruh Indonesia.' },
  { q: 'Istilah *STUNTING* pada remaja dan balita berkaitan dengan?', opts: ['A. Kelebihan berat badan berlebih', 'B. Gangguan pertumbuhan dan perkembangan akibat kekurangan gizi kronis', 'C. Penyakit kulit menular', 'D. Gangguan penglihatan dini'], ans: 'B', exp: 'Stunting dicegah sejak remaja dengan gizi seimbang dan pencegahan anemia!' },
  { q: 'Dalam Triad KRR, kepanjangan dari *KRR* adalah?', opts: ['A. Kesehatan Reproduksi Remaja', 'B. Konseling Rencana Remaja', 'C. Komunitas Remaja Ramah', 'D. Kegiatan Remaja Religius'], ans: 'A', exp: 'Kesehatan Reproduksi Remaja (KRR) penting dijaga untuk masa depan generasi penerus.' }
];

const GAME3_MITOS_FAKTA = [
  { q: 'Mitos atau Fakta: "Minum air es saat sedang menstruasi dapat membekukan darah kotor di rahim."', ans: 'MITOS', exp: 'MITOS! Saluran pencernaan dan rahim terpisah. Suhu air minum tidak membekukan darah menstruasi.' },
  { q: 'Mitos atau Fakta: "Remaja putri perlu minum Tablet Tambah Darah (TTD) seminggu sekali untuk mencegah anemia."', ans: 'FAKTA', exp: 'FAKTA! TTD mencegah anemia defisiensi besi dan menjaga konsentrasi belajar serta persiapan calon ibu masa depan.' },
  { q: 'Mitos atau Fakta: "Jerawat selalu timbul hanya karena sering mencuci muka dengan air."', ans: 'MITOS', exp: 'MITOS! Terlalu sering mencuci muka justru bisa membuat kulit kering dan memicu produksi minyak berlebih. Cukup 2x sehari.' },
  { q: 'Mitos atau Fakta: "Stres psikologis dan beban pikiran bisa memengaruhi siklus haid menjadi tidak teratur."', ans: 'FAKTA', exp: 'FAKTA! Hormon stres (kortisol) dapat memengaruhi hormon reproduksi di otak sehingga siklus haid terganggu.' },
  { q: 'Mitos atau Fakta: "Stunting pada anak hanya dipengaruhi oleh faktor genetik/keturunan semata."', ans: 'MITOS', exp: 'MITOS! Genetik hanya berkontribusi kecil. Faktor utama stunting adalah asupan gizi, sanitasi, dan pola asuh 1000 Hari Pertama Kehidupan.' },
  { q: 'Mitos atau Fakta: "Curhat dan membagikan perasaan ke teman sebaya atau konselor bisa menurunkan tingkat kecemasan remaja."', ans: 'FAKTA', exp: 'FAKTA! Katarsis emosi dan dukungan sosial terbukti ilmiah meredakan stres dan menjaga kesehatan mental.' }
];

const GAME4_TRUTH = [
  'Apa hal yang paling bikin kamu insecure minggu ini, dan gimana cara kamu menghadapinya?',
  'Siapa orang di sekolah yang paling kamu kagumi sikap atau prestasinya? Kenapa?',
  'Pernahkah kamu merasa kesepian meski di tengah keramaian? Apa yang kamu lakukan saat itu?',
  'Apa satu kebiasaan buruk yang paling ingin kamu ubah demi masa depanmu?',
  'Kapan terakhir kali kamu minta maaf ke orang tua atau teman dengan tulus?',
  'Apa mimpi terbesarmu yang belum pernah kamu ceritakan ke orang lain?'
];

const GAME4_DARE = [
  'Kirim stiker paling kocak yang kamu punya sekarang juga! 😂',
  'Buat pantun bertema "Remaja Sehat GenRe" dalam 1 menit dan kirim ke sini! ✍️',
  'Kirim pesan terima kasih singkat ke salah satu teman terbaikmu sekarang! 💚',
  'Tulis 3 hal yang paling kamu syukuri hari ini! 🌟',
  'Tirukan gaya bicara ketua kelas atau guru favoritmu dalam voice note singkat! 🎙️'
];

const GAME5_KUISS = [
  {
    q: '1️⃣ Ketika ada teman sekelas yang tiba-tiba murung dan menyendiri, apa reaksi pertamamu?',
    opts: [
      { id: 'A', text: 'A. Mengajaknya bicara berdua dan mendengarkan ceritanya', trait: 'konselor' },
      { id: 'B', text: 'B. Mengajak teman-teman lain bikin kegiatan seru biar dia terhibur', trait: 'leader' },
      { id: 'C', text: 'C. Bikin meme atau konten lucu buat mencairkan suasana', trait: 'kreator' },
      { id: 'D', text: 'D. Mencarikan solusi praktis atau menghubungkan ke guru/ahli', trait: 'humas' }
    ]
  },
  {
    q: '2️⃣ Dalam sebuah kepanitiaan event sekolah, tugas apa yang paling kamu sukai?',
    opts: [
      { id: 'A', text: 'A. Memimpin koordinasi dan memastikan semua divisi berjalan lancar', trait: 'leader' },
      { id: 'B', text: 'B. Mendesain pamflet, foto/video dokumentasi, dan media sosial', trait: 'kreator' },
      { id: 'C', text: 'C. Berbicara di depan umum, MC, atau menyebarkan undangan ke luar', trait: 'humas' },
      { id: 'D', text: 'D. Mendampingi peserta dan mengurus kenyamanan anggota', trait: 'konselor' }
    ]
  },
  {
    q: '3️⃣ Prinsip hidup yang paling menggambarkan dirimu saat ini:',
    opts: [
      { id: 'A', text: 'A. "Jadilah teladan dan pembawa perubahan positif."', trait: 'leader' },
      { id: 'B', text: 'B. "Kebaikan kecil bisa menyelamatkan hari seseorang."', trait: 'konselor' },
      { id: 'C', text: 'C. "Ekspresikan karyamu, warnai dunia dengan kreativitas."', trait: 'kreator' },
      { id: 'D', text: 'D. "Jalin silaturahmi, jadilah jembatan bagi sesama."', trait: 'humas' }
    ]
  }
];


// ─── Game 6: Susun Kata ──────────────────────────────────────────────────────
const GAME6_SUSUN_KATA = [
  { word: 'SEKOLAH', clue: 'Tempat menuntut ilmu dan bertemu teman' },
  { word: 'PRAMUKA', clue: 'Ekstrakurikuler berseragam cokelat' },
  { word: 'MADRASAH', clue: 'Lembaga pendidikan Islam tercinta' },
  { word: 'KOMPUTER', clue: 'Perangkat teknologi untuk belajar dan mengetik' },
  { word: 'MATAHARI', clue: 'Pusat tata surya yang menerangi bumi' },
  { word: 'PERPUSTAKAAN', clue: 'Gudang ilmu tempat membaca dan pinjam buku' },
  { word: 'PELANGI', clue: 'Fenomena warna-warni sehabis hujan' },
  { word: 'SAHABAT', clue: 'Teman setia saat suka dan duka' },
  { word: 'PRESTASI', clue: 'Hasil membanggakan dari usaha keras' },
  { word: 'KESEHATAN', clue: 'Kondisi bugar raga dan jiwa' },
  { word: 'DISIPLIN', clue: 'Kunci utama kesuksesan seorang juara' },
  { word: 'SEMANGAT', clue: 'Energi positif pantang menyerah' },
  { word: 'INDONESIA', clue: 'Negara kepulauan tanah air tercinta' },
  { word: 'ORGANISASI', clue: 'Wadah berkumpul dan berkarya bersama' },
  { word: 'KREATIF', clue: 'Kemampuan menciptakan ide-ide baru' }
];

function scrambleWord(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const res = arr.join(' - ');
  if (res.replace(/ - /g, '') === word && word.length > 2) {
    return scrambleWord(word);
  }
  return res;
}

// ─── Game 7: Tebak Emoji (Santai & Umum) ─────────────────────────────────────
const GAME7_TEBAK_EMOJI = [
  { emojis: '☀️ + 👓', ans: 'Kacamata hitam', aliases: ['kacamata hitam', 'kacamata'], clue: 'Aksesoris pelindung silau' },
  { emojis: '🌧️ + 🌈', ans: 'Pelangi', aliases: ['pelangi'], clue: 'Keindahan alam sehabis hujan' },
  { emojis: '⚽ + 🥅', ans: 'Sepak bola', aliases: ['sepak bola', 'sepakbola', 'main bola'], clue: 'Olahraga terpopuler di dunia' },
  { emojis: '☕ + 🥛', ans: 'Kopi susu', aliases: ['kopi susu'], clue: 'Minuman santai favorit nongkrong' },
  { emojis: '📚 + 🏫', ans: 'Sekolah', aliases: ['sekolah', 'belajar di sekolah', 'belajar'], clue: 'Tempat menuntut ilmu' },
  { emojis: '🚗 + 🧼', ans: 'Cuci mobil', aliases: ['cuci mobil'], clue: 'Membersihkan kendaraan' },
  { emojis: '🍚 + 🍗', ans: 'Nasi ayam', aliases: ['nasi ayam', 'ayam goreng'], clue: 'Menu makanan favorit sejuta umat' },
  { emojis: '🏠 + 👻', ans: 'Rumah hantu', aliases: ['rumah hantu'], clue: 'Wahana uji nyali seram' },
  { emojis: '🐱 + 🐟', ans: 'Kucing makan ikan', aliases: ['kucing makan ikan', 'kucing ikan'], clue: 'Kebiasaan hewan peliharaan' },
  { emojis: '⏰ + 💤', ans: 'Jam tidur', aliases: ['jam tidur', 'waktu tidur', 'tidur'], clue: 'Waktu istirahat malam' },
  { emojis: '🚲 + 🏞️', ans: 'Bersepeda', aliases: ['bersepeda', 'sepeda'], clue: 'Aktivitas olahraga santai sore' },
  { emojis: '🎂 + 🕯️', ans: 'Ulang tahun', aliases: ['ulang tahun', 'ultah'], clue: 'Momen perayaan hari kelahiran' },
  { emojis: '📱 + 🔋', ans: 'Cas hp', aliases: ['cas hp', 'isi daya', 'charger', 'cas'], clue: 'Isi baterai gadget' },
  { emojis: '🎬 + 🍿', ans: 'Nonton bioskop', aliases: ['nonton bioskop', 'bioskop', 'nonton film'], clue: 'Hiburan akhir pekan' },
  { emojis: '✈️ + 🏝️', ans: 'Liburan', aliases: ['liburan', 'wisata'], clue: 'Jalan-jalan saat waktu senggang' }
];

// ─── Game 8: Tebak-tebakan Lucu & Asah Otak ─────────────────────────────────
const GAME8_TEBAK_TEBAKAN = [
  { q: 'Pintu apa yang didorong sama 10 orang nggak bakal kebuka?', ans: 'Pintu yang ada tulisan tarik', aliases: ['tarik', 'pintu tarik', 'tulisan tarik'], exp: 'Karena pintunya harus ditarik, bukan didorong! 😂' },
  { q: 'Hewan apa yang bersaudara?', ans: 'Katak beradik', aliases: ['katak beradik', 'katak', 'kodok beradik'], exp: 'Katak beradik (kakak beradik) 🐸' },
  { q: 'Benda apa yang kalau dibeli hitam, dipakai merah, dibuang abu-abu?', ans: 'Arang', aliases: ['arang'], exp: 'Arang dibeli hitam, dibakar merah membara, dibuang jadi abu! 🔥' },
  { q: 'Jauh di mata, dekat di hati. Apakah itu?', ans: 'Empedu', aliases: ['empedu', 'usus'], exp: 'Empedu posisinya dekat jantung/hati, jauh dari mata! 🫀' },
  { q: 'Kenapa pohon di depan rumah harus ditebang?', ans: 'Karena kalau dicabut berat', aliases: ['karena kalau dicabut berat', 'berat dicabut', 'berat', 'dicabut berat'], exp: 'Ya iya dong, masa mau dicabut pohon segede gitu! 🌳' },
  { q: 'Ban apa yang enak dimakan?', ans: 'Bandeng', aliases: ['bandeng', 'ikan bandeng'], exp: 'Ikan bandeng presto dong! 🐟' },
  { q: 'Gajah apa yang belalainya pendek?', ans: 'Gajah pesek', aliases: ['gajah pesek', 'pesek'], exp: 'Gajah yang hidungnya pesek! 🐘😂' },
  { q: 'Mata apa yang ukurannya paling besar di alam semesta?', ans: 'Matahari', aliases: ['matahari'], exp: 'Matahari kan gede banget! ☀️' },
  { q: 'Kutu apa yang paling mengerikan?', ans: 'Kutukan', aliases: ['kutukan', 'kutukan kutukan'], exp: 'Kutukan seram hiii! 👻' },
  { q: 'Lampu apa yang kalau dipecahin malah keluar orangnya?', ans: 'Lampu tetangga', aliases: ['lampu tetangga'], exp: 'Coba pecahin lampu tetangga, pasti yang punya langsung keluar marah-marah! 🤣' },
  { q: 'Kaki seribu kalau belok kakinya jadi berapa?', ans: '999', aliases: ['999', 'sembilan ratus'], exp: 'Soalnya yang satu kaki dipake buat ngasih reting/sein! 🛵' },
  { q: 'Kue apa yang paling tengah-tengah?', ans: 'Kue donat', aliases: ['donat', 'kue donat'], exp: 'Donat kan bolong di tengah! 🍩' }
];

// ─── Game 9: Hitung Kilat (Speed Math) ──────────────────────────────────────
function generateMathQuestions(count = 5) {
  const ops = ['+', '-', 'x'];
  const res = [];
  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, ans;
    if (op === '+') {
      a = Math.floor(Math.random() * 45) + 10;
      b = Math.floor(Math.random() * 45) + 10;
      ans = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 60) + 30;
      b = Math.floor(Math.random() * (a - 10)) + 5;
      ans = a - b;
    } else {
      a = Math.floor(Math.random() * 11) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      ans = a * b;
    }
    res.push({ q: `${a} ${op} ${b}`, ans });
  }
  return res;
}

const KARAKTER_RESULTS = {
  leader: {
    title: '👑 SANG PEMIMPIN VISIONER (Tipe Pimpinan Inti)',
    desc: 'Kamu punya jiwa kepemimpinan alami, berani mengambil keputusan, dan pandai mengarahkan tim menuju tujuan bersama. Di PIK-R, kamu sangat cocok berada di jajaran pimpinan inti!'
  },
  konselor: {
    title: '💚 SANG PENDENGAR EMPATIK (Tipe Konselor Sebaya Sejati)',
    desc: 'Kamu peka terhadap perasaan orang lain, pendengar yang hangat, dan tempat ternyaman bagi teman-temanmu untuk mencurahkan hati. Kamu adalah pilar utama Ruang Cerita!'
  },
  kreator: {
    title: '🎨 SANG KREATOR INSPIRATIF (Tipe PDD & Publikasi Visual)',
    desc: 'Kamu memiliki imajinasi visual yang kaya, estetik, dan pandai mengemas pesan menjadi karya menarik. Tanpamu, program PIK-R akan sepi tanpa visual yang memikat!'
  },
  humas: {
    title: '📢 SANG KOMUNIKATOR ULUNG (Tipe Humas & Pendidik Sebaya)',
    desc: 'Kamu luwes bergaul, pandai berbicara, dan mudah membangun relasi dengan siapa saja. Kamu jago menyebarkan virus positif GenRe ke seluruh penjuru madrasah!'
  }
};

async function cmdGames(msg, jid) {
  if (gameStates.has(jid)) gameStates.delete(jid);
  gameStates.set(jid, { step: 'menu' });

  const text = `🎮 *GAME ZONE PIK-R MANSEKU*\n\nPilih game seru yang ingin dimainkan:\n\n` +
    `1️⃣ *Trivia GenRe & Remaja* — Wawasan kesehatan & PIK-R\n` +
    `2️⃣ *Tebak Singkatan GenRe* — Istilah penting remaja\n` +
    `3️⃣ *Mitos vs Fakta* — Uji fakta kesehatan remaja\n` +
    `4️⃣ *Truth or Dare* — Tantangan & kejujuran seru\n` +
    `5️⃣ *Kuis Tipe Karakter* — Temukan tipe kepribadianmu\n` +
    `6️⃣ *Susun Kata* — Asah otak susun huruf acak\n` +
    `7️⃣ *Tebak Emoji* — Tebak kata sehari-hari dari emoji\n` +
    `8️⃣ *Tebak-tebakan Lucu* — Teka-teki receh & humor\n` +
    `9️⃣ *Hitung Kilat* — Adu cepat berhitung matematika\n\n` +
    `_Ketik angka *1-9* atau nama gamenya:_`;

  return replyButtons(msg, text, [
    { id: 'game_1', text: '1️⃣ Trivia' },
    { id: 'game_6', text: '6️⃣ Susun Kata' },
    { id: 'game_7', text: '7️⃣ Tebak Emoji' },
    { id: 'game_8', text: '8️⃣ Tebakan' },
    { id: 'game_9', text: '9️⃣ Hitung' },
    { id: 'batal', text: '❌ Batal' }
  ]);
}


// ─── Multiplayer Game Helpers ─────────────────────────────────────────────────
function trackPlayer(gs, phone, name, isCorrect) {
  if (!gs.players) gs.players = new Map();
  const p = gs.players.get(phone) || { name, correct: 0, total: 0 };
  p.name = name; // update nama terbaru
  p.total++;
  if (isCorrect) p.correct++;
  gs.players.set(phone, p);
}

function buildPlayerBoard(players, totalQ) {
  if (!players || players.size === 0) return '';
  const sorted = [...players.entries()]
    .map(([, p]) => p)
    .sort((a, b) => b.correct - a.correct || b.total - a.total);
  const medals = ['🥇', '🥈', '🥉'];
  const rows = sorted.map((p, i) => {
    const pct = totalQ > 0 ? Math.round((p.correct / totalQ) * 100) : 0;
    return `${medals[i] || `${i+1}.`} *${p.name}* — ${p.correct}/${totalQ} benar (${pct}%)`;
  });
  return `🏅 *Papan Skor Pemain:*
${rows.join('\n')}`;
}

async function handleGameAnswer(msg, jid, text) {
  const gs = gameStates.get(jid);
  if (!gs) return;

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // Tombol batal
  if (lower === 'batal' || lower === 'cancel') {
    gameStates.delete(jid);
    return reply(msg, '🎮 Game dihentikan. Ketik */games* kapan saja untuk main lagi!');
  }

  // ─── Menu Pilihan Game ───
  if (gs.step === 'menu') {
    let pick = raw;
    if (lower === 'game_1' || lower === 'trivia') pick = '1';
    if (lower === 'game_2' || lower === 'tebak kata') pick = '2';
    if (lower === 'game_3' || lower === 'mitos fakta') pick = '3';
    if (lower === 'game_4' || lower === 'tod') pick = '4';
    if (lower === 'game_5' || lower === 'kuis') pick = '5';
    if (lower === 'game_6' || lower === 'susun kata' || lower === 'susunkata' || lower === 'scramble') pick = '6';
    if (lower === 'game_7' || lower === 'tebak emoji' || lower === 'emoji') pick = '7';
    if (lower === 'game_8' || lower === 'tebak tebakan' || lower === 'tebak-tebakan' || lower === 'tebakan' || lower === 'asah otak') pick = '8';
    if (lower === 'game_9' || lower === 'hitung kilat' || lower === 'hitung' || lower === 'math') pick = '9';

    if (pick === '1') {
      gs.type = 'trivia';
      gs.step = 'playing';
      gs.qIndex = 0;
      gs.score = 0;
      gs.players = new Map(); // phone → { name, correct, total }
      gs.questions = [...GAME1_TRIVIA].sort(() => Math.random() - 0.5);
      gameStates.set(jid, gs);
      return sendGame1Question(msg, jid, gs);
    }
    if (pick === '2') {
      gs.type = 'singkatan';
      gs.step = 'playing';
      gs.qIndex = 0;
      gs.score = 0;
      gs.players = new Map();
      gs.questions = [...GAME2_SINGKATAN].sort(() => Math.random() - 0.5);
      gameStates.set(jid, gs);
      return sendGame2Question(msg, jid, gs);
    }
    if (pick === '3') {
      gs.type = 'mitos';
      gs.step = 'playing';
      gs.qIndex = 0;
      gs.score = 0;
      gs.players = new Map();
      gs.questions = [...GAME3_MITOS_FAKTA].sort(() => Math.random() - 0.5);
      gameStates.set(jid, gs);
      return sendGame3Question(msg, jid, gs);
    }
    if (pick === '4') {
      gs.type = 'tod';
      gs.step = 'tod_choice';
      gameStates.set(jid, gs);
      return replyButtons(msg, '🎲 *TRUTH OR DARE REMAJA* 🔥\n\nPilih tantanganmu:', [
        { id: 'truth', text: '🎲 Truth (Jujur)' },
        { id: 'dare', text: '🔥 Dare (Tantangan)' },
        { id: 'batal', text: '❌ Selesai' }
      ]);
    }
    if (pick === '5') {
      gs.type = 'kuis';
      gs.step = 'playing';
      gs.qIndex = 0;
      gs.players = new Map();
      gs.scores = { leader: 0, konselor: 0, kreator: 0, humas: 0 };
      gs.questions = GAME5_KUISS;
      gameStates.set(jid, gs);
      return sendGame5Question(msg, jid, gs);
    }

    return reply(msg, '❌ Pilihan tidak valid. Ketik angka *1-5* atau ketik *batal*.');
  }

  // ─── Game 1: Trivia GenRe ───
  if (gs.type === 'trivia') {
    const q = gs.questions[gs.qIndex];
    const ans = lower.charAt(0).toUpperCase();
    const isCorrect = ans === q.ans;
    const _p1phone = extractSenderPhone(msg) || 'unknown';
    trackPlayer(gs, _p1phone, msg.pushName || _p1phone, isCorrect);
    if (isCorrect) gs.score++;
    gs.qIndex++;
    gameStates.set(jid, gs);

    const correctOpt = q.opts.find(o => o.startsWith(q.ans)) || q.ans;
    const feedback = isCorrect
      ? `✅ *Benar!* 🎉\n*${correctOpt}*`
      : `❌ *Kurang Tepat!*\nJawaban yang benar: *${correctOpt}*`;

    if (gs.qIndex >= gs.questions.length) {
      gameStates.delete(jid);
      const stars = gs.score >= 5 ? '⭐⭐⭐' : gs.score >= 3 ? '⭐⭐' : '⭐';
      // Simpan skor ke database
      const sPhone = extractSenderPhone(msg) || 'unknown';
      const sName = msg.pushName || sPhone;
      prisma.gameScore.create({ data: { phone: sPhone, name: sName, gameType: gs.type || 'trivia', score: gs.score, groupJid: jid } }).catch(() => {});
      const _board1 = buildPlayerBoard(gs.players, gs.questions.length);
      return reply(msg, `${feedback}\n\n🏁 *TRIVIA SELESAI!*\nTotal benar: *${gs.score}/${gs.questions.length}* ${stars}\n\n${_board1 ? _board1 + '\n\n' : ''}${gs.score === gs.questions.length ? '🏆 Sempurna! Kalian master wawasan PIK-R!' : gs.score >= 4 ? '👏 Keren banget! Terus tingkatkan ya!' : '💪 Tetap semangat belajar tentang GenRe!'}\n\nKetik */games* untuk main lagi!`);
    }

    await reply(msg, feedback);
    await new Promise(r => setTimeout(r, 600));
    return sendGame1Question(msg, jid, gs);
  }

  // ─── Game 2: Tebak Singkatan ───
  if (gs.type === 'singkatan') {
    const q = gs.questions[gs.qIndex];
    const ans = lower.charAt(0).toUpperCase();
    const isCorrect = ans === q.ans;
    const _p2phone = extractSenderPhone(msg) || 'unknown';
    trackPlayer(gs, _p2phone, msg.pushName || _p2phone, isCorrect);
    if (isCorrect) gs.score++;
    gs.qIndex++;
    gameStates.set(jid, gs);

    const correctOpt = q.opts.find(o => o.startsWith(q.ans)) || q.ans;
    const feedback = isCorrect
      ? `✅ *Tepat Sekali!* 🎉\n*${correctOpt}*\n💡 _${q.exp}_`
      : `❌ *Belum Tepat!*\nJawaban yang benar: *${correctOpt}*.\n💡 _${q.exp}_`;

    if (gs.qIndex >= gs.questions.length) {
      gameStates.delete(jid);
      // Simpan skor ke database
      const sPhone2 = extractSenderPhone(msg) || 'unknown';
      const sName2 = msg.pushName || sPhone2;
      prisma.gameScore.create({ data: { phone: sPhone2, name: sName2, gameType: gs.type || 'singkatan', score: gs.score, groupJid: jid } }).catch(() => {});
      const _board2 = buildPlayerBoard(gs.players, gs.questions.length);
      return reply(msg, `${feedback}\n\n🏁 *TEBAK SINGKATAN SELESAI!*\n\n${_board2 ? _board2 + '\n\n' : ''}Ketik */games* untuk main game lainnya!`);
    }

    await reply(msg, feedback);
    await new Promise(r => setTimeout(r, 600));
    return sendGame2Question(msg, jid, gs);
  }

  // ─── Game 3: Mitos vs Fakta ───
  if (gs.type === 'mitos') {
    const q = gs.questions[gs.qIndex];
    let userAns = '';
    if (lower.includes('fakta') || lower === '1') userAns = 'FAKTA';
    if (lower.includes('mitos') || lower === '2') userAns = 'MITOS';

    if (!userAns) {
      return reply(msg, 'Silakan pilih tombol *Fakta* atau *Mitos* ya.');
    }

    const isCorrect = userAns === q.ans;
    const _p3phone = extractSenderPhone(msg) || 'unknown';
    trackPlayer(gs, _p3phone, msg.pushName || _p3phone, isCorrect);
    if (isCorrect) gs.score++;
    gs.qIndex++;
    gameStates.set(jid, gs);

    const feedback = isCorrect
      ? `✅ *Jawaban Kamu Benar!* (${q.ans})\n💡 ${q.exp}`
      : `❌ *Salah! Jawaban yang benar adalah ${q.ans}.*\n💡 ${q.exp}`;

    if (gs.qIndex >= gs.questions.length) {
      gameStates.delete(jid);
      // Simpan skor ke database
      const sPhone3 = extractSenderPhone(msg) || 'unknown';
      const sName3 = msg.pushName || sPhone3;
      prisma.gameScore.create({ data: { phone: sPhone3, name: sName3, gameType: gs.type || 'mitos', score: gs.score, groupJid: jid } }).catch(() => {});
      const _board3 = buildPlayerBoard(gs.players, gs.questions.length);
      return reply(msg, `${feedback}\n\n🏁 *MITOS VS FAKTA SELESAI!*\n\n${_board3 ? _board3 + '\n\n' : ''}Ketik */games* untuk main game lainnya!`);
    }

    await reply(msg, feedback);
    await new Promise(r => setTimeout(r, 600));
    return sendGame3Question(msg, jid, gs);
  }


  // ─── Game 6: Susun Kata ───
  if (gs.type === 'susunkata') {
    const q = gs.questions[gs.qIndex];
    const isNyerah = lower === 'nyerah';
    const isCorrect = lower.replace(/\s+/g, '') === q.word.toLowerCase();

    if (!isCorrect && !isNyerah) {
      if (isBotMentionedOrQuoted(msg)) {
        return reply(msg, `❌ *Belum Tepat!* Coba susun lagi hurufnya ya!\n👉 *${q.scrambled || q.word}*`);
      }
      return;
    }

    const _phone = extractSenderPhone(msg) || 'unknown';
    const _name = msg.pushName || _phone;
    if (isCorrect) {
      trackPlayer(gs, _phone, _name, true);
      gs.score++;
    }
    gs.qIndex++;
    gameStates.set(jid, gs);

    const feedback = isCorrect
      ? `✅ *Tepat Sekali, ${_name}!* 🎉\nKata yang benar: *${q.word}*`
      : `🏳️ *Dilewati!* Jawaban yang benar adalah: *${q.word}*`;

    if (gs.qIndex >= gs.questions.length) {
      gameStates.delete(jid);
      const _board = buildPlayerBoard(gs.players, gs.questions.length);
      prisma.gameScore.create({ data: { phone: _phone, name: _name, gameType: 'susunkata', score: gs.score, groupJid: jid } }).catch(() => {});
      return reply(msg, `${feedback}\n\n🏁 *SUSUN KATA SELESAI!*\nTotal benar: *${gs.score}/${gs.questions.length}*\n\n${_board ? _board + '\n\n' : ''}Ketik */games* untuk main lagi!`);
    }

    await reply(msg, feedback);
    await new Promise(r => setTimeout(r, 600));
    return sendGame6Question(msg, jid, gs);
  }

  // ─── Game 7: Tebak Emoji ───
  if (gs.type === 'emoji') {
    const q = gs.questions[gs.qIndex];
    const isNyerah = lower === 'nyerah';
    const isCorrect = lower === q.ans.toLowerCase() || (q.aliases && q.aliases.some(a => lower.includes(a)));

    if (!isCorrect && !isNyerah) {
      if (isBotMentionedOrQuoted(msg)) {
        return reply(msg, `❌ *Belum Tepat!* Ayo tebak lagi arti dari emoji:\n👉 *${q.emojis}*`);
      }
      return;
    }

    const _phone = extractSenderPhone(msg) || 'unknown';
    const _name = msg.pushName || _phone;
    if (isCorrect) {
      trackPlayer(gs, _phone, _name, true);
      gs.score++;
    }
    gs.qIndex++;
    gameStates.set(jid, gs);

    const feedback = isCorrect
      ? `✅ *Tebakan Mantap, ${_name}!* 🎉\nArti emoji: *${q.ans}*`
      : `🏳️ *Dilewati!* Jawaban yang benar adalah: *${q.ans}*`;

    if (gs.qIndex >= gs.questions.length) {
      gameStates.delete(jid);
      const _board = buildPlayerBoard(gs.players, gs.questions.length);
      prisma.gameScore.create({ data: { phone: _phone, name: _name, gameType: 'emoji', score: gs.score, groupJid: jid } }).catch(() => {});
      return reply(msg, `${feedback}\n\n🏁 *TEBAK EMOJI SELESAI!*\nTotal benar: *${gs.score}/${gs.questions.length}*\n\n${_board ? _board + '\n\n' : ''}Ketik */games* untuk main lagi!`);
    }

    await reply(msg, feedback);
    await new Promise(r => setTimeout(r, 600));
    return sendGame7Question(msg, jid, gs);
  }

  // ─── Game 8: Tebak-tebakan Lucu ───
  if (gs.type === 'tebaktebakan') {
    const q = gs.questions[gs.qIndex];
    const isNyerah = lower === 'nyerah';
    const isCorrect = lower.includes(q.ans.toLowerCase()) || (q.aliases && q.aliases.some(a => lower.includes(a)));

    if (!isCorrect && !isNyerah) {
      if (isBotMentionedOrQuoted(msg)) {
        return reply(msg, `❌ *Belum Kena!* Tebak lagi dong atau ketik "nyerah" kalau nyerah! 😜`);
      }
      return;
    }

    const _phone = extractSenderPhone(msg) || 'unknown';
    const _name = msg.pushName || _phone;
    if (isCorrect) {
      trackPlayer(gs, _phone, _name, true);
      gs.score++;
    }
    gs.qIndex++;
    gameStates.set(jid, gs);

    const feedback = isCorrect
      ? `🎯 *Bisa Aja Lu, ${_name}!* 🤣\nJawabannya: *${q.ans}*\n💡 ${q.exp}`
      : `🏳️ *Nyerah Nih Yee!* 😜\nJawabannya: *${q.ans}*\n💡 ${q.exp}`;

    if (gs.qIndex >= gs.questions.length) {
      gameStates.delete(jid);
      const _board = buildPlayerBoard(gs.players, gs.questions.length);
      prisma.gameScore.create({ data: { phone: _phone, name: _name, gameType: 'tebaktebakan', score: gs.score, groupJid: jid } }).catch(() => {});
      return reply(msg, `${feedback}\n\n🏁 *TEBAK-TEBAKAN SELESAI!*\nTotal benar: *${gs.score}/${gs.questions.length}*\n\n${_board ? _board + '\n\n' : ''}Ketik */games* untuk main lagi!`);
    }

    await reply(msg, feedback);
    await new Promise(r => setTimeout(r, 600));
    return sendGame8Question(msg, jid, gs);
  }

  // ─── Game 9: Hitung Kilat ───
  if (gs.type === 'hitungkilat') {
    const q = gs.questions[gs.qIndex];
    const isNyerah = lower === 'nyerah';
    const isCorrect = String(q.ans) === lower.replace(/\s+/g, '');

    if (!isCorrect && !isNyerah) {
      if (isBotMentionedOrQuoted(msg)) {
        return reply(msg, `❌ *Hitungan Kurang Tepat!* Coba hitung lagi secepatnya: *👉 ${q.q} = ?*`);
      }
      return;
    }

    const _phone = extractSenderPhone(msg) || 'unknown';
    const _name = msg.pushName || _phone;
    if (isCorrect) {
      trackPlayer(gs, _phone, _name, true);
      gs.score++;
    }
    gs.qIndex++;
    gameStates.set(jid, gs);

    const feedback = isCorrect
      ? `⚡ *Cepat Banget, ${_name}!* 🎯\nHasil yang benar: *${q.ans}*`
      : `🏳️ *Dilewati!* Hasil yang benar adalah: *${q.ans}*`;

    if (gs.qIndex >= gs.questions.length) {
      gameStates.delete(jid);
      const _board = buildPlayerBoard(gs.players, gs.questions.length);
      prisma.gameScore.create({ data: { phone: _phone, name: _name, gameType: 'hitungkilat', score: gs.score, groupJid: jid } }).catch(() => {});
      return reply(msg, `${feedback}\n\n🏁 *HITUNG KILAT SELESAI!*\nTotal benar: *${gs.score}/${gs.questions.length}*\n\n${_board ? _board + '\n\n' : ''}Ketik */games* untuk main lagi!`);
    }

    await reply(msg, feedback);
    await new Promise(r => setTimeout(r, 600));
    return sendGame9Question(msg, jid, gs);
  }

  // ─── Game 4: Truth or Dare ───
  if (gs.type === 'tod') {
    if (lower === 'truth' || lower === '1') {
      const q = GAME4_TRUTH[Math.floor(Math.random() * GAME4_TRUTH.length)];
      return replyButtons(msg, `🎲 *TRUTH (Pertanyaan Jujur):*\n\n"${q}"\n\nJawab jujur ya! Mau lanjut?`, [
        { id: 'truth', text: '🎲 Truth Lagi' },
        { id: 'dare', text: '🔥 Ganti Dare' },
        { id: 'batal', text: '❌ Selesai' }
      ]);
    }
    if (lower === 'dare' || lower === '2') {
      const q = GAME4_DARE[Math.floor(Math.random() * GAME4_DARE.length)];
      return replyButtons(msg, `🔥 *DARE (Tantangan Aksi):*\n\n"${q}"\n\nLakukan tantangan ini! Mau lanjut?`, [
        { id: 'dare', text: '🔥 Dare Lagi' },
        { id: 'truth', text: '🎲 Ganti Truth' },
        { id: 'batal', text: '❌ Selesai' }
      ]);
    }
  }

  // ─── Game 5: Kuis Karakter ───
  if (gs.type === 'kuis') {
    const q = gs.questions[gs.qIndex];
    const pick = lower.charAt(0).toUpperCase();
    const chosen = q.opts.find(o => o.id === pick) || q.opts[0];
    if (chosen?.trait) {
      gs.scores[chosen.trait] = (gs.scores[chosen.trait] || 0) + 1;
    }
    gs.qIndex++;
    gameStates.set(jid, gs);

    if (gs.qIndex >= gs.questions.length) {
      gameStates.delete(jid);
      let topTrait = 'leader';
      let maxScore = -1;
      for (const [k, v] of Object.entries(gs.scores)) {
        if (v > maxScore) { maxScore = v; topTrait = k; }
      }
      // Simpan skor ke database
      const sPhone5 = extractSenderPhone(msg) || 'unknown';
      const sName5 = msg.pushName || sPhone5;
      prisma.gameScore.create({ data: { phone: sPhone5, name: sName5, gameType: gs.type || 'kuis', score: maxScore, groupJid: jid } }).catch(() => {});
      const res = KARAKTER_RESULTS[topTrait] || KARAKTER_RESULTS.leader;
      return reply(msg, `🔮 *HASIL KUIS KARAKTER GENRE* 🔮\n\n${res.title}\n\n${res.desc}\n\nKetik */games* untuk main game seru lainnya!`);
    }

    return sendGame5Question(msg, jid, gs);
  }
}

async function sendGame1Question(msg, jid, gs) {
  const q = gs.questions[gs.qIndex];
  const text = `🧠 *Trivia (${gs.qIndex + 1}/${gs.questions.length})*\n\n${q.q}\n\n${q.opts.join('\n')}`;
  return replyButtons(msg, text, [
    { id: 'A', text: '🅐 A' },
    { id: 'B', text: '🅑 B' },
    { id: 'C', text: '🅒 C' },
    { id: 'D', text: '🅓 D' },
    { id: 'batal', text: '❌ Batal' }
  ]);
}

async function sendGame2Question(msg, jid, gs) {
  const q = gs.questions[gs.qIndex];
  const text = `🔤 *Tebak Singkatan (${gs.qIndex + 1}/${gs.questions.length})*\n\n${q.q}\n\n${q.opts.join('\n')}`;
  return replyButtons(msg, text, [
    { id: 'A', text: '🅐 A' },
    { id: 'B', text: '🅑 B' },
    { id: 'C', text: '🅒 C' },
    { id: 'D', text: '🅓 D' },
    { id: 'batal', text: '❌ Batal' }
  ]);
}

async function sendGame3Question(msg, jid, gs) {
  const q = gs.questions[gs.qIndex];
  const text = `⚖️ *Mitos vs Fakta (${gs.qIndex + 1}/${gs.questions.length})*\n\n${q.q}`;
  return replyButtons(msg, text, [
    { id: 'fakta', text: '✅ Fakta' },
    { id: 'mitos', text: '❌ Mitos' },
    { id: 'batal', text: '🛑 Batal' }
  ]);
}

async function sendGame5Question(msg, jid, gs) {
  const q = gs.questions[gs.qIndex];
  const text = `🔮 *Kuis Karakter (${gs.qIndex + 1}/${gs.questions.length})*\n\n${q.q}\n\n${q.opts.map(o => o.text).join('\n')}`;
  return replyButtons(msg, text, [
    { id: 'A', text: '🅐 A' },
    { id: 'B', text: '🅑 B' },
    { id: 'C', text: '🅒 C' },
    { id: 'D', text: '🅓 D' },
    { id: 'batal', text: '❌ Batal' }
  ]);
}


async function sendGame6Question(msg, jid, gs) {
  const q = gs.questions[gs.qIndex];
  const scrambled = q.scrambled || scrambleWord(q.word);
  q.scrambled = scrambled;
  const text = `🔤 *Susun Kata (${gs.qIndex + 1}/${gs.questions.length})*\n\nHuruf Acak:\n👉 *${scrambled}*\n\n💡 Clue: _${q.clue}_\n📏 Jumlah: *${q.word.length} huruf*\n\n_Ketik tebakan kata langsung atau ketik "nyerah"!_`;
  return replyButtons(msg, text, [
    { id: 'nyerah', text: '🏳️ Nyerah' },
    { id: 'batal', text: '🛑 Batal' }
  ]);
}

async function sendGame7Question(msg, jid, gs) {
  const q = gs.questions[gs.qIndex];
  const text = `🧩 *Tebak Emoji (${gs.qIndex + 1}/${gs.questions.length})*\n\n👉 *${q.emojis}*\n\n💡 Clue: _${q.clue}_\n\n_Ketik tebakanmu langsung atau ketik "nyerah"!_`;
  return replyButtons(msg, text, [
    { id: 'nyerah', text: '🏳️ Nyerah' },
    { id: 'batal', text: '🛑 Batal' }
  ]);
}

async function sendGame8Question(msg, jid, gs) {
  const q = gs.questions[gs.qIndex];
  const text = `🤣 *Tebak-tebakan Lucu (${gs.qIndex + 1}/${gs.questions.length})*\n\n"${q.q}"\n\n_Ketik tebakanmu langsung atau ketik "nyerah"!_`;
  return replyButtons(msg, text, [
    { id: 'nyerah', text: '🏳️ Nyerah' },
    { id: 'batal', text: '🛑 Batal' }
  ]);
}

async function sendGame9Question(msg, jid, gs) {
  const q = gs.questions[gs.qIndex];
  const text = `⚡ *Hitung Kilat (${gs.qIndex + 1}/${gs.questions.length})*\n\nBerapa hasil dari:\n👉 *${q.q} = ?*\n\n_Ketik angka jawaban secepatnya!_`;
  return replyButtons(msg, text, [
    { id: 'nyerah', text: '🏳️ Lewati' },
    { id: 'batal', text: '🛑 Batal' }
  ]);
}

// ─── /lapor (Dilengkapi Tombol Anonim / Identitas) ────────────────────────────
async function cmdLapor(msg, arg, sender, isGroup) {
  if (arg.trim()) {
    if (laporStates.has(sender)) laporStates.delete(sender);
    laporStates.set(sender, { step: 'anon_choice', message: arg.trim() });

    return replyButtons(msg, `📋 *Laporan diterima!*\n\nPesanmu:\n_"${arg.trim()}"_\n\nApakah kamu ingin laporan ini dikirim secara *Anonim* atau menyertakan *Identitas* kamu?`, [
      { id: 'anonim', text: '👤 Anonim' },
      { id: 'identitas', text: '📝 Identitas' },
      { id: 'batal', text: '❌ Batal' }
    ]);
  }

  laporStates.set(sender, { step: 'waiting_message' });
  return reply(msg, `📋 *LAYANAN LAPORAN PIK-R MANSEKU*\n\nSilakan sampaikan laporan, aduan, atau masalah yang ingin kamu laporkan.\nKetik */lapor [isi laporan]*\n\n💡 Contoh: /lapor Ada indikasi perundungan di kelas XII`);
}

async function handleLaporStep(msg, sender, text) {
  const ls = laporStates.get(sender);
  if (!ls) return;

  const lower = text.trim().toLowerCase();

  if (lower === 'batal' || lower === 'cancel') {
    laporStates.delete(sender);
    return reply(msg, '❌ Laporan dibatalkan.');
  }

  if (ls.step === 'waiting_message') {
    ls.message = text.trim();
    ls.step = 'anon_choice';
    laporStates.set(sender, ls);

    return replyButtons(msg, `📋 *Laporan diterima!*\n\nPesanmu:\n_"${ls.message}"_\n\nApakah kamu ingin laporan ini dikirim secara *Anonim* atau menyertakan *Identitas* kamu?`, [
      { id: 'anonim', text: '👤 Anonim' },
      { id: 'identitas', text: '📝 Identitas' },
      { id: 'batal', text: '❌ Batal' }
    ]);
  }

  if (ls.step === 'anon_choice') {
    const isAnon = lower === 'anonim' || lower === '1';
    const withId = lower === 'identitas' || lower === '2';
    if (!isAnon && !withId) {
      return reply(msg, 'Silakan pilih tombol *Anonim* atau *Identitas*, atau ketik *batal*.');
    }

    laporStates.delete(sender);

    const reportData = {
      timestamp: new Date().toISOString(),
      phone: isAnon ? 'ANONIM' : sender,
      message: ls.message,
      isAnon
    };

    const fname = `${Date.now()}_${isAnon ? 'anon' : sender}.json`;
    try {
      fs.writeFileSync(path.join(REPORTS_DIR, fname), JSON.stringify(reportData, null, 2), 'utf8');
    } catch (e) {
      waLog('error', `Gagal simpan laporan: ${e.message}`);
    }

    try {
      await prisma.announcementLog.create({
        data: {
          receiverJid: 'ADMIN',
          sender: isAnon ? 'ANONIM' : sender,
          content: `[LAPORAN] ${ls.message}`,
          type: 'LAPORAN'
        }
      });
    } catch {}

    waLog('info', `Laporan baru diterima (${isAnon ? 'anonim' : sender}): ${ls.message.slice(0, 60)}`);

    return reply(msg, `✅ *Laporan berhasil terkirim!*\n\n${isAnon ? '🔒 Laporan dikirim secara *Anonim*.' : '📋 Laporan dikirim dengan *Identitas* terdaftar.'}\n\nPengurus PIK-R MANSEKU akan segera menindaklanjutinya. Terima kasih atas kepedulianmu! 🙏\n\n_PIK-R MANSEKU — Sehat, Cerdas, Berencana_ 💚`);
  }
}

// ─── XP & Leveling System ────────────────────────────────────────────────────

const XP_LEVELS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];

function getLevelFromXP(xp) {
  let level = 0;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i]) level = i;
    else break;
  }
  return level;
}

function xpToNextLevel(xp, currentLevel) {
  const nextThreshold = XP_LEVELS[currentLevel + 1];
  if (!nextThreshold) return null; // max level
  return nextThreshold - xp;
}

async function getLevelingConfig() {
  try {
    const s = await prisma.setting.findUnique({ where: { key: 'bot_leveling' } });
    if (s) return JSON.parse(s.value);
  } catch {}
  return {
    enabled: true,
    trackedGroups: [],
    levelUpDm: true,
    levelUpMessage: '🎉 Selamat *{name}*, kamu naik ke *Level {level}* di grup ini! Terus aktif ya! 💪',
    xpPerMessage: 1,
    levels: XP_LEVELS
  };
}

async function trackXP(msg, groupJid, phone) {
  try {
    const config = await getLevelingConfig();
    if (!config.enabled) return;
    // Check if group is tracked (empty array = all groups tracked)
    if (config.trackedGroups.length > 0 && !config.trackedGroups.includes(groupJid)) return;

    const xpGain = config.xpPerMessage || 1;
    const existing = await prisma.userXP.findUnique({ where: { phone_groupJid: { phone, groupJid } } });
    const oldXp = existing?.xp || 0;
    const oldLevel = existing?.level || getLevelFromXP(oldXp);
    const newXp = oldXp + xpGain;
    const newLevel = getLevelFromXP(newXp);

    await prisma.userXP.upsert({
      where: { phone_groupJid: { phone, groupJid } },
      create: { phone, groupJid, xp: newXp, level: newLevel, messageCount: 1, lastActivity: new Date() },
      update: { xp: newXp, level: newLevel, messageCount: { increment: 1 }, lastActivity: new Date() }
    });

    // Level up notification
    if (newLevel > oldLevel && config.levelUpDm) {
      const name = msg.pushName || phone;
      const text = (config.levelUpMessage || '🎉 Selamat *{name}*, kamu naik ke *Level {level}*!')
        .replace('{name}', name).replace('{level}', newLevel);
      const senderJid = phone.includes('@') ? phone : phone + '@s.whatsapp.net';
      await sock.sendMessage(senderJid, { text });
    }
  } catch (err) {
    waLog('error', `trackXP error: ${err.message}`);
  }
}

// ─── /fun ────────────────────────────────────────────────────────────────────
async function cmdFun(msg, arg, isGroup, jid) {
  const sub = (arg || '').toLowerCase().trim();
  if (!sub) {
    // Tampilkan menu Fun
    const text = `🎉 *FUN ZONE PIK-R MANSEKU*\n\n` +
      `Perintah seru di Fun Zone:\n\n` +
      `🎮 */games* — 9 Game Seru (Trivia, Susun Kata, Emoji, Tebak-tebakan, Hitung Kilat, dll)\n` +
      `🏆 */scoreboard [game]* — Papan skor per jenis game\n` +
      `📊 */top [@tag]* — Peringkat aktivitas & XP\n` +
      `⭐ */level [@tag]* — Cek level & XP kamu atau anggota lain\n\n` +
      `💡 _Aktif di grup = XP naik = Level naik!_`;
    return reply(msg, text);
  }
  // Subcommand routing
  if (sub === 'games') return cmdGames(msg, jid);
  if (sub === 'level') return cmdLevel(msg, '', isGroup, extractSenderPhone(msg), msg.pushName || 'kamu');
  if (sub === 'scoreboard' || sub === 'top') return cmdScoreboard(msg, '', isGroup, jid);
  return reply(msg, `❓ Sub-perintah *"${sub}"* tidak dikenal.\nKetik */fun* untuk daftar perintah Fun Zone.`);
}

// ─── /level [@tag] ───────────────────────────────────────────────────────────
async function cmdLevel(msg, arg, isGroup, senderPhone, who) {
  try {
    let targetPhone = senderPhone;
    let targetName = who;
    // Cek jika ada @mention
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      || msg.message?.groupMentionsMessage?.mentionedJid?.[0];
    if (mentioned) {
      targetPhone = mentioned.replace('@s.whatsapp.net', '');
      targetName = arg.replace(/@\d+/g, '').trim() || targetPhone;
    }

    const jid = msg.key.remoteJid;
    const groupJid = isGroup ? jid : 'dm';
    const record = await prisma.userXP.findUnique({ where: { phone_groupJid: { phone: targetPhone, groupJid } } });
    const isMe = targetPhone === senderPhone;

    // Jika belum ada record → tampilkan sebagai Level 0
    const xp = record?.xp || 0;
    const level = record?.level || 0;
    const msgCount = record?.messageCount || 0;

    const nextXp = xpToNextLevel(xp, level);
    const bar = buildXpBar(xp, level);

    // Label rank berdasarkan level
    const RANK_LABELS = ['🌱 Pemula', '🌿 Aktif', '🌟 Semangat', '💫 Rajin', '🔥 Gaul', '⚡ Expert', '💎 Elite', '👑 Legend', '🚀 Master', '🏆 GOAT'];
    const rankLabel = RANK_LABELS[Math.min(level, RANK_LABELS.length - 1)];

    return reply(msg,
      `⭐ *LEVEL ${isMe ? 'KAMU' : targetName.toUpperCase()}*\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `🏅 *Level ${level}* — ${rankLabel}\n` +
      `${bar}\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `✨ Total XP  : *${xp.toLocaleString('id')}*\n` +
      `💬 Pesan     : *${msgCount.toLocaleString('id')}*\n` +
      (nextXp !== null
        ? `📈 Butuh      : *${nextXp} XP* lagi ke Level ${level + 1}`
        : `🏆 _Level Maksimum! Kamu legenda!_ 🎊`) +
      (!record ? `\n\n_💡 Mulai chat di grup untuk dapat XP!_` : '')
    );
  } catch (err) {
    waLog('error', `/level error: ${err.message}`);
    return reply(msg, '❌ Gagal memuat data level. Coba lagi nanti.');
  }
}

function buildXpBar(xp, level) {
  const current = XP_LEVELS[level] || 0;
  const next = XP_LEVELS[level + 1];
  if (!next) return '🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 *MAX!*';
  const gained = xp - current;
  const needed = next - current;
  const filled = Math.min(10, Math.ceil((gained / needed) * 10));
  const empty = 10 - filled;
  const pct = Math.round((gained / needed) * 100);
  return `${'⬜'.repeat(filled)}${'🔳'.repeat(empty)} *${pct}%*\n📊 _${gained.toLocaleString('id')} / ${needed.toLocaleString('id')} XP_`;
}

// ─── /scoreboard & /top ──────────────────────────────────────────────────────
async function cmdScoreboard(msg, arg, isGroup, jid) {
  try {
    const gameArg = (arg || '').toLowerCase().trim();
    let title = '🏆 *PAPAN SKOR TERATAS*';
    let rows = [];

    if (gameArg && gameArg !== 'xp' && gameArg !== 'level') {
      // Scoreboard game spesifik
      const gameMap = {
        trivia: 'trivia', 'tebak kata': 'tebakkata', tebakkata: 'tebakkata',
        singkatan: 'singkatan', acak: 'acak', sambung: 'sambung',
        susunkata: 'susunkata', 'susun kata': 'susunkata', scramble: 'susunkata',
        emoji: 'emoji', 'tebak emoji': 'emoji',
        tebaktebakan: 'tebaktebakan', 'tebak tebakan': 'tebaktebakan', tebakan: 'tebaktebakan', 'asah otak': 'tebaktebakan',
        hitungkilat: 'hitungkilat', 'hitung kilat': 'hitungkilat', hitung: 'hitungkilat', math: 'hitungkilat'
      };
      const gameType = gameMap[gameArg] || gameArg;
      title = `🏆 *SCOREBOARD ${gameArg.toUpperCase()}*`;
      const scores = await prisma.gameScore.findMany({
        where: { gameType, ...(isGroup ? { groupJid: jid } : {}) },
        orderBy: { score: 'desc' },
        take: 10
      });
      if (!scores.length) return reply(msg, `📊 Belum ada skor ${gameArg} di ${isGroup ? 'grup ini' : 'sini'}.`);
      rows = scores.map((s, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} *${s.name}* — ${s.score} poin`;
      });
    } else {
      // XP/Level leaderboard
      title = isGroup ? `🏆 *PERINGKAT XP GRUP*` : `🏆 *PERINGKAT XP TOP*`;
      const records = await prisma.userXP.findMany({
        where: isGroup ? { groupJid: jid } : {},
        orderBy: { xp: 'desc' },
        take: 10
      });
      if (!records.length) return reply(msg, `📊 Belum ada data XP di ${isGroup ? 'grup ini' : 'sini'}.`);
      rows = records.map((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} *${r.phone}* — Lv.${r.level} (${r.xp} XP)`;
      });
    }

    return reply(msg, `${title}\n\n${rows.join('\n')}\n\n💡 _Ketik /level untuk lihat XP kamu!_`);
  } catch (err) {
    waLog('error', `/scoreboard error: ${err.message}`);
    return reply(msg, '❌ Gagal memuat scoreboard. Coba lagi nanti.');
  }
}

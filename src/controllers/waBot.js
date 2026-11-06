import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/secret.js';
import {
  getWaStatus, getWaLogs, waEvents, startBot, stopBot, logoutBot, restartBot,
  updateBotProfile, updateBotPicture, sendTestMessage
} from '../services/whatsapp.js';

const fail = (res, err, fallback) => res.status(err.status || 500).json({ message: err.status ? err.message : fallback });

// GET /api/admin/wa/status
export function status(req, res) {
  return res.json(getWaStatus());
}

// POST /api/admin/wa/start { pairingPhone? } — nyalakan bot; dengan nomor = minta kode pairing
export async function start(req, res) {
  try {
    return res.json(await startBot({ pairingPhone: req.body?.pairingPhone }));
  } catch (err) {
    console.error('[WA] start:', err);
    return fail(res, err, 'Gagal menyalakan bot');
  }
}

export async function stop(req, res) {
  try { return res.json(await stopBot()); } catch (err) { return fail(res, err, 'Gagal mematikan bot'); }
}

export async function restart(req, res) {
  try { return res.json(await restartBot()); } catch (err) { return fail(res, err, 'Gagal memulai ulang bot'); }
}

export async function logout(req, res) {
  try { return res.json(await logoutBot()); } catch (err) { return fail(res, err, 'Gagal memutus tautan bot'); }
}

// PUT /api/admin/wa/profile { name?, about? }
export async function profile(req, res) {
  try {
    return res.json(await updateBotProfile({ name: req.body?.name, about: req.body?.about }));
  } catch (err) {
    console.error('[WA] profile:', err);
    return fail(res, err, 'Gagal memperbarui profil bot');
  }
}

// POST /api/admin/wa/photo (multipart: photo)
export async function photo(req, res) {
  if (!req.file?.buffer) return res.status(400).json({ message: 'Pilih file gambar.' });
  try {
    return res.json(await updateBotPicture(req.file.buffer));
  } catch (err) {
    console.error('[WA] photo:', err);
    return fail(res, err, 'Gagal mengganti foto bot');
  }
}

// POST /api/admin/wa/test { to }
export async function test(req, res) {
  const to = String(req.body?.to || '').replace(/\D/g, '');
  if (to.length < 9) return res.status(400).json({ message: 'Nomor tujuan tidak valid.' });
  try {
    await sendTestMessage(to);
    return res.json({ message: 'Pesan uji terkirim.' });
  } catch (err) {
    return fail(res, err, 'Gagal mengirim pesan uji');
  }
}

/**
 * GET /api/admin/wa/stream?token=… — Server-Sent Events: status + log langsung untuk terminal debug.
 * EventSource tidak bisa mengirim header Authorization, jadi token admin dibaca dari query.
 */
export async function stream(req, res) {
  try {
    const decoded = jwt.verify(String(req.query.token || ''), JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error('bukan admin');
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin || admin.role !== 'DEVELOPER') throw new Error('tidak berhak');
  } catch {
    return res.status(401).json({ message: 'Akses ditolak' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  const sendEvent = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  sendEvent('status', getWaStatus());
  for (const l of getWaLogs(Number(req.query.after) || 0)) sendEvent('log', l);

  const onLog = (l) => sendEvent('log', l);
  const onStatus = (s) => sendEvent('status', s);
  waEvents.on('log', onLog);
  waEvents.on('status', onStatus);
  // Detak tiap 20 detik: Cloudflare menutup koneksi yang diam terlalu lama
  const beat = setInterval(() => res.write(': ping\n\n'), 20000);
  req.on('close', () => {
    clearInterval(beat);
    waEvents.off('log', onLog);
    waEvents.off('status', onStatus);
  });
}

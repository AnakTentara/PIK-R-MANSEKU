import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';
import { findSimilarCandidates } from '../utils/similarity.js';

let sock = null;
let isConnected = false;
let reconnectDelay = 5000; // Exponential backoff: mulai 5 detik, max 5 menit
const MAX_RECONNECT_DELAY = 5 * 60 * 1000;

export function formatPhoneNumber(num) {
  let cleaned = num.replace(/\D/g, ''); // Keep only digits
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  
  if (!cleaned.endsWith('@s.whatsapp.net')) {
    return cleaned + '@s.whatsapp.net';
  }
  return cleaned;
}

export function extractSenderPhone(msg) {
  const candidates = [
    msg?.key?.remoteJidAlt,
    msg?.key?.participant,
    msg?.key?.remoteJid,
    msg?.message?.extendedTextMessage?.contextInfo?.participant
  ].filter(Boolean);

  for (const jid of candidates) {
    if (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@c.us')) {
      const clean = jid.replace(/@.*$/, '').replace(/\D/g, '');
      if (clean.length >= 9 && clean.length <= 15) {
        return clean;
      }
    }
  }

  for (const jid of candidates) {
    const clean = jid.replace(/@.*$/, '').replace(/\D/g, '');
    if (clean.length >= 9 && clean.length <= 15) {
      return clean;
    }
  }

  return '';
}

export async function findUserFromWA(msg, extraText = '') {
  const cleanPhone = extractSenderPhone(msg);
  const pushName = msg?.pushName ? msg.pushName.trim() : '';
  const query = extraText.trim();

  // 1. Search by explicitly passed query (NISN or Name)
  if (query) {
    const isNisn = /^\d+$/.test(query);
    if (isNisn) {
      const m = await prisma.member.findUnique({ where: { nisn: query } });
      if (m) return m;
      const c = await prisma.candidate.findUnique({ where: { nisn: query } });
      if (c) return c;
    }

    const m = await prisma.member.findFirst({ where: { name: { contains: query } } });
    if (m) return m;
    const c = await prisma.candidate.findFirst({ where: { name: { contains: query } } });
    if (c) return c;
  }

  // 2. Search by phone number (if extracted)
  if (cleanPhone) {
    const searchSlice = cleanPhone.length > 9 ? cleanPhone.slice(-9) : cleanPhone;
    const m = await prisma.member.findFirst({
      where: {
        OR: [
          { whatsappNumber: { contains: searchSlice } },
          { whatsappNumber: cleanPhone }
        ]
      }
    });
    if (m) return m;

    const c = await prisma.candidate.findFirst({
      where: {
        OR: [
          { whatsappNumber: { contains: searchSlice } },
          { whatsappNumber: cleanPhone }
        ]
      }
    });
    if (c) return c;
  }

  // 3. Fallback: Search by WhatsApp display name (pushName) — batasi query untuk efisiensi
  if (pushName && pushName.length > 2) {
    // Coba cari dengan LIKE dulu (lebih efisien dari full fuzzy)
    const quickMatch = await prisma.member.findFirst({
      where: { name: { contains: pushName.split(' ')[0] } }
    });
    if (quickMatch) return quickMatch;

    const quickCandMatch = await prisma.candidate.findFirst({
      where: { name: { contains: pushName.split(' ')[0] } }
    });
    if (quickCandMatch) return quickCandMatch;

    // Fallback fuzzy hanya jika LIKE tidak menemukan hasil
    const allMembers = await prisma.member.findMany({
      select: { id: true, name: true, nisn: true, whatsappNumber: true, plainPassword: true },
      take: 200 // batasi max 200 baris agar tidak membebani memory
    });
    const matchedM = findSimilarCandidates(pushName, allMembers);
    if (matchedM.length > 0 && (matchedM[0].exact || matchedM[0].score > 0.8)) {
      return matchedM[0].candidate;
    }

    const allCandidates = await prisma.candidate.findMany({
      select: { id: true, name: true, nisn: true, whatsappNumber: true, plainPassword: true },
      take: 200
    });
    const matchedC = findSimilarCandidates(pushName, allCandidates);
    if (matchedC.length > 0 && (matchedC[0].exact || matchedC[0].score > 0.8)) {
      return matchedC[0].candidate;
    }
  }

  return null;
}

export async function initWhatsApp() {
  const authFolder = path.join(process.cwd(), '.baileys_auth');
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Menggunakan versi Baileys v${version.join('.')}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    printQRInTerminal: false, // We will custom print it using qrcode-terminal
    auth: state,
    logger: pino({ level: 'silent' }), // Turn off annoying logs
    browser: ['PIK-R MANSEKU Bot', 'Safari', '3.0.0'],
    defaultQueryTimeoutMs: undefined
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('=== SCAN QR CODE DI BAWAH INI UNTUK MENGHUBUNGKAN WHATSAPP ===');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Koneksi WhatsApp terputus. Penyebab: ', lastDisconnect?.error, 'Mencoba menghubungkan kembali:', shouldReconnect);
      
      if (shouldReconnect) {
        console.log(`[WA] Reconnect dalam ${reconnectDelay / 1000} detik...`);
        setTimeout(() => {
          initWhatsApp();
          reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
        }, reconnectDelay);
      } else {
        reconnectDelay = 5000; // reset delay setelah logout manual
        console.log('WhatsApp ter-logout. Hapus folder .baileys_auth untuk menscan ulang.');
        try {
          fs.rmSync(authFolder, { recursive: true, force: true });
        } catch (e) {
          console.error('Gagal menghapus folder autentikasi:', e);
        }
        setTimeout(() => {
          initWhatsApp();
        }, 5000);
      }
    } else if (connection === 'open') {
      isConnected = true;
      reconnectDelay = 5000; // reset delay setelah berhasil konek
      console.log('WhatsApp Bot BERHASIL terhubung dan AKTIF!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    // Extract text from textMessage or extendedTextMessage
    const text = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || '';
                 
    const fromJid = msg.key.remoteJid;
    const cleanPhone = extractSenderPhone(msg);

    // ── GROUP JID LISTENER & AUTO-LOGGER ──
    const isGroup = fromJid.endsWith('@g.us');
    if (isGroup) {
      try {
        let groupName = 'Grup WhatsApp (' + fromJid.slice(0, 12) + ')';
        try {
          const groupMeta = await sock.groupMetadata(fromJid);
          if (groupMeta && groupMeta.subject) {
            groupName = groupMeta.subject;
          }
        } catch (e) {
          // Fallback if metadata fails
        }

        await prisma.whatsAppGroup.upsert({
          where: { jid: fromJid },
          create: {
            jid: fromJid,
            name: groupName,
            memberCount: 0,
            lastMsgAt: new Date()
          },
          update: {
            name: groupName,
            lastMsgAt: new Date()
          }
        });

        // Log incoming group message in AnnouncementLog
        await prisma.announcementLog.create({
          data: {
            receiverJid: fromJid,
            sender: msg.pushName || cleanPhone || 'Anggota Grup',
            content: text || '[Pesan Media/Sticker]',
            type: 'INCOMING_MSG'
          }
        });
      } catch (err) {
        console.error('Error logging WhatsApp group message:', err);
      }

      // Check command !id or !groupinfo in WhatsApp Group
      const lowerText = text.trim().toLowerCase();
      if (lowerText === '!id' || lowerText === '!group' || lowerText === '!info' || lowerText === '!groupinfo') {
        let gName = fromJid;
        try {
          const groupMeta = await sock.groupMetadata(fromJid);
          if (groupMeta && groupMeta.subject) gName = groupMeta.subject;
        } catch (e) {}

        const replyMsg = `📌 *INFO ID GRUP WHATSAPP*\n\nNama Grup: *${gName}*\nGroup JID / Channel ID:\n\`${fromJid}\`\n\n💡 *Tips Admin*: Salin Group JID di atas dan tempel pada tab *Pengumuman Scheduled* di Admin Dashboard untuk mengirim pesan / media scheduled ke grup ini!`;
        await replyToMessage(fromJid, replyMsg, msg);
        return;
      }
    }

    if (text.trim().startsWith('/sandi ganti')) {
      try {
        const extra = text.trim().substring(12).trim();
        const user = await findUserFromWA(msg, extra);

        if (!user) {
          await replyToMessage(
            fromJid,
            `❌ *DATA TIDAK DITEMUKAN*\n\nNomor WhatsApp / Nama WhatsApp Anda (*${msg.pushName || cleanPhone || 'Pengguna'}*) belum terhubung dengan akun terdaftar.\n\n💡 *Tips*: Ketik perintah */sandi ganti [NISN Anda]* untuk memverifikasi akun Anda.`,
            msg
          );
          return;
        }

        // Pastikan user adalah Anggota, bukan sekadar Pendaftar
        const isMember = await prisma.member.findUnique({ where: { id: user.id } });
        if (!isMember) {
          await replyToMessage(
            fromJid,
            `⏳ *BELUM JADI ANGGOTA*\n\nHalo *${user.name}*,\n\nKamu masih berstatus *Pendaftar* dan belum memiliki akun anggota PIK-R MANSEKU.\n\nTunggu pengumuman kelulusan dari panitia seleksi ya! 💪`,
            msg
          );
          return;
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const otpModel = prisma.passwordResetOtp || prisma.PasswordResetOtp;
        if (otpModel) {
          await otpModel.create({
            data: {
              identifier: user.nisn || user.whatsappNumber || cleanPhone,
              otpCode,
              expiresAt
            }
          });
        }

        const nisnParam = user.nisn ? `nisn=${user.nisn}` : `wa=${user.whatsappNumber}`;
        const replyText = `🔐 *KODE OTP RESET SANDI PIK-R MANSEKU*\n\nHalo *${user.name}*,\n\nKode OTP Anda untuk mengganti kata sandi adalah: *${otpCode}*\n\n⏰ *Berlaku:* 10 Menit\n\nSilakan buka link di bawah ini dan masukkan kode OTP di atas untuk mengatur kata sandi baru:\n🔗 https://pikr-manseku.my.id/reset-sandi?${nisnParam}\n\n⚠️ *PERINGATAN*: Rahasiakan kode OTP ini dari siapa pun!`;

        await replyToMessage(fromJid, replyText, msg);
      } catch (err) {
        console.error('Error handling /sandi ganti:', err);
        await replyToMessage(fromJid, 'Terjadi kesalahan sistem saat membuat kode OTP reset sandi.', msg);
      }
      return;
    }

    if (text.trim().startsWith('/sandi')) {
      try {
        const extra = text.trim().substring(6).trim();
        const user = await findUserFromWA(msg, extra);

        if (!user) {
          await replyToMessage(
            fromJid,
            `❌ *DATA TIDAK DITEMUKAN*\n\nNomor WhatsApp / Nama WhatsApp Anda (*${msg.pushName || cleanPhone || 'Pengguna'}*) belum terdaftar.\n\n💡 *Tips*: Ketik perintah */sandi [NISN Anda]* (contoh: \`/sandi 3102603365\`) untuk mengecek kata sandi NISN Anda secara langsung.`,
            msg
          );
          return;
        }

        // Pastikan user adalah Anggota, bukan sekadar Pendaftar
        const isMember = await prisma.member.findUnique({ where: { id: user.id } });
        if (!isMember) {
          await replyToMessage(
            fromJid,
            `⏳ *BELUM JADI ANGGOTA*\n\nHalo *${user.name}*,\n\nKamu masih berstatus *Pendaftar* dan belum memiliki akun anggota PIK-R MANSEKU.\n\nTunggu pengumuman kelulusan dari panitia seleksi ya! 💪`,
            msg
          );
          return;
        }

        const readMore = '\u200B'.repeat(4000);

        const replyText = `🔒 *PEMBERITAHUAN KEAMANAN SANDI*\n\nHalo *${user.name}*,\nKata sandi Anda bersifat sangat rahasia. Pastikan Anda berada di tempat yang aman sebelum membuka rincian sandi Anda.\n\n💡 *Cara Mengganti Kata Sandi:*\nKetik perintah */sandi ganti* untuk menerima kode OTP verifikasi dan tautan pembuatan kata sandi baru.\n\nTekan *Baca Selengkapnya* di bawah ini untuk melihat kata sandi Anda.${readMore}\n\n🔑 *INFORMASI KREDENSIAL AKUN*\n\n👤 Nama: *${user.name}*\n${user.nisn ? `📌 NISN: *${user.nisn}*\n` : ''}🔑 Kata Sandi: *${user.plainPassword || '(Sandi telah diubah atau belum diatur)'}*\n\n⚠️ *PERINGATAN PRIVASI*: Kata sandi ini bersifat pribadi. Jaga kerahasiaan sandi Anda dan jangan bagikan kepada siapa pun!`;

        await replyToMessage(fromJid, replyText, msg);
      } catch (err) {
        console.error('Error handling /sandi:', err);
        await replyToMessage(fromJid, 'Terjadi kesalahan sistem saat memeriksa data sandi.', msg);
      }
      return;
    }

    // ── /cek COMMAND (Candidate & Member Lookup) ──
    const lowerTrimText = text.trim().toLowerCase();
    if (lowerTrimText.startsWith('/cek') || lowerTrimText.startsWith('!cek') || lowerTrimText.startsWith('cek ')) {
      let query = '';
      if (lowerTrimText.startsWith('/cek')) query = text.trim().substring(4).trim();
      else if (lowerTrimText.startsWith('!cek')) query = text.trim().substring(4).trim();
      else if (lowerTrimText.startsWith('cek ')) query = text.trim().substring(4).trim();

      if (!query) {
        await replyToMessage(fromJid, 'Format salah. Gunakan: */cek [Nama atau NISN]*\nContoh: `/cek Haikal Mabrur` atau `/cek 3102603365`', msg);
        return;
      }

      console.log(`[WhatsApp Bot] Request cek dari ${fromJid} untuk query: "${query}"`);
      const isNisn = /^\d+$/.test(query);

      try {
        if (isNisn) {
          let person = await prisma.candidate.findFirst({ where: { nisn: query } });
          if (!person) {
            person = await prisma.member.findFirst({ where: { nisn: query } });
          }

          if (person) {
            const replyText = `Halo *${person.name}*,\n\nHasil kelulusan pendaftaran PIK-R MANSEKU Anda dapat dicek secara langsung melalui link berikut:\n🔗 https://pikr-manseku.my.id/cek-kelulusan?nisn=${person.nisn}\n\nTerima kasih!`;
            await replyToMessage(fromJid, replyText, msg);
          } else {
            await replyToMessage(fromJid, `Maaf, data pendaftaran dengan NISN *${query}* tidak ditemukan di database.`, msg);
          }
        } else {
          // Fetch from BOTH Candidate and Member tables (handles closed session & migrated candidates)
          const [candidates, members] = await Promise.all([
            prisma.candidate.findMany({ select: { id: true, name: true, nisn: true, className: true } }),
            prisma.member.findMany({ select: { id: true, name: true, nisn: true, className: true } })
          ]);

          const peopleMap = new Map();
          candidates.forEach(c => { if (c && c.name) peopleMap.set('c_' + c.id, c); });
          members.forEach(m => {
            if (m && m.name) {
              const existsInCandidates = Array.from(peopleMap.values()).some(p => p.nisn && m.nisn && p.nisn === m.nisn);
              if (!existsInCandidates) peopleMap.set('m_' + m.id, m);
            }
          });

          const allPeople = Array.from(peopleMap.values());
          const matches = findSimilarCandidates(query, allPeople);

          if (matches.length === 0) {
            await replyToMessage(fromJid, `Maaf, data pendaftaran dengan nama *"${query}"* tidak ditemukan di database. Pastikan ejaan nama Anda sesuai dengan saat pendaftaran.`, msg);
          } else if (matches[0].exact || matches[0].score >= 0.65 || matches.length === 1) {
            const person = matches[0].candidate;
            const replyText = `Halo *${person.name}* (${person.className || 'Anggota/Pendaftar'}),\n\nHasil kelulusan pendaftaran PIK-R MANSEKU Anda dapat dicek secara langsung melalui link berikut:\n🔗 https://pikr-manseku.my.id/cek-kelulusan?nisn=${person.nisn}\n\nTerima kasih!`;
            await replyToMessage(fromJid, replyText, msg);
          } else {
            let replyText = `Data pendaftar dengan nama *"${query}"* ditemukan beberapa hasil yang cocok:\n`;
            const suggestions = matches.slice(0, 4);
            suggestions.forEach((match, index) => {
              const c = match.candidate;
              replyText += `\n${index + 1}. *${c.name}* (Kelas ${c.className || '-'})\n🔗 https://pikr-manseku.my.id/cek-kelulusan?nisn=${c.nisn}\n`;
            });
            replyText += `\nSilakan klik link di atas jika sesuai dengan nama Anda.`;
            await replyToMessage(fromJid, replyText, msg);
          }
        }
      } catch (err) {
        console.error('Error handling WhatsApp cek command:', err);
        await replyToMessage(fromJid, 'Terjadi kesalahan sistem saat mencari data.', msg);
      }
    }
  });
}

// Helper to reply to messages
async function replyToMessage(jid, text, msg) {
  if (!sock) return;
  try {
    await sock.sendMessage(jid, { text }, { quoted: msg });
  } catch (error) {
    console.error('Gagal mengirim pesan WhatsApp:', error);
  }
}

// Function to send normal WhatsApp message
export async function sendWhatsApp(to, text) {
  if (!sock || !isConnected) {
    console.warn(`[WhatsApp] Gagal mengirim pesan ke ${to} karena bot belum aktif/terkoneksi.`);
    return false;
  }

  try {
    const formattedJid = formatPhoneNumber(to);
    await sock.sendMessage(formattedJid, { text });
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Gagal mengirim pesan ke ${to}:`, error);
    return false;
  }
}

/**
 * Send WhatsApp text message and optional document attachments (e.g. PDF guidelines).
 * @param {string} to - Phone number
 * @param {string} text - Message caption or text
 * @param {Array<{ path: string, filename: string, mimetype?: string }>} attachments
 */
export async function sendWhatsAppWithAttachments(to, text, attachments = []) {
  if (!sock || !isConnected) {
    console.warn(`[WhatsApp] Gagal mengirim pesan/dokumen ke ${to} karena bot belum aktif/terkoneksi.`);
    return false;
  }

  try {
    const formattedJid = formatPhoneNumber(to);
    
    // Send main text message first
    if (text && text.trim()) {
      await sock.sendMessage(formattedJid, { text: text.trim() });
    }

    // Send attached document files (PDFs)
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        if (!att.path || !fs.existsSync(att.path)) continue;
        const buffer = fs.readFileSync(att.path);
        const mimetype = att.mimetype || 'application/pdf';
        const fileName = att.filename || path.basename(att.path);

        await sock.sendMessage(formattedJid, {
          document: buffer,
          mimetype,
          fileName
        });
      }
    }
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Gagal mengirim dokumen/pesan ke ${to}:`, error);
    return false;
  }
}

export function isWhatsAppReady() {
  return isConnected;
}

/**
 * Send WhatsApp Broadcast to Group JID or Specific Destination with optional Media
 */
export async function sendWhatsAppGroupBroadcast(toJid, text, mediaObj = null) {
  if (!sock || !isConnected) {
    console.warn(`[WhatsApp] Gagal mengirim broadcast ke ${toJid} karena bot belum aktif/terkoneksi.`);
    return false;
  }

  try {
    const targetJid = toJid.includes('@') ? toJid : formatPhoneNumber(toJid);

    if (mediaObj && mediaObj.url && fs.existsSync(mediaObj.url)) {
      const buffer = fs.readFileSync(mediaObj.url);
      const mimetype = mediaObj.mimetype || 'application/octet-stream';
      const type = (mediaObj.type || '').toUpperCase();

      if (type === 'IMAGE' || mimetype.startsWith('image/')) {
        await sock.sendMessage(targetJid, { image: buffer, caption: text || '' });
      } else if (type === 'VIDEO' || mimetype.startsWith('video/')) {
        await sock.sendMessage(targetJid, { video: buffer, caption: text || '' });
      } else {
        await sock.sendMessage(targetJid, {
          document: buffer,
          mimetype,
          fileName: mediaObj.name || path.basename(mediaObj.url),
          caption: text || ''
        });
      }
    } else {
      if (text && text.trim()) {
        await sock.sendMessage(targetJid, { text: text.trim() });
      }
    }
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Gagal mengirim broadcast grup ke ${toJid}:`, error);
    return false;
  }
}


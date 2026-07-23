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

  // 3. Fallback: Search by WhatsApp display name (pushName)
  if (pushName && pushName.length > 2) {
    const allMembers = await prisma.member.findMany();
    const matchedM = findSimilarCandidates(pushName, allMembers);
    if (matchedM.length > 0 && (matchedM[0].exact || matchedM[0].score > 0.8)) {
      return matchedM[0].candidate;
    }

    const allCandidates = await prisma.candidate.findMany();
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
        setTimeout(() => {
          initWhatsApp();
        }, 5000);
      } else {
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

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await prisma.passwordResetOtp.create({
          data: {
            identifier: user.nisn || user.whatsappNumber || cleanPhone,
            otpCode,
            expiresAt
          }
        });

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

        const readMore = '\u200B'.repeat(4000);

        const replyText = `🔒 *PEMBERITAHUAN KEAMANAN SANDI*\n\nHalo *${user.name}*,\nKata sandi Anda bersifat sangat rahasia. Pastikan Anda berada di tempat yang aman sebelum membuka rincian sandi Anda.\n\n💡 *Cara Mengganti Kata Sandi:*\nKetik perintah */sandi ganti* untuk menerima kode OTP verifikasi dan tautan pembuatan kata sandi baru.\n\nTekan *Baca Selengkapnya* di bawah ini untuk melihat kata sandi Anda.${readMore}\n\n🔑 *INFORMASI KREDENSIAL AKUN*\n\n👤 Nama: *${user.name}*\n${user.nisn ? `📌 NISN: *${user.nisn}*\n` : ''}🔑 Kata Sandi: *${user.plainPassword || '(Sandi telah diubah atau belum diatur)'}*\n\n⚠️ *PERINGATAN PRIVASI*: Kata sandi ini bersifat pribadi. Jaga kerahasiaan sandi Anda dan jangan bagikan kepada siapa pun!`;

        await replyToMessage(fromJid, replyText, msg);
      } catch (err) {
        console.error('Error handling /sandi:', err);
        await replyToMessage(fromJid, 'Terjadi kesalahan sistem saat memeriksa data sandi.', msg);
      }
      return;
    }

    if (text.startsWith('/cek ')) {
      const query = text.substring(5).trim();
      if (!query) {
        await replyToMessage(fromJid, 'Format salah. Gunakan: */cek [Nama atau NISN]*\nContoh: `/cek Haikal Mabrur` atau `/cek 3102603365`', msg);
        return;
      }

      console.log(`WhatsApp Bot menerima request cek dari ${fromJid} untuk query: "${query}"`);
      const isNisn = /^\d+$/.test(query);

      try {
        if (isNisn) {
          const candidate = await prisma.candidate.findUnique({
            where: { nisn: query }
          });

          if (candidate) {
            const replyText = `Halo *${candidate.name}*,\n\nHasil kelulusan pendaftaran PIK-R MANSEKU Anda dapat dicek secara langsung melalui link berikut:\n🔗 https://pikr-manseku.my.id/cek-kelulusan?nisn=${candidate.nisn}\n\nTerima kasih!`;
            await replyToMessage(fromJid, replyText, msg);
          } else {
            await replyToMessage(fromJid, `Maaf, data pendaftaran dengan NISN *${query}* tidak ditemukan di database.`, msg);
          }
        } else {
          const allCandidates = await prisma.candidate.findMany({
            select: { id: true, name: true, nisn: true, className: true }
          });

          const matches = findSimilarCandidates(query, allCandidates);

          if (matches.length === 0) {
            await replyToMessage(fromJid, `Maaf, data pendaftaran dengan nama *"${query}"* tidak ditemukan di database.`, msg);
          } else if (matches[0].exact || matches[0].score > 0.95) {
            const candidate = matches[0].candidate;
            const replyText = `Halo *${candidate.name}* (${candidate.className}),\n\nHasil kelulusan pendaftaran PIK-R MANSEKU Anda dapat dicek secara langsung melalui link berikut:\n🔗 https://pikr-manseku.my.id/cek-kelulusan?nisn=${candidate.nisn}\n\nTerima kasih!`;
            await replyToMessage(fromJid, replyText, msg);
          } else {
            let replyText = `Data pendaftar dengan nama *"${query}"* tidak ditemukan secara persis.\n\n*Mungkin yang kamu maksud:*\n`;
            const suggestions = matches.slice(0, 3);
            suggestions.forEach((match, index) => {
              const c = match.candidate;
              replyText += `\n${index + 1}. *${c.name}* (Kelas ${c.className})\n🔗 https://pikr-manseku.my.id/cek-kelulusan?nisn=${c.nisn}\n`;
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

export function isWhatsAppReady() {
  return isConnected;
}

/**
 * Sahabat AI PIK-R — Konselor sebaya virtual berbasis Gemini.
 *
 * Endpoints:
 *   GET    /rc/ai/limit                  → status limit harian user
 *   GET    /rc/ai/sessions               → daftar sesi AI user
 *   POST   /rc/ai/sessions               → buat sesi baru
 *   GET    /rc/ai/sessions/:id           → ambil pesan sesi (dekripsi)
 *   POST   /rc/ai/sessions/:id/chat      → kirim pesan, terima balasan AI
 *   DELETE /rc/ai/sessions/:id           → hapus sesi
 */

import prisma from '../config/db.js';
import { requireViewer, handle, fail } from './core.js';
import { seal, open } from './crypto.js';
import { callGemini } from './aiRotator.js';
import { isUrgent } from './counsel.js';

// ─── Konstanta ────────────────────────────────────────────────────────────────

export const DAILY_LIMIT = 50; // pesan/hari per user (seluruh sesi)

// Instruksi sistem: konselor sebaya virtual PIK-R MAN 1 Muara Enim
export const SYSTEM_INSTRUCTION = `Kamu adalah "Sahabat AI", konselor sebaya virtual resmi dari PIK-R (Pusat Informasi dan Konseling Remaja) MAN 1 Muara Enim (MANSEKU).

### Peran & Persona:
1. Sahabat Sebaya yang Tulus:
   - Bersikap sebagai sahabat sebaya yang hangat, santai, penuh empati, dan pengertian.
   - Gunakan gaya bahasa santai dan akrab yang nyaman bagi remaja/siswa madrasah ("aku" dan "kamu").
   - Jangan kaku, jangan menggurui, dan jangan berbicara seperti robot atau dokumen formal.
   - Gunakan emoji secukupnya agar suasana percakapan terasa hidup, hangat, dan menenangkan 😊✨.

2. Pendekatan Konseling Sebaya (Active Listening & Empathy):
   - Selalu mulai dengan memvalidasi dan mengapresiasi perasaan mereka terlebih dahulu (contoh: "Pasti berat banget ya rasanya ada di posisi itu...", "Wajar banget kok kalau kamu ngerasa capek/bingung...").
   - Hindari langsung memberi kuliah atau ceramah panjang. Berikan tanggapan yang hangat, ringkas (2-4 paragraf santai), lalu ajak mereka mengeksplorasi perasaan dengan pertanyaan pemantik yang reflektif.
   - Dampingi temanmu agar ia merasa didengarkan seutuhnya dan bisa menemukan sudut pandang positif serta solusinya sendiri.

3. Konteks Remaja & PIK-R:
   - Pahami dinamika kehidupan remaja: beban tugas sekolah/madrasah, overthinking masa depan, ujian, pertemanan, rasa insecure, hubungan keluarga, hingga asmara remaja.
   - Terapkan semangat nilai GenRe (Generasi Berencana) & Triad KRR: Katakan Tidak pada Pernikahan Dini, Seks Pranikah, dan Napza.

4. Batasan Medis & Kedaruratan:
   - Kamu BUKAN dokter, psikolog klinis, atau psikiater. Jangan pernah memberi diagnosis gangguan kejiwaan klinis atau resep obat.
   - Jika ada tanda-tanda menyakiti diri sendiri, depresi berat, putus asa mendalam, atau kekerasan:
     Rangkul perasaannya dengan hangat dan selalu sarankan untuk menghubungi layanan profesional atau orang dewasa yang dipercaya:
     "Kamu tidak sendirian 💙 Hubungi SEJIWA di 119 (tekan 8) atau SAPA 129, atau temui langsung guru BK / Pembina PIK-R di madrasah.

5. Format Respons (WAJIB):
   - Gunakan format Markdown standar dalam SETIAP respons.
   - **bold** untuk penekanan penting atau kata kunci emosional.
   - *italic* untuk nuansa lembut atau sapaan.
   - ## Heading untuk topik baru jika respons panjang (jarang dipakai).
   - - list atau 1. list untuk langkah-langkah atau poin-poin.
   - Paragraf pendek (2-4 baris), bukan blok teks panjang.
   - Gunakan emoji secukupnya (1-3 per pesan) untuk kehangatan.
   - JANGAN gunakan format WhatsApp (*bold* WA style) — gunakan Markdown standar (**bold**)."`;

/**
 * Bangun instruksi sistem dinamis berdasarkan preferensi mood/tone siswa.
 * @param {'listen'|'solve'|'comfort'} tone
 */
export function buildSystemInstruction(tone = 'listen') {
  let toneAddon = '';
  if (tone === 'solve') {
    toneAddon = `\n\n### Mode Percakapan: CARI SOLUSI (Problem-Solving & Actionable)
- Temanmu ingin mencari jalan keluar atau langkah nyata yang praktis.
- Validasi emosinya singkat (1-2 kalimat), lalu bantu petakan masalahnya.
- Berikan saran konkret, realistis, dan langkah bertahap yang bisa dicoba perlahan (baby steps).
- Hindari nada mendikte atau menggurui; berikan pilihan agar ia memegang kendali atas keputusannya.`;
  } else if (tone === 'comfort') {
    toneAddon = `\n\n### Mode Percakapan: DITENANGKAN (Calming, Grounding & Overthinking)
- Temanmu sedang merasa sangat cemas, panik, overthinking, atau tertekan.
- Gunakan bahasa yang ekstra lembut, menyejukkan, hangat, dan tidak menuntut.
- Jangan berikan pertanyaan yang rumit atau analisis masalah yang berat. Ajak ia rileks sejenak.
- Tuntun dengan afirmasi yang menenangkan ("Tarik napas perlahan...", "Kamu aman di sini", "Pelan-pelan ya, kamu sudah berjuang hebat hari ini").`;
  } else {
    // 'listen'
    toneAddon = `\n\n### Mode Percakapan: CUMA MAU DIDENGAR (Active Listening & Safe Space)
- Temanmu hanya ingin meluapkan unek-unek tanpa dihakimi dan tanpa langsung digurui solusi.
- Fokus utama: Dengarkan sepenuhnya, validasi perasaannya, tunjukkan empati yang tulus.
- Berikan ruang seluas-luasnya untuk dia berekspresi. Ajak dia bercerita lebih lanjut dengan pertanyaan reflektif yang hangat.`;
  }
  return SYSTEM_INSTRUCTION + toneAddon;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Hitung tengah malam berikutnya WIB (UTC+7) dalam UTC */
function nextMidnightWIB() {
  const now = new Date();
  // Offset WIB adalah +7 jam
  const wibOffset = 7 * 60 * 60 * 1000;
  const nowWIB = new Date(now.getTime() + wibOffset);
  // Tengah malam WIB berikutnya
  const midnightWIB = new Date(Date.UTC(
    nowWIB.getUTCFullYear(),
    nowWIB.getUTCMonth(),
    nowWIB.getUTCDate() + 1, // besok
    0, 0, 0, 0
  ));
  // Konversi kembali ke UTC
  return new Date(midnightWIB.getTime() - wibOffset);
}

/** Ambil/buat record limit user, reset jika sudah lewat */
export async function getOrCreateLimit(memberId) {
  let lim = await prisma.rcAiLimit.findUnique({ where: { memberId } });
  const now = new Date();
  if (!lim) {
    lim = await prisma.rcAiLimit.create({
      data: { memberId, usedToday: 0, resetAt: nextMidnightWIB() }
    });
  } else if (new Date(lim.resetAt) <= now) {
    // Reset harian
    lim = await prisma.rcAiLimit.update({
      where: { memberId },
      data: { usedToday: 0, resetAt: nextMidnightWIB() }
    });
  }
  return lim;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** GET /rc/ai/limit */
export const getLimit = handle(async (req) => {
  const me = await requireViewer(req);
  const lim = await getOrCreateLimit(me.id);
  return {
    usedToday: lim.usedToday,
    total: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - lim.usedToday),
    resetAt: lim.resetAt,
    percent: Math.min(100, Math.round((lim.usedToday / DAILY_LIMIT) * 100)),
  };
});

/** GET /rc/ai/sessions */
export const listSessions = handle(async (req) => {
  const me = await requireViewer(req);
  const sessions = await prisma.rcAiSession.findMany({
    where: { memberId: me.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, tone: true, createdAt: true, updatedAt: true },
    take: 50,
  });
  return { sessions };
});

/** POST /rc/ai/sessions */
export const createSession = handle(async (req, res) => {
  const me = await requireViewer(req);
  const tone = req.body?.tone && ['listen', 'solve', 'comfort'].includes(req.body.tone)
    ? req.body.tone
    : 'listen';
  const session = await prisma.rcAiSession.create({
    data: { memberId: me.id, tone },
    select: { id: true, title: true, tone: true, createdAt: true, updatedAt: true },
  });
  if (res) res.status(201);
  return { session };
});

/** GET /rc/ai/sessions/:id */
export const getSession = handle(async (req) => {
  const me = await requireViewer(req);
  const { id } = req.params;

  const session = await prisma.rcAiSession.findFirst({
    where: { id, memberId: me.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!session) fail(404, 'Sesi tidak ditemukan.');

  const messages = session.messages.map(m => ({
    id: m.id,
    role: m.role,
    content: open(m.content),
    createdAt: m.createdAt,
  }));

  const lim = await getOrCreateLimit(me.id);

  return {
    session: {
      id: session.id,
      title: session.title,
      tone: session.tone || 'listen',
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    },
    messages,
    limit: {
      usedToday: lim.usedToday,
      total: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - lim.usedToday),
      resetAt: lim.resetAt,
      percent: Math.min(100, Math.round((lim.usedToday / DAILY_LIMIT) * 100)),
    },
  };
});

/** POST /rc/ai/sessions/:id/tone */
export const updateTone = handle(async (req) => {
  const me = await requireViewer(req);
  const { id } = req.params;
  const tone = req.body?.tone;
  if (!tone || !['listen', 'solve', 'comfort'].includes(tone)) {
    fail(400, 'Tone tidak valid.');
  }

  const session = await prisma.rcAiSession.findFirst({
    where: { id, memberId: me.id }
  });
  if (!session) fail(404, 'Sesi tidak ditemukan.');

  await prisma.rcAiSession.update({
    where: { id },
    data: { tone, updatedAt: new Date() }
  });

  return { ok: true, tone };
});

/** POST /rc/ai/sessions/:id/chat */
export const chat = handle(async (req, res) => {
  const me = await requireViewer(req);
  const { id } = req.params;
  const text = req.body?.text;
  const reqTone = req.body?.tone;

  if (!text || typeof text !== 'string' || !text.trim()) {
    fail(400, 'Pesan tidak boleh kosong.');
  }
  const userText = text.trim().slice(0, 2000);

  // Periksa sesi milik user
  const session = await prisma.rcAiSession.findFirst({
    where: { id, memberId: me.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!session) fail(404, 'Sesi tidak ditemukan.');

  // Tentukan tone aktif (update jika dikirimkan oleh klien)
  let activeTone = session.tone || 'listen';
  if (reqTone && ['listen', 'solve', 'comfort'].includes(reqTone) && reqTone !== activeTone) {
    activeTone = reqTone;
    await prisma.rcAiSession.update({
      where: { id },
      data: { tone: activeTone }
    });
  }

  // Periksa limit harian
  const lim = await getOrCreateLimit(me.id);
  if (lim.usedToday >= DAILY_LIMIT) {
    const limitReply = 'Mohon maaf ya! Limit mu sudah terpakai semua, akan aku alihkan kamu ke konselor ya! Mohon tunggu sebentar hingga konselor menjawab. 🧡';
    const now = new Date();
    await prisma.rcAiMessage.createMany({
      data: [
        { sessionId: id, role: 'user', content: seal(userText), createdAt: now },
        { sessionId: id, role: 'model', content: seal(limitReply), createdAt: new Date(now.getTime() + 10) }
      ]
    });
    return {
      reply: limitReply,
      limitExceeded: true,
      redirectToCounsel: true,
      limit: {
        usedToday: lim.usedToday,
        total: DAILY_LIMIT,
        remaining: 0,
        resetAt: lim.resetAt,
        percent: 100,
      }
    };
  }

  // Bangun riwayat percakapan Gemini
  const contents = session.messages.map(m => ({
    role: m.role,
    parts: [{ text: open(m.content) }],
  }));
  contents.push({ role: 'user', parts: [{ text: userText }] });

  // Panggil Gemini via Rotator dengan system prompt sesuai mood
  let aiReply = await callGemini(contents, buildSystemInstruction(activeTone));

  // Jika terdeteksi kata darurat, tambahkan panduan bantuan
  const urgent = isUrgent(userText);
  if (urgent) {
    aiReply += `\n\n---\n💙 **Kamu tidak sendirian.** Jika kamu membutuhkan bantuan segera, hubungi:\n- **SEJIWA**: 119 (tekan 8)\n- **Into The Light**: 021-7884-5555\n- Atau temui langsung **guru BK / Pembina PIK-R-mu**.`;
  }

  // Simpan pesan user & balasan AI (terenkripsi AES-256)
  const now = new Date();
  await prisma.rcAiMessage.createMany({
    data: [
      { sessionId: id, role: 'user',  content: seal(userText), createdAt: now },
      { sessionId: id, role: 'model', content: seal(aiReply),  createdAt: new Date(now.getTime() + 10) },
    ],
  });

  // Auto-judul dari pesan pertama user bila belum ada judul
  const updates = { updatedAt: new Date() };
  if (!session.title && session.messages.length === 0) {
    updates.title = userText.slice(0, 50);
  }
  await prisma.rcAiSession.update({ where: { id }, data: updates });

  // Tambahkan penggunaan limit
  const updatedLim = await prisma.rcAiLimit.update({
    where: { memberId: me.id },
    data: { usedToday: { increment: 1 } },
  });

  return {
    reply: aiReply,
    tone: activeTone,
    urgent,
    limit: {
      usedToday: updatedLim.usedToday,
      total: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - updatedLim.usedToday),
      resetAt: updatedLim.resetAt,
      percent: Math.min(100, Math.round((updatedLim.usedToday / DAILY_LIMIT) * 100)),
    },
  };
});

/** DELETE /rc/ai/sessions/:id */
export const deleteSession = handle(async (req) => {
  const me = await requireViewer(req);
  const { id } = req.params;

  const session = await prisma.rcAiSession.findFirst({ where: { id, memberId: me.id } });
  if (!session) fail(404, 'Sesi tidak ditemukan.');

  await prisma.rcAiSession.delete({ where: { id } });
  return { ok: true };
});

/**
 * Gemini API Rotator — round-robin 8 API keys dengan failover otomatis.
 * Model: gemini-3.5-flash-lite (Google AI Studio)
 *
 * Strategi:
 * - Putar kunci secara bergilir (round-robin).
 * - Jika kunci menerima 429 (rate limit) atau 503, tandai "pendingin" selama COOLDOWN_MS.
 * - Coba kunci berikutnya secara otomatis (maks. MAX_TRIES kali).
 * - Jika semua kunci dalam pendingin → lemparkan error 503.
 */

import { RcError } from './core.js';

const MODEL = 'gemini-3.5-flash-lite';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const COOLDOWN_MS = 60_000; // 60 detik pendingin per kunci
const MAX_TRIES = 12;       // maks. percobaan (mencakup semua kunci)

// Ambil kunci langsung dari process.env (selalu dinamis, tidak stale)
function keys() {
  const raw = process.env.GEMINI_API_KEYS || '';
  const ks = raw.split(',').map((k) => k.trim()).filter(Boolean);
  if (ks.length === 0) {
    console.warn('[AI Rotator] GEMINI_API_KEYS belum diisi di .env.');
  }
  return ks;
}

// Indeks kunci saat ini (round-robin)
let _idx = 0;
// Map: keyIndex → timestamp pendingin habis
const cooling = new Map();

function nextKey() {
  const ks = keys();
  if (ks.length === 0) throw new RcError(503, 'Sahabat AI belum dikonfigurasi (kunci API kosong).');

  const start = _idx;
  for (let i = 0; i < ks.length; i++) {
    const idx = (start + i) % ks.length;
    const coolUntil = cooling.get(idx) || 0;
    if (Date.now() >= coolUntil) {
      _idx = (idx + 1) % ks.length;
      return { key: ks[idx], idx, totalKeys: ks.length };
    }
  }
  throw new RcError(503, 'Semua kunci Gemini sedang dalam pendingin karena batas laju. Coba lagi dalam 1 menit.');
}

function setCooling(idx) {
  cooling.set(idx, Date.now() + COOLDOWN_MS);
  console.warn(`[AI Rotator] Kunci #${idx + 1} masuk pendingin (cooldown 60s) hingga ${new Date(cooling.get(idx)).toLocaleTimeString('id-ID')}`);
}

/**
 * Panggil Gemini API dengan percobaan ulang otomatis & rotator.
 *
 * @param {Array<{role: 'user'|'model', parts: [{text: string}]}>} contents - Riwayat percakapan
 * @param {string} systemInstruction - Instruksi sistem konselor
 * @returns {Promise<string>} - Teks balasan model
 */
export async function callGemini(contents, systemInstruction) {
  const ks = keys();
  if (ks.length === 0) throw new RcError(503, 'Sahabat AI belum dikonfigurasi.');

  let lastErr = null;
  for (let attempt = 0; attempt < Math.min(MAX_TRIES, ks.length * 2); attempt++) {
    let keyInfo;
    try {
      keyInfo = nextKey();
    } catch (e) {
      throw e; // semua kunci dalam pendingin
    }

    const { key, idx, totalKeys } = keyInfo;
    const url = `${API_BASE}/${MODEL}:generateContent?key=${key}`;

    try {
      const body = {
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',      threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',threshold: 'BLOCK_ONLY_HIGH' },
        ],
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(35_000), // timeout 35 detik
      });

      if (res.status === 429 || res.status === 503) {
        setCooling(idx);
        lastErr = new RcError(res.status, `Kunci #${idx + 1} rate limited (${res.status})`);
        continue; // coba kunci berikutnya
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error(`[AI Rotator] Kunci #${idx + 1} galat HTTP ${res.status}:`, txt.slice(0, 300));
        setCooling(idx);
        lastErr = new RcError(502, `Gemini error ${res.status}: ${txt.slice(0, 150)}`);
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new RcError(502, 'Respons dari Sahabat AI kosong.');

      console.log(`[AI Rotator] Berhasil merespons pesan via Kunci #${idx + 1}/${totalKeys} (Model: ${MODEL})`);
      return text.trim();
    } catch (err) {
      if (err instanceof RcError && err.status === 503) throw err;
      console.warn(`[AI Rotator] Percobaan #${attempt + 1} pada kunci #${idx + 1} gagal:`, err.message);
      setCooling(idx);
      lastErr = err;
    }
  }

  throw lastErr || new RcError(503, 'Sahabat AI sedang sibuk saat ini. Silakan coba lagi beberapa saat lagi.');
}

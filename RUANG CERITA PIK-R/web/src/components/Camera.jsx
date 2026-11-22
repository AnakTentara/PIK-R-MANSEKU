import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  X, RefreshCw, Zap, ZapOff, Images, Music, MicOff, Loader2, Timer, Grid2X2, ScrollText, ChevronDown, Check, Ban,
  Maximize2, Minimize2, ArrowRight, Undo2, Camera as CameraIcon, ImagePlus, Settings, Sparkles, GalleryVerticalEnd
} from 'lucide-react';
import { getCamera, getMic, cameraError, pickRecorderType, cropRect, baseMime } from '@/lib/camera.js';
import { useBackClose } from '@/lib/back.js';
import { concatFmp4 } from '@/lib/fmp4.js';
import { FILTERS } from '@/lib/photo.js';
import { startMusic, startMusicForRecording, stopMusic, pauseMusic, resumeMusic, musicElement } from '@/lib/music.js';
import { STORY_BG } from './Stories.jsx';
import MusicSheet from './MusicSheet.jsx';
import styles from './Camera.module.css';

const ASPECT_STD = 3 / 4;
const ASPECT_TALL = 9 / 16;
const HOLD_MS = 260;      // tahan lebih lama dari ini = rekam selama ditahan (lepas = jeda)
const CAPTURE_MODES = [
  { key: '10m', label: '10 mnt', limit: 600 },
  { key: '60s', label: '60 detik', limit: 60 },
  { key: '15s', label: '15 detik', limit: 15 },
  { key: 'photo', label: 'FOTO', limit: 0 },
  { key: 'text', label: 'TEKS', limit: 0 },
];
const KINDS = [{ key: 'story', label: 'Cerita' }, { key: 'post', label: 'Postingan' }];
const MAX_UPLOAD_BYTES = 55 * 1024 * 1024; // server menolak video > 60 MB; sisakan ruang untuk header
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_ZOOM = 5;
const REC_W = 720;        // lebar rekaman: ringan untuk HP kelas menengah
const RING = 289.03;      // keliling cincin shutter (r = 46)

/**
 * Tata letak kolase: slot dalam pecahan 0–1 dari bingkai.
 * Jarak antar sel = GAP × lebar bingkai, sudut sel = RADIUS × lebar bingkai (sama di pratinjau dan hasil akhir).
 */
const COLLAGE_LAYOUTS = {
  '2v': { label: '2 foto vertikal', slots: [{ x: 0, y: 0, w: .5, h: 1 }, { x: .5, y: 0, w: .5, h: 1 }] },
  '2h': { label: '2 foto horizontal', slots: [{ x: 0, y: 0, w: 1, h: .5 }, { x: 0, y: .5, w: 1, h: .5 }] },
  '3v': { label: '3 foto vertikal', slots: [0, 1, 2].map((i) => ({ x: i / 3, y: 0, w: 1 / 3, h: 1 })) },
  '4': { label: '4 foto kotak', slots: [{ x: 0, y: 0, w: .5, h: .5 }, { x: .5, y: 0, w: .5, h: .5 }, { x: 0, y: .5, w: .5, h: .5 }, { x: .5, y: .5, w: .5, h: .5 }] },
  '6': { label: '6 foto', slots: [0, 1, 2, 3, 4, 5].map((i) => ({ x: i < 3 ? 0 : .5, y: (i % 3) / 3, w: .5, h: 1 / 3 })) }
};
const COLLAGE_ORDER = ['2v', '2h', '3v', '4', '6'];   // eksplisit: kunci angka akan diurutkan lebih dulu oleh Object.entries
const GAP = 0.012;
const RADIUS = 0.016;

/**
 * Filter kamera. Pratinjau & rekaman video memakai padanan CSS; foto membawa NAMA filter ke penyunting
 * (yang memprosesnya per piksel) sehingga hasil akhirnya sama dengan filter di penyunting.
 */
const FILTER_CSS = {
  none: 'none',
  hangat: 'sepia(.22) saturate(1.12) brightness(1.04)',
  senja: 'sepia(.36) saturate(1.22) contrast(1.1) hue-rotate(-8deg)',
  sejuk: 'saturate(.95) hue-rotate(12deg) brightness(1.05)',
  cerah: 'brightness(1.12) contrast(1.08) saturate(1.15)',
  pudar: 'contrast(.9) saturate(.8) brightness(1.08) sepia(.1)',
  film: 'sepia(.18) contrast(1.12) saturate(.95)',
  kontras: 'contrast(1.3) saturate(1.08)',
  klasik: 'grayscale(1) contrast(1.15)',
  arang: 'grayscale(1) contrast(1.4) brightness(.95)'
};
const FILTER_UI = FILTERS.map((f) => ({ key: f.key, label: f.label, css: FILTER_CSS[f.key] || 'none' }));
const FILTER_W = 78;      // lebar tiap lingkaran filter di deretan
const FILTER_DRAG = 52;   // piksel geser per satu filter
const CTX_FILTER = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;

/** Kecepatan gulir teleprompter (piksel/detik) dan ukuran huruf. */
const TELE_SPEEDS = [14, 24, 38, 56, 80];
const TELE_SPEED_LABEL = ['Pelan', 'Santai', 'Sedang', 'Cepat', 'Kilat'];
const TELE_SIZES = [15, 18, 22];
const readTele = () => { try { return { speed: 2, size: 1, ...JSON.parse(localStorage.getItem('rc_tele') || '{}') }; } catch { return { speed: 2, size: 1 }; } };
const DEMO_TEXT = 'Halo semuanya! Ini contoh skrip yang bergulir. Baca pelan-pelan sambil menatap kamera, tarik napas, lalu lanjutkan ceritamu dengan percaya diri.';

/** Rata-rata kecerahan bingkai (0–255); di bawah ±70 dianggap gelap, dipakai oleh flash Auto. */
const isDark = (video) => {
  try {
    const c = document.createElement('canvas');
    c.width = 24; c.height = 24;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(video, 0, 0, 24, 24);
    const d = x.getImageData(0, 0, 24, 24).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    return sum / (d.length / 4) < 70;
  } catch { return false; }
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const loadImg = (url) => new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
const clamp01 = (n) => Math.min(1, Math.max(0, n));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const musicMeta = (m) => (m ? { id: m.id, title: m.title, artist: m.artist, start: m.start } : undefined);

/**
 * Cara cadangan menggabungkan klip (bila bukan MP4 terfragmentasi): putar ulang berurutan ke kanvas + audio,
 * lalu rekam sekali lagi. Berjalan real-time, jadi ada indikator kemajuan.
 */
async function mergeByReplay(s, onProgress) {
  const { W, H, segs, type } = s;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const out = canvas.captureStream(30);
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  const dest = ac.createMediaStreamDestination();
  await ac.resume().catch(() => {});
  dest.stream.getAudioTracks().forEach((t) => out.addTrack(t));
  const total = segs.reduce((a, x) => a + x.dur, 0) || 1;
  const rec = new MediaRecorder(out, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: s.long ? 600_000 : 2_500_000, audioBitsPerSecond: 64_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise((res) => { rec.onstop = res; });
  rec.start(500);
  let done = 0;
  for (const seg of segs) {
    const v = document.createElement('video');
    v.playsInline = true; v.preload = 'auto'; v.src = seg.url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('klip')); });
    const src = ac.createMediaElementSource(v);
    src.connect(dest);
    let raf = 0;
    const draw = () => { ctx.drawImage(v, 0, 0, W, H); onProgress(Math.min(1, (done + v.currentTime) / total)); raf = requestAnimationFrame(draw); };
    await v.play();
    draw();
    await Promise.race([new Promise((res) => { v.onended = res; }), sleep(seg.dur * 1000 + 4000)]);   // jaga-jaga bila 'ended' tidak datang
    cancelAnimationFrame(raf);
    done += seg.dur;
    try { src.disconnect(); } catch { /* abaikan */ }
    v.removeAttribute('src'); v.load();
  }
  rec.stop();
  await stopped;
  out.getVideoTracks().forEach((t) => t.stop());
  ac.close().catch(() => {});
  return new Blob(chunks, { type: baseMime(rec.mimeType || type) });
}

/** Ikon mini tata letak kolase, digambar dari data slot yang sama dengan hasil akhirnya. */
function LayoutGlyph({ slots }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {slots.map((s, i) => (
        <rect key={i} x={2 + s.x * 20 + 0.9} y={2 + s.y * 20 + 0.9} width={s.w * 20 - 1.8} height={s.h * 20 - 1.8} rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      ))}
    </svg>
  );
}

/** Pratinjau kamera di dalam satu sel kolase (berbagi aliran dengan kamera utama). */
function LiveCell({ stream, mirror, scale }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || !stream) return;
    v.srcObject = stream;
    v.play().catch(() => {});
  }, [stream]);
  return <video ref={ref} className={styles.cellVideo} playsInline muted autoPlay style={{ transform: `${mirror ? 'scaleX(-1) ' : ''}scale(${scale})` }} />;
}

/**
 * Pemilih bergulir: hanya teks, bisa digeser kiri-kanan; yang di tengah = aktif.
 * Teks yang tidak aktif memudar ke transparan di tepi (gradient).
 */
function ModeScroller({ items, value, onChange, disabled, className = '', label = 'Mode pengambilan' }) {
  const ref = useRef(null);
  const prog = useRef(false);       // true selama kita sendiri yang menggulir (abaikan event gulir)
  const timer = useRef(0);
  const center = useCallback((key, smooth) => {
    const box = ref.current;
    const el = box?.querySelector(`[data-key="${key}"]`);
    if (!el) return;
    prog.current = true;
    clearTimeout(timer.current);
    box.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - box.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
    timer.current = setTimeout(() => { prog.current = false; }, smooth ? 520 : 90);
  }, []);
  useLayoutEffect(() => { center(value, false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { center(value, true); }, [value, center]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onScroll = () => {
    if (prog.current || disabled) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {                       // gulir berhenti: ambil yang paling dekat tengah
      const box = ref.current;
      if (!box) return;
      const mid = box.scrollLeft + box.clientWidth / 2;
      let best = null; let bd = Infinity;
      for (const el of box.children) {
        if (!el.dataset.key) continue;
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
        if (d < bd) { bd = d; best = el; }
      }
      if (best && best.dataset.key !== value) onChange(best.dataset.key);
    }, 110);
  };
  return (
    <div ref={ref} className={`${styles.modes} ${className}`} role="tablist" aria-label={label} onScroll={onScroll}>
      {items.map((m) => (
        <button key={m.key} type="button" role="tab" data-key={m.key} aria-selected={value === m.key} className={value === m.key ? styles.modeOn : ''}
          onClick={() => !disabled && onChange(m.key)} disabled={disabled && value !== m.key}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

const readFacing = () => { try { return localStorage.getItem('rc_cam_facing') || 'environment'; } catch { return 'environment'; } };

/**
 * Kartu teleprompter: bisa digeser, diubah ukurannya dari sudut kanan bawah, ditutup dengan X.
 * Tombol pengaturan (kanan atas) mengatur kecepatan & ukuran huruf dengan pratinjau gulir; saat merekam teks ikut bergulir.
 */
function TeleprompterCard({ position, setPosition, script, onOpen, onClose, prefs, setPrefs, running, resetKey }) {
  const drag = useRef(null);
  const resize = useRef(null);
  const moved = useRef(false);                   // true bila jari/kursor bergeser: klik susulan jangan membuka editor
  const [prefOpen, setPrefOpen] = useState(false);
  const inner = useRef(null);
  const offset = useRef(0);
  const onPointerDown = (e) => { moved.current = false; e.currentTarget.setPointerCapture?.(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y }; };
  const onPointerMove = (e) => {
    if (drag.current && Math.abs(e.clientX - drag.current.x) + Math.abs(e.clientY - drag.current.y) > 5) moved.current = true;
    if (drag.current) setPosition((p) => ({ ...p, x: Math.max(8, Math.min(window.innerWidth - p.w - 8, drag.current.px + e.clientX - drag.current.x)), y: Math.max(70, Math.min(window.innerHeight - p.h - 150, drag.current.py + e.clientY - drag.current.y)) }));
    if (resize.current) setPosition((p) => ({ ...p, w: Math.max(170, Math.min(window.innerWidth - p.x - 8, resize.current.w + e.clientX - resize.current.x)), h: Math.max(84, Math.min(window.innerHeight - p.y - 140, resize.current.h + e.clientY - resize.current.y)) }));
  };
  const onPointerUp = () => { drag.current = null; resize.current = null; };
  const onResizeStart = (e) => { e.stopPropagation(); e.currentTarget.setPointerCapture?.(e.pointerId); resize.current = { x: e.clientX, y: e.clientY, w: position.w, h: position.h }; };
  const setPref = (patch) => setPrefs((p) => { const n = { ...p, ...patch }; try { localStorage.setItem('rc_tele', JSON.stringify(n)); } catch { /* abaikan */ } return n; });

  // Mulai dari atas setiap rekaman baru
  useEffect(() => { offset.current = 0; if (inner.current) inner.current.style.transform = 'translateY(0)'; }, [resetKey]);
  // Gulir otomatis hanya saat benar-benar merekam (berhenti saat dijeda)
  useEffect(() => {
    if (!running) return undefined;
    let last = performance.now();
    let raf = 0;
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const el = inner.current;
      if (el) {
        offset.current = Math.min(offset.current + TELE_SPEEDS[prefs.speed] * dt, Math.max(0, el.scrollHeight - 28));
        el.style.transform = `translateY(${-offset.current}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, prefs.speed]);

  const stop = (e) => e.stopPropagation();
  return (
    <div className={styles.teleprompter} style={{ left: position.x, top: position.y, width: position.w, height: position.h }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      onClick={(e) => { e.stopPropagation(); if (moved.current) { moved.current = false; return; } if (prefOpen) setPrefOpen(false); else onOpen(); }}>
      <div className={styles.teleView}>
        <div ref={inner} className={styles.teleInner} style={{ fontSize: TELE_SIZES[prefs.size] }}>{script || 'Ketuk untuk menambahkan Skripmu sendiri.'}</div>
      </div>
      <button type="button" className={styles.teleClose} onPointerDown={stop} onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Tutup Teleprompter"><X size={14} /></button>
      <button type="button" className={`${styles.telePref} ${prefOpen ? styles.telePrefOn : ''}`} onPointerDown={stop} onClick={(e) => { e.stopPropagation(); setPrefOpen((v) => !v); }} aria-expanded={prefOpen} aria-label="Pengaturan teleprompter"><Settings size={15} /></button>
      <button type="button" className={styles.teleHandle} onPointerDown={onResizeStart} onClick={stop} aria-label="Ubah ukuran Teleprompter">↗</button>

      {prefOpen && (
        <div className={styles.telePop} onPointerDown={stop} onClick={stop} role="dialog" aria-label="Preferensi teleprompter">
          <b>Kecepatan gulir</b>
          <div className={styles.teleDemo} aria-hidden="true">
            <div key={prefs.speed} className={styles.teleDemoText} style={{ fontSize: TELE_SIZES[prefs.size] * .8, '--dist': '-110px', animationDuration: `${110 / TELE_SPEEDS[prefs.speed]}s` }}>{DEMO_TEXT}</div>
          </div>
          <div className={styles.teleSpeeds} role="radiogroup" aria-label="Kecepatan">
            {TELE_SPEEDS.map((_, i) => (
              <button key={i} type="button" role="radio" aria-checked={prefs.speed === i} className={prefs.speed === i ? styles.teleOn : ''} onClick={() => setPref({ speed: i })}>{i + 1}</button>
            ))}
          </div>
          <p className={styles.teleSpeedName}>{TELE_SPEED_LABEL[prefs.speed]} · {TELE_SPEEDS[prefs.speed]} px/dtk</p>
          <b>Ukuran huruf</b>
          <div className={styles.teleSizes} role="radiogroup" aria-label="Ukuran huruf">
            {['Kecil', 'Sedang', 'Besar'].map((l, i) => (
              <button key={l} type="button" role="radio" aria-checked={prefs.size === i} className={prefs.size === i ? styles.teleOn : ''} onClick={() => setPref({ size: i })}>{l}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Halaman TEKS: layar penuh di sebelah kamera (kamera bergeser keluar, halaman ini masuk dari kanan).
 * Hasilnya cerita teks; kamera tidak ditutup.
 */
function TextPage({ active, text, setText, bg, setBg, onBack, onDone, modeBar }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return undefined;
    const t = setTimeout(() => ref.current?.focus({ preventScroll: true }), 460);   // setelah geseran selesai
    return () => clearTimeout(t);
  }, [active]);
  const dark = bg === 'clay';
  return (
    <section className={`${styles.textPage} ${active ? styles.textPageOn : ''}`} style={{ background: STORY_BG[bg] }} aria-hidden={!active} aria-label="Cerita teks">
      <header className={styles.textHead}>
        <button type="button" className={`${styles.railBtn} ${dark ? styles.railBtnLight : ''}`} onClick={onBack} aria-label="Kembali ke kamera"><X size={20} /></button>
        <button type="button" className={styles.textDone} onClick={onDone} disabled={!text.trim()}>Lanjut</button>
      </header>
      <div className={styles.textBody}>
        <textarea ref={ref} className={`${styles.textArea} ${dark ? styles.textAreaDark : ''}`} value={text} maxLength={300} rows={5}
          onChange={(e) => setText(e.target.value)} placeholder="Ketuk untuk menulis…" aria-label="Isi cerita teks" />
      </div>
      <div className={styles.swatches} role="radiogroup" aria-label="Warna latar">
        {Object.entries(STORY_BG).map(([k, v]) => (
          <button key={k} type="button" role="radio" aria-checked={bg === k} aria-label={k} style={{ background: v }} className={bg === k ? styles.swatchOn : ''} onClick={() => setBg(k)} />
        ))}
      </div>
      {modeBar}
    </section>
  );
}

/**
 * Kamera layar penuh untuk Cerita / Postingan / foto Pesan.
 *  - Bawah tengah       : Cerita ⇄ Postingan (geser). Berganti = transisi besar supaya terasa bedanya.
 *  - Geser shutter      : ganti filter (hilang saat merekam)
 *  - FOTO               : ketuk = foto
 *  - 10 mnt/60/15 detik : ketuk = mulai, ketuk lagi = JEDA (klip selesai), ketuk lagi = klip baru. Tahan = merekam
 *                         selama ditahan. Undo menghapus klip terakhir; Selesai menggabungkan semua klip.
 *  - TEKS               : halaman cerita teks di sebelah kamera
 *  - Kolase             : bingkai terbagi sesuai tata letak, foto bergantian mengisi tiap sel
 * Hasil dipotong sesuai bingkai yang terlihat (yang terlihat = yang tersimpan).
 */
export default function Camera({ mode: initialKind = 'story', photoOnly = false, onKind, onCapture, onGallery, onText, onClose }) {
  const [kind, setKind] = useState(initialKind);
  const [tall, setTall] = useState(initialKind === 'story');   // rasio 9:16 (Cerita) atau 3:4
  const [kindFx, setKindFx] = useState(null);
  const [captureMode, setCaptureMode] = useState('photo');
  const [screenLight, setScreenLight] = useState(false);
  const countRef = useRef(0);                    // token hitung mundur timer; 0 = tidak berjalan
  const [facing, setFacing] = useState(readFacing);
  const [stream, setStream] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [rec, setRec] = useState(null);          // null | 'hold' | 'free' = klip sedang direkam
  const [paused, setPaused] = useState(false);   // ada sesi rekaman, klip sedang jeda
  const [sec, setSec] = useState(0);             // total detik terekam (tidak termasuk jeda)
  const [segDurs, setSegDurs] = useState([]);    // durasi tiap klip yang sudah selesai
  const [merging, setMerging] = useState(null);  // { p: 0..1 } saat klip digabung
  const [zoom, setZoom] = useState(1);
  const [flashMode, setFlashMode] = useState('off'); // off | auto | on
  const [canTorch, setCanTorch] = useState(false);
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [timerOpen, setTimerOpen] = useState(false);
  const [collage, setCollage] = useState('off');
  const [collageOpen, setCollageOpen] = useState(false);
  const [cells, setCells] = useState([]);        // [{ file, url, w, h, ax, ay } | null]
  const [target, setTarget] = useState(null);    // sel yang sengaja dipilih untuk diisi ulang
  const [cellMenu, setCellMenu] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [filterIdx, setFilterIdx] = useState(0);
  const [filterName, setFilterName] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [music, setMusic] = useState(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const [script, setScript] = useState('');
  const [scriptOpen, setScriptOpen] = useState(false);
  const [teleprompter, setTeleprompter] = useState(false);
  const [telePrefs, setTelePrefs] = useState(readTele);
  const [teleRun, setTeleRun] = useState(0);     // naik tiap sesi rekaman baru: teks kembali ke atas
  const [telePos, setTelePos] = useState({ x: 18, y: 150, w: 240, h: 112 });
  const [storyText, setStoryText] = useState('');
  const [storyBg, setStoryBg] = useState('sunset');
  const [noMic, setNoMic] = useState(false);
  const [flashFx, setFlashFx] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const fileRef = useRef(null);
  const fillIdx = useRef(null);                  // sel tujuan untuk pilihan Galeri
  const trackRef = useRef(null);
  const hwZoom = useRef(null);                   // { min, max } bila kamera mendukung zoom optik/digital bawaan
  const zoomRef = useRef(1);
  const micRef = useRef(null);
  const sess = useRef(null);                     // sesi rekaman video (klip-klip)
  const starting = useRef(0);                    // token klip yang sedang dimulai (0 = tidak ada)
  const press = useRef(null);
  const holdTimer = useRef(0);
  const stageTap = useRef(0);
  const pinch = useRef(null);
  const ptrs = useRef(new Map());
  const cellsRef = useRef([]);
  const targetRef = useRef(null);
  const order = useRef([]);                      // urutan sel yang terisi (untuk Ulangi)
  const dragRef = useRef(null);
  const stripDrag = useRef(null);
  const stripMoved = useRef(false);
  const fxTimer = useRef(0);
  const nameTimer = useRef(0);
  const handedOff = useRef(false);               // hasil sudah diserahkan: musik foto lanjut di penyunting
  const musicRef = useRef(null);
  musicRef.current = music;
  const filterRef = useRef(0);
  filterRef.current = filterIdx;
  const limitRef = useRef(60);
  useBackClose(true, onClose);

  const aspect = kind === 'dm' ? ASPECT_STD : tall ? ASPECT_TALL : ASPECT_STD;
  const aspectRef = useRef(aspect);
  aspectRef.current = aspect;
  const front = facing === 'user';
  const activeCapture = CAPTURE_MODES.find((item) => item.key === captureMode) || CAPTURE_MODES[3];
  const isText = captureMode === 'text';
  const isVideoMode = !photoOnly && !isText && captureMode !== 'photo';
  const session = !!rec || paused;               // ada rekaman berjalan / dijeda
  const collageActive = collage !== 'off' && captureMode === 'photo';
  const layout = collage !== 'off' ? COLLAGE_LAYOUTS[collage] : null;
  const filled = cells.filter(Boolean).length;
  const collageFull = collageActive && layout && cells.length === layout.slots.length && filled === layout.slots.length;
  const activeIdx = collageActive && !collageFull ? (target ?? cells.findIndex((c) => !c)) : -1;
  const limit = activeCapture.limit || 60;
  limitRef.current = limit;
  const hasKinds = !photoOnly && !!onKind;
  // Filter: tidak dipakai di kolase, teks, atau saat merekam; video butuh dukungan filter kanvas
  const filtersOn = !session && !isText && !collageActive && countdown === 0 && (captureMode === 'photo' || CTX_FILTER);
  const filter = filtersOn ? FILTER_UI[filterIdx] : FILTER_UI[0];

  const updateCells = (fn) => { const next = fn(cellsRef.current); cellsRef.current = next; setCells(next); };
  const setTargetBoth = (v) => { targetRef.current = v; setTarget(v); };
  const putCell = (i, cell) => {
    updateCells((cs) => cs.map((c, n) => (n === i ? cell : c)));
    order.current = [...order.current.filter((n) => n !== i), i];
    setTargetBoth(null);
  };
  const clearCell = (i) => {
    updateCells((cs) => cs.map((c, n) => (n === i ? null : c)));
    order.current = order.current.filter((n) => n !== i);
  };

  // Buka kamera (ulang saat ganti depan/belakang)
  useEffect(() => {
    let alive = true;
    setReady(false); setError(null); setFlashMode('off'); setZoom(1); zoomRef.current = 1;
    getCamera(facing).then((s) => {
      if (!alive) return;
      const v = videoRef.current;
      v.srcObject = s;
      v.play().catch(() => {});
      setStream(s);
      const track = s.getVideoTracks()[0];
      trackRef.current = track;
      const caps = track.getCapabilities?.() || {};
      hwZoom.current = caps.zoom && caps.zoom.max > caps.zoom.min ? { min: caps.zoom.min, max: caps.zoom.max } : null;
      setCanTorch(!!caps.torch);
    }).catch((err) => alive && setError(cameraError(err)));
    return () => { alive = false; };
  }, [facing, attempt]);

  // Mikrofon diminta sekali saat kamera dibuka (bukan di tengah menahan tombol)
  useEffect(() => {
    if (photoOnly) return;
    getMic().then((m) => { micRef.current = m; setNoMic(!m); });
  }, [photoOnly]);

  // Tutup di tengah jalan: hentikan rekaman, hitung mundur, dan musik (kecuali musik foto yang diteruskan ke penyunting)
  useEffect(() => () => {
    countRef.current = 0;
    clearTimeout(fxTimer.current); clearTimeout(nameTimer.current);
    const s = sess.current;
    if (s) { s.cancelled = true; if (s.cur && s.cur.recorder.state !== 'inactive') s.cur.recorder.stop(); teardown(s, false); }
    if (!handedOff.current) stopMusic();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyZoom = useCallback((z) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    zoomRef.current = next;
    setZoom(next);
    const hz = hwZoom.current;
    if (hz) {
      const value = Math.min(hz.max, hz.min * next);
      trackRef.current?.applyConstraints({ advanced: [{ zoom: value }] }).catch(() => {});
    }
  }, []);
  // Zoom digital dipakai bila kamera tidak punya zoom bawaan
  const digital = () => (hwZoom.current ? 1 : zoomRef.current);

  const cycleFlash = async () => {
    const next = flashMode === 'off' ? 'auto' : flashMode === 'auto' ? 'on' : 'off';
    setFlashMode(next);
    if (!canTorch || !trackRef.current) return;
    try {
      await trackRef.current.applyConstraints({ advanced: [{ torch: next === 'on' }] });
    } catch {
      setFlashMode('off');
      toast.error('Lampu kilat tidak tersedia');
    }
  };
  const flip = () => {
    if (session) return;
    const next = front ? 'environment' : 'user';
    try { localStorage.setItem('rc_cam_facing', next); } catch { /* abaikan */ }
    setFacing(next);
  };

  /** Ganti Cerita ⇄ Postingan: rasio ikut berubah dan layar memberi tahu lewat transisi besar. */
  const chooseKind = (k) => {
    if (session || k === kind || countdown > 0) return;
    setKind(k);
    setTall(k === 'story');
    onKind?.(k);
    clearTimeout(fxTimer.current);
    setKindFx({ k, id: Date.now() });
    fxTimer.current = setTimeout(() => setKindFx(null), 1400);
    navigator.vibrate?.(12);
  };

  /** Hitung mundur timer. true = lanjut; false = dibatalkan. */
  const cancelCountdown = () => { countRef.current = 0; starting.current = 0; setCountdown(0); };   // starting dilepas agar ketukan berikutnya langsung diterima
  const runCountdown = async () => {
    if (countRef.current) { cancelCountdown(); return false; }   // ketuk tombol saat hitung mundur = batalkan
    if (timer <= 0) return true;
    const token = Date.now();
    countRef.current = token;
    setTimerOpen(false); setCollageOpen(false);
    for (let remaining = timer; remaining > 0; remaining -= 1) {
      setCountdown(remaining);
      await sleep(1000);
      if (countRef.current !== token) { setCountdown(0); return false; }
    }
    countRef.current = 0;
    setCountdown(0);
    return true;
  };

  /**
   * Foto: potong bingkai dari video asli (resolusi penuh), cermin untuk kamera depan seperti pratinjau.
   * Di mode kolase seluruh bingkai kamera disimpan ke sel (supaya bisa digeser), bukan hasil potongan.
   */
  const snap = async () => {
    if (!(await runCountdown())) return;
    const v = videoRef.current;
    if (!v?.videoWidth || busy) return;
    setBusy(true);
    // Flash: torch bila ada; kamera depan / tanpa torch memakai layar putih sebagai lampu
    const needLight = flashMode === 'on' || (flashMode === 'auto' && isDark(v));
    const useTorch = canTorch && !!trackRef.current;
    let torchTemp = false;
    try {
      if (needLight && useTorch && flashMode === 'auto') {
        await trackRef.current.applyConstraints({ advanced: [{ torch: true }] });
        torchTemp = true;
        await sleep(350);
      } else if (needLight && !useTorch) {
        setScreenLight(true);
        await sleep(320);
      }
      setFlashFx(true);
      setTimeout(() => setFlashFx(false), 260);
      const inCollage = collageActive;
      const a = inCollage ? v.videoWidth / v.videoHeight : aspectRef.current;
      const r = cropRect(v.videoWidth, v.videoHeight, a, digital());
      const c = document.createElement('canvas');
      c.width = Math.round(r.sw); c.height = Math.round(r.sh);
      const ctx = c.getContext('2d');
      if (front) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(v, r.sx, r.sy, r.sw, r.sh, 0, 0, c.width, c.height);
      const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92));
      if (!blob) throw new Error('blob');
      const file = new File([blob], `kamera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      navigator.vibrate?.(8);
      const url = URL.createObjectURL(file);
      if (inCollage) {
        const idx = targetRef.current ?? cellsRef.current.findIndex((cell) => !cell);
        if (idx >= 0) putCell(idx, { file, url, w: c.width, h: c.height, ax: .5, ay: .5 });
        return;
      }
      // Foto + musik: lagu mulai saat dicekrek dan terus berbunyi di penyunting
      if (musicRef.current) { startMusic(musicRef.current); handedOff.current = true; }
      const fk = FILTER_UI[filterRef.current].key;
      onCapture({ file, url, video: false, w: c.width, h: c.height, mode: kind, filter: fk !== 'none' ? fk : undefined, music: musicMeta(musicRef.current) });
    } catch {
      toast.error('Foto gagal diambil. Coba lagi.');
    } finally {
      setScreenLight(false);
      if (torchTemp) trackRef.current?.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
      setBusy(false);
    }
  };

  // ── Kolase ──
  const chooseCollage = (key) => {
    setCollage(key);
    setCollageOpen(false);
    order.current = [];
    setTargetBoth(null);
    setCellMenu(null);
    updateCells(() => (key === 'off' ? [] : Array(COLLAGE_LAYOUTS[key].slots.length).fill(null)));
  };
  const undoCell = () => {
    const i = order.current[order.current.length - 1];
    if (i === undefined) return;
    clearCell(i);
    setTargetBoth(i);                              // ulangi: sel itu kembali menjadi pratinjau kamera
  };
  const fillFromGallery = async (file) => {
    const i = fillIdx.current;
    fillIdx.current = null;
    if (!file || i === null) return;
    if (!file.type.startsWith('image/')) { toast.error('Pilih foto'); return; }
    if (file.size > MAX_PHOTO_BYTES) { toast.error('Foto terlalu besar (maks. 15 MB)'); return; }
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImg(url);
      putCell(i, { file, url, w: img.naturalWidth, h: img.naturalHeight, ax: .5, ay: .5 });
    } catch { toast.error('Foto tidak bisa dibuka'); }
  };
  const menuPick = (pick) => {
    const i = cellMenu;
    setCellMenu(null);
    if (i === null) return;
    if (pick === 'camera') { if (cellsRef.current[i]) clearCell(i); setTargetBoth(i); return; }
    fillIdx.current = i;
    fileRef.current?.click();
  };
  // Geser foto di dalam sel untuk mengatur posisi; ketuk = pilih Kamera/Galeri
  const cellDown = (e, i) => {
    e.stopPropagation();
    const c = cellsRef.current[i];
    if (!c || !frameRef.current) return;
    const box = e.currentTarget.getBoundingClientRect();
    const fr = frameRef.current.getBoundingClientRect();
    const scale = Math.max(box.width / c.w, box.height / c.h);
    const rw = c.w * scale; const rh = c.h * scale;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { i, x: e.clientX, y: e.clientY, ax: c.ax, ay: c.ay, ox: rw - box.width, oy: rh - box.height, rw, rh, cx: box.left - fr.left, cy: box.top - fr.top, moved: false };
  };
  const cellMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    e.stopPropagation();
    const dx = e.clientX - d.x; const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) { d.moved = true; setDragIdx(d.i); }
    const ax = d.ox > 1 ? clamp01(d.ax - dx / d.ox) : d.ax;
    const ay = d.oy > 1 ? clamp01(d.ay - dy / d.oy) : d.ay;
    updateCells((cs) => cs.map((c, n) => (n === d.i ? { ...c, ax, ay } : c)));
    setGhost({ url: cellsRef.current[d.i].url, left: d.cx - ax * d.ox, top: d.cy - ay * d.oy, w: d.rw, h: d.rh });
  };
  const cellUp = (e) => {
    e.stopPropagation();
    const d = dragRef.current;
    dragRef.current = null;
    setGhost(null); setDragIdx(null);
    if (d && !d.moved) setCellMenu(d.i);
  };

  /** Susun kolase dari sel yang sudah terisi (posisi geser ikut diterapkan). */
  const finishCollage = async () => {
    if (!layout || busy) return;
    setBusy(true);
    try {
      const a = aspectRef.current;
      const W = a < 0.7 ? 1080 : 1440;
      const H = Math.round(W / a);
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      const g = GAP * W; const rad = RADIUS * W;
      for (let i = 0; i < layout.slots.length; i += 1) {
        const s = layout.slots[i]; const c = cellsRef.current[i];
        const img = await loadImg(c.url);
        const sx = s.x * W + g / 2; const sy = s.y * H + g / 2;
        const sw = s.w * W - g; const sh = s.h * H - g;
        const sc = Math.max(sw / img.naturalWidth, sh / img.naturalHeight);
        const rw = img.naturalWidth * sc; const rh = img.naturalHeight * sc;
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(sx, sy, sw, sh, rad); else ctx.rect(sx, sy, sw, sh);
        ctx.clip();
        ctx.drawImage(img, sx - c.ax * (rw - sw), sy - c.ay * (rh - sh), rw, rh);
        ctx.restore();
      }
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
      if (!blob) throw new Error('blob');
      const file = new File([blob], `kolase-kamera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (musicRef.current) { startMusic(musicRef.current); handedOff.current = true; }
      onCapture({ file, url: URL.createObjectURL(file), video: false, w: W, h: H, mode: kind, music: musicMeta(musicRef.current) });
    } catch {
      toast.error('Kolase gagal disusun. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  // ── Video: sesi berisi klip-klip (mulai / jeda / lanjut / undo / selesai) ──
  function teardown(s, resetUi = true) {
    cancelAnimationFrame(s.raf);
    clearInterval(s.timer);
    s.out?.getVideoTracks().forEach((t) => t.stop());
    s.segs.forEach((g) => URL.revokeObjectURL(g.url));
    if (sess.current === s) sess.current = null;
    if (resetUi) { setRec(null); setPaused(false); setSec(0); setSegDurs([]); }
  }
  const sumDur = (s) => s.segs.reduce((a, g) => a + g.dur, 0);

  /** Sesi baru: kanvas + aliran (video terfilter + mikrofon/musik) yang dipakai semua klip. */
  const ensureSession = () => {
    if (sess.current) return sess.current;
    const type = pickRecorderType();
    if (type === null) { toast.error('Browser ini belum bisa merekam video. Pilih video dari galeri.'); return null; }
    const v = videoRef.current;
    if (!v?.videoWidth) return null;
    const a = aspectRef.current;
    const W = REC_W;
    const H = Math.round(REC_W / a / 2) * 2;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const lim = limitRef.current;
    const s = { type, canvas, ctx, W, H, raf: 0, timer: 0, out: null, segs: [], cur: null, bytes: 0, cancelled: false, finishing: false, limit: lim, long: lim > 60, music: !!musicRef.current, filterCss: FILTER_UI[filterRef.current].css };
    const isFront = front;
    const draw = () => {
      const r = cropRect(v.videoWidth, v.videoHeight, a, digital());
      ctx.save();
      if (isFront) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      if (CTX_FILTER) ctx.filter = s.filterCss;
      ctx.drawImage(v, r.sx, r.sy, r.sw, r.sh, 0, 0, W, H);
      ctx.restore();
      s.raf = requestAnimationFrame(draw);
    };
    draw();
    s.out = canvas.captureStream(30);
    let audioStream = null;
    if (musicRef.current) {
      try { audioStream = startMusicForRecording(musicRef.current, micRef.current); } catch { audioStream = null; toast('Musik tidak bisa dicampur, merekam dengan suara mikrofon'); }
    }
    if (audioStream) audioStream.getAudioTracks().forEach((t) => s.out.addTrack(t));
    else micRef.current?.getAudioTracks().forEach((t) => s.out.addTrack(t));
    s.timer = setInterval(() => {
      const t = sumDur(s) + (s.cur ? (performance.now() - s.cur.t0) / 1000 : 0);
      setSec(t);
      if (t >= s.limit) finishRec();
    }, 100);
    sess.current = s;
    setTeleRun((n) => n + 1);
    return s;
  };

  const startSegment = (pressKind) => {
    const s = sess.current;
    if (!s || s.cur) return;
    let recorder;
    try {
      recorder = new MediaRecorder(s.out, { ...(s.type ? { mimeType: s.type } : {}), videoBitsPerSecond: s.long ? 600_000 : 2_500_000, audioBitsPerSecond: 64_000 });
    } catch {
      toast.error('Perekaman tidak didukung di browser ini.');
      if (!s.segs.length) { stopMusic(); teardown(s); }
      return;
    }
    const cur = { recorder, chunks: [], t0: performance.now() };
    recorder.ondataavailable = (e) => {
      if (!e.data.size) return;
      cur.chunks.push(e.data);
      s.bytes += e.data.size;
      if (s.bytes >= MAX_UPLOAD_BYTES) { toast('Batas ukuran video tercapai, rekaman diselesaikan'); finishRec(); }
    };
    recorder.onstop = () => onSegmentStop(s, cur);
    recorder.start(500);
    s.cur = cur;
    if (s.segs.length) resumeMusic();
    setPaused(false); setRec(pressKind);
    navigator.vibrate?.(15);
  };

  function onSegmentStop(s, cur) {
    const dur = (performance.now() - cur.t0) / 1000;
    s.cur = null;
    const mime = baseMime(cur.recorder.mimeType || s.type);
    const blob = new Blob(cur.chunks, { type: mime });
    if (dur >= 0.5 && blob.size >= 2000 && !s.cancelled) {
      s.segs.push({ blob, dur, url: URL.createObjectURL(blob), mime });
      setSegDurs(s.segs.map((g) => g.dur));
    } else if (!s.cancelled && !s.finishing) {
      s.bytes -= blob.size;
      toast('Klip terlalu singkat, tidak disimpan');
    }
    setSec(sumDur(s));
    setRec(null);
    if (s.cancelled) { teardown(s); return; }
    if (s.finishing) { finalize(s); return; }
    if (!s.segs.length) { stopMusic(); teardown(s); return; }
    setPaused(true);
  }

  async function finalize(s) {
    if (!s.segs.length) { stopMusic(); teardown(s); toast('Rekaman terlalu singkat'); return; }
    const dur = sumDur(s);
    let blob = null;
    let mime = s.segs[0].mime;
    if (s.segs.length === 1) {
      blob = s.segs[0].blob;
    } else {
      // 1) Gabung tanpa encode ulang (cepat, kualitas tetap) bila semua klip MP4 terfragmentasi
      if (s.segs.every((g) => g.mime.includes('mp4'))) blob = await concatFmp4(s.segs.map((g) => g.blob));
      // 2) Cadangan: putar ulang berurutan lalu rekam lagi (real-time)
      if (!blob) {
        setMerging({ p: 0 });
        try {
          blob = await mergeByReplay(s, (p) => setMerging({ p }));
        } catch {
          setMerging(null);
          s.finishing = false;
          setPaused(true);
          toast.error('Klip gagal digabung. Coba Selesai lagi atau hapus klip terakhir.');
          return;
        }
        setMerging(null);
      }
      mime = baseMime(blob.type || mime);
    }
    const file = new File([blob], `kamera-${Date.now()}.${mime.includes('mp4') ? 'mp4' : 'webm'}`, { type: mime });
    const url = URL.createObjectURL(file);
    const hadMusic = s.music;
    const { W, H } = s;
    stopMusic();
    teardown(s);
    onCapture({ file, url, video: true, w: W, h: H, duration: dur, mode: kind, music: hadMusic ? musicMeta(musicRef.current) : undefined });
  }

  /** Selesai: klip yang sedang direkam dihentikan, lalu semua klip digabung. */
  function finishRec() {
    const s = sess.current;
    if (!s || s.finishing) return;
    s.finishing = true;
    if (s.cur && s.cur.recorder.state !== 'inactive') s.cur.recorder.stop();
    else finalize(s);
  }
  const pauseRec = () => {
    const s = sess.current;
    if (!s?.cur || s.cur.recorder.state === 'inactive') return;
    s.cur.recorder.stop();
    pauseMusic();
    navigator.vibrate?.(10);
  };
  /** Mulai klip baru (setelah hitung mundur bila diatur) — juga untuk klip kedua dan seterusnya. */
  const startOrResume = async (pressKind) => {
    if (countRef.current) { cancelCountdown(); return; }          // ketuk saat hitung mundur = batal
    if (starting.current || sess.current?.cur || sess.current?.finishing) return;
    const mine = Date.now();
    starting.current = mine;
    try {
      if (pressKind === 'free' && !(await runCountdown())) return;
      if (starting.current !== mine) return;                       // dibatalkan selagi menunggu
      const s = sess.current || ensureSession();
      if (s) startSegment(pressKind);
    } finally { if (starting.current === mine) starting.current = 0; }
  };
  /** Hapus klip terakhir (pertama, kedua, ketiga…); musik dimundurkan sesuai sisa durasi. */
  const undoSegment = () => {
    const s = sess.current;
    if (!s || s.cur || s.finishing || !s.segs.length) return;
    const g = s.segs.pop();
    URL.revokeObjectURL(g.url);
    s.bytes = s.segs.reduce((a, x) => a + x.blob.size, 0);
    setSegDurs(s.segs.map((x) => x.dur));
    setSec(sumDur(s));
    navigator.vibrate?.(10);
    if (!s.segs.length) { stopMusic(); teardown(s); return; }
    const el = musicElement();
    if (el && musicRef.current) { try { el.currentTime = (musicRef.current.start || 0) + sumDur(s); } catch { /* abaikan */ } }
  };
  const discardAndClose = () => {
    const s = sess.current;
    if (s && !window.confirm('Buang rekaman ini?')) return;
    if (s) { s.cancelled = true; if (s.cur && s.cur.recorder.state !== 'inactive') s.cur.recorder.stop(); else teardown(s); }
    onClose();
  };

  // ── Filter: geser shutter / geser deretan lingkaran ──
  const pickFilter = (i) => {
    const n = clamp(i, 0, FILTER_UI.length - 1);
    if (n === filterRef.current) return;
    setFilterIdx(n);
    setFilterName({ t: FILTER_UI[n].label, id: Date.now() });
    clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(() => setFilterName(null), 1100);
    navigator.vibrate?.(6);
  };
  const stripDown = (e) => {
    if (!filtersOn) return;
    stripMoved.current = false;
    stripDrag.current = { x: e.clientX, i0: filterRef.current };
    const move = (ev) => {
      const d = stripDrag.current;
      if (!d) return;
      const dx = ev.clientX - d.x;
      if (Math.abs(dx) > 10) stripMoved.current = true;
      if (stripMoved.current) pickFilter(d.i0 - Math.round(dx / FILTER_DRAG));
    };
    const up = () => { stripDrag.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  // ── Gestur tombol rana ──
  const onShutterDown = (e) => {
    if (!ready || busy) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (rec === 'free') { pauseRec(); return; }     // sedang merekam: ketuk = jeda
    press.current = { x: e.clientX, y: e.clientY, z0: zoomRef.current, holding: false, swiping: false, i0: filterRef.current };
    if (isVideoMode) {
      holdTimer.current = setTimeout(() => {
        if (!press.current || press.current.swiping) return;
        press.current.holding = true;
        startOrResume('hold');
      }, HOLD_MS);
    }
  };
  const onShutterMove = (e) => {
    const p = press.current;
    if (!p) return;
    if (!p.holding && filtersOn) {                  // geser ke samping = ganti filter
      const dx = e.clientX - p.x;
      if (!p.swiping && Math.abs(dx) > 12) { p.swiping = true; clearTimeout(holdTimer.current); }
      if (p.swiping) { pickFilter(p.i0 - Math.round(dx / FILTER_DRAG)); return; }
    }
    if (!p.holding) return;
    // Geser ke atas setengah layar = zoom maksimum
    const dy = p.y - e.clientY;
    applyZoom(p.z0 * MAX_ZOOM ** (dy / (window.innerHeight * 0.5)));
  };
  const onShutterUp = () => {
    clearTimeout(holdTimer.current);
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (p.swiping) return;                          // tadi menggeser filter, bukan mengetuk
    if (p.holding) { pauseRec(); return; }          // ditahan: lepas = jeda
    if (isVideoMode) { startOrResume('free'); return; }
    snap();
  };

  // ── Gestur layar: cubit = zoom, ketuk dua kali = ganti kamera ──
  const onStageDown = (e) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z0: zoomRef.current };
    }
  };
  const onStageMove = (e) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      applyZoom(pinch.current.z0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d));
    }
  };
  const onStageUp = (e) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) pinch.current = null;
    if (ptrs.current.size === 0 && e.type === 'pointerup' && !collageActive && !session) {
      const t = Date.now();
      if (t - stageTap.current < 300) { stageTap.current = 0; flip(); } else stageTap.current = t;
    }
  };

  // ── Cincin shutter: tiap klip = satu busur merah berujung bulat, dipisah celah putih ──
  const arcs = [];
  {
    let acc = 0;
    segDurs.forEach((d) => { arcs.push([acc, d]); acc += d; });
    if (rec) arcs.push([acc, Math.max(0, sec - acc)]);
  }
  const flashLabel = flashMode === 'on' ? 'nyala' : flashMode === 'auto' ? 'otomatis' : 'mati';
  const toggleRatio = () => { if (kind !== 'dm' && !session) setTall((t) => !t); };
  const chooseCapture = (key) => {
    if (session || countdown > 0) return;
    setCaptureMode(key);
    setTimerOpen(false); setCollageOpen(false); setCellMenu(null);
  };
  const finishText = () => {
    const t = storyText.trim();
    if (!t) { toast('Tulis sesuatu dulu'); return; }
    onText?.({ text: t, bg: storyBg });
  };

  const modeList = photoOnly ? [] : CAPTURE_MODES.filter((m) => m.key !== 'text' || onText);
  const hide = countdown > 0 ? styles.hideCount : '';
  const renderModes = (extra = '') => modeList.length > 0 && (
    <ModeScroller items={modeList} value={captureMode} onChange={chooseCapture} disabled={session || countdown > 0} className={`${extra} ${hide}`} />
  );
  const KindIcon = kindFx?.k === 'story' ? Sparkles : GalleryVerticalEnd;

  return createPortal(
    <div className={`${styles.cam} ${tall && kind !== 'dm' ? styles.camTall : ''} ${sidebarExpanded ? styles.camExpanded : ''}`} style={{ '--cam-a': aspect }} role="dialog" aria-label="Kamera">
      {screenLight && <div className={styles.screenLight} aria-hidden="true" />}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; fillFromGallery(f); }} />

      <div className={`${styles.ui} ${isText ? styles.uiAway : ''}`}>
        <div ref={frameRef} className={`${styles.frame} ${collageActive ? styles.frameCollage : ''} ${kindFx ? styles.frameSwap : ''}`}
          onPointerDown={onStageDown} onPointerMove={onStageMove} onPointerUp={onStageUp} onPointerCancel={onStageUp}>
          <video ref={videoRef} className={`${styles.video} ${collageActive ? styles.videoHidden : ''}`} playsInline muted autoPlay
            onLoadedMetadata={() => setReady(true)}
            style={{ transform: `${front ? 'scaleX(-1) ' : ''}scale(${hwZoom.current ? 1 : zoom})`, filter: filter.css }} />
          {!ready && !error && <div className={styles.center}><Loader2 size={30} className="spin" /></div>}
          {error && (
            <div className={styles.center}>
              <p>{error}</p>
              <div className={styles.errBtns}>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => setAttempt((n) => n + 1)}>Coba lagi</button>
                {onGallery && <button type="button" className="btn btn-primary btn-sm" onClick={() => onGallery(kind)}>Pilih dari galeri</button>}
              </div>
            </div>
          )}

          {collageActive && layout && (
            <div className={styles.cells} aria-label="Kolase">
              {layout.slots.map((s, i) => {
                const c = cells[i];
                return (
                  <div key={i} className={`${styles.cell} ${dragIdx === i ? styles.cellDrag : ''}`}
                    style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%`, height: `${s.h * 100}%` }}>
                    <div className={`${styles.cellIn} ${i === activeIdx ? styles.cellActive : ''}`} role="button" tabIndex={0} aria-label={`Sel kolase ${i + 1}${c ? ' terisi' : ' kosong'}`}
                      onPointerDown={c ? (e) => cellDown(e, i) : undefined} onPointerMove={c ? cellMove : undefined}
                      onPointerUp={c ? cellUp : undefined} onPointerCancel={c ? cellUp : undefined}
                      onClick={c ? undefined : () => setCellMenu(i)}>
                      {c
                        ? <img src={c.url} alt="" draggable={false} style={{ objectPosition: `${c.ax * 100}% ${c.ay * 100}%` }} />
                        : <LiveCell stream={stream} mirror={front} scale={hwZoom.current ? 1 : zoom} />}
                    </div>
                  </div>
                );
              })}
              {ghost && <img className={styles.ghost} src={ghost.url} alt="" draggable={false} style={{ left: ghost.left, top: ghost.top, width: ghost.w, height: ghost.h }} />}
              {cellMenu !== null && layout.slots[cellMenu] && (
                <>
                  <div className={styles.cellMenuBack} onClick={() => setCellMenu(null)} />
                  <div className={styles.cellMenu} role="menu" aria-label="Isi sel dari"
                    style={{ left: `clamp(104px, ${(layout.slots[cellMenu].x + layout.slots[cellMenu].w / 2) * 100}%, calc(100% - 104px))`, top: `${(layout.slots[cellMenu].y + layout.slots[cellMenu].h / 2) * 100}%` }}>
                    <button type="button" role="menuitem" onClick={() => menuPick('camera')}><CameraIcon size={17} />Kamera</button>
                    <button type="button" role="menuitem" onClick={() => menuPick('gallery')}><ImagePlus size={17} />Galeri</button>
                  </div>
                </>
              )}
            </div>
          )}
          {flashFx && <div className={styles.flash} />}
        </div>
        {zoom > 1.05 && <span className={styles.zoomTag}>{zoom.toFixed(1)}×</span>}
        {filterName && <span key={filterName.id} className={styles.filterName}>{filterName.t}</span>}
        {countdown > 0 && (
          <div className={styles.countBox}>
            <span className={styles.countdown} key={countdown}>{countdown}</span>
            <button type="button" className={styles.cancelCount} onClick={cancelCountdown}>BATAL</button>
          </div>
        )}

        <button type="button" className={`${styles.railBtn} ${styles.closeBtn}`} onClick={discardAndClose} aria-label="Tutup kamera"><X size={20} /></button>
        {session && !merging && (
          <button type="button" className={styles.doneBtn} onClick={finishRec} aria-label="Selesai merekam"><Check size={15} strokeWidth={3} /><span>Selesai</span></button>
        )}

        {!photoOnly && (
          <div className={`${styles.soundPill} ${session ? styles.soundOff : ''}`}>
            <button type="button" className={styles.soundMain} onClick={() => !session && setMusicOpen(true)} disabled={session} aria-label={music ? `Musik: ${music.title}. Ketuk untuk mengganti` : 'Tambahkan Musik'}>
              <Music size={16} /> <span>{music ? music.title : 'Tambahkan Musik'}</span>
            </button>
            {music && !session && <button type="button" className={styles.soundX} onClick={() => setMusic(null)} aria-label="Hapus musik"><X size={14} /></button>}
          </div>
        )}
        {noMic && isVideoMode && !session && <span className={styles.micOff}><MicOff size={13} /> Video tanpa suara</span>}

        <aside className={`${styles.toolRail} ${sidebarExpanded ? styles.toolRailExpanded : ''}`} aria-label="Alat kamera">
          <button type="button" className={styles.railBtn} onClick={flip} disabled={session} aria-label="Ganti kamera depan atau belakang">
            <RefreshCw size={20} /><small>Balik kamera</small>
          </button>
          <button type="button" className={`${styles.railBtn} ${flashMode !== 'off' ? styles.railBtnOn : ''}`} onClick={cycleFlash} aria-label={`Flash: ${flashLabel}`}>
            {flashMode === 'off' ? <ZapOff size={21} /> : <span className={styles.flashIcon}><Zap size={21} />{flashMode === 'auto' && <b>A</b>}</span>}
            <small>Flash {flashLabel}</small>
          </button>
          <i className={styles.railDivider} />

          <div className={styles.railItem}>
            <button type="button" className={`${styles.railBtn} ${timer ? styles.railBtnOn : ''}`} onClick={() => { setTimerOpen((v) => !v); setCollageOpen(false); }} aria-expanded={timerOpen} aria-label="Pengatur waktu">
              <Timer size={21} />{timer > 0 && <em className={styles.badge}>{timer}</em>}
              <small>Pengatur waktu</small>
            </button>
            {timerOpen && (
              <div className={styles.flyout} role="radiogroup" aria-label="Durasi timer">
                {[0, 3, 5, 10].map((value) => (
                  <button key={value} type="button" role="radio" aria-checked={timer === value} aria-label={value ? `${value} detik` : 'Timer mati'} className={timer === value ? styles.flyOn : ''} onClick={() => { setTimer(value); setTimerOpen(false); }}>
                    {value === 0 ? <Ban size={17} /> : <>{value}<small>dtk</small></>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.railItem}>
            <button type="button" className={`${styles.railBtn} ${collage !== 'off' ? styles.railBtnOn : ''}`} onClick={() => { setCollageOpen((v) => !v); setTimerOpen(false); }} disabled={session} aria-expanded={collageOpen} aria-label="Tata letak kolase">
              {collage === 'off' ? <Grid2X2 size={21} /> : <LayoutGlyph slots={COLLAGE_LAYOUTS[collage].slots} />}
              {collage !== 'off' && filled > 0 && <em className={styles.badge}>{filled}/{COLLAGE_LAYOUTS[collage].slots.length}</em>}
              <small>Tata letak</small>
            </button>
            {collageOpen && (
              <div className={`${styles.flyout} ${styles.flyGrid}`} role="radiogroup" aria-label="Tata letak kolase">
                <button type="button" role="radio" aria-checked={collage === 'off'} aria-label="Kolase mati" className={collage === 'off' ? styles.flyOn : ''} onClick={() => chooseCollage('off')}><Ban size={17} /></button>
                {COLLAGE_ORDER.map((key) => (
                  <button key={key} type="button" role="radio" aria-checked={collage === key} aria-label={COLLAGE_LAYOUTS[key].label} className={collage === key ? styles.flyOn : ''} onClick={() => chooseCollage(key)}>
                    <LayoutGlyph slots={COLLAGE_LAYOUTS[key].slots} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="button" className={styles.railBtn} onClick={toggleRatio} disabled={kind === 'dm' || session} aria-label={tall ? 'Perkecil rasio ke 3:4' : 'Perbesar rasio ke 9:16'}>
            {tall ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            <small>Rasio {tall ? '9:16' : '3:4'}</small>
          </button>

          <button type="button" className={`${styles.railBtn} ${styles.railMore} ${teleprompter ? styles.railBtnOn : ''}`} onClick={() => setTeleprompter((v) => !v)} aria-pressed={teleprompter} aria-hidden={!sidebarExpanded} tabIndex={sidebarExpanded ? 0 : -1} aria-label="Teleprompter">
            <ScrollText size={21} /><small>Teleprompter</small>
          </button>
          <button type="button" className={styles.railBtn} onClick={() => setSidebarExpanded((v) => !v)} aria-expanded={sidebarExpanded} aria-label={sidebarExpanded ? 'Ciutkan alat' : 'Tampilkan semua alat'}>
            <ChevronDown size={20} className={styles.chev} />
          </button>
        </aside>

        {/* Bar mode (dalam preview): saat merekam diganti indikator durasi */}
        {session
          ? (
            <div className={styles.status} role="status">
              <i className={paused ? styles.paused : ''} />
              <b>{paused ? 'Dijeda' : 'Merekam'}</b>
              <span>{fmt(sec)} / {fmt(limit)}</span>
              {segDurs.length > 0 && <em>{segDurs.length} klip</em>}
            </div>
          )
          : renderModes()}

        {/* Filter: geser shutter atau deretan lingkaran; hilang saat merekam */}
        <div className={`${styles.filters} ${filtersOn ? '' : styles.filtersOff}`} onPointerDown={stripDown} aria-label="Filter" aria-hidden={!filtersOn}>
          <div className={styles.filterTrack} style={{ transform: `translateX(${-filterIdx * FILTER_W}px)` }}>
            {FILTER_UI.map((f, i) => (
              <button key={f.key} type="button" tabIndex={filtersOn ? 0 : -1} className={`${styles.fcircle} ${i === filterIdx ? styles.fOn : ''}`}
                onClick={() => { if (!stripMoved.current) pickFilter(i); }} aria-label={`Filter ${f.label}`} aria-pressed={i === filterIdx}>
                <i style={{ filter: f.css }} />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.shutterRow}>
          {collageFull ? (
            <button type="button" className={styles.continueBtn} onClick={finishCollage} disabled={busy} aria-label="Lanjutkan dengan kolase ini">
              {busy ? <Loader2 size={30} className="spin" /> : <ArrowRight size={34} strokeWidth={2.6} />}
            </button>
          ) : (
            <button type="button" className={`${styles.shutter} ${rec ? styles.recording : ''}`} aria-label={isVideoMode ? (rec ? 'Jeda rekaman' : paused ? 'Lanjutkan rekaman' : `Rekam video ${activeCapture.label}`) : 'Ambil foto'}
              onPointerDown={onShutterDown} onPointerMove={onShutterMove} onPointerUp={onShutterUp} onPointerCancel={onShutterUp}
              onContextMenu={(e) => e.preventDefault()} disabled={!ready && !error}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="46" className={styles.track} />
                {arcs.map(([start, d], i) => {
                  const a0 = (start / limit) * RING + 4.5;                       // celah putih 1,5 + tutup bulat 3
                  const len = Math.max(0.01, (d / limit) * RING - 9);
                  return <circle key={i} cx="50" cy="50" r="46" className={styles.progress} strokeDasharray={`${len} ${RING}`} strokeDashoffset={-a0} />;
                })}
              </svg>
              <span className={`${styles.core} ${isVideoMode ? styles.coreVideo : ''}`} />
            </button>
          )}
        </div>
        {isVideoMode && paused && !rec && segDurs.length > 0 && !merging && (
          <button type="button" className={styles.segUndo} onClick={undoSegment} aria-label="Hapus rekaman terakhir"><Undo2 size={22} /></button>
        )}

        {/* Baris bawah: galeri · Cerita/Postingan · (ulangi kolase) */}
        {onGallery && !session && (
          <button type="button" className={styles.galleryFloat} onClick={() => onGallery(kind)} aria-label="Pilih dari galeri"><Images size={23} /></button>
        )}
        {hasKinds && !isText && (
          <ModeScroller items={KINDS} value={kind} onChange={chooseKind} disabled={session || countdown > 0} label="Jenis unggahan" className={`${styles.kinds} ${session ? styles.kindsOff : ''} ${hide}`} />
        )}
        {collageActive && filled > 0 && !session && (
          <button type="button" className={styles.undoFloat} onClick={undoCell} aria-label="Ulangi foto sebelumnya"><Undo2 size={23} /></button>
        )}
      </div>

      {kindFx && (
        <div key={kindFx.id} className={`${styles.kindFx} ${kindFx.k === 'story' ? styles.fxStory : styles.fxPost}`} role="status" aria-live="polite">
          <div className={styles.fxCard}>
            <span className={styles.fxSpin}><Loader2 size={30} className="spin" /></span>
            <span className={styles.fxIcon}><KindIcon size={30} /></span>
            <b>Buat {kindFx.k === 'story' ? 'Cerita' : 'Postingan'}</b>
            <small>{kindFx.k === 'story' ? 'Layar penuh 9:16 · hilang dalam 24 jam' : 'Rasio 3:4 · tampil di profilmu'}</small>
          </div>
        </div>
      )}

      {merging && (
        <div className={styles.mergeLayer} role="status" aria-live="polite">
          <div className={styles.mergeCard}>
            <Loader2 size={26} className="spin" />
            <b>Menyatukan rekaman…</b>
            <i><u style={{ width: `${Math.round(merging.p * 100)}%` }} /></i>
            <small>{Math.round(merging.p * 100)}% · jangan tutup layar ini</small>
          </div>
        </div>
      )}

      {onText && (
        <TextPage active={isText} text={storyText} setText={setStoryText} bg={storyBg} setBg={setStoryBg}
          onBack={() => chooseCapture('photo')} onDone={finishText} modeBar={renderModes(styles.modesText)} />
      )}

      {teleprompter && !isText && (
        <TeleprompterCard position={telePos} setPosition={setTelePos} script={script} onOpen={() => setScriptOpen(true)} onClose={() => setTeleprompter(false)}
          prefs={telePrefs} setPrefs={setTelePrefs} running={!!rec} resetKey={teleRun} />
      )}
      {scriptOpen && (
        <div className={styles.scriptLayer} role="dialog" aria-label="Skrip teleprompter">
          <button type="button" className={styles.scriptClose} onClick={() => setScriptOpen(false)} aria-label="Tutup tanpa menyimpan"><X size={24} /></button>
          <button type="button" className={styles.scriptDone} onClick={() => setScriptOpen(false)} aria-label="Simpan skrip"><Check size={24} /></button>
          <textarea autoFocus value={script} onChange={(e) => setScript(e.target.value)} placeholder="Ketuk untuk menambahkan Skripmu sendiri." />
        </div>
      )}
      {musicOpen && <MusicSheet current={music} onPick={(m) => { setMusic(m); setMusicOpen(false); }} onClose={() => setMusicOpen(false)} />}
    </div>,
    document.body
  );
}

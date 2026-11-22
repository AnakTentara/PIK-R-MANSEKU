import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  X, Crop, Sparkles, SlidersHorizontal, Type, RotateCw, FlipHorizontal2, Loader2, Trash2,
  ChevronLeft, ChevronRight, Volume2, VolumeX, Maximize2, Minimize2, Plus,
  Sun, Contrast, Flame, Eye, CircleDot, CircleDashed, LayoutGrid,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Edit3, Scaling, Square, Box, Layers, CircleSlash
} from 'lucide-react';
import { ADJUST, FILTERS, TEXT_COLORS, emptyEdit, loadImage, renderPhoto, exportPhoto, clampPan, downscale, naturalAspect, clampAspect } from '@/lib/photo.js';
import { useBackClose } from '@/lib/back.js';
import { stopMusic } from '@/lib/music.js';
import CameraLensRuler from './CameraLensRuler.jsx';
import CollageModal from './CollageModal.jsx';
import styles from './MediaEditor.module.css';

/** Pilihan rasio. 'free' = rasio asli foto (dibatasi 9:16 … 16:9). */
const RATIOS = {
  post: [['free', 'Asli'], [1, '1:1'], [4 / 5, '4:5'], [3 / 4, '3:4'], [16 / 9, '16:9'], [9 / 16, '9:16']],
  dm: [['free', 'Asli'], [1, '1:1'], [3 / 4, '3:4'], [9 / 16, '9:16']],
  story: []
};
const DEFAULT_RATIO = { post: 'free', dm: 'free', story: 9 / 16 };
const EXPORT_LONG = { post: 1440, story: 1920, dm: 1600 };

const ADJUST_ICONS = {
  brightness: Sun,
  contrast: Contrast,
  saturation: Flame,
  warmth: Sparkles,
  fade: CircleDashed,
  vignette: CircleDot,
};

const BG_STYLES = [
  { key: 'none', label: 'Tanpa latar' },
  { key: 'box', label: 'Kotak' },
  { key: 'rounded', label: 'Rounded' },
  { key: 'semi', label: 'Semi trans' },
];

/**
 * Penyunting foto/video untuk Postingan, Cerita, dan Pesan.
 * - Penggeser lensa kamera profesional (CameraLensRuler)
 * - Tombol bubble untuk Atur dengan klik ganda / klik ulang untuk reset
 * - Tombol Tambah Teks melayang di atas foto pratinjau (langsung klik)
 * - Teks yang bisa digeser, diputar, diskala (rotasi & perbesar)
 * - Latar fleksibel (kotak, rounded, semi transparan, tanpa latar)
 * - Efek teks bersinar, tebal, miring, garis bawah, paragraf & perataan teks
 * - Dukungan Kolase Foto (Collage Layout)
 */
export default function MediaEditor({ items: initial, target = 'post', doneLabel = 'Lanjut', footerExtra = null, onDone, onCancel, busy = false }) {
  // Filter yang dipilih di kamera (geser shutter) dibawa sebagai filter awal; bisa diganti di sini
  const [items, setItems] = useState(() => initial.map((it) => {
    const edit = emptyEdit(target === 'story' ? 'contain' : 'cover');
    if (it.filter && FILTERS.some((f) => f.key === it.filter)) edit.filter = it.filter;
    return { ...it, edit };
  }));
  const [idx, setIdx] = useState(0);
  const [ratio, setRatio] = useState(DEFAULT_RATIO[target]);
  const [tool, setTool] = useState(target === 'story' ? 'filter' : 'crop');
  const [adjKey, setAdjKey] = useState('brightness');
  const [images, setImages] = useState({});        // url → { full, small }
  const [textEdit, setTextEdit] = useState(null);  // { i, draft } i = -1 baru
  const [selectedTextIdx, setSelectedTextIdx] = useState(null);
  const [textSubTool, setTextSubTool] = useState(null); // 'size' | null
  const [exporting, setExporting] = useState(false);
  const [muted, setMuted] = useState(true);
  const [collageOpen, setCollageOpen] = useState(false);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [box, setBox] = useState({ w: 300, h: 400 });
  const gesture = useRef(null);
  const ptrs = useRef(new Map());
  useBackClose(true, onCancel);
  // Musik dari kamera terus berbunyi selama penyunting terbuka, berhenti saat ditutup
  useEffect(() => () => stopMusic(), []);

  const cur = items[idx];
  const img = cur && !cur.video ? images[cur.url] : null;
  const st = cur?.edit;

  // Muat semua foto
  useEffect(() => {
    let alive = true;
    for (const it of items) {
      if (it.video || images[it.url]) continue;
      loadImage(it.url).then((full) => alive && setImages((m) => ({ ...m, [it.url]: { full, small: downscale(full, 1280) } })))
        .catch(() => toast.error('Foto tidak bisa dibuka'));
    }
    return () => { alive = false; };
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rasio aktif
  const aspect = (() => {
    if (target === 'story') return 9 / 16;
    if (ratio !== 'free') return ratio;
    if (img) return clampAspect(naturalAspect(img.full, st.rot));
    if (cur?.w && cur?.h) return clampAspect(cur.w / cur.h);
    return 3 / 4;
  })();

  // Ukuran pratinjau mengikuti ruang yang tersedia
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const measure = () => {
      const W = el.clientWidth - 24;
      const H = el.clientHeight - 24;
      const w = Math.min(W, H * aspect);
      setBox({ w: Math.max(120, Math.floor(w)), h: Math.max(120, Math.floor(w / aspect)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  // Gambar pratinjau
  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const id = requestAnimationFrame(() => renderPhoto(canvasRef.current, img.small, st, box.w * dpr, box.h * dpr, { withText: false }));
    return () => cancelAnimationFrame(id);
  }, [img, st, box]);

  const patch = useCallback((p, all = false) => {
    setItems((list) => list.map((it, i) => {
      if (!all && i !== idx) return it;
      if (it.video) return it;
      const next = { ...it.edit, ...(typeof p === 'function' ? p(it.edit) : p) };
      const im = images[it.url];
      return { ...it, edit: im ? clampPan(im.full, next, aspect) : next };
    }));
  }, [idx, images, aspect]);

  // ── Geser & cubit foto di bingkai ──
  const onDown = (e) => {
    if (!img) return;
    if (e.target.closest(`.${styles.textItem}`)) return; // Jangan drag foto saat klik teks
    e.currentTarget.setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...ptrs.current.values()];
    gesture.current = pts.length === 2
      ? { pinch: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), z0: st.zoom }
      : { x: e.clientX, y: e.clientY, px: st.px, py: st.py };
    setSelectedTextIdx(null);
  };
  const onMove = (e) => {
    if (!gesture.current || !ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = [...ptrs.current.values()];
    if (g.pinch && pts.length === 2) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      patch({ zoom: Math.min(5, Math.max(1, g.z0 * (d / g.pinch))) });
    } else if (!g.pinch) {
      patch({ px: g.px + (e.clientX - g.x) / box.w, py: g.py + (e.clientY - g.y) / box.h });
    }
  };
  const onUp = (e) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) gesture.current = null;
  };
  const onWheel = (e) => { if (img) patch({ zoom: Math.min(5, Math.max(1, st.zoom * (e.deltaY < 0 ? 1.08 : 0.93))) }); };

  // ── Drag & Manipulasi Teks ──
  const activeHandle = useRef(null); // { type: 'scale' | 'rotate', i, ... }
  const textPointers = useRef(new Map()); // pointerId -> { x, y }
  const textGesture = useRef(null); // { type: 'drag' | 'pinch', ... }
  const lastTapRef = useRef({ time: 0, i: null });

  // 1. Geser (Drag 1 jari) & Cubit (Pinch 2 jari) langsung pada teks
  const onTextPointerDown = (e, i) => {
    e.stopPropagation();
    setSelectedTextIdx(i);
    setTool('text');
    e.currentTarget.setPointerCapture?.(e.pointerId);

    textPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...textPointers.current.values()];
    const t = st.texts[i];

    if (pts.length === 2) {
      // 2 Jari: Cubit / Putar langsung
      const initDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const initAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) * (180 / Math.PI);
      textGesture.current = {
        type: 'pinch',
        i,
        initDist: Math.max(initDist, 10),
        initAngle,
        initScale: t.scale || 1,
        initRot: t.rot || 0,
        moved: true
      };
    } else {
      // 1 Jari: Geser posisi teks
      textGesture.current = {
        type: 'drag',
        i,
        startX: e.clientX,
        startY: e.clientY,
        initX: t.x,
        initY: t.y,
        moved: false
      };
    }
  };

  const onTextPointerMove = (e) => {
    if (!textPointers.current.has(e.pointerId)) return;
    textPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = textGesture.current;
    if (!g) return;

    const pts = [...textPointers.current.values()];

    if (g.type === 'pinch' && pts.length === 2) {
      const curDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const curAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) * (180 / Math.PI);
      const scaleFactor = curDist / g.initDist;
      const nextScale = Math.min(4.0, Math.max(0.4, Number((g.initScale * scaleFactor).toFixed(2))));
      const angleDiff = curAngle - g.initAngle;
      let nextRot = Math.round(g.initRot + angleDiff);
      nextRot = ((nextRot % 360) + 360) % 360;
      for (const snap of [0, 90, 180, 270, 360]) {
        if (Math.abs(nextRot - snap) < 4) { nextRot = snap % 360; break; }
      }
      patch((s) => ({
        texts: s.texts.map((item, n) => (n === g.i ? { ...item, scale: nextScale, rot: nextRot } : item))
      }));
    } else if (g.type === 'drag') {
      const dx = (e.clientX - g.startX) / box.w;
      const dy = (e.clientY - g.startY) / box.h;
      if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 4) {
        g.moved = true;
      }
      patch((s) => ({
        texts: s.texts.map((t, n) => (n === g.i ? {
          ...t,
          x: Math.min(0.95, Math.max(0.05, g.initX + dx)),
          y: Math.min(0.95, Math.max(0.05, g.initY + dy))
        } : t))
      }));
    }
  };

  const onTextPointerUp = (e) => {
    textPointers.current.delete(e.pointerId);
    const g = textGesture.current;
    if (textPointers.current.size === 0) {
      textGesture.current = null;
      if (g && g.type === 'drag' && !g.moved) {
        // Tap biasa (bukan drag): cek double tap vs single tap
        const now = Date.now();
        const last = lastTapRef.current;
        if (last.i === g.i && now - last.time < 350) {
          setTextEdit({ i: g.i, draft: { ...st.texts[g.i] } });
          lastTapRef.current = { time: 0, i: null };
        } else {
          lastTapRef.current = { time: now, i: g.i };
        }
      }
    }
  };

  // 2. Handle Skala Teks (Perbesaran Radial Presisi)
  const onScaleHandleDown = (e, i) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const itemEl = e.currentTarget.closest(`.${styles.textItem}`);
    if (!itemEl) return;
    const rect = itemEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const initScale = st.texts[i]?.scale || 1;

    activeHandle.current = {
      type: 'scale',
      i,
      cx,
      cy,
      startDist: Math.max(startDist, 10),
      initScale
    };
  };

  const onScaleHandleMove = (e) => {
    const h = activeHandle.current;
    if (!h || h.type !== 'scale') return;
    const curDist = Math.hypot(e.clientX - h.cx, e.clientY - h.cy);
    const factor = curDist / h.startDist;
    const nextScale = Math.min(4.0, Math.max(0.4, Number((h.initScale * factor).toFixed(2))));
    patch((s) => ({
      texts: s.texts.map((item, n) => (n === h.i ? { ...item, scale: nextScale } : item))
    }));
  };

  const onScaleHandleUp = () => {
    if (activeHandle.current?.type === 'scale') {
      activeHandle.current = null;
    }
  };

  // 3. Handle Rotasi Teks (Putar Halus & Snap Otomatis)
  const onRotateHandleDown = (e, i) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const itemEl = e.currentTarget.closest(`.${styles.textItem}`);
    if (!itemEl) return;
    const rect = itemEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    const initRot = st.texts[i]?.rot || 0;

    activeHandle.current = {
      type: 'rotate',
      i,
      cx,
      cy,
      startAngle,
      initRot
    };
  };

  const onRotateHandleMove = (e) => {
    const h = activeHandle.current;
    if (!h || h.type !== 'rotate') return;
    const curAngle = Math.atan2(e.clientY - h.cy, e.clientX - h.cx) * (180 / Math.PI);
    const angleDiff = curAngle - h.startAngle;
    let nextRot = Math.round(h.initRot + angleDiff);
    nextRot = ((nextRot % 360) + 360) % 360;
    for (const snap of [0, 90, 180, 270, 360]) {
      if (Math.abs(nextRot - snap) < 4) { nextRot = snap % 360; break; }
    }
    patch((s) => ({
      texts: s.texts.map((item, n) => (n === h.i ? { ...item, rot: nextRot } : item))
    }));
  };

  const onRotateHandleUp = () => {
    if (activeHandle.current?.type === 'rotate') {
      activeHandle.current = null;
    }
  };

  // ── Tambah Teks Baru ──
  const openNewText = () => {
    setTextEdit({
      i: -1,
      draft: {
        text: '',
        x: 0.5,
        y: 0.4,
        size: 0.07,
        scale: 1,
        rot: 0,
        color: '#ffffff',
        bgStyle: 'none',
        bold: true,
        italic: false,
        underline: false,
        glow: false,
        align: 'center',
      }
    });
  };

  const saveText = () => {
    const { i, draft } = textEdit;
    setTextEdit(null);
    if (!draft.text.trim()) {
      if (i >= 0) patch((s) => ({ texts: s.texts.filter((_, n) => n !== i) }));
      setSelectedTextIdx(null);
      return;
    }
    if (i >= 0) {
      patch((s) => ({ texts: s.texts.map((t, n) => (n === i ? draft : t)) }));
      setSelectedTextIdx(i);
    } else {
      const nextIdx = st.texts.length;
      patch((s) => ({ texts: [...s.texts, draft] }));
      setSelectedTextIdx(nextIdx);
    }
    setTool('text');
  };

  const patchSelectedText = (patchObj) => {
    if (selectedTextIdx === null) return;
    patch((s) => ({
      texts: s.texts.map((t, idx) => (idx === selectedTextIdx ? { ...t, ...patchObj } : t))
    }));
  };

  const handleTextSizeToggle = () => {
    if (textSubTool === 'size') {
      // Ketuk lagi saat bubble aktif: reset ukuran/scale teks terpilih ke 1.0!
      patchSelectedText({ scale: 1 });
      setTextSubTool(null);
      toast.success('Ukuran teks direset ke normal');
    } else {
      setTextSubTool('size');
    }
  };

  const deleteText = (i) => {
    patch((s) => ({ texts: s.texts.filter((_, n) => n !== i) }));
    setSelectedTextIdx(null);
    setTextSubTool(null);
  };

  // ── Penyesuaian Bubble "Atur" ──
  const handleBubbleClick = (key) => {
    if (adjKey === key) {
      // Klik lagi pada bubble yang aktif → Reset nilai pilihan ini ke 0!
      patch((s) => ({ adj: { ...s.adj, [key]: 0 } }));
      toast.success(`${ADJUST.find((a) => a.key === key)?.label} direset`);
    } else {
      setAdjKey(key);
    }
  };

  const finish = async () => {
    if (exporting || busy) return;
    setExporting(true);
    try {
      const out = [];
      for (const it of items) {
        if (it.video) { out.push({ file: it.file, url: it.url, video: true, w: it.w, h: it.h }); continue; }
        const im = images[it.url] || { full: await loadImage(it.url) };
        const a = target === 'story' ? 9 / 16 : ratio === 'free' ? clampAspect(naturalAspect(im.full, it.edit.rot)) : ratio;
        const untouched = it.edit.rot === 0 && !it.edit.flip && it.edit.zoom === 1 && !it.edit.px && !it.edit.py
          && it.edit.filter === 'none' && !Object.values(it.edit.adj).some(Boolean) && !it.edit.texts.length;
        if (untouched && target !== 'story' && ratio === 'free' && Math.abs(a - naturalAspect(im.full)) < 0.01) {
          out.push({ file: it.file, url: it.url, video: false, w: im.full.naturalWidth, h: im.full.naturalHeight });
          continue;
        }
        const { file, w, h } = await exportPhoto(im.full, it.edit, a, EXPORT_LONG[target]);
        out.push({ file, url: URL.createObjectURL(file), video: false, w, h });
      }
      await onDone(out, { aspect });
    } catch (err) {
      toast.error(err?.message || 'Gagal memproses foto');
    } finally {
      setExporting(false);
    }
  };

  const remove = () => {
    if (items.length === 1) { onCancel(); return; }
    setItems((l) => l.filter((_, i) => i !== idx));
    setIdx((i) => Math.max(0, i - 1));
  };

  // Terima hasil kolase
  const handleCollageDone = (collageItem) => {
    setItems((curItems) => [collageItem, ...curItems]);
    setIdx(0);
    setCollageOpen(false);
  };

  const tools = cur?.video ? [] : [
    target !== 'story' && ['crop', 'Potong', Crop],
    ['filter', 'Filter', Sparkles],
    ['adjust', 'Atur', SlidersHorizontal],
    ['text', 'Teks', Type]
  ].filter(Boolean);
  const adjDef = ADJUST.find((a) => a.key === adjKey) || ADJUST[0];

  return createPortal(
    <div className={styles.editor} role="dialog" aria-label="Sunting media">
      {/* Header */}
      <header className={styles.head}>
        <button type="button" className={styles.iconBtn} onClick={onCancel} aria-label="Batal"><X size={24} /></button>
        <b>{target === 'story' ? 'Sunting cerita' : target === 'dm' ? 'Kirim foto' : 'Sunting'}</b>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Tombol Kolase */}
          {target === 'post' && !cur?.video && (
            <button
              type="button"
              className={styles.collageBtn}
              onClick={() => setCollageOpen(true)}
              title="Buat Kolase Foto"
            >
              <LayoutGrid size={16} />
              <span>Kolase</span>
            </button>
          )}
          <button type="button" className={styles.done} onClick={finish} disabled={exporting || busy || !items.length}>
            {exporting || busy ? <Loader2 size={18} className="spin" /> : doneLabel}
          </button>
        </div>
      </header>

      {/* Area Panggung Foto */}
      <div className={styles.stage} ref={stageRef}>
        {cur && (
          <div
            className={styles.frame}
            style={{ width: box.w, height: box.h, borderRadius: target === 'story' ? 18 : 6 }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onWheel={onWheel}
          >
            {/* Tombol Tambah Teks Melayang Di Atas Pratinjau */}
            {!cur.video && (
              <button
                type="button"
                className={styles.addTextFloating}
                onClick={(e) => { e.stopPropagation(); openNewText(); }}
              >
                <Plus size={14} /> Tambah Teks
              </button>
            )}

            {cur.video ? (
              <>
                <video key={cur.url} src={cur.url} className={styles.video} playsInline autoPlay loop muted={muted} />
                <button type="button" className={styles.mute} onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Bunyikan' : 'Bisukan'}>
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </>
            ) : img ? (
              <canvas ref={canvasRef} className={styles.canvas} />
            ) : (
              <div className={styles.loading}><Loader2 size={26} className="spin" /></div>
            )}

            {/* Render Teks Interaktif */}
            {!cur.video && st.texts.map((t, i) => {
              const isSelected = selectedTextIdx === i;
              const bgClass =
                t.bgStyle === 'box' ? styles.textBgBox :
                t.bgStyle === 'rounded' ? styles.textBgRounded :
                t.bgStyle === 'semi' ? styles.textBgSemi : '';
              const fontSize = (t.size || 0.07) * box.w;
              const padX = Math.round(fontSize * 0.45);
              const padY = Math.round(fontSize * 0.28);
              const radius = t.bgStyle === 'box' ? 0 : Math.min(Math.round(fontSize * 0.35), 18);

              return (
                <div
                  key={i}
                  className={`${styles.textItem} ${isSelected ? styles.textItemSelected : ''}`}
                  style={{
                    left: `${t.x * 100}%`,
                    top: `${t.y * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${t.rot || 0}deg) scale(${t.scale || 1})`,
                    maxWidth: `${Math.round(box.w * 0.84)}px`,
                  }}
                  onPointerDown={(e) => onTextPointerDown(e, i)}
                  onPointerMove={onTextPointerMove}
                  onPointerUp={onTextPointerUp}
                  onPointerCancel={onTextPointerUp}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setTextEdit({ i, draft: { ...st.texts[i] } });
                  }}
                >
                  <span
                    className={`${styles.textContent} ${bgClass}`}
                    style={{
                      fontSize,
                      color: (t.bgStyle === 'rounded' || t.bgStyle === 'box') ? (inkOn(t.color || '#fff')) : (t.color || '#fff'),
                      backgroundColor: (t.bgStyle === 'rounded' || t.bgStyle === 'box') ? t.color : undefined,
                      fontWeight: t.bold !== false ? 800 : 400,
                      fontStyle: t.italic ? 'italic' : 'normal',
                      textDecoration: t.underline ? 'underline' : 'none',
                      textAlign: t.align || 'center',
                      display: 'inline-block',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      padding: `${padY}px ${padX}px`,
                      borderRadius: radius,
                      textShadow: t.glow
                        ? `0 0 16px ${t.color || '#fff'}, 0 0 30px ${t.color || '#fff'}`
                        : t.bgStyle === 'none'
                        ? '0 2px 8px rgba(0, 0, 0, 0.65)'
                        : 'none',
                    }}
                  >
                    {t.text}
                  </span>

                  {/* Handle Rotasi & Skala saat Teks Dipilih */}
                  {isSelected && (
                    <>
                      <div
                        className={styles.handleRotate}
                        onPointerDown={(e) => onRotateHandleDown(e, i)}
                        onPointerMove={onRotateHandleMove}
                        onPointerUp={onRotateHandleUp}
                        onPointerCancel={onRotateHandleUp}
                        title="Putar teks"
                      >↻</div>
                      <div
                        className={styles.handleScale}
                        onPointerDown={(e) => onScaleHandleDown(e, i)}
                        onPointerMove={onScaleHandleMove}
                        onPointerUp={onScaleHandleUp}
                        onPointerCancel={onScaleHandleUp}
                        title="Perbesar / Perkecil"
                      >⤡</div>
                      <button
                        type="button"
                        className={styles.handleDelete}
                        onPointerDown={(e) => { e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); deleteText(i); }}
                        title="Hapus teks"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            {tool === 'crop' && img && <div className={styles.grid} aria-hidden="true"><i /><i /><i /><i /></div>}
          </div>
        )}

        {items.length > 1 && (
          <>
            {idx > 0 && <button type="button" className={`${styles.nav} ${styles.navL}`} onClick={() => setIdx(idx - 1)} aria-label="Sebelumnya"><ChevronLeft size={20} /></button>}
            {idx < items.length - 1 && <button type="button" className={`${styles.nav} ${styles.navR}`} onClick={() => setIdx(idx + 1)} aria-label="Berikutnya"><ChevronRight size={20} /></button>}
          </>
        )}
      </div>

      {/* Strip Galeri Thumbnail Media */}
      {items.length > 1 && (
        <div className={styles.strip}>
          {items.map((it, i) => (
            <button key={it.url} type="button" className={i === idx ? styles.stripOn : ''} onClick={() => setIdx(i)} aria-label={`Media ${i + 1}`}>
              {it.video ? <video src={it.url} muted /> : <img src={it.url} alt="" />}
            </button>
          ))}
        </div>
      )}

      {/* Panel Kontrol Bawah */}
      <div className={styles.panel}>
        {cur?.video && <p className={styles.note}>Video diunggah apa adanya (maks. 60 MB). Ketuk ikon suara untuk mendengar pratinjau.</p>}

        {/* ── ALAT: POTONG (CROP) ── */}
        {tool === 'crop' && !cur?.video && (
          <div className={styles.toolBody}>
            {RATIOS[target].length > 0 && (
              <div className={styles.chips} role="radiogroup" aria-label="Rasio">
                {RATIOS[target].map(([v, l]) => (
                  <button key={l} type="button" role="radio" aria-checked={ratio === v} className={ratio === v ? styles.chipOn : ''} onClick={() => { setRatio(v); patch({ px: 0, py: 0 }, true); }}>{l}</button>
                ))}
              </div>
            )}
            <div className={styles.row}>
              <button type="button" className={styles.toolBtn} onClick={() => patch((s) => ({ rot: (s.rot + 90) % 360, px: 0, py: 0 }))}><RotateCw size={18} /> Putar</button>
              <button type="button" className={styles.toolBtn} onClick={() => patch((s) => ({ flip: !s.flip }))}><FlipHorizontal2 size={18} /> Cermin</button>
            </div>
            {/* Penggaris Kamera Zoom */}
            <div style={{ width: '100%', marginTop: 2 }}>
              <CameraLensRuler
                min={100}
                max={500}
                step={5}
                majorStep={50}
                value={Math.round(st.zoom * 100)}
                unit="x"
                formatValue={(v) => `${(v / 100).toFixed(1)}x`}
                onChange={(v) => patch({ zoom: v / 100 })}
              />
            </div>
            <p className={styles.hint}>Geser foto untuk mengatur posisi · geser penggaris untuk perbesar</p>
          </div>
        )}

        {/* ── ALAT: FILTER ── */}
        {tool === 'filter' && !cur?.video && (
          <div className={styles.toolBody}>
            {target === 'story' && (
              <div className={styles.row}>
                <button type="button" className={styles.toolBtn} onClick={() => patch((s) => ({ fit: s.fit === 'contain' ? 'cover' : 'contain', zoom: 1, px: 0, py: 0 }))}>
                  {st.fit === 'contain' ? <><Maximize2 size={18} /> Penuhi layar</> : <><Minimize2 size={18} /> Tampilkan utuh</>}
                </button>
                <button type="button" className={styles.toolBtn} onClick={() => patch((s) => ({ rot: (s.rot + 90) % 360, px: 0, py: 0 }))}><RotateCw size={18} /> Putar</button>
              </div>
            )}
            <div className={styles.filters}>
              {FILTERS.map((f) => (
                <button key={f.key} type="button" className={st.filter === f.key ? styles.filterOn : ''} onClick={() => patch({ filter: f.key })}>
                  <FilterThumb img={img?.small} filter={f.key} />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
            {items.length > 1 && st.filter !== 'none' && <button type="button" className={styles.link} onClick={() => patch({ filter: st.filter }, true)}>Pakai filter ini untuk semua foto</button>}
          </div>
        )}

        {/* ── ALAT: ATUR (ADJUST) BUBBLE + LENS RULER ── */}
        {tool === 'adjust' && !cur?.video && (
          <div className={styles.toolBody}>
            {/* Bubble Buttons Lingkaran */}
            <div className={styles.bubbleRow}>
              {ADJUST.map((a) => {
                const Icon = ADJUST_ICONS[a.key] || Sun;
                const val = st.adj[a.key] || 0;
                const isCurrent = adjKey === a.key;
                const isModified = val !== 0;

                return (
                  <button
                    key={a.key}
                    type="button"
                    className={`${styles.bubbleBtn} ${isCurrent ? styles.bubbleBtnActive : ''} ${isModified ? styles.bubbleBtnModified : ''}`}
                    onClick={() => handleBubbleClick(a.key)}
                    title={isCurrent ? 'Ketuk lagi untuk reset' : a.label}
                  >
                    <div className={styles.bubbleCircle}>
                      <Icon size={20} />
                      {isModified && (
                        <span className={styles.bubbleValBadge}>
                          {val > 0 ? `+${val}` : val}
                        </span>
                      )}
                    </div>
                    <span className={styles.bubbleLabel}>{a.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Penggaris Kamera Profesional yang muncul saat bubble aktif */}
            <div className={styles.lensRulerWrap}>
              <CameraLensRuler
                min={adjDef.min}
                max={adjDef.max}
                step={1}
                majorStep={25}
                value={st.adj[adjKey] || 0}
                onChange={(v) => patch((s) => ({ adj: { ...s.adj, [adjKey]: v } }))}
              />
            </div>

            {Object.values(st.adj).some(Boolean) && (
              <button type="button" className={styles.link} onClick={() => patch({ adj: {} })}>
                Atur ulang semua
              </button>
            )}
          </div>
        )}

        {/* ── ALAT: TEKS (KATEGORISASI BUBBLE + LENS RULER) ── */}
        {tool === 'text' && !cur?.video && (() => {
          const selectedText = selectedTextIdx !== null ? st.texts[selectedTextIdx] : null;
          const hasSelectedText = !!selectedText;

          return (
            <div className={styles.toolBody}>
              <div className={styles.textCategoriesScroll}>
                {/* 1. KELOLA / AKSI */}
                <div className={styles.catGroup}>
                  <div className={styles.catHeader}>
                    <span className={styles.catTitle}>Kelola</span>
                  </div>
                  <div className={styles.catItems}>
                    {/* Tombol T (Tambah Teks) — SELALU BISA DIKLIK */}
                    <button
                      type="button"
                      className={styles.bubbleBtn}
                      onClick={openNewText}
                      title="Tambah teks baru"
                    >
                      <div className={`${styles.bubbleCircle} ${styles.bubbleAddText}`}>
                        <Type size={20} />
                      </div>
                      <span className={styles.bubbleLabel}>Tambah Teks</span>
                    </button>

                    {/* Tombol Pensil (Edit Teks) — Aktif jika ada teks terpilih */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => hasSelectedText && setTextEdit({ i: selectedTextIdx, draft: { ...selectedText } })}
                      title={hasSelectedText ? 'Edit kalimat teks' : 'Pilih teks di foto dahulu'}
                    >
                      <div className={styles.bubbleCircle}>
                        <Edit3 size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Edit Teks</span>
                    </button>

                    {/* Tombol Hapus */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => hasSelectedText && deleteText(selectedTextIdx)}
                      title={hasSelectedText ? 'Hapus teks ini' : 'Pilih teks di foto dahulu'}
                    >
                      <div className={`${styles.bubbleCircle} ${hasSelectedText ? styles.bubbleDeleteCircle : ''}`}>
                        <Trash2 size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Hapus</span>
                    </button>
                  </div>
                </div>

                <div className={styles.catDivider} />

                {/* 2. FORMAT & UKURAN */}
                <div className={styles.catGroup}>
                  <div className={styles.catHeader}>
                    <span className={styles.catTitle}>Format & Ukuran</span>
                  </div>
                  <div className={styles.catItems}>
                    {/* Atur Ukuran / Scale */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${textSubTool === 'size' && hasSelectedText ? styles.bubbleBtnActive : ''}`}
                      disabled={!hasSelectedText}
                      onClick={handleTextSizeToggle}
                      title={hasSelectedText ? (textSubTool === 'size' ? 'Ketuk lagi untuk reset ukuran' : 'Atur ukuran / scale') : 'Pilih teks dahulu'}
                    >
                      <div className={styles.bubbleCircle}>
                        <Scaling size={19} />
                        {hasSelectedText && selectedText.scale && selectedText.scale !== 1 && (
                          <span className={styles.bubbleValBadge}>
                            {`${selectedText.scale.toFixed(1)}x`}
                          </span>
                        )}
                      </div>
                      <span className={styles.bubbleLabel}>Ukuran</span>
                    </button>

                    {/* Tebal */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${hasSelectedText && selectedText.bold !== false ? styles.bubbleBtnActive : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => patchSelectedText({ bold: selectedText.bold === false })}
                      title="Tebal"
                    >
                      <div className={styles.bubbleCircle}>
                        <Bold size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Tebal</span>
                    </button>

                    {/* Miring */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${hasSelectedText && selectedText.italic ? styles.bubbleBtnActive : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => patchSelectedText({ italic: !selectedText.italic })}
                      title="Miring"
                    >
                      <div className={styles.bubbleCircle}>
                        <Italic size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Miring</span>
                    </button>

                    {/* Garis Bawah */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${hasSelectedText && selectedText.underline ? styles.bubbleBtnActive : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => patchSelectedText({ underline: !selectedText.underline })}
                      title="Garis Bawah"
                    >
                      <div className={styles.bubbleCircle}>
                        <Underline size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Garis Bawah</span>
                    </button>

                    {/* Bersinar (Glow) */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${hasSelectedText && selectedText.glow ? styles.bubbleBtnActive : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => patchSelectedText({ glow: !selectedText.glow })}
                      title="Efek Bersinar (Glow)"
                    >
                      <div className={styles.bubbleCircle}>
                        <Sparkles size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Bersinar</span>
                    </button>
                  </div>
                </div>

                <div className={styles.catDivider} />

                {/* 3. PERATAAN (ALIGN) */}
                <div className={styles.catGroup}>
                  <div className={styles.catHeader}>
                    <span className={styles.catTitle}>Perataan</span>
                  </div>
                  <div className={styles.catItems}>
                    {/* Kiri */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${hasSelectedText && selectedText.align === 'left' ? styles.bubbleBtnActive : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => patchSelectedText({ align: 'left' })}
                      title="Rata Kiri"
                    >
                      <div className={styles.bubbleCircle}>
                        <AlignLeft size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Kiri</span>
                    </button>

                    {/* Tengah */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${hasSelectedText && (!selectedText.align || selectedText.align === 'center') ? styles.bubbleBtnActive : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => patchSelectedText({ align: 'center' })}
                      title="Rata Tengah"
                    >
                      <div className={styles.bubbleCircle}>
                        <AlignCenter size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Tengah</span>
                    </button>

                    {/* Kanan */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${hasSelectedText && selectedText.align === 'right' ? styles.bubbleBtnActive : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => patchSelectedText({ align: 'right' })}
                      title="Rata Kanan"
                    >
                      <div className={styles.bubbleCircle}>
                        <AlignRight size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Kanan</span>
                    </button>

                    {/* Justify */}
                    <button
                      type="button"
                      className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${hasSelectedText && selectedText.align === 'justify' ? styles.bubbleBtnActive : ''}`}
                      disabled={!hasSelectedText}
                      onClick={() => patchSelectedText({ align: 'justify' })}
                      title="Rata Justify"
                    >
                      <div className={styles.bubbleCircle}>
                        <AlignJustify size={18} />
                      </div>
                      <span className={styles.bubbleLabel}>Justify</span>
                    </button>
                  </div>
                </div>

                <div className={styles.catDivider} />

                {/* 4. LATAR TEKS */}
                <div className={styles.catGroup}>
                  <div className={styles.catHeader}>
                    <span className={styles.catTitle}>Latar</span>
                  </div>
                  <div className={styles.catItems}>
                    {BG_STYLES.map((bg) => {
                      const isCur = hasSelectedText && (selectedText.bgStyle || 'none') === bg.key;
                      return (
                        <button
                          key={bg.key}
                          type="button"
                          className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''} ${isCur ? styles.bubbleBtnActive : ''}`}
                          disabled={!hasSelectedText}
                          onClick={() => patchSelectedText({ bgStyle: bg.key })}
                          title={bg.label}
                        >
                          <div className={styles.bubbleCircle}>
                            {bg.key === 'none' && <CircleSlash size={18} />}
                            {bg.key === 'box' && <Square size={18} />}
                            {bg.key === 'rounded' && <Box size={18} />}
                            {bg.key === 'semi' && <Layers size={18} />}
                          </div>
                          <span className={styles.bubbleLabel}>{bg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.catDivider} />

                {/* 5. WARNA TEKS */}
                <div className={styles.catGroup}>
                  <div className={styles.catHeader}>
                    <span className={styles.catTitle}>Warna</span>
                  </div>
                  <div className={styles.catItems}>
                    {TEXT_COLORS.map((c) => {
                      const isCur = hasSelectedText && (selectedText.color || '#ffffff').toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          type="button"
                          className={`${styles.bubbleBtn} ${!hasSelectedText ? styles.bubbleBtnDisabled : ''}`}
                          disabled={!hasSelectedText}
                          onClick={() => patchSelectedText({ color: c })}
                          title={`Warna ${c}`}
                        >
                          <div
                            className={`${styles.bubbleColorCircle} ${isCur ? styles.bubbleColorCircleSelected : ''}`}
                            style={{ backgroundColor: c }}
                          />
                          <span className={styles.bubbleLabel} style={{ fontSize: 9 }}>{c === '#ffffff' ? 'Putih' : c === '#0f0d0c' ? 'Hitam' : c}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Slider / Lens Ruler Pengatur Ukuran saat tombol Ukuran aktif */}
              {textSubTool === 'size' && hasSelectedText && (
                <div className={styles.lensRulerWrap}>
                  <CameraLensRuler
                    min={40}
                    max={350}
                    step={5}
                    majorStep={50}
                    value={Math.round((selectedText.scale || 1) * 100)}
                    unit="%"
                    formatValue={(v) => `${(v / 100).toFixed(1)}x`}
                    onChange={(v) => patchSelectedText({ scale: v / 100 })}
                  />
                  <p className={styles.hint} style={{ margin: '2px 0 0' }}>
                    Geser penggaris kamera untuk memperbesar / memperkecil ukuran teks · ketuk tombol Ukuran lagi untuk reset 1.0x
                  </p>
                </div>
              )}

              {!hasSelectedText && (
                <p className={styles.hint} style={{ margin: '4px 0 0' }}>
                  Ketuk teks di atas pratinjau untuk mengaktifkan pengaturan · Ketuk 2x untuk ubah isi kalimat
                </p>
              )}
            </div>
          );
        })()}

        {/* Tab Alat Utama Bawah */}
        {tools.length > 1 && (
          <div className={styles.tabs} role="tablist">
            {tools.map(([k, l, Icon]) => (
              <button key={k} type="button" role="tab" aria-selected={tool === k} className={tool === k ? styles.tabOn : ''} onClick={() => setTool(k)}>
                <Icon size={20} />
                <span>{l}</span>
              </button>
            ))}
            {items.length > 1 && (
              <button type="button" onClick={remove} aria-label="Hapus media ini">
                <Trash2 size={20} />
                <span>Hapus</span>
              </button>
            )}
          </div>
        )}
        {footerExtra}
      </div>

      {/* Modal Editor Teks Lengkap */}
      {textEdit && (
        <div className={styles.textLayer} onPointerDown={(e) => e.target === e.currentTarget && saveText()}>
          <div className={styles.textTop}>
            {textEdit.i >= 0 && (
              <button
                type="button"
                className={styles.toolBtn}
                onClick={() => { setTextEdit((t) => ({ ...t, draft: { ...t.draft, text: '' } })); setTimeout(saveText, 0); }}
              >
                <Trash2 size={16} /> Hapus
              </button>
            )}
            <button type="button" className={styles.done} onClick={saveText}>
              Selesai
            </button>
          </div>

          {/* Kotak Input Teks Paragraf */}
          <textarea
            autoFocus
            className={styles.textInput}
            value={textEdit.draft.text}
            rows={4}
            placeholder="Ketik ceritamu di sini… ✨"
            style={{
              color: (textEdit.draft.bgStyle === 'rounded' || textEdit.draft.bgStyle === 'box')
                ? inkOn(textEdit.draft.color || '#fff')
                : (textEdit.draft.color || '#ffffff'),
              backgroundColor: (textEdit.draft.bgStyle === 'rounded' || textEdit.draft.bgStyle === 'box')
                ? textEdit.draft.color
                : textEdit.draft.bgStyle === 'semi'
                ? 'rgba(0, 0, 0, 0.55)'
                : 'transparent',
              fontWeight: textEdit.draft.bold !== false ? 800 : 400,
              fontStyle: textEdit.draft.italic ? 'italic' : 'normal',
              textDecoration: textEdit.draft.underline ? 'underline' : 'none',
              textAlign: textEdit.draft.align || 'center',
              textShadow: textEdit.draft.glow
                ? `0 0 16px ${textEdit.draft.color || '#fff'}, 0 0 28px ${textEdit.draft.color || '#fff'}`
                : textEdit.draft.bgStyle === 'none'
                ? '0 2px 8px rgba(0, 0, 0, 0.6)'
                : 'none',
              borderRadius: textEdit.draft.bgStyle === 'box' ? 0 : 12,
            }}
            onChange={(e) => setTextEdit((t) => ({ ...t, draft: { ...t.draft, text: e.target.value } }))}
          />

          {/* Pengaturan Efek & Perataan Teks */}
          <div className={styles.textToolbarWrap}>
            <div className={styles.textToolRow}>
              {/* Efek: Tebal, Miring, Garis Bawah, Glow */}
              <button
                type="button"
                className={`${styles.textToolBtn} ${textEdit.draft.bold !== false ? styles.textToolBtnActive : ''}`}
                onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, bold: t.draft.bold === false } }))}
                title="Tebal"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                className={`${styles.textToolBtn} ${textEdit.draft.italic ? styles.textToolBtnActive : ''}`}
                onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, italic: !t.draft.italic } }))}
                title="Miring"
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                className={`${styles.textToolBtn} ${textEdit.draft.underline ? styles.textToolBtnActive : ''}`}
                onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, underline: !t.draft.underline } }))}
                title="Garis bawah"
              >
                <Underline size={16} />
              </button>
              <button
                type="button"
                className={`${styles.textToolBtn} ${textEdit.draft.glow ? styles.textToolBtnActive : ''}`}
                onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, glow: !t.draft.glow } }))}
                title="Efek Bersinar (Glow)"
              >
                ✦
              </button>

              <div className={styles.toolSep} />

              {/* Perataan (Align) */}
              <button
                type="button"
                className={`${styles.textToolBtn} ${textEdit.draft.align === 'left' ? styles.textToolBtnActive : ''}`}
                onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, align: 'left' } }))}
                title="Rata Kiri"
              >
                <AlignLeft size={16} />
              </button>
              <button
                type="button"
                className={`${styles.textToolBtn} ${(!textEdit.draft.align || textEdit.draft.align === 'center') ? styles.textToolBtnActive : ''}`}
                onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, align: 'center' } }))}
                title="Rata Tengah"
              >
                <AlignCenter size={16} />
              </button>
              <button
                type="button"
                className={`${styles.textToolBtn} ${textEdit.draft.align === 'right' ? styles.textToolBtnActive : ''}`}
                onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, align: 'right' } }))}
                title="Rata Kanan"
              >
                <AlignRight size={16} />
              </button>
              <button
                type="button"
                className={`${styles.textToolBtn} ${textEdit.draft.align === 'justify' ? styles.textToolBtnActive : ''}`}
                onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, align: 'justify' } }))}
                title="Rata Kanan Kiri"
              >
                <AlignJustify size={16} />
              </button>
            </div>

            {/* Pilihan Gaya Latar Belakang */}
            <div className={styles.textToolRow}>
              {BG_STYLES.map((bg) => (
                <button
                  key={bg.key}
                  type="button"
                  className={`${styles.bgStyleOption} ${textEdit.draft.bgStyle === bg.key ? styles.bgStyleOptionActive : ''}`}
                  onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, bgStyle: bg.key } }))}
                >
                  {bg.label}
                </button>
              ))}
            </div>

            {/* Ukuran Teks */}
            <div className={styles.textToolRow} style={{ width: '100%', maxWidth: 360 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', minWidth: 50 }}>Ukuran</span>
              <input
                type="range"
                className={styles.sizeRange}
                min={3}
                max={16}
                value={Math.round((textEdit.draft.size || 0.07) * 100)}
                aria-label="Ukuran teks"
                onChange={(e) => setTextEdit((t) => ({ ...t, draft: { ...t.draft, size: Number(e.target.value) / 100 } }))}
              />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', minWidth: 32, textAlign: 'right' }}>
                {Math.round((textEdit.draft.size || 0.07) * 100)}
              </span>
            </div>
          </div>

          {/* Pilihan Warna Teks */}
          <div className={styles.colors}>
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                style={{ background: c }}
                aria-label={`Warna ${c}`}
                className={textEdit.draft.color === c ? styles.colorOn : ''}
                onClick={() => setTextEdit((t) => ({ ...t, draft: { ...t.draft, color: c } }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal Kolase Foto */}
      {collageOpen && (
        <CollageModal
          availablePhotos={items}
          onDone={handleCollageDone}
          onClose={() => setCollageOpen(false)}
        />
      )}
    </div>,
    document.body
  );
}

const inkOn = (hex) => {
  if (!hex || !hex.startsWith('#')) return '#fff';
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150 ? '#111' : '#fff';
};

/** Pratinjau kecil filter (dirender sekali per foto). */
function FilterThumb({ img, filter }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!img || !ref.current) return;
    const id = requestAnimationFrame(() => renderPhoto(ref.current, img, { ...emptyEdit(), filter }, 128, 128, { withText: false }));
    return () => cancelAnimationFrame(id);
  }, [img, filter]);
  return <canvas ref={ref} width={128} height={128} />;
}

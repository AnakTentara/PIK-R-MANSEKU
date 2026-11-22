import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Camera, Type, Loader2, UploadCloud, Sparkles, Plus,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Trash2
} from 'lucide-react';
import { createStory } from '@/api/social';
import toast from 'react-hot-toast';
import styles from './CreateStoryModal.module.css';

const PRESET_COLORS = [
  '#EA580C', '#EC4899', '#8B5CF6', '#2563EB', '#059669', '#0F172A',
];

const TEXT_COLORS = ['#ffffff', '#f8fafc', '#fde68a', '#86efac', '#93c5fd', '#f9a8d4', '#0f172a'];

const BG_STYLES = [
  { key: 'none', label: 'Tanpa latar' },
  { key: 'box', label: 'Kotak' },
  { key: 'rounded', label: 'Rounded' },
  { key: 'semi', label: 'Semi trans' },
];

let _textId = 0;
const makeTextId = () => `txt_${++_textId}`;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ─── Komponen teks overlay yang bisa drag / scale / rotate ───────────────────
function TextOverlay({ obj, containerRef, onUpdate, onSelect, onDelete, isSelected }) {
  const elRef = useRef(null);
  const dragRef = useRef(null);
  const rotRef = useRef(null);
  const scaleRef = useRef(null);

  // ── Drag ──
  const startDrag = useCallback((e) => {
    e.stopPropagation();
    onSelect(obj.id);
    const rect = containerRef.current.getBoundingClientRect();
    const startX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const startY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const initX = obj.x;
    const initY = obj.y;

    dragRef.current = { startX, startY, initX, initY };

    const move = (ev) => {
      if (!dragRef.current) return;
      const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
      const cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - rect.top;
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      onUpdate(obj.id, {
        x: clamp(dragRef.current.initX + dx / rect.width, 0, 1),
        y: clamp(dragRef.current.initY + dy / rect.height, 0, 1),
      });
    };
    const end = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }, [obj, containerRef, onUpdate, onSelect]);

  // ── Rotate handle ──
  const startRotate = useCallback((e) => {
    e.stopPropagation();
    const rect = elRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(
      (e.touches ? e.touches[0].clientY : e.clientY) - cy,
      (e.touches ? e.touches[0].clientX : e.clientX) - cx
    );
    const initRot = obj.rotation || 0;

    const move = (ev) => {
      const angle = Math.atan2(
        (ev.touches ? ev.touches[0].clientY : ev.clientY) - cy,
        (ev.touches ? ev.touches[0].clientX : ev.clientX) - cx
      );
      onUpdate(obj.id, { rotation: initRot + ((angle - startAngle) * 180) / Math.PI });
    };
    const end = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }, [obj, onUpdate]);

  // ── Scale corner handle ──
  const startScale = useCallback((e) => {
    e.stopPropagation();
    const startDist = e.touches ? e.touches[0].clientX : e.clientX;
    const initScale = obj.scale || 1;

    const move = (ev) => {
      const dist = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const delta = (dist - startDist) / 80;
      onUpdate(obj.id, { scale: clamp(initScale + delta, 0.4, 4) });
    };
    const end = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }, [obj, onUpdate]);

  const bgStyle = (() => {
    switch (obj.bgStyle) {
      case 'box':     return { background: 'rgba(0,0,0,0.75)', borderRadius: 0, padding: '4px 8px' };
      case 'rounded': return { background: 'rgba(0,0,0,0.75)', borderRadius: '8px', padding: '4px 10px' };
      case 'semi':    return { background: 'rgba(0,0,0,0.38)', borderRadius: '8px', padding: '4px 10px', backdropFilter: 'blur(4px)' };
      default:        return {};
    }
  })();

  return (
    <div
      ref={elRef}
      className={`${styles.textOverlay} ${isSelected ? styles.textOverlaySelected : ''}`}
      style={{
        left: `${obj.x * 100}%`,
        top: `${obj.y * 100}%`,
        transform: `translate(-50%, -50%) scale(${obj.scale || 1}) rotate(${obj.rotation || 0}deg)`,
        maxWidth: `${(obj.wrapWidth || 0.8) * 100}%`,
      }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <div
        style={{
          ...bgStyle,
          color: obj.color || '#fff',
          fontSize: `${obj.fontSize || 20}px`,
          fontWeight: obj.bold ? 700 : 400,
          fontStyle: obj.italic ? 'italic' : 'normal',
          textDecoration: obj.underline ? 'underline' : 'none',
          textAlign: obj.align || 'center',
          textShadow: obj.glow ? '0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.5)' : 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.4,
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        {obj.text || 'Teks'}
      </div>

      {isSelected && (
        <>
          {/* Rotate handle — atas tengah */}
          <div
            className={styles.handleRotate}
            onMouseDown={startRotate}
            onTouchStart={startRotate}
            title="Putar"
          >↻</div>
          {/* Scale handle — kanan bawah */}
          <div
            className={styles.handleScale}
            onMouseDown={startScale}
            onTouchStart={startScale}
            title="Perbesar"
          >⤡</div>
          {/* Delete — kiri atas */}
          <button
            className={styles.handleDelete}
            onMouseDown={(e) => { e.stopPropagation(); onDelete(obj.id); }}
            onTouchStart={(e) => { e.stopPropagation(); onDelete(obj.id); }}
            title="Hapus"
          ><Trash2 size={12} /></button>
        </>
      )}
    </div>
  );
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function CreateStoryModal({ onClose, onCreated }) {
  const [mode, setMode] = useState('photo'); // 'photo' | 'text'
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState(PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  // Text overlays untuk mode foto
  const [textObjs, setTextObjs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Properti teks yang sedang diedit / dipilih
  const [txtColor, setTxtColor] = useState('#ffffff');
  const [txtBgStyle, setTxtBgStyle] = useState('none');
  const [txtBold, setTxtBold] = useState(false);
  const [txtItalic, setTxtItalic] = useState(false);
  const [txtUnderline, setTxtUnderline] = useState(false);
  const [txtGlow, setTxtGlow] = useState(false);
  const [txtAlign, setTxtAlign] = useState('center');
  const [txtSize, setTxtSize] = useState(22);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const editInputRef = useRef(null);

  // Sinkronisasi properti ketika ganti selected
  useEffect(() => {
    if (!selectedId) return;
    const o = textObjs.find(t => t.id === selectedId);
    if (!o) return;
    setTxtColor(o.color || '#ffffff');
    setTxtBgStyle(o.bgStyle || 'none');
    setTxtBold(o.bold || false);
    setTxtItalic(o.italic || false);
    setTxtUnderline(o.underline || false);
    setTxtGlow(o.glow || false);
    setTxtAlign(o.align || 'center');
    setTxtSize(o.fontSize || 22);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Hanya format gambar yang didukung.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Ukuran gambar maksimal 10MB.'); return; }
    setPhotoFile(file);
    setTextObjs([]);
    setSelectedId(null);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const addText = () => {
    const id = makeTextId();
    const obj = {
      id,
      text: 'Ketik teks...',
      x: 0.5, y: 0.5,
      scale: 1, rotation: 0,
      color: txtColor,
      bgStyle: txtBgStyle,
      bold: txtBold, italic: txtItalic, underline: txtUnderline,
      glow: txtGlow, align: txtAlign,
      fontSize: txtSize,
      wrapWidth: 0.8,
    };
    setTextObjs(prev => [...prev, obj]);
    setSelectedId(id);
    setEditingId(id);
    setEditText('Ketik teks...');
    setTimeout(() => editInputRef.current?.select(), 50);
  };

  const updateObj = useCallback((id, patch) => {
    setTextObjs(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
  }, []);

  const deleteObj = (id) => {
    setTextObjs(prev => prev.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  };

  // Update properti real-time ke objek yang dipilih
  const applyProp = (patch) => {
    if (selectedId) updateObj(selectedId, patch);
  };

  const finishEdit = () => {
    if (editingId) {
      updateObj(editingId, { text: editText || 'Teks' });
      setEditingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    finishEdit();

    if (mode === 'photo' && !photoFile) { toast.error('Pilih foto terlebih dahulu.'); return; }
    if (mode === 'text' && !caption.trim()) { toast.error('Tulis kata-kata atau cerita singkatmu.'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (mode === 'photo') {
        fd.append('media', photoFile);
        // Serialisasi text overlays sebagai JSON agar backend bisa simpan jika mau
        if (textObjs.length > 0) fd.append('textOverlays', JSON.stringify(textObjs));
        if (caption.trim()) fd.append('caption', caption.trim());
      } else {
        fd.append('caption', caption.trim());
        fd.append('bgColor', bgColor);
      }
      const res = await createStory(fd);
      toast.success(res.data?.message || 'Cerita 24 jam berhasil dibagikan! 🎉');
      if (onCreated) onCreated(res.data?.story);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal membagikan cerita.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedObj = textObjs.find(o => o.id === selectedId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--color-primary, #EA580C)" />
            <h3 className={styles.title}>Bagikan Cerita 24 Jam</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeTab} ${mode === 'photo' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('photo')}
          >
            <Camera size={16} /> Foto
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${mode === 'text' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('text')}
          >
            <Type size={16} /> Teks Warna
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {mode === 'photo' ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {/* Preview area foto — blurred background + text overlays */}
                <div className={styles.photoEditorWrap}>
                  {photoPreview ? (
                    <div
                      ref={containerRef}
                      className={styles.photoCanvas}
                      onClick={() => { finishEdit(); setSelectedId(null); }}
                    >
                      {/* Blurred background */}
                      <div
                        className={styles.photoBgBlur}
                        style={{ backgroundImage: `url(${photoPreview})` }}
                      />
                      {/* Foto utama */}
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className={styles.photoMain}
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      />
                      {/* Tombol Tambah Teks — pojok kiri atas */}
                      <button
                        type="button"
                        className={styles.addTextBtn}
                        onClick={(e) => { e.stopPropagation(); addText(); }}
                        title="Tambah teks"
                      >
                        <Plus size={14} /> Tambah Teks
                      </button>
                      {/* Tombol ganti foto — pojok kanan atas */}
                      <button
                        type="button"
                        className={styles.changePhotoBtn}
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      >Ganti Foto</button>

                      {/* Text Overlays */}
                      {textObjs.map(obj => (
                        editingId === obj.id ? (
                          <div
                            key={obj.id}
                            className={styles.textEditWrap}
                            style={{
                              left: `${obj.x * 100}%`,
                              top: `${obj.y * 100}%`,
                              transform: `translate(-50%, -50%)`,
                              maxWidth: `${(obj.wrapWidth || 0.8) * 100}%`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <textarea
                              ref={editInputRef}
                              className={styles.textEditInput}
                              value={editText}
                              autoFocus
                              rows={3}
                              onChange={(e) => { setEditText(e.target.value); updateObj(obj.id, { text: e.target.value }); }}
                              onBlur={finishEdit}
                              onKeyDown={(e) => { if (e.key === 'Escape') finishEdit(); }}
                              style={{
                                color: obj.color,
                                fontWeight: obj.bold ? 700 : 400,
                                fontStyle: obj.italic ? 'italic' : 'normal',
                                fontSize: `${obj.fontSize || 20}px`,
                                textAlign: obj.align,
                              }}
                            />
                          </div>
                        ) : (
                          <TextOverlay
                            key={obj.id}
                            obj={obj}
                            containerRef={containerRef}
                            isSelected={selectedId === obj.id}
                            onSelect={(id) => { setSelectedId(id); }}
                            onUpdate={updateObj}
                            onDelete={deleteObj}
                          />
                        )
                      ))}
                    </div>
                  ) : (
                    /* Dropzone sebelum ada foto */
                    <div
                      className={styles.uploadDropzone}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={38} color="#94a3b8" />
                      <span className={styles.dropzoneText}>Ketuk untuk memilih foto</span>
                      <span className={styles.dropzoneHint}>Format JPG, PNG, atau WebP (maks. 10MB)</span>
                    </div>
                  )}
                </div>

                {/* Toolbar teks — tampil ketika ada teks yang dipilih */}
                {selectedObj && !editingId && (
                  <div className={styles.textToolbar}>
                    {/* Warna teks */}
                    <div className={styles.toolbarRow}>
                      {TEXT_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          className={`${styles.colorDot} ${txtColor === c ? styles.colorDotActive : ''}`}
                          style={{ background: c, border: c === '#ffffff' ? '1.5px solid #cbd5e1' : 'none' }}
                          onClick={() => { setTxtColor(c); applyProp({ color: c }); }}
                        />
                      ))}
                    </div>
                    {/* Format */}
                    <div className={styles.toolbarRow}>
                      <button type="button" className={`${styles.toolBtn} ${txtBold ? styles.toolBtnOn : ''}`} onClick={() => { const v = !txtBold; setTxtBold(v); applyProp({ bold: v }); }}><Bold size={14} /></button>
                      <button type="button" className={`${styles.toolBtn} ${txtItalic ? styles.toolBtnOn : ''}`} onClick={() => { const v = !txtItalic; setTxtItalic(v); applyProp({ italic: v }); }}><Italic size={14} /></button>
                      <button type="button" className={`${styles.toolBtn} ${txtUnderline ? styles.toolBtnOn : ''}`} onClick={() => { const v = !txtUnderline; setTxtUnderline(v); applyProp({ underline: v }); }}><Underline size={14} /></button>
                      <button type="button" className={`${styles.toolBtn} ${txtGlow ? styles.toolBtnOn : ''}`} onClick={() => { const v = !txtGlow; setTxtGlow(v); applyProp({ glow: v }); }} title="Glow">✦</button>
                      <div className={styles.toolSep} />
                      <button type="button" className={`${styles.toolBtn} ${txtAlign === 'left' ? styles.toolBtnOn : ''}`} onClick={() => { setTxtAlign('left'); applyProp({ align: 'left' }); }}><AlignLeft size={14} /></button>
                      <button type="button" className={`${styles.toolBtn} ${txtAlign === 'center' ? styles.toolBtnOn : ''}`} onClick={() => { setTxtAlign('center'); applyProp({ align: 'center' }); }}><AlignCenter size={14} /></button>
                      <button type="button" className={`${styles.toolBtn} ${txtAlign === 'right' ? styles.toolBtnOn : ''}`} onClick={() => { setTxtAlign('right'); applyProp({ align: 'right' }); }}><AlignRight size={14} /></button>
                      <button type="button" className={`${styles.toolBtn} ${txtAlign === 'justify' ? styles.toolBtnOn : ''}`} onClick={() => { setTxtAlign('justify'); applyProp({ align: 'justify' }); }}><AlignJustify size={14} /></button>
                    </div>
                    {/* Latar teks */}
                    <div className={styles.toolbarRow}>
                      {BG_STYLES.map(b => (
                        <button
                          key={b.key}
                          type="button"
                          className={`${styles.bgStyleBtn} ${txtBgStyle === b.key ? styles.bgStyleBtnOn : ''}`}
                          onClick={() => { setTxtBgStyle(b.key); applyProp({ bgStyle: b.key }); }}
                        >{b.label}</button>
                      ))}
                    </div>
                    {/* Ukuran teks */}
                    <div className={styles.toolbarRow}>
                      <span className={styles.toolLabel}>Ukuran</span>
                      <input
                        type="range" min={12} max={56} step={1}
                        value={txtSize}
                        className={styles.toolRange}
                        onChange={(e) => { const v = +e.target.value; setTxtSize(v); applyProp({ fontSize: v }); }}
                      />
                      <span className={styles.toolValue}>{txtSize}px</span>
                    </div>
                    {/* Edit teks */}
                    <div className={styles.toolbarRow}>
                      <button
                        type="button"
                        className={styles.editTextBtn}
                        onClick={() => { setEditingId(selectedId); setEditText(selectedObj.text); setTimeout(() => editInputRef.current?.select(), 50); }}
                      >Edit Teks</button>
                      <button type="button" className={styles.deleteTextBtn} onClick={() => deleteObj(selectedId)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                )}

                {/* Caption opsional */}
                {photoPreview && (
                  <div className={styles.captionGroup}>
                    <textarea
                      rows={2}
                      className={styles.captionInput}
                      placeholder="Tulis keterangan foto (opsional)..."
                      value={caption}
                      maxLength={300}
                      onChange={(e) => setCaption(e.target.value)}
                    />
                  </div>
                )}
              </>
            ) : (
              /* ── Mode Teks Warna ── */
              <>
                <div className={styles.textPreviewCard} style={{ background: bgColor }}>
                  <p className={styles.quoteText}>{caption.trim() || 'Ketik ceritamu di bawah... ✨'}</p>
                </div>
                <div className={styles.colorPickerTray}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.colorBubble} ${bgColor === c ? styles.colorBubbleActive : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setBgColor(c)}
                      title={c}
                    />
                  ))}
                </div>
                <div className={styles.captionGroup}>
                  <textarea
                    rows={3}
                    className={styles.captionInput}
                    placeholder="Apa yang sedang kamu pikirkan hari ini? Bagikan bersama sahabat PIK-R..."
                    value={caption}
                    maxLength={300}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>Batal</button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || (mode === 'photo' && !photoFile) || (mode === 'text' && !caption.trim())}
            >
              {submitting ? (<><Loader2 size={16} className="animate-spin" /> Mengunggah...</>) : 'Bagikan Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

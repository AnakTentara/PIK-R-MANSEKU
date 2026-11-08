import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Eye, Loader2, Trash2, GripVertical, Copy,
  Type, AlignLeft, ImageIcon, RectangleHorizontal, Minus, MoveVertical, Columns3, Code2,
  MousePointer, X, Upload
} from 'lucide-react';
import { getSettings, saveSettings, uploadBlogImage } from '@/api/admin';
import styles from './AdminPageBuilderPage.module.css';

/* ═══════════════════════════════════════
   Block type definitions
   ═══════════════════════════════════════ */
const BLOCK_TYPES = [
  {
    group: 'Teks',
    items: [
      { type: 'heading', label: 'Heading', icon: Type, defaultProps: { text: 'Judul Halaman', level: 'h1', fontSize: 2, color: '#1e293b', align: 'left', fontWeight: '700', marginBottom: 16, width: 100 } },
      { type: 'paragraph', label: 'Paragraf', icon: AlignLeft, defaultProps: { text: 'Tulis konten paragraf di sini...', fontSize: 1, color: '#475569', lineHeight: 1.7, align: 'left', marginBottom: 12, width: 100 } },
    ]
  },
  {
    group: 'Media',
    items: [
      { type: 'image', label: 'Gambar', icon: ImageIcon, defaultProps: { src: '', alt: '', width: 100, borderRadius: 8, align: 'center', marginBottom: 16 } },
    ]
  },
  {
    group: 'Elemen',
    items: [
      { type: 'button', label: 'Tombol', icon: RectangleHorizontal, defaultProps: { label: 'Klik di sini', href: '#', bgColor: '#6366f1', textColor: '#ffffff', fontSize: 0.95, borderRadius: 6, align: 'left', marginBottom: 12, paddingX: 24, paddingY: 10, opacity: 100, style: 'filled' } },
      { type: 'divider', label: 'Garis Pemisah', icon: Minus, defaultProps: { color: '#e5e7eb', thickness: 1, style: 'solid', width: 100, marginBottom: 16 } },
      { type: 'spacer', label: 'Spacer', icon: MoveVertical, defaultProps: { height: 32 } },
    ]
  },
  {
    group: 'Layout',
    items: [
      { type: 'columns', label: '2 Kolom', icon: Columns3, defaultProps: { gap: 24, col1: '<p>Kolom 1</p>', col2: '<p>Kolom 2</p>', marginBottom: 16 } },
      { type: 'html', label: 'HTML', icon: Code2, defaultProps: { html: '<p>Kode HTML kustom</p>', marginBottom: 0 } },
    ]
  },
];

const slugify = (s) =>
  String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'halaman';

const uid = () => `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/* ═══════════════════════════════════════
   NumericInput — slider + stepper combo
   ═══════════════════════════════════════ */
function NumericInput({ value, onChange, min = 0, max = 100, step = 1, unit = '', label }) {
  const [mode, setMode] = useState('slider');
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;

  return (
    <div className={styles.ctrlRow}>
      {label && <span className={styles.ctrlLabel}>{label}</span>}
      {mode === 'slider' ? (
        <>
          <input type="range" className={styles.ctrlSlider} min={min} max={max} step={step}
            value={numVal} onChange={(e) => onChange(parseFloat(e.target.value))} />
          <span style={{ fontSize: '0.68rem', color: '#9ca3af', minWidth: 36, textAlign: 'right', fontFamily: 'monospace' }}>
            {numVal}{unit}
          </span>
        </>
      ) : (
        <div className={styles.stepper}>
          <button type="button" className={styles.stepperBtn} onClick={() => onChange(Math.max(min, numVal - step))}>−</button>
          <input className={styles.stepperVal} value={numVal} type="number" min={min} max={max} step={step}
            onChange={(e) => onChange(Math.min(max, Math.max(min, parseFloat(e.target.value) || 0)))} />
          <button type="button" className={styles.stepperBtn} onClick={() => onChange(Math.min(max, numVal + step))}>+</button>
        </div>
      )}
      <div className={styles.inputToggle}>
        <button type="button" className={`${styles.inputToggleBtn} ${mode === 'slider' ? styles.inputToggleBtnOn : ''}`} onClick={() => setMode('slider')}>S</button>
        <button type="button" className={`${styles.inputToggleBtn} ${mode === 'stepper' ? styles.inputToggleBtnOn : ''}`} onClick={() => setMode('stepper')}>#</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Block Preview — canvas render
   ═══════════════════════════════════════ */
function BlockPreview({ block }) {
  const p = block.props;
  const widthPct = p.width != null ? `${p.width}%` : '100%';
  const wrapStyle = { width: widthPct, maxWidth: '100%', marginBottom: `${p.marginBottom || 0}px` };

  if (p.align === 'center') { wrapStyle.marginLeft = 'auto'; wrapStyle.marginRight = 'auto'; }
  else if (p.align === 'right') { wrapStyle.marginLeft = 'auto'; }

  if (block.type === 'heading') {
    const Tag = p.level || 'h2';
    return (
      <div style={wrapStyle}>
        <Tag style={{ fontSize: `${p.fontSize || 2}rem`, color: p.color || 'inherit', fontWeight: p.fontWeight || '700', textAlign: p.align || 'left', margin: 0 }}>
          {p.text || <span style={{ opacity: 0.2 }}>Judul kosong</span>}
        </Tag>
      </div>
    );
  }
  if (block.type === 'paragraph') {
    return (
      <div style={wrapStyle}>
        <p style={{ fontSize: `${p.fontSize || 1}rem`, color: p.color || 'inherit', lineHeight: p.lineHeight || 1.7, textAlign: p.align || 'left', margin: 0 }}>
          {p.text || <span style={{ opacity: 0.2 }}>Paragraf kosong</span>}
        </p>
      </div>
    );
  }
  if (block.type === 'image') {
    if (!p.src) {
      return (
        <div style={wrapStyle}>
          <div style={{ height: 120, background: '#f9fafb', borderRadius: `${p.borderRadius || 8}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: '0.8rem', border: '1px dashed #e5e7eb' }}>
            Belum ada gambar
          </div>
        </div>
      );
    }
    return (
      <div style={wrapStyle}>
        <img src={p.src} alt={p.alt || ''} style={{ width: '100%', borderRadius: `${p.borderRadius || 8}px`, display: 'block' }} />
      </div>
    );
  }
  if (block.type === 'button') {
    const btnStyle = {
      display: 'inline-block',
      padding: `${p.paddingY || 10}px ${p.paddingX || 24}px`,
      fontSize: `${p.fontSize || 0.95}rem`,
      borderRadius: `${p.borderRadius || 6}px`,
      fontWeight: 600,
      cursor: 'default',
      textDecoration: 'none',
      opacity: (p.opacity || 100) / 100,
      transition: 'none',
    };
    if (p.style === 'outline') {
      btnStyle.background = 'transparent';
      btnStyle.color = p.bgColor || '#6366f1';
      btnStyle.border = `2px solid ${p.bgColor || '#6366f1'}`;
    } else if (p.style === 'ghost') {
      btnStyle.background = 'transparent';
      btnStyle.color = p.bgColor || '#6366f1';
      btnStyle.border = 'none';
    } else {
      btnStyle.background = p.bgColor || '#6366f1';
      btnStyle.color = p.textColor || '#fff';
      btnStyle.border = 'none';
    }
    return (
      <div style={{ ...wrapStyle, textAlign: p.align || 'left' }}>
        <span style={btnStyle}>{p.label || 'Tombol'}</span>
      </div>
    );
  }
  if (block.type === 'divider') {
    return (
      <div style={wrapStyle}>
        <hr style={{ border: 'none', borderTop: `${p.thickness || 1}px ${p.style || 'solid'} ${p.color || '#e5e7eb'}`, margin: 0 }} />
      </div>
    );
  }
  if (block.type === 'spacer') {
    return <div style={{ height: `${p.height || 32}px` }} aria-hidden="true" />;
  }
  if (block.type === 'columns') {
    return (
      <div style={{ ...wrapStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${p.gap || 24}px` }}>
        <div style={{ background: '#fafafa', borderRadius: 4, padding: 10, fontSize: '0.82rem', color: '#6b7280' }} dangerouslySetInnerHTML={{ __html: p.col1 || '' }} />
        <div style={{ background: '#fafafa', borderRadius: 4, padding: 10, fontSize: '0.82rem', color: '#6b7280' }} dangerouslySetInnerHTML={{ __html: p.col2 || '' }} />
      </div>
    );
  }
  if (block.type === 'html') {
    return <div style={wrapStyle} dangerouslySetInnerHTML={{ __html: p.html || '' }} />;
  }
  return null;
}

/* ═══════════════════════════════════════
   SortableBlock — canvas item
   ═══════════════════════════════════════ */
function SortableBlock({ block, selected, onSelect, onDelete, onDuplicate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.25 : 1 };

  return (
    <div ref={setNodeRef} style={style}
      className={`${styles.block} ${selected ? styles.blockSelected : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
    >
      <span className={styles.dragHandle} {...attributes} {...listeners}><GripVertical size={14} /></span>
      {selected && (
        <div className={styles.blockToolbar} onClick={(e) => e.stopPropagation()}>
          <button className={styles.blockToolBtn} title="Duplikat" onClick={() => onDuplicate(block.id)}><Copy size={12} /></button>
          <button className={`${styles.blockToolBtn} ${styles.blockToolBtnDanger}`} title="Hapus" onClick={() => onDelete(block.id)}><Trash2 size={12} /></button>
        </div>
      )}
      <div style={{ padding: '8px 10px' }}><BlockPreview block={block} /></div>
    </div>
  );
}

/* ═══════════════════════════════════════
   AlignButtons
   ═══════════════════════════════════════ */
function AlignButtons({ value, onChange }) {
  return (
    <div className={styles.alignBtns}>
      {[['left', 'L'], ['center', 'C'], ['right', 'R']].map(([v, label]) => (
        <button key={v} type="button" className={`${styles.alignBtn} ${value === v ? styles.alignBtnActive : ''}`}
          onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   StyleEditor — right panel
   ═══════════════════════════════════════ */
function StyleEditor({ block, onChange, onImageUpload }) {
  if (!block) {
    return (
      <div className={styles.stylePanelEmpty}>
        <MousePointer size={28} />
        <p>Klik blok di canvas</p>
      </div>
    );
  }

  const p = block.props;
  const up = (key, val) => onChange({ ...block, props: { ...p, [key]: val } });
  const fileRef = useRef(null);

  return (
    <>
      {/* Heading */}
      {block.type === 'heading' && (
        <>
          <div className={styles.styleSection}>
            <div className={styles.styleSectionTitle}>Konten</div>
            <div className={styles.ctrlRow}>
              <span className={styles.ctrlLabel}>Teks</span>
              <input className={styles.ctrlInput} value={p.text || ''} onChange={(e) => up('text', e.target.value)} />
            </div>
            <div className={styles.ctrlRow}>
              <span className={styles.ctrlLabel}>Level</span>
              <select className={styles.ctrlSelect} value={p.level || 'h1'} onChange={(e) => up('level', e.target.value)}>
                <option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="h4">H4</option>
              </select>
            </div>
          </div>
          <div className={styles.styleSection}>
            <div className={styles.styleSectionTitle}>Tipografi</div>
            <NumericInput label="Ukuran" value={p.fontSize || 2} onChange={(v) => up('fontSize', v)} min={0.75} max={5} step={0.125} unit="rem" />
            <div className={styles.ctrlRow}>
              <span className={styles.ctrlLabel}>Warna</span>
              <input type="color" className={styles.ctrlColor} value={p.color || '#1e293b'} onChange={(e) => up('color', e.target.value)} />
              <input className={styles.ctrlInput} value={p.color || '#1e293b'} onChange={(e) => up('color', e.target.value)} style={{ flex: 1 }} />
            </div>
            <div className={styles.ctrlRow}>
              <span className={styles.ctrlLabel}>Tebal</span>
              <select className={styles.ctrlSelect} value={p.fontWeight || '700'} onChange={(e) => up('fontWeight', e.target.value)}>
                <option value="400">Regular</option><option value="600">Semibold</option><option value="700">Bold</option><option value="800">Extrabold</option>
              </select>
            </div>
            <div className={styles.ctrlRow}><span className={styles.ctrlLabel}>Rata</span><AlignButtons value={p.align} onChange={(v) => up('align', v)} /></div>
          </div>
        </>
      )}

      {/* Paragraph */}
      {block.type === 'paragraph' && (
        <>
          <div className={styles.styleSection}>
            <div className={styles.styleSectionTitle}>Konten</div>
            <textarea className={styles.ctrlInput} rows={4} value={p.text || ''} onChange={(e) => up('text', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div className={styles.styleSection}>
            <div className={styles.styleSectionTitle}>Tipografi</div>
            <NumericInput label="Ukuran" value={p.fontSize || 1} onChange={(v) => up('fontSize', v)} min={0.75} max={1.5} step={0.05} unit="rem" />
            <div className={styles.ctrlRow}>
              <span className={styles.ctrlLabel}>Warna</span>
              <input type="color" className={styles.ctrlColor} value={p.color || '#475569'} onChange={(e) => up('color', e.target.value)} />
              <input className={styles.ctrlInput} value={p.color || '#475569'} onChange={(e) => up('color', e.target.value)} style={{ flex: 1 }} />
            </div>
            <NumericInput label="Spasi" value={p.lineHeight || 1.7} onChange={(v) => up('lineHeight', v)} min={1.2} max={2.4} step={0.1} />
            <div className={styles.ctrlRow}><span className={styles.ctrlLabel}>Rata</span><AlignButtons value={p.align} onChange={(v) => up('align', v)} /></div>
          </div>
        </>
      )}

      {/* Image */}
      {block.type === 'image' && (
        <div className={styles.styleSection}>
          <div className={styles.styleSectionTitle}>Gambar</div>
          <div className={styles.ctrlRow}>
            <span className={styles.ctrlLabel}>URL</span>
            <input className={styles.ctrlInput} value={p.src || ''} onChange={(e) => up('src', e.target.value)} placeholder="https://..." />
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = await onImageUpload(file);
              if (url) up('src', url);
              e.target.value = '';
            }}
          />
          <div className={styles.uploadZone} onClick={() => fileRef.current?.click()}>
            <Upload size={18} />
            <span>Upload dari perangkat</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className={styles.ctrlRow}>
              <span className={styles.ctrlLabel}>Alt</span>
              <input className={styles.ctrlInput} value={p.alt || ''} onChange={(e) => up('alt', e.target.value)} placeholder="Deskripsi" />
            </div>
            <NumericInput label="Sudut" value={p.borderRadius || 8} onChange={(v) => up('borderRadius', v)} min={0} max={32} step={1} unit="px" />
            <div className={styles.ctrlRow}><span className={styles.ctrlLabel}>Posisi</span><AlignButtons value={p.align} onChange={(v) => up('align', v)} /></div>
          </div>
        </div>
      )}

      {/* Button */}
      {block.type === 'button' && (
        <div className={styles.styleSection}>
          <div className={styles.styleSectionTitle}>Tombol</div>
          <div className={styles.ctrlRow}>
            <span className={styles.ctrlLabel}>Label</span>
            <input className={styles.ctrlInput} value={p.label || ''} onChange={(e) => up('label', e.target.value)} />
          </div>
          <div className={styles.ctrlRow}>
            <span className={styles.ctrlLabel}>Link</span>
            <input className={styles.ctrlInput} value={p.href || ''} onChange={(e) => up('href', e.target.value)} placeholder="https://..." />
          </div>
          <div className={styles.ctrlRow}>
            <span className={styles.ctrlLabel}>Style</span>
            <select className={styles.ctrlSelect} value={p.style || 'filled'} onChange={(e) => up('style', e.target.value)}>
              <option value="filled">Filled</option><option value="outline">Outline</option><option value="ghost">Ghost</option>
            </select>
          </div>
          <div className={styles.ctrlRow}>
            <span className={styles.ctrlLabel}>Warna</span>
            <input type="color" className={styles.ctrlColor} value={p.bgColor || '#6366f1'} onChange={(e) => up('bgColor', e.target.value)} />
            <input className={styles.ctrlInput} value={p.bgColor || '#6366f1'} onChange={(e) => up('bgColor', e.target.value)} style={{ flex: 1 }} />
          </div>
          {p.style !== 'outline' && p.style !== 'ghost' && (
            <div className={styles.ctrlRow}>
              <span className={styles.ctrlLabel}>Teks</span>
              <input type="color" className={styles.ctrlColor} value={p.textColor || '#ffffff'} onChange={(e) => up('textColor', e.target.value)} />
              <input className={styles.ctrlInput} value={p.textColor || '#ffffff'} onChange={(e) => up('textColor', e.target.value)} style={{ flex: 1 }} />
            </div>
          )}
          <NumericInput label="Sudut" value={p.borderRadius || 6} onChange={(v) => up('borderRadius', v)} min={0} max={32} step={1} unit="px" />
          <NumericInput label="Padding X" value={p.paddingX || 24} onChange={(v) => up('paddingX', v)} min={8} max={80} step={2} unit="px" />
          <NumericInput label="Padding Y" value={p.paddingY || 10} onChange={(v) => up('paddingY', v)} min={4} max={40} step={1} unit="px" />
          <NumericInput label="Opacity" value={p.opacity ?? 100} onChange={(v) => up('opacity', v)} min={10} max={100} step={5} unit="%" />
          <div className={styles.ctrlRow}><span className={styles.ctrlLabel}>Posisi</span><AlignButtons value={p.align} onChange={(v) => up('align', v)} /></div>
        </div>
      )}

      {/* Divider */}
      {block.type === 'divider' && (
        <div className={styles.styleSection}>
          <div className={styles.styleSectionTitle}>Garis</div>
          <div className={styles.ctrlRow}>
            <span className={styles.ctrlLabel}>Warna</span>
            <input type="color" className={styles.ctrlColor} value={p.color || '#e5e7eb'} onChange={(e) => up('color', e.target.value)} />
            <input className={styles.ctrlInput} value={p.color || '#e5e7eb'} onChange={(e) => up('color', e.target.value)} style={{ flex: 1 }} />
          </div>
          <NumericInput label="Tebal" value={p.thickness || 1} onChange={(v) => up('thickness', v)} min={1} max={8} step={1} unit="px" />
          <div className={styles.ctrlRow}>
            <span className={styles.ctrlLabel}>Gaya</span>
            <select className={styles.ctrlSelect} value={p.style || 'solid'} onChange={(e) => up('style', e.target.value)}>
              <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
      )}

      {/* Spacer */}
      {block.type === 'spacer' && (
        <div className={styles.styleSection}>
          <div className={styles.styleSectionTitle}>Spacer</div>
          <NumericInput label="Tinggi" value={p.height || 32} onChange={(v) => up('height', v)} min={8} max={200} step={4} unit="px" />
        </div>
      )}

      {/* Columns */}
      {block.type === 'columns' && (
        <div className={styles.styleSection}>
          <div className={styles.styleSectionTitle}>Kolom</div>
          <NumericInput label="Jarak" value={parseInt(p.gap) || 24} onChange={(v) => up('gap', v)} min={8} max={64} step={4} unit="px" />
          <div className={styles.ctrlRow} style={{ alignItems: 'flex-start' }}>
            <span className={styles.ctrlLabel}>Kol 1</span>
            <textarea className={styles.ctrlInput} rows={3} value={p.col1 || ''} onChange={(e) => up('col1', e.target.value)} />
          </div>
          <div className={styles.ctrlRow} style={{ alignItems: 'flex-start' }}>
            <span className={styles.ctrlLabel}>Kol 2</span>
            <textarea className={styles.ctrlInput} rows={3} value={p.col2 || ''} onChange={(e) => up('col2', e.target.value)} />
          </div>
        </div>
      )}

      {/* HTML */}
      {block.type === 'html' && (
        <div className={styles.styleSection}>
          <div className={styles.styleSectionTitle}>HTML</div>
          <textarea className={styles.ctrlInput} rows={8} style={{ fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
            value={p.html || ''} onChange={(e) => up('html', e.target.value)} />
        </div>
      )}

      {/* Block width (Notion-like) */}
      {block.type !== 'spacer' && (
        <div className={styles.styleSection}>
          <div className={styles.styleSectionTitle}>Dimensi</div>
          <NumericInput label="Lebar" value={p.width ?? 100} onChange={(v) => up('width', v)} min={20} max={100} step={5} unit="%" />
          <NumericInput label="Gap" value={p.marginBottom ?? 0} onChange={(v) => up('marginBottom', v)} min={0} max={80} step={4} unit="px" />
          {block.type !== 'divider' && block.type !== 'columns' && (
            <div className={styles.ctrlRow}><span className={styles.ctrlLabel}>Posisi</span><AlignButtons value={p.align} onChange={(v) => up('align', v)} /></div>
          )}
        </div>
      )}

      {/* Spacer gap only */}
      {block.type === 'spacer' && null}
    </>
  );
}

/* ═══════════════════════════════════════
   NavbarPositionEditor
   ═══════════════════════════════════════ */
function NavbarPositionEditor({ page, onChange }) {
  const nav = page.navPosition || { placement: 'hidden' };
  const setNav = (patch) => onChange({ ...page, navPosition: { ...nav, ...patch } });

  return (
    <div className={styles.navSection}>
      <div className={styles.navSectionTitle}>Posisi Navbar</div>
      <div className={styles.radioGroup}>
        <label className={styles.radioItem}>
          <input type="radio" name="navPlace" value="hidden" checked={nav.placement === 'hidden'} onChange={() => setNav({ placement: 'hidden' })} />
          Tersembunyi
        </label>
        <label className={styles.radioItem}>
          <input type="radio" name="navPlace" value="root" checked={nav.placement === 'root'} onChange={() => setNav({ placement: 'root' })} />
          Item utama
        </label>
        <label className={styles.radioItem}>
          <input type="radio" name="navPlace" value="category" checked={nav.placement === 'category'} onChange={() => setNav({ placement: 'category' })} />
          Dalam kategori
        </label>
      </div>
      {nav.placement === 'root' && (
        <div className={styles.navSubInput}>
          <label style={{ fontSize: '0.68rem', color: '#6b7280' }}>Label</label>
          <input className={styles.ctrlInput} value={nav.label || page.title || ''} onChange={(e) => setNav({ label: e.target.value })} />
        </div>
      )}
      {nav.placement === 'category' && (
        <div className={styles.navSubInput}>
          <label style={{ fontSize: '0.68rem', color: '#6b7280' }}>Kategori</label>
          <input className={styles.ctrlInput} value={nav.categoryName || ''} onChange={(e) => setNav({ categoryName: e.target.value })} placeholder="cth: Download" />
          <label style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 2 }}>Label sub-item</label>
          <input className={styles.ctrlInput} value={nav.label || page.title || ''} onChange={(e) => setNav({ label: e.target.value })} />
          <p style={{ fontSize: '0.68rem', color: '#d1d5db', margin: '2px 0 0' }}>Kategori sama digabung otomatis.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   blocks → HTML for save
   ═══════════════════════════════════════ */
function blocksToHtml(blocks) {
  return blocks.map((b) => {
    const p = b.props;
    const w = p.width != null && p.width < 100 ? `width:${p.width}%;${p.align === 'center' ? 'margin:0 auto' : p.align === 'right' ? 'margin-left:auto' : ''}` : '';
    const mb = p.marginBottom ? `margin-bottom:${p.marginBottom}px` : '';
    const wrap = [w, mb].filter(Boolean).join(';');
    if (b.type === 'heading') {
      const tag = p.level || 'h2';
      return `<${tag} style="font-size:${p.fontSize}rem;color:${p.color};font-weight:${p.fontWeight};text-align:${p.align};margin:0;${wrap}">${p.text || ''}</${tag}>`;
    }
    if (b.type === 'paragraph') return `<p style="font-size:${p.fontSize}rem;color:${p.color};line-height:${p.lineHeight};text-align:${p.align};margin:0;${wrap}">${p.text || ''}</p>`;
    if (b.type === 'image') return p.src ? `<div style="text-align:${p.align};${wrap}"><img src="${p.src}" alt="${p.alt || ''}" style="width:100%;border-radius:${p.borderRadius}px;max-width:100%;display:block" /></div>` : '';
    if (b.type === 'button') return `<div style="text-align:${p.align};${wrap}"><a href="${p.href || '#'}" style="display:inline-block;padding:${p.paddingY}px ${p.paddingX}px;background:${p.style === 'filled' ? p.bgColor : 'transparent'};color:${p.style === 'filled' ? p.textColor : p.bgColor};font-size:${p.fontSize}rem;border-radius:${p.borderRadius}px;font-weight:600;text-decoration:none;opacity:${(p.opacity || 100) / 100};${p.style === 'outline' ? `border:2px solid ${p.bgColor}` : 'border:none'}">${p.label || 'Tombol'}</a></div>`;
    if (b.type === 'divider') return `<hr style="border:none;border-top:${p.thickness}px ${p.style} ${p.color};${wrap}" />`;
    if (b.type === 'spacer') return `<div style="height:${p.height}px"></div>`;
    if (b.type === 'columns') return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:${p.gap}px;${wrap}">${p.col1 || ''}${p.col2 || ''}</div>`;
    if (b.type === 'html') return p.html || '';
    return '';
  }).join('\n');
}

/* ═══════════════════════════════════════
   Main: AdminPageBuilderPage
   ═══════════════════════════════════════ */
export default function AdminPageBuilderPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [page, setPage] = useState({ id, title: '', slug: '', description: '', navPosition: { placement: 'hidden' } });
  const [blocks, setBlocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    setLoading(true);
    getSettings()
      .then((res) => {
        const raw = (res.data?.settings || []).find((x) => x.key === 'WEB_EDITOR_CONFIG');
        if (!raw?.value) return;
        try {
          const cfg = JSON.parse(raw.value);
          const found = (cfg.customPages || []).find((p) => p.id === id);
          if (found) {
            setPage({ id: found.id, title: found.title || '', slug: found.slug || '', description: found.description || '', navPosition: found.navPosition || { placement: 'hidden' } });
            setBlocks(found.blocks || []);
          }
        } catch { /* */ }
      })
      .catch(() => toast.error('Gagal memuat'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await getSettings();
      const raw = (res.data?.settings || []).find((x) => x.key === 'WEB_EDITOR_CONFIG');
      let cfg = {};
      try { cfg = JSON.parse(raw?.value || '{}'); } catch { /* */ }
      const newPage = { ...page, blocks, html: blocksToHtml(blocks) };
      const pages = (cfg.customPages || []).map((p) => p.id === id ? newPage : p);
      if (!pages.find((p) => p.id === id)) pages.push(newPage);
      await saveSettings({ key: 'WEB_EDITOR_CONFIG', value: JSON.stringify({ ...cfg, customPages: pages }) });
      toast.success('Tersimpan');
    } catch { toast.error('Gagal menyimpan'); }
    finally { setSaving(false); }
  }, [id, page, blocks]);

  const handleImageUpload = useCallback(async (file) => {
    const loadId = toast.loading('Mengupload...');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await uploadBlogImage(fd);
      toast.dismiss(loadId);
      toast.success('Upload berhasil');
      return res.data?.url || res.data?.path || '';
    } catch {
      toast.dismiss(loadId);
      toast.error('Gagal upload');
      return '';
    }
  }, []);

  const addBlock = useCallback((typeObj) => {
    const newBlock = { id: uid(), type: typeObj.type, props: { ...typeObj.defaultProps } };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
  }, []);

  const updateBlock = useCallback((updated) => {
    setBlocks((prev) => prev.map((b) => b.id === updated.id ? updated : b));
  }, []);

  const deleteBlock = useCallback((blockId) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setSelectedId(null);
  }, []);

  const duplicateBlock = useCallback((blockId) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx < 0) return prev;
      const clone = { ...prev[idx], id: uid(), props: { ...prev[idx].props } };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, []);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (active.id !== over?.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;
  const dragBlock = blocks.find((b) => b.id === activeId);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 8, color: '#9ca3af' }}>
      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Memuat...
    </div>
  );

  return (
    <div className={styles.root}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <Link to="/admin/desain?tab=halaman" className={styles.topbarBack}><ArrowLeft size={14} /> Kembali</Link>
        <span style={{ color: '#e5e7eb' }}>|</span>
        <span className={styles.topbarTitle}>{page.title || 'Tanpa Judul'}</span>
        <span className={styles.topbarSlug}>/p/{page.slug || '...'}</span>
        <div className={styles.topbarActions}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPreviewing(true)} style={{ gap: 5, fontSize: '0.78rem' }}>
            <Eye size={14} /> Pratinjau
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{ gap: 5, fontSize: '0.78rem' }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Simpan
          </button>
        </div>
      </div>

      <div className={styles.panels}>
        {/* Left: Palette */}
        <div className={styles.palette}>
          <div className={styles.paletteHead}>Elemen</div>
          {BLOCK_TYPES.map((group) => (
            <div key={group.group} className={styles.paletteGroup}>
              <div className={styles.paletteGroupLabel}>{group.group}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.type} className={styles.paletteItem} onClick={() => addBlock(item)}>
                    <Icon size={14} /> {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Center: Canvas */}
        <div className={styles.canvasArea} onClick={() => setSelectedId(null)}>
          <div className={styles.canvasFrame}>
            <DndContext sensors={sensors} collisionDetection={closestCenter}
              onDragStart={({ active }) => setActiveId(active.id)} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.length === 0 ? (
                  <div className={styles.canvasEmpty}>
                    <Type size={28} />
                    <span>Klik elemen di kiri untuk menambahkan</span>
                  </div>
                ) : blocks.map((block) => (
                  <SortableBlock key={block.id} block={block} selected={selectedId === block.id}
                    onSelect={setSelectedId} onDelete={deleteBlock} onDuplicate={duplicateBlock} />
                ))}
              </SortableContext>
              <DragOverlay>
                {dragBlock && (
                  <div className={`${styles.block} ${styles.dragOverlay}`} style={{ padding: '8px 10px', background: '#fff' }}>
                    <BlockPreview block={dragBlock} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        {/* Right: Inspector */}
        <div className={styles.stylePanel}>
          <div className={styles.stylePanelHead}>
            {selectedBlock ? `Edit: ${selectedBlock.type}` : 'Pengaturan'}
          </div>

          {!selectedBlock && (
            <div className={styles.metaSection}>
              <div className={styles.metaField}>
                <label>Judul</label>
                <input value={page.title} onChange={(e) => setPage((prev) => ({ ...prev, title: e.target.value, slug: prev.slug || slugify(e.target.value) }))} />
              </div>
              <div className={styles.metaField}>
                <label>Slug</label>
                <input className={styles.metaSlug} value={page.slug} onChange={(e) => setPage((prev) => ({ ...prev, slug: slugify(e.target.value) }))} />
                <small style={{ fontSize: '0.65rem', color: '#d1d5db' }}>/p/{page.slug || '...'}</small>
              </div>
              <div className={styles.metaField}>
                <label>Deskripsi</label>
                <textarea rows={2} value={page.description} onChange={(e) => setPage((prev) => ({ ...prev, description: e.target.value }))} placeholder="Deskripsi SEO..." />
              </div>
            </div>
          )}

          {!selectedBlock && <NavbarPositionEditor page={page} onChange={setPage} />}

          <StyleEditor block={selectedBlock} onChange={updateBlock} onImageUpload={handleImageUpload} />
        </div>
      </div>

      {/* Preview Overlay */}
      {previewing && (
        <div className={styles.previewOverlay}>
          <div className={styles.previewTopbar}>
            <span>Pratinjau: {page.title}</span>
            <button onClick={() => setPreviewing(false)} style={{ background: 'none', border: 'none', color: '#f9fafb', cursor: 'pointer', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
          <div className={styles.previewContent}>
            {blocks.map((block) => <BlockPreview key={block.id} block={block} />)}
            {blocks.length === 0 && <p style={{ textAlign: 'center', color: '#d1d5db' }}>Halaman kosong</p>}
          </div>
        </div>
      )}
    </div>
  );
}

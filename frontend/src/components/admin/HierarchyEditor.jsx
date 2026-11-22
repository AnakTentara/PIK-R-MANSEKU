import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  X, Plus, GripVertical, Pencil, Trash2, RotateCcw,
  ArrowUp, ArrowDown, Layers, Loader2, Check, Sparkles, Tag, ChevronDown, Info
} from 'lucide-react';
import { saveOrgPositions, resetOrgPositions } from '@/api/admin';
import { useUIStore } from '@/stores/uiStore';
import styles from './HierarchyEditor.module.css';

const ROLE_OPTIONS = [
  { value: 'PEMBINA', label: 'Pembina', tone: 'pembina', desc: 'Penasihat & pembimbing' },
  { value: 'KETUA', label: 'Ketua', tone: 'ketua', desc: 'Pimpinan tertinggi' },
  { value: 'WAKIL', label: 'Wakil', tone: 'wakil', desc: 'Wakil pimpinan' },
  { value: 'KABINET', label: 'Kabinet / Pengurus', tone: 'kabinet', desc: 'Koordinator bidang' },
  { value: 'ANGGOTA', label: 'Anggota', tone: 'anggota', desc: 'Staff / anggota bidang' }
];

const ROLE_TONE = {
  PEMBINA: 'pembina',
  KETUA: 'ketua',
  WAKIL: 'wakil',
  KABINET: 'kabinet',
  ANGGOTA: 'anggota'
};

/** Smart preset generator untuk deskripsi, tag, dan sebutan anggota */
function generateSuggestions(title, role) {
  const t = (title || '').toLowerCase().trim();
  let description = '';
  let tags = [];
  let memberTitle = '';

  const cleanBidang = title.replace(/^(koordinator|ketua bidang|ketua|kepala)\s+/i, '').trim();

  if (/pdd|medinfo|media|publikasi|dokumentasi|desain/i.test(t)) {
    description = 'Mengkoordinir divisi Publikasi, Dekorasi, dan Dokumentasi (PDD) dalam peliputan kegiatan, desain visual, konten media sosial, dan materi promosi PIK-R.';
    tags = ['pdd', 'medinfo', 'media', 'publikasi', 'dokumentasi', 'desain', 'konten', 'sosmed', 'fotografi'];
    memberTitle = 'Anggota PDD';
  } else if (/konselor|curhat|mental/i.test(t)) {
    description = 'Mengkoordinir layanan konseling teman sebaya, mendengarkan curhat remaja, menjaga kerahasiaan konseling, dan kesehatan mental remaja.';
    tags = ['konselor', 'konseling', 'curhat', 'teman sebaya', 'mental health', 'konseling remaja'];
    memberTitle = 'Anggota Konselor Sebaya';
  } else if (/pendidik|edukasi|sosialisasi|genre/i.test(t)) {
    description = 'Mengkoordinir kegiatan penyuluhan sebaya, sosialisasi kesehatan reproduksi, gizi remaja, pencegahan stunting, dan substansi GenRe.';
    tags = ['pendidik', 'edukasi', 'pendidik sebaya', 'sosialisasi', 'materi genre', 'penyuluhan'];
    memberTitle = 'Anggota Pendidik Sebaya';
  } else if (/humas|hubungan masyarakat|eksternal|pr\b/i.test(t)) {
    description = 'Membangun relasi kemitraan dengan pihak sekolah, BKKBN, instansi luar, alumni, dan komunikasi kemasyarakatan.';
    tags = ['humas', 'hubungan masyarakat', 'eksternal', 'pr', 'public relations', 'kemitraan'];
    memberTitle = 'Anggota Humas';
  } else if (/kie|informasi/i.test(t)) {
    description = 'Mengembangkan media literasi remaja, modul informasi, leaflet, majalah dinding edukatif, dan materi wawasan remaja.';
    tags = ['kie', 'informasi', 'edukasi', 'literasi', 'mading', 'buletin'];
    memberTitle = 'Anggota Informasi';
  } else if (/pendamping/i.test(t)) {
    description = 'Mengkoordinir pendampingan khusus kasus sebaya, fasilitasi ruang cerita, dan koordinasi dengan Guru BK.';
    tags = ['pendamping', 'pendampingan', 'bk', 'advokasi', 'ruang cerita'];
    memberTitle = 'Anggota Konseling dan Pendamping';
  } else if (/acara|kegiatan|event/i.test(t)) {
    description = 'Merencanakan, menyusun konsep, dan mengeksekusi jalannya seluruh rangkaian kegiatan, webinar, serta program kerja PIK-R.';
    tags = ['acara', 'kegiatan', 'event', 'proker', 'sie acara'];
    memberTitle = `Anggota Sie ${cleanBidang || 'Acara'}`;
  } else if (/logistik|perlengkapan|sarpras/i.test(t)) {
    description = 'Mengelola penyediaan perlengkapan, tata ruang acara, inventaris alat, dan kebutuhan operasional teknis kegiatan.';
    tags = ['logistik', 'perlengkapan', 'alat', 'sarpras', 'inventaris'];
    memberTitle = `Anggota Sie ${cleanBidang || 'Perlengkapan'}`;
  } else if (/sekretaris/i.test(t)) {
    description = 'Mengelola administrasi persuratan, pengarsipan dokumen resmi, proposal, dan notulensi rapat organisasi.';
    tags = ['sekretaris', 'sekre', 'admin', 'surat', 'proposal'];
  } else if (/bendahara|keuangan|kas\b/i.test(t)) {
    description = 'Mengatur sirkulasi keuangan organisasi, pencatatan kas masuk dan keluar, serta transparansi anggaran kegiatan.';
    tags = ['bendahara', 'uang', 'kas', 'keuangan', 'finance', 'bendum'];
  } else if (/ketua umum|ketua/i.test(t)) {
    description = 'Pemimpin tertinggi PIK-R MANSEKU, bertanggung jawab atas seluruh kebijakan, program kerja, dan koordinasi internal serta eksternal.';
    tags = ['ketua', 'ketum', 'pimpinan', 'leader', 'ketua umum'];
  } else if (/wakil/i.test(t)) {
    description = 'Mendampingi Ketua Umum dalam koordinasi bidang organisasi, pembinaan divisi, dan evaluasi program kerja.';
    tags = ['wakil', 'waka', 'wakil ketua'];
  } else if (/pembina/i.test(t)) {
    description = 'Membimbing, mengarahkan, dan mengawasi jalannya seluruh kegiatan dan kepengurusan PIK-R MANSEKU.';
    tags = ['pembina', 'pembimbing', 'guru', 'penasihat'];
  } else {
    description = `Bertanggung jawab dalam menjalankan program kerja dan koordinasi ${title} pada PIK-R MANSEKU.`;
    tags = [t, 'divisi', 'pengurus'];
    memberTitle = `Anggota ${cleanBidang || title}`;
  }

  if (role === 'ANGGOTA' && !description.toLowerCase().startsWith('staff')) {
    description = `Staff pelaksana dan pendukung operasional pada divisi ${cleanBidang || title}.`;
  }

  return { description, tags, memberTitle };
}

/** Kelompokkan jabatan non-anggota per level (baris hierarki). Anggota bidang menempel ke induknya. */
function toLevels(list) {
  const tops = list.filter((p) => !p.parent);
  const levels = [...new Set(tops.map((p) => p.level))].sort((a, b) => a - b);
  return levels.map((lv) => ({
    level: lv,
    items: tops.filter((p) => p.level === lv).sort((a, b) => a.order - b.order)
  }));
}

/** Role Selector Pill Component dengan Popover Menarik */
function RoleBadgePicker({ role, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const current = ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[3];

  return (
    <div className={styles.roleBadgeContainer} ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className={`${styles.roleBadgeBtn} ${styles[`badge_${current.tone}`]}`}
        onClick={() => setOpen(!open)}
        title="Klik untuk mengganti peran/kategori"
      >
        <span>{current.label}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className={styles.rolePopover}>
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.roleOptionItem} ${opt.value === role ? styles.roleOptionActive : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {opt.value === role && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Sub-Modal: Tambah atau Edit Jabatan Lengkap */
function PositionFormModal({ mode, initialData, levels, existingLabels, onClose, onSave }) {
  const [form, setForm] = useState({
    label: '',
    role: 'KABINET',
    unique: true,
    parent: '',
    level: 5,
    description: '',
    tags: [],
    createMemberTitle: false,
    memberTitle: '',
    ...initialData
  });

  const [tagInput, setTagInput] = useState('');

  // Auto-generate helper
  const handleAutoSuggest = () => {
    if (!form.label.trim()) return toast.error('Ketik nama jabatan terlebih dahulu');
    const sugg = generateSuggestions(form.label, form.role);
    setForm((prev) => ({
      ...prev,
      description: sugg.description,
      tags: Array.from(new Set([...prev.tags, ...sugg.tags])),
      memberTitle: prev.memberTitle || sugg.memberTitle
    }));
    toast.success('Saran deskripsi dan tag diterapkan!');
  };

  const handleAddTag = () => {
    const val = tagInput.replace(/[#\s]/g, ' ').trim().toLowerCase();
    if (!val) return;
    const parts = val.split(',').map((p) => p.trim()).filter(Boolean);
    setForm((prev) => ({
      ...prev,
      tags: Array.from(new Set([...prev.tags, ...parts]))
    }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove)
    }));
  };

  const handleKeyDownTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const label = form.label.replace(/\s+/g, ' ').trim();
    if (!label) return toast.error('Nama jabatan wajib diisi');

    const isDuplicate = existingLabels.some(
      (x) => x.toLowerCase() === label.toLowerCase() && (!initialData?.was || x.toLowerCase() !== initialData.was.toLowerCase())
    );
    if (isDuplicate) return toast.error(`Jabatan "${label}" sudah ada`);

    onSave({
      ...form,
      label,
      tags: form.tags,
      description: form.description.trim()
    });
  };

  // Daftar calon parent (jabatan non-anggota)
  const parentCandidates = levels
    .flatMap((l) => l.items)
    .filter((p) => p.label !== form.label);

  return createPortal(
    <div className={styles.subOverlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.subModal} role="dialog" aria-modal="true">
        <div className={styles.subHead}>
          <h4>
            <Layers size={18} />
            {mode === 'edit' ? `Edit Jabatan: ${initialData?.label}` : 'Tambah Jabatan Baru'}
          </h4>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nama Jabatan */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <span>Nama Jabatan / Posisi</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Maks. 60 karakter</span>
            </label>
            <input
              autoFocus
              className={styles.fieldInput}
              placeholder="Contoh: Koordinator PDD, Anggota PDD, dsb."
              maxLength={60}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />
          </div>

          {/* Kategori / Peran */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Peran & Kategori Struktur</label>
            <div className={styles.roleCardsGrid}>
              {ROLE_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  className={`${styles.roleCardRadio} ${form.role === opt.value ? styles.roleCardActive : ''}`}
                  onClick={() => {
                    const isAnggota = opt.value === 'ANGGOTA';
                    setForm({
                      ...form,
                      role: opt.value,
                      unique: isAnggota ? false : form.unique
                    });
                  }}
                >
                  <div>{opt.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sifat Pemegang (Tunggal vs Jamak) */}
          <div className={styles.uniqueToggleRow}>
            <div className={styles.uniqueInfo}>
              <h5>Sifat Jabatan</h5>
              <p>{form.unique ? 'Jabatan tunggal (hanya 1 pemegang aktif)' : 'Jabatan jamak (bisa banyak anggota)'}</p>
            </div>
            <button
              type="button"
              className={`${styles.switchBtn} ${form.unique ? styles.switchBtnActive : ''}`}
              onClick={() => setForm({ ...form, unique: !form.unique })}
            >
              {form.unique ? '1 Orang Saja' : 'Banyak Orang'}
            </button>
          </div>

          {/* Pilihan Induk (Parent) jika Anggota */}
          {form.role === 'ANGGOTA' && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Jabatan Induk / Koordinator</label>
              <select
                className={styles.fieldInput}
                value={form.parent || ''}
                onChange={(e) => setForm({ ...form, parent: e.target.value })}
              >
                <option value="">-- Berdiri Sendiri (Tanpa Induk) --</option>
                {parentCandidates.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
              <span className={styles.hintText}>Anggota bidang akan mengelompok di bawah jabatan induknya pada bagan.</span>
            </div>
          )}

          {/* Opsi Buat Sebutan Anggota Otomatis jika Create Kabinet/Koordinator */}
          {mode === 'create' && form.role === 'KABINET' && (
            <div style={{ padding: '10px 14px', borderRadius: 14, background: 'var(--color-surface-2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.createMemberTitle}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm({
                      ...form,
                      createMemberTitle: checked,
                      memberTitle: checked ? (form.memberTitle || `Anggota ${form.label.replace(/^(koordinator|ketua bidang|ketua|kepala)\s+/i, '').trim()}`) : ''
                    });
                  }}
                />
                <span>Sertakan posisi Anggota untuk divisi ini?</span>
              </label>
              {form.createMemberTitle && (
                <div style={{ marginTop: 2 }}>
                  <input
                    className={styles.fieldInput}
                    placeholder="Contoh: Anggota PDD"
                    value={form.memberTitle}
                    onChange={(e) => setForm({ ...form, memberTitle: e.target.value })}
                  />
                  <span className={styles.hintText}>Posisi anggota ini akan otomatis dibuat dan menempel di bawah jabatan ini.</span>
                </div>
              )}
            </div>
          )}

          {/* Deskripsi Jabatan & Divisi */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>
              <span>Deskripsi Tugas & Fungsi</span>
              <button type="button" className={styles.magicBtn} onClick={handleAutoSuggest} title="Generate deskripsi dan tag otomatis berdasarkan nama">
                <Sparkles size={12} /> Saran Otomatis
              </button>
            </div>
            <textarea
              className={styles.fieldTextarea}
              placeholder="Deskripsi tugas dan tanggung jawab divisi/jabatan ini..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Tag & Alias untuk Bot WA */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>
              <span>Tag & Alias Bot WA (/divisi)</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Tekan Enter atau Koma</span>
            </div>
            <div className={styles.tagBox} onClick={() => document.getElementById('tag-input-field')?.focus()}>
              {form.tags.map((t) => (
                <span key={t} className={styles.tagChip}>
                  #{t}
                  <span className={styles.tagChipClose} onClick={(e) => { e.stopPropagation(); handleRemoveTag(t); }}>
                    <X size={10} />
                  </span>
                </span>
              ))}
              <input
                id="tag-input-field"
                className={styles.tagInlineInput}
                placeholder={form.tags.length === 0 ? "Ketik alias bot WA, misal: pdd, medinfo, desain..." : "Tambah tag..."}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDownTag}
                onBlur={handleAddTag}
              />
            </div>
            <p className={styles.hintText}>
              💡 Bot WhatsApp menggunakan tag ini untuk mencocokkan kata kunci saat anggota mengetik perintah <code>/divisi [nama]</code>.
            </p>
          </div>

          {/* Tombol Aksi */}
          <div className={styles.subActions}>
            <button type="button" className={styles.ghost} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.primary}>
              <Check size={16} /> {mode === 'edit' ? 'Perbarui Posisi' : 'Tambahkan Posisi'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/**
 * Editor hierarki jabatan: seret kartu jabatan ke baris lain (atau ke sebelah jabatan lain = berdampingan),
 * ubah nama, deskripsi, tag, tambah jabatan baru dengan modal lengkap, hapus yang tidak dipakai.
 */
export default function HierarchyEditor({ open, positions, onClose, onSaved }) {
  const [list, setList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingInline, setEditingInline] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [activeModal, setActiveModal] = useState(null); // null | { mode: 'create' | 'edit', data: {...} }

  const openConfirm = useUIStore((st) => st.openConfirm);
  const drag = useRef(null);
  const [over, setOver] = useState(null);

  useEffect(() => {
    if (!open) return;
    setList(
      positions.map(({ holders, ...p }) => ({
        ...p,
        was: p.was || p.label,
        tags: Array.isArray(p.tags) ? p.tags : typeof p.tags === 'string' ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        description: p.description || ''
      }))
    );
    setActiveModal(null);
  }, [open, positions]);

  const holdersOf = useMemo(
    () => Object.fromEntries(positions.map((p) => [p.label, p.holders || []])),
    [positions]
  );
  const levels = useMemo(() => toLevels(list), [list]);
  const childrenOf = (label) => list.filter((p) => p.parent === label);

  if (!open) return null;

  /* ── Mutasi (selalu menormalkan level 1..n dan urutan 1..m) ── */
  const normalize = (arr) => {
    const tops = arr.filter((p) => !p.parent);
    const lv = [...new Set(tops.map((p) => p.level))].sort((a, b) => a - b);
    const map = new Map(lv.map((v, i) => [v, i + 1]));
    const next = arr.map((p) => (p.parent ? p : { ...p, level: map.get(p.level) }));
    lv.forEach((old) => {
      next
        .filter((p) => !p.parent && p.level === map.get(old))
        .sort((a, b) => a.order - b.order)
        .forEach((p, i) => {
          p.order = i + 1;
        });
    });
    // Anggota bidang ikut level & urutan induknya
    return next.map((p) => {
      if (!p.parent) return p;
      const parent = next.find((x) => x.label === p.parent);
      return parent ? { ...p, level: parent.level, order: parent.order } : p;
    });
  };

  const move = (label, toLevel, toIndex) => {
    setList((cur) => {
      const arr = cur.map((p) => ({ ...p }));
      const item = arr.find((p) => p.label === label);
      if (!item) return cur;
      const lvItems = arr
        .filter((p) => !p.parent && p.level === toLevel && p.label !== label)
        .sort((a, b) => a.order - b.order);
      item.level = toLevel;
      lvItems.splice(Math.max(0, Math.min(toIndex, lvItems.length)), 0, item);
      lvItems.forEach((p, i) => {
        p.order = i + 1;
      });
      return normalize(arr);
    });
  };

  const moveToNewLevel = (label, beforeLevel) => {
    setList((cur) => {
      const arr = cur.map((p) => ({ ...p }));
      const item = arr.find((p) => p.label === label);
      if (!item) return cur;
      const maxLevel = Math.max(0, ...arr.filter((p) => !p.parent).map((p) => p.level));
      item.level = beforeLevel == null ? maxLevel + 1 : beforeLevel - 0.5;
      item.order = 1;
      return normalize(arr);
    });
  };

  const nudge = (label, dir) => {
    const item = list.find((p) => p.label === label);
    if (!item) return;
    const lv = levels.findIndex((l) => l.level === item.level);
    const target = levels[lv + dir];
    if (target) move(label, target.level, target.items.length);
    else moveToNewLevel(label, dir < 0 ? levels[0].level : null);
  };

  const startInlineEdit = (p) => {
    setEditingInline(p.label);
    setDraftName(p.label);
  };

  const commitInlineEdit = (p) => {
    const name = draftName.replace(/\s+/g, ' ').trim();
    setEditingInline(null);
    if (!name || name === p.label) return;
    if (list.some((x) => x.label.toLowerCase() === name.toLowerCase() && x.label !== p.label)) {
      return toast.error('Nama jabatan sudah ada.');
    }
    setList((cur) =>
      cur.map((x) =>
        x.label === p.label ? { ...x, label: name } : x.parent === p.label ? { ...x, parent: name } : x
      )
    );
  };

  const setRole = (label, role) => {
    setList((cur) =>
      cur.map((x) =>
        x.label === label ? { ...x, role, unique: role === 'ANGGOTA' ? false : x.unique } : x
      )
    );
  };

  const toggleUnique = (label) => {
    setList((cur) => cur.map((x) => (x.label === label ? { ...x, unique: !x.unique } : x)));
  };

  const remove = (p) => {
    const kids = childrenOf(p.label);
    if ((holdersOf[p.was] || []).length) {
      return toast.error(`"${p.label}" masih dipegang ${holdersOf[p.was][0].name}. Pindahkan dulu pengurusnya.`);
    }
    for (const k of kids) {
      if ((holdersOf[k.was] || []).length) {
        return toast.error(`Anggota bidang "${k.label}" masih dipegang pengurus aktif.`);
      }
    }
    setList((cur) => normalize(cur.filter((x) => x.label !== p.label && x.parent !== p.label)));
    toast.success(`Jabatan "${p.label}" dihapus`);
  };

  /* ── Penanganan Simpan dari Sub-Modal ── */
  const handleSaveSubModal = (formData) => {
    if (activeModal.mode === 'create') {
      const targetLevel = activeModal.targetLevel || (levels.length ? levels[levels.length - 1].level : 1);
      const peers = list.filter((p) => !p.parent && p.level === targetLevel);
      const newItems = [
        {
          label: formData.label,
          role: formData.role,
          unique: formData.unique,
          level: targetLevel,
          order: peers.length + 1,
          group: formData.role === 'PEMBINA' ? 'Pembina' : formData.role === 'ANGGOTA' ? 'Anggota Bidang' : 'Ketua Bidang',
          parent: formData.role === 'ANGGOTA' ? formData.parent : undefined,
          description: formData.description,
          tags: formData.tags
        }
      ];

      // Jika user memilih buat anggota sebutan otomatis
      if (formData.createMemberTitle && formData.memberTitle) {
        newItems.push({
          label: formData.memberTitle,
          role: 'ANGGOTA',
          unique: false,
          level: targetLevel,
          order: peers.length + 1,
          group: 'Anggota Bidang',
          parent: formData.label,
          description: `Staff pelaksana dan anggota pada ${formData.label}.`,
          tags: [`anggota ${formData.label.toLowerCase()}`, ...formData.tags]
        });
      }

      setList((cur) => normalize([...cur, ...newItems]));
      toast.success(`Jabatan "${formData.label}" ditambahkan`);
    } else {
      // Edit existing
      setList((cur) =>
        cur.map((x) => {
          if (x.label === activeModal.data.label) {
            return {
              ...x,
              label: formData.label,
              role: formData.role,
              unique: formData.unique,
              parent: formData.parent,
              description: formData.description,
              tags: formData.tags
            };
          }
          if (x.parent === activeModal.data.label) {
            return { ...x, parent: formData.label };
          }
          return x;
        })
      );
      toast.success(`Jabatan "${formData.label}" diperbarui`);
    }
    setActiveModal(null);
  };

  /* ── Drag & Drop ── */
  const onDragStart = (label) => (e) => {
    drag.current = label;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', label);
  };
  const onDrop = (level, index) => (e) => {
    e.preventDefault();
    if (drag.current) move(drag.current, level, index);
    drag.current = null;
    setOver(null);
  };
  const allow = (key) => (e) => {
    e.preventDefault();
    setOver(key);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = list.map((p) => ({
        label: p.label,
        role: p.role,
        unique: p.unique,
        level: p.level,
        order: p.order,
        parent: p.parent,
        description: p.description || '',
        tags: p.tags || [],
        was: p.was !== p.label ? p.was : undefined
      }));
      const res = await saveOrgPositions(payload);
      const renamed = res.data.renamed || [];
      toast.success(
        renamed.length
          ? `Disimpan. ${renamed.reduce((n, r) => n + r.count, 0)} pengurus aktif ikut berganti nama jabatan.`
          : 'Hierarki jabatan berhasil disimpan'
      );
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan hierarki');
    } finally {
      setSaving(false);
    }
  };

  const reset = () =>
    openConfirm({
      title: 'Kembalikan hierarki ke bawaan?',
      message:
        'Susunan dan nama jabatan kembali seperti semula. Data pengurus tidak berubah, tetapi jabatan yang namanya sudah Anda ganti harus dipindahkan dulu bila masih dipegang.',
      onConfirm: async () => {
        try {
          await resetOrgPositions();
          toast.success('Hierarki dikembalikan ke bawaan');
          onSaved();
          onClose();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal mengembalikan');
        }
      }
    });

  const Card = ({ p }) => {
    const holders = holdersOf[p.was] || [];
    const kids = childrenOf(p.label);
    const isInlineEditing = editingInline === p.label;

    return (
      <div
        className={`${styles.card} ${styles[ROLE_TONE[p.role]]}`}
        draggable={!isInlineEditing}
        onDragStart={onDragStart(p.label)}
        onDragEnd={() => {
          drag.current = null;
          setOver(null);
        }}
      >
        <div className={styles.cardTop}>
          <GripVertical size={16} className={styles.grip} />
          {isInlineEditing ? (
            <input
              className={styles.nameInput}
              autoFocus
              value={draftName}
              maxLength={60}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => commitInlineEdit(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitInlineEdit(p);
                if (e.key === 'Escape') setEditingInline(null);
              }}
            />
          ) : (
            <b
              className={styles.cardName}
              onDoubleClick={() => startInlineEdit(p)}
              title="Klik 2x untuk ganti nama cepat, atau klik ikon pensil untuk info lengkap"
            >
              {p.label}
            </b>
          )}
        </div>

        {/* Meta Bar: Modern Role Selector & Unique Button */}
        <div className={styles.meta}>
          <RoleBadgePicker role={p.role} onChange={(r) => setRole(p.label, r)} />
          <button
            type="button"
            className={`${styles.pill} ${p.unique ? styles.pillOn : ''}`}
            onClick={() => toggleUnique(p.label)}
            title="Jabatan tunggal: hanya satu pemegang aktif"
          >
            {p.unique ? '1 orang' : 'banyak'}
          </button>
        </div>

        {/* Tags Preview */}
        {p.tags && p.tags.length > 0 && (
          <div className={styles.cardTags} title={`Tag bot WA: ${p.tags.join(', ')}`}>
            {p.tags.slice(0, 3).map((t) => (
              <span key={t} className={styles.cardTag}>#{t}</span>
            ))}
            {p.tags.length > 3 && <span className={styles.cardTag}>+{p.tags.length - 3}</span>}
          </div>
        )}

        {/* Holders */}
        <span className={styles.holder} title={holders.map((h) => h.name).join(', ')}>
          {holders.length ? holders.map((h) => h.name).join(', ') : 'Kosong'}
        </span>

        {/* Children (Anggota) */}
        {kids.length > 0 && (
          <div className={styles.kids}>
            {kids.map((k) => (
              <span key={k.label} className={styles.kid} title={`Sub-jabatan: ${k.label}`}>
                {k.label} <em>{(holdersOf[k.was] || []).length}</em>
              </span>
            ))}
          </div>
        )}

        {/* Tools Actions */}
        <div className={styles.tools}>
          <button type="button" onClick={() => nudge(p.label, -1)} title="Naikkan satu baris">
            <ArrowUp size={14} />
          </button>
          <button type="button" onClick={() => nudge(p.label, 1)} title="Turunkan satu baris">
            <ArrowDown size={14} />
          </button>
          <button
            type="button"
            onClick={() => setActiveModal({ mode: 'edit', data: { ...p } })}
            title="Edit Detail, Deskripsi & Tag Bot WA"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => remove(p)}
            title="Hapus jabatan"
            className={styles.del}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const totalPositions = list.length;
  const existingLabels = list.map((p) => p.label);

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className={`${styles.modal} modal-shell modal-padded`} role="dialog" aria-modal="true" aria-label="Atur hierarki jabatan">
        {/* Header */}
        <div className={styles.head}>
          <div className={styles.headTitle}>
            <h3><Layers size={20} /> Atur Hierarki Jabatan</h3>
            <span className={styles.badgeStats}>{totalPositions} Jabatan • {levels.length} Baris</span>
          </div>
          <div className={styles.headRight}>
            <button
              type="button"
              className={styles.btnCreate}
              onClick={() => setActiveModal({ mode: 'create', targetLevel: levels.length ? levels[levels.length - 1].level : 1, data: {} })}
            >
              <Plus size={15} /> Tambah Jabatan Baru
            </button>
            <button className={styles.close} onClick={onClose} aria-label="Tutup">
              <X size={18} />
            </button>
          </div>
        </div>

        <p className={styles.help}>
          Seret kartu ke baris lain, atau ke samping kartu lain agar <b>berdampingan</b>. Klik ikon <b>pensil</b> pada kartu untuk mengatur Deskripsi tugas & Tag alias perintah <code>/divisi</code> WhatsApp Bot.
        </p>

        {/* Board Hierarki */}
        <div className={styles.board}>
          {levels.map((lv, li) => (
            <div key={lv.level} className={styles.level}>
              <div className={styles.levelHeader}>
                <span className={styles.levelTag}>Baris {li + 1} ({lv.items.length} jabatan)</span>
              </div>
              <div className={styles.row}>
                {lv.items.map((p, i) => (
                  <div key={p.label} className={styles.slot}>
                    <div
                      className={`${styles.gap} ${over?.level === lv.level && over?.index === i ? styles.gapOn : ''}`}
                      onDragOver={allow({ level: lv.level, index: i })}
                      onDragLeave={() => setOver(null)}
                      onDrop={onDrop(lv.level, i)}
                    />
                    <Card p={p} />
                  </div>
                ))}
                <div
                  className={`${styles.gap} ${styles.gapEnd} ${over?.level === lv.level && over?.index === lv.items.length ? styles.gapOn : ''}`}
                  onDragOver={allow({ level: lv.level, index: lv.items.length })}
                  onDragLeave={() => setOver(null)}
                  onDrop={onDrop(lv.level, lv.items.length)}
                />
                <button
                  type="button"
                  className={styles.addHere}
                  onClick={() => setActiveModal({ mode: 'create', targetLevel: lv.level, data: {} })}
                  title="Tambah jabatan di baris ini"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Zona buat baris baru */}
          <div
            className={`${styles.newLevel} ${over?.newLevel ? styles.gapOn : ''}`}
            onDragOver={allow({ newLevel: true })}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (drag.current) moveToNewLevel(drag.current, null);
              drag.current = null;
              setOver(null);
            }}
          >
            Seret & Lepas kartu di sini untuk membuat Baris Baru di paling bawah
          </div>
        </div>

        {/* Actions Bar */}
        <div className={`${styles.actions} modal-bar`}>
          <button type="button" className={styles.ghost} onClick={reset} disabled={saving}>
            <RotateCcw size={15} /> Kembalikan bawaan
          </button>
          <span className={styles.spacer} />
          <button type="button" className={styles.ghost} onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button type="button" className={styles.primary} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : <Check size={16} />} Simpan hierarki
          </button>
        </div>

        {/* Sub-Modal Tambah / Edit */}
        {activeModal && (
          <PositionFormModal
            mode={activeModal.mode}
            initialData={activeModal.data}
            levels={levels}
            existingLabels={existingLabels}
            onClose={() => setActiveModal(null)}
            onSave={handleSaveSubModal}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { X, Plus, GripVertical, Pencil, Trash2, RotateCcw, ArrowUp, ArrowDown, Layers, Loader2, Check } from 'lucide-react';
import { saveOrgPositions, resetOrgPositions } from '@/api/admin';
import { useUIStore } from '@/stores/uiStore';
import styles from './HierarchyEditor.module.css';

const ROLE_OPTIONS = [
  { value: 'PEMBINA', label: 'Pembina' },
  { value: 'KETUA', label: 'Ketua' },
  { value: 'WAKIL', label: 'Wakil' },
  { value: 'KABINET', label: 'Kabinet / Pengurus' },
  { value: 'ANGGOTA', label: 'Anggota' }
];
const ROLE_TONE = { PEMBINA: 'pembina', KETUA: 'ketua', WAKIL: 'wakil', KABINET: 'kabinet', ANGGOTA: 'anggota' };

/** Kelompokkan jabatan non-anggota per level (baris hierarki). Anggota bidang menempel ke induknya. */
function toLevels(list) {
  const tops = list.filter((p) => !p.parent);
  const levels = [...new Set(tops.map((p) => p.level))].sort((a, b) => a - b);
  return levels.map((lv) => ({ level: lv, items: tops.filter((p) => p.level === lv).sort((a, b) => a.order - b.order) }));
}

/**
 * Editor hierarki jabatan: seret kartu jabatan ke baris lain (atau ke sebelah jabatan lain = berdampingan),
 * ubah nama, tambah jabatan baru, hapus yang tidak dipakai. Disimpan sekaligus; pengurus aktif ikut berganti
 * nama bila nama jabatan diubah.
 */
export default function HierarchyEditor({ open, positions, onClose, onSaved }) {
  const [list, setList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // label sedang diedit
  const [draftName, setDraftName] = useState('');
  const [adding, setAdding] = useState(null); // { level }
  const [newForm, setNewForm] = useState({ label: '', role: 'KABINET' });
  const openConfirm = useUIStore((st) => st.openConfirm);
  const drag = useRef(null);
  const [over, setOver] = useState(null); // { level, index } atau { newLevel: true }

  useEffect(() => {
    if (!open) return;
    setList(positions.map(({ holders, ...p }) => ({ ...p, was: p.label })));
    setEditing(null); setAdding(null);
  }, [open, positions]);

  const holdersOf = useMemo(() => Object.fromEntries(positions.map((p) => [p.label, p.holders || []])), [positions]);
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
      next.filter((p) => !p.parent && p.level === map.get(old)).sort((a, b) => a.order - b.order).forEach((p, i) => { p.order = i + 1; });
    });
    // anggota bidang ikut level & urutan induknya
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
      const lvItems = arr.filter((p) => !p.parent && p.level === toLevel && p.label !== label).sort((a, b) => a.order - b.order);
      item.level = toLevel;
      lvItems.splice(Math.max(0, Math.min(toIndex, lvItems.length)), 0, item);
      lvItems.forEach((p, i) => { p.order = i + 1; });
      return normalize(arr);
    });
  };

  // Pindahkan ke baris BARU yang disisipkan sebelum baris `beforeLevel` (atau paling bawah bila null)
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
    const lv = levels.findIndex((l) => l.level === item.level);
    const target = levels[lv + dir];
    if (target) move(label, target.level, target.items.length);
    else moveToNewLevel(label, dir < 0 ? levels[0].level : null);
  };

  const startEdit = (p) => { setEditing(p.label); setDraftName(p.label); };
  const commitEdit = (p) => {
    const name = draftName.replace(/\s+/g, ' ').trim();
    setEditing(null);
    if (!name || name === p.label) return;
    if (list.some((x) => x.label.toLowerCase() === name.toLowerCase() && x.label !== p.label)) return toast.error('Nama jabatan sudah ada.');
    setList((cur) => cur.map((x) => (x.label === p.label ? { ...x, label: name } : x.parent === p.label ? { ...x, parent: name } : x)));
  };

  const setRole = (label, role) => setList((cur) => cur.map((x) => (x.label === label ? { ...x, role, unique: role === 'ANGGOTA' ? false : x.unique } : x)));
  const toggleUnique = (label) => setList((cur) => cur.map((x) => (x.label === label ? { ...x, unique: !x.unique } : x)));

  const remove = (p) => {
    const kids = childrenOf(p.label);
    if ((holdersOf[p.was] || []).length) return toast.error(`"${p.label}" masih dipegang ${holdersOf[p.was][0].name}. Pindahkan dulu pengurusnya.`);
    for (const k of kids) if ((holdersOf[k.was] || []).length) return toast.error(`Anggota bidang "${k.label}" masih dipegang pengurus aktif.`);
    setList((cur) => normalize(cur.filter((x) => x.label !== p.label && x.parent !== p.label)));
  };

  const addPosition = (e) => {
    e.preventDefault();
    const label = newForm.label.replace(/\s+/g, ' ').trim();
    if (!label) return;
    if (list.some((x) => x.label.toLowerCase() === label.toLowerCase())) return toast.error('Nama jabatan sudah ada.');
    setList((cur) => {
      const peers = cur.filter((p) => !p.parent && p.level === adding.level);
      return normalize([...cur, { label, role: newForm.role, unique: newForm.role !== 'ANGGOTA', level: adding.level, order: peers.length + 1, group: 'Pengurus' }]);
    });
    setAdding(null); setNewForm({ label: '', role: 'KABINET' });
  };

  /* ── Seret & lepas ── */
  const onDragStart = (label) => (e) => { drag.current = label; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', label); };
  const onDrop = (level, index) => (e) => { e.preventDefault(); if (drag.current) move(drag.current, level, index); drag.current = null; setOver(null); };
  const allow = (key) => (e) => { e.preventDefault(); setOver(key); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = list.map((p) => ({ label: p.label, role: p.role, unique: p.unique, level: p.level, order: p.order, parent: p.parent, was: p.was !== p.label ? p.was : undefined }));
      const res = await saveOrgPositions(payload);
      const renamed = res.data.renamed || [];
      toast.success(renamed.length ? `Disimpan. ${renamed.reduce((n, r) => n + r.count, 0)} pengurus aktif ikut berganti nama jabatan.` : 'Hierarki disimpan');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan hierarki');
    } finally { setSaving(false); }
  };

  const reset = () => openConfirm({
    title: 'Kembalikan hierarki ke bawaan?',
    message: 'Susunan dan nama jabatan kembali seperti semula. Data pengurus tidak berubah, tetapi jabatan yang namanya sudah Anda ganti harus dipindahkan dulu bila masih dipegang.',
    onConfirm: async () => {
      try { await resetOrgPositions(); toast.success('Hierarki dikembalikan ke bawaan'); onSaved(); onClose(); }
      catch (err) { toast.error(err.response?.data?.message || 'Gagal mengembalikan'); }
    }
  });

  const Card = ({ p }) => {
    const holders = holdersOf[p.was] || [];
    const kids = childrenOf(p.label);
    const isEditing = editing === p.label;
    return (
      <div className={`${styles.card} ${styles[ROLE_TONE[p.role]]}`} draggable={!isEditing} onDragStart={onDragStart(p.label)} onDragEnd={() => { drag.current = null; setOver(null); }}>
        <div className={styles.cardTop}>
          <GripVertical size={16} className={styles.grip} />
          {isEditing ? (
            <input className={styles.nameInput} autoFocus value={draftName} maxLength={60}
              onChange={(e) => setDraftName(e.target.value)} onBlur={() => commitEdit(p)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(p); if (e.key === 'Escape') setEditing(null); }} />
          ) : (
            <b className={styles.cardName} onDoubleClick={() => startEdit(p)}>{p.label}</b>
          )}
        </div>
        <div className={styles.meta}>
          <select className={styles.roleSel} value={p.role} onChange={(e) => setRole(p.label, e.target.value)} aria-label="Peran">
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button type="button" className={`${styles.pill} ${p.unique ? styles.pillOn : ''}`} onClick={() => toggleUnique(p.label)} title="Jabatan tunggal: hanya satu pemegang aktif">
            {p.unique ? '1 orang' : 'banyak'}
          </button>
        </div>
        <span className={styles.holder}>{holders.length ? holders.map((h) => h.name).join(', ') : 'Kosong'}</span>
        {kids.length > 0 && (
          <div className={styles.kids}>
            {kids.map((k) => <span key={k.label} className={styles.kid}>{k.label} <em>{(holdersOf[k.was] || []).length}</em></span>)}
          </div>
        )}
        <div className={styles.tools}>
          <button type="button" onClick={() => nudge(p.label, -1)} title="Naikkan satu baris"><ArrowUp size={14} /></button>
          <button type="button" onClick={() => nudge(p.label, 1)} title="Turunkan satu baris"><ArrowDown size={14} /></button>
          <button type="button" onClick={() => startEdit(p)} title="Ganti nama"><Pencil size={14} /></button>
          <button type="button" onClick={() => remove(p)} title="Hapus jabatan" className={styles.del}><Trash2 size={14} /></button>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Atur hierarki jabatan">
        <div className={styles.head}>
          <h3><Layers size={18} /> Atur Hierarki Jabatan</h3>
          <button className={styles.close} onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <p className={styles.help}>
          Seret kartu ke baris lain, atau ke samping kartu lain agar <b>berdampingan</b> di satu baris. Klik dua kali nama untuk menggantinya.
          Bagan di halaman Anggota mengikuti susunan ini.
        </p>

        <div className={styles.board}>
          {levels.map((lv, li) => (
            <div key={lv.level} className={styles.level}>
              <span className={styles.levelTag}>Baris {li + 1}</span>
              <div className={styles.row}>
                {lv.items.map((p, i) => (
                  <div key={p.label} className={styles.slot}>
                    <div className={`${styles.gap} ${over?.level === lv.level && over?.index === i ? styles.gapOn : ''}`}
                      onDragOver={allow({ level: lv.level, index: i })} onDragLeave={() => setOver(null)} onDrop={onDrop(lv.level, i)} />
                    <Card p={p} />
                  </div>
                ))}
                <div className={`${styles.gap} ${styles.gapEnd} ${over?.level === lv.level && over?.index === lv.items.length ? styles.gapOn : ''}`}
                  onDragOver={allow({ level: lv.level, index: lv.items.length })} onDragLeave={() => setOver(null)} onDrop={onDrop(lv.level, lv.items.length)} />
                <button type="button" className={styles.addHere} onClick={() => { setAdding({ level: lv.level }); setNewForm({ label: '', role: 'KABINET' }); }} title="Tambah jabatan di baris ini">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
          <div className={`${styles.newLevel} ${over?.newLevel ? styles.gapOn : ''}`}
            onDragOver={allow({ newLevel: true })} onDragLeave={() => setOver(null)}
            onDrop={(e) => { e.preventDefault(); if (drag.current) moveToNewLevel(drag.current, null); drag.current = null; setOver(null); }}>
            Lepas di sini untuk membuat baris baru di bawah
          </div>
        </div>

        {adding && (
          <form className={styles.addForm} onSubmit={addPosition}>
            <b>Jabatan baru di Baris {levels.findIndex((l) => l.level === adding.level) + 1}</b>
            <input autoFocus placeholder="Nama jabatan, mis. Koordinator Acara" maxLength={60} value={newForm.label} onChange={(e) => setNewForm({ ...newForm, label: e.target.value })} required />
            <select value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}>
              {ROLE_OPTIONS.filter((r) => r.value !== 'PEMBINA').map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button type="submit" className={styles.primary}><Check size={16} /> Tambah</button>
            <button type="button" className={styles.ghost} onClick={() => setAdding(null)}>Batal</button>
          </form>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={reset} disabled={saving}><RotateCcw size={15} /> Kembalikan bawaan</button>
          <span className={styles.spacer} />
          <button type="button" className={styles.ghost} onClick={onClose} disabled={saving}>Batal</button>
          <button type="button" className={styles.primary} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : <Check size={16} />} Simpan hierarki
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getOrgMembers, createOrgMember, updateOrgMember, deleteOrgMember, getMembers,
  getOrgPositions, getOrgSyncReport, runOrgSyncFix
} from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import PickerField, { compareText } from '@/components/common/PickerField';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import ReplaceFlow from '@/components/admin/ReplaceFlow';
import HierarchyEditor from '@/components/admin/HierarchyEditor';
import { useUIStore } from '@/stores/uiStore';
import {
  Plus, Edit2, Trash2, X, Upload, Link as LinkIcon, Unlink, Archive, Users, AlertTriangle, Wand2, Search, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getUploadUrl } from '@/api/axios';
import { compressImage } from '@/utils/compressor';
import styles from './AdminOrgPage.module.css';

const ROLE_ORDER = { PEMBINA: 0, KETUA: 1, WAKIL: 2, KABINET: 3, ANGGOTA: 4 };
const ROLE_LABEL = { PEMBINA: 'Pembina', KETUA: 'Ketua', WAKIL: 'Wakil', KABINET: 'Kabinet', ANGGOTA: 'Anggota' };
const TABS = [
  { key: 'AKTIF', label: 'Pengurus Aktif', icon: Users },
  { key: 'ARSIP', label: 'Arsip Kepengurusan', icon: Archive }
];
const periode = (m) => {
  const end = m.yearEnd && m.yearEnd > m.yearStart ? m.yearEnd : m.yearStart + 1;
  return `${m.yearStart}/${end}`;
};

export default function AdminOrgPage() {
  const [members, setMembers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [report, setReport] = useState({ fixes: [], needsPosition: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('AKTIF');
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isPembinaMode, setIsPembinaMode] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [yearStart, setYearStart] = useState(new Date().getFullYear());
  const [quote, setQuote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [hierOpen, setHierOpen] = useState(false);

  const openConfirm = useUIStore((s) => s.openConfirm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [org, pos, mem, rep] = await Promise.all([
        getOrgMembers(), getOrgPositions(), getMembers(), getOrgSyncReport()
      ]);
      setMembers(org.data);
      setPositions(pos.data);
      setAllMembers(mem.data || []);
      setReport(rep.data);
    } catch {
      toast.error('Gagal mengambil data struktur organisasi');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const active = useMemo(() => members.filter((m) => m.isCurrent), [members]);
  const archive = useMemo(() => members.filter((m) => !m.isCurrent), [members]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = (tab === 'AKTIF' ? active : archive).filter(
      (m) => !needle || `${m.name} ${m.jabatan}`.toLowerCase().includes(needle)
    );
    if (tab === 'AKTIF') {
      return list.sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || compareText(a.jabatan, b.jabatan) || compareText(a.name, b.name));
    }
    // Arsip: periode terbaru dulu, lalu tim inti, lalu A–Z
    return list.sort((a, b) => b.yearStart - a.yearStart || (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || compareText(a.name, b.name));
  }, [tab, active, archive, q]);

  const archiveByYear = useMemo(() => {
    const map = new Map();
    rows.forEach((m) => { const k = periode(m); if (!map.has(k)) map.set(k, []); map.get(k).push(m); });
    return [...map.entries()];
  }, [rows]);

  /* ── Opsi pemilih ───────────────────────────────────────── */
  const memberOptions = useMemo(() => {
    const pembina = isPembinaMode;
    return allMembers
      .filter((m) => m.status === 'ACTIVE' && (pembina ? m.role === 'PEMBINA' : m.role !== 'PEMBINA'))
      .map((m) => ({
        value: m.id,
        label: m.name.trim(),
        description: m.jabatan ? `${m.className || 'Umum'} · saat ini ${m.jabatan}` : (m.className || 'Umum'),
        avatar: m.photoPath ? getUploadUrl(m.photoPath) : '',
        group: m.className ? m.className.split(/[-. ]/)[0].toUpperCase() : 'Umum'
      }));
  }, [allMembers, isPembinaMode]);

  const positionOptions = useMemo(
    () => positions
      .filter((p) => p.role !== 'PEMBINA')
      .map((p) => ({
        value: p.label,
        label: p.label,
        group: p.group,
        description: p.holders.length && p.unique ? `Dipegang ${p.holders[0].name}` : (p.unique ? 'Kosong' : `${p.holders.length} orang`),
        badge: p.unique && p.holders.length && p.holders[0].memberId !== selectedMemberId ? 'Akan menggantikan' : undefined
      })),
    [positions, selectedMemberId]
  );

  const selectedMember = allMembers.find((m) => m.id === selectedMemberId);
  const chosenPosition = positions.find((p) => p.label === jabatan);
  const willDisplace = chosenPosition?.unique ? chosenPosition.holders.filter((h) => h.memberId !== selectedMemberId) : [];

  /* ── Modal ──────────────────────────────────────────────── */
  const resetPhoto = (url = '') => { setPhotoFile(null); setPhotoPreview(url); };

  const handleOpenAddModal = (forPembina = false) => {
    setEditingId(null);
    setName('');
    setSelectedMemberId('');
    setJabatan(forPembina ? 'Pembina' : '');
    setIsPembinaMode(forPembina);
    setYearStart(new Date().getFullYear());
    setQuote('');
    resetPhoto();
    setModalOpen(true);
  };

  const handleOpenEditModal = (m) => {
    setEditingId(m.id);
    setName(m.name);
    setSelectedMemberId(m.memberId || '');
    setJabatan(m.jabatan);
    setIsPembinaMode(m.role === 'PEMBINA');
    setYearStart(m.yearStart);
    setQuote(m.quote || '');
    resetPhoto(m.effectivePhoto ? getUploadUrl(m.effectivePhoto) : '');
    setModalOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) return toast.error('Ukuran foto pengurus maksimal adalah 25MB.');
    const t = toast.loading('Mengompresi foto...');
    compressImage(file)
      .then((c) => { setPhotoFile(c); setPhotoPreview(URL.createObjectURL(c)); toast.success('Foto siap diupload.', { id: t }); })
      .catch(() => { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); toast.error('Gagal mengompresi, memakai file asli.', { id: t }); });
  };

  const save = async (displaceMode) => {
    const fd = new FormData();
    if (!selectedMemberId) fd.append('name', name.trim());
    fd.append('jabatan', jabatan);
    fd.append('yearStart', yearStart);
    fd.append('isCurrent', true);
    if (displaceMode) fd.append('displaceMode', displaceMode);
    if (quote) fd.append('quote', quote);
    if (photoFile && !selectedMemberId) fd.append('photo', photoFile);
    if (selectedMemberId) fd.append('memberId', selectedMemberId);
    else if (editingId) fd.append('memberId', 'NONE');

    try {
      const res = editingId ? await updateOrgMember(editingId, fd) : await createOrgMember(fd);
      toast.success(res.data.message || 'Tersimpan');
      setReplaceOpen(false);
      setModalOpen(false);
      load();
    } catch (err) {
      setReplaceOpen(false);
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengurus');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jabatan) return toast.error('Pilih jabatan kepengurusan.');
    if (!selectedMemberId && !name.trim()) return toast.error('Pilih akun anggota atau isi nama.');
    // Jabatan tunggal yang sedang dipegang orang lain: minta konfirmasi dulu
    if (willDisplace.length > 0) return setReplaceOpen(true);
    save();
  };

  const handleArchive = (m) => openConfirm({
    title: 'Pindahkan ke arsip?',
    message: `${m.name.trim()} (${m.jabatan}) akan masuk Arsip Kepengurusan ${periode({ ...m, yearEnd: new Date().getFullYear() })} dan kembali menjadi anggota biasa.`,
    onConfirm: async () => {
      try {
        const fd = new FormData();
        fd.append('isCurrent', false);
        fd.append('yearEnd', new Date().getFullYear());
        await updateOrgMember(m.id, fd);
        toast.success('Dipindahkan ke arsip');
        load();
      } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengarsipkan'); }
    }
  });

  const handleDelete = (m) => openConfirm({
    title: 'Hapus data kepengurusan?',
    message: `Catatan ${m.name.trim()} — ${m.jabatan} (${periode(m)}) dihapus permanen dari struktur dan arsip.`,
    danger: true,
    onConfirm: async () => {
      try { await deleteOrgMember(m.id); toast.success('Data dihapus'); load(); }
      catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
    }
  });

  const handleSyncFix = async () => {
    try {
      const r = await runOrgSyncFix();
      toast.success(`${r.data.applied} data disinkronkan`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyinkronkan'); }
  };

  const needSync = report.fixes.length > 0 || report.needsPosition.length > 0;

  return (
    <div className={styles.page}>
      <AdminHeader title="Struktur Organisasi" subtitle="Pengurus aktif dan arsip kepengurusan PIK-R MANSEKU" />

      <div className={styles.content}>
        {needSync && (
          <div className={styles.syncBanner}>
            <AlertTriangle size={18} />
            <div className={styles.syncText}>
              <b>Data anggota dan struktur belum sinkron.</b>
              <span>
                {report.fixes.length > 0 && `${report.fixes.length} bisa diperbaiki otomatis`}
                {report.fixes.length > 0 && report.needsPosition.length > 0 && ' · '}
                {report.needsPosition.length > 0 && `${report.needsPosition.length} anggota berperan pengurus tapi belum punya jabatan (${report.needsPosition.slice(0, 3).map((p) => p.name).join(', ')}${report.needsPosition.length > 3 ? '…' : ''}). Tambahkan lewat "Tambah Pengurus".`}
              </span>
            </div>
            {report.fixes.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={handleSyncFix}><Wand2 size={14} /> Sinkronkan</button>
            )}
          </div>
        )}

        <div className={styles.toolbar}>
          <nav className={styles.tabs}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} className={`${styles.tab} ${tab === key ? styles.active : ''}`} onClick={() => setTab(key)}>
                <Icon size={15} /> {label} <span className={styles.tabCount}>{key === 'AKTIF' ? active.length : archive.length}</span>
              </button>
            ))}
          </nav>
          <div className={styles.toolbarActions}>
            <label className={styles.searchBox}>
              <Search size={15} />
              <input placeholder="Cari nama / jabatan" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <button className="btn btn-primary" onClick={() => handleOpenAddModal(false)}><Plus size={16} /> Tambah Pengurus</button>
            <button className="btn btn-secondary" onClick={() => handleOpenAddModal(true)}><Plus size={16} /> Tambah Pembina</button>
            <button className="btn btn-secondary" onClick={() => setHierOpen(true)} title="Tambah jabatan, ganti nama, geser hierarki"><Layers size={16} /> Atur Hierarki</button>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : rows.length === 0 ? (
          <div className={styles.empty}>
            {tab === 'AKTIF' ? 'Belum ada pengurus aktif.' : 'Belum ada arsip kepengurusan. Pengurus yang menjadi alumni otomatis masuk ke sini.'}
          </div>
        ) : tab === 'AKTIF' ? (
          <div className={styles.tableCard}>
            <OrgTable rows={rows} onEdit={handleOpenEditModal} onDelete={handleDelete} onArchive={handleArchive} />
          </div>
        ) : (
          archiveByYear.map(([period, list]) => (
            <section key={period} className={styles.archiveGroup}>
              <h3 className={styles.archiveTitle}><Archive size={16} /> Kepengurusan {period} <span>{list.length} orang</span></h3>
              <div className={styles.tableCard}>
                <OrgTable rows={list} archive onEdit={handleOpenEditModal} onDelete={handleDelete} />
              </div>
            </section>
          ))
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} modal-shell`}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Edit Data Pengurus' : (isPembinaMode ? 'Tambah Pembina Baru' : 'Tambah Pengurus Baru')}</h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className={`${styles.form} modal-scroll`}>
              {!selectedMemberId ? (
                <div className={styles.photoSection}>
                  <div className={styles.photoPreviewWrapper}>
                    {photoPreview ? <img src={photoPreview} alt="Preview" className={styles.photoPreview} /> : <div className={styles.photoPlaceholder}><Upload size={24} /></div>}
                  </div>
                  <label className={styles.photoLabel}>
                    <Upload size={14} /> Pilih Foto Pengurus
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className={styles.fileInput} />
                  </label>
                </div>
              ) : (
                <div className={styles.linkedPhotoInfo}>
                  {selectedMember?.photoPath
                    ? <img src={getUploadUrl(selectedMember.photoPath)} alt="" className={styles.linkedPhotoAvatar} />
                    : <div className={styles.linkedPhotoPlaceholder}>{selectedMember?.name?.[0] || '?'}</div>}
                  <span>Nama, foto, dan kelas diambil otomatis dari akun <strong>{selectedMember?.name?.trim()}</strong>.</span>
                </div>
              )}

              <div className={styles.grid}>
                <div className="form-group">
                  <label className="form-label">{isPembinaMode ? 'Akun Pembina' : 'Akun Anggota'} {!editingId && !isPembinaMode ? '*' : ''}</label>
                  <PickerField
                    value={selectedMemberId}
                    options={memberOptions}
                    sort="az"
                    title={isPembinaMode ? 'Pilih akun pembina' : 'Pilih akun anggota'}
                    placeholder={isPembinaMode ? 'Pilih akun pembina' : 'Pilih akun anggota'}
                    clearLabel={editingId || isPembinaMode ? 'Tanpa akun (input manual)' : undefined}
                    required={!isPembinaMode && !editingId}
                    onChange={(v, o) => { setSelectedMemberId(v); if (o) setName(o.label); else if (!editingId) setName(''); }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input
                    type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)}
                    readOnly={!!selectedMemberId} required
                    placeholder={selectedMemberId ? 'Terisi otomatis dari akun' : 'Masukkan nama lengkap'}
                    style={selectedMemberId ? { backgroundColor: 'var(--color-surface-2)', cursor: 'not-allowed' } : undefined}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jabatan Kepengurusan *</label>
                  {isPembinaMode ? (
                    <input type="text" className="form-input" value="Pembina" readOnly style={{ backgroundColor: 'var(--color-surface-2)', cursor: 'not-allowed' }} />
                  ) : (
                    <PickerField
                      value={jabatan}
                      options={positionOptions}
                      title="Pilih jabatan"
                      placeholder="Pilih jabatan"
                      searchable
                      required
                      onChange={(v) => setJabatan(v)}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Tahun Mulai Menjabat *</label>
                  <input type="number" className="form-input" value={yearStart} onChange={(e) => setYearStart(e.target.value)} required />
                </div>
              </div>

              {willDisplace.length > 0 && (
                <div className={styles.displaceNote}>
                  <AlertTriangle size={16} />
                  <span><b>{willDisplace.map((h) => h.name).join(', ')}</b> saat ini menjabat <b>{jabatan}</b> dan akan dipindahkan ke arsip.</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Kata Sambutan / Kutipan</label>
                <textarea className="form-textarea" rows={3} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Tuliskan kata motivasi atau sambutan singkat..." />
              </div>

              </div>
              <div className={`${styles.modalActions} modal-bar`}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <HierarchyEditor open={hierOpen} positions={positions} onClose={() => setHierOpen(false)} onSaved={load} />

      <ReplaceFlow
        open={replaceOpen}
        jabatan={jabatan}
        oldHolders={willDisplace}
        newPerson={{
          name: (selectedMember?.name || name).trim(),
          photoPath: selectedMember?.photoPath || null,
          className: selectedMember?.className,
          caption: 'Pejabat baru'
        }}
        onCancel={() => setReplaceOpen(false)}
        onConfirm={save}
      />
    </div>
  );
}

function OrgTable({ rows, archive = false, onEdit, onDelete, onArchive }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>No</th><th>Foto</th><th>Nama</th><th>Jabatan</th><th>Peran</th><th>{archive ? 'Periode' : 'Mulai'}</th><th>Akun</th>
          <th style={{ textAlign: 'right' }}>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m, idx) => (
          <tr key={m.id}>
            <td>{idx + 1}</td>
            <td>
              <PhotoAvatar src={m.effectivePhoto ? getUploadUrl(m.effectivePhoto) : ''} name={m.name} className={styles.avatar} placeholderClassName={styles.avatarPlaceholder} />
            </td>
            <td className={styles.name}>{m.name.trim()}</td>
            <td><strong>{m.jabatan}</strong></td>
            <td><span className={`${styles.roleBadge} ${styles[m.role.toLowerCase()]}`}>{ROLE_LABEL[m.role] || m.role}</span></td>
            <td>{archive ? periode(m) : m.yearStart}</td>
            <td>
              {m.memberId
                ? <span className={styles.linkedBadge}><LinkIcon size={12} /> {m.member?.status === 'ALUMNI' ? 'Alumni' : 'Terhubung'}</span>
                : <span className={styles.orphanBadge}><Unlink size={12} /> Mandiri</span>}
            </td>
            <td style={{ textAlign: 'right' }}>
              <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                {!archive && (
                  <button className="btn btn-ghost btn-sm" onClick={() => onArchive(m)} title="Pindahkan ke arsip"><Archive size={14} /></button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(m)} title="Edit"><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => onDelete(m)} title="Hapus"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

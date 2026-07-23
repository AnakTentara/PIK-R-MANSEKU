import { useState, useEffect } from 'react';
import { getOrgMembers, createOrgMember, updateOrgMember, deleteOrgMember, getMembers } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import { useUIStore } from '@/stores/uiStore';
import { Network, Plus, Edit2, Trash2, Check, X, Upload, Link, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUploadUrl } from '@/api/axios';
import { compressImage } from '@/utils/compressor';
import styles from './AdminOrgPage.module.css';

const POSITIONS = [
  // Pimpinan Inti
  { label: 'Ketua Umum', role: 'KETUA' },
  { label: 'Wakil Ketua Umum', role: 'WAKIL' },
  { label: 'Sekretaris Umum', role: 'KABINET' },
  { label: 'Bendahara Umum', role: 'KABINET' },
  
  // Ketua Divisi
  { label: 'Ketua MedInfo', role: 'KABINET' },
  { label: 'Ketua Konselor Sebaya', role: 'KABINET' },
  { label: 'Ketua Pendidik Sebaya', role: 'KABINET' },
  { label: 'Ketua Humas', role: 'KABINET' },
  { label: 'Ketua Informasi', role: 'KABINET' },
  { label: 'Ketua Konseling dan Pendamping', role: 'KABINET' },
  { label: 'Ketua Kegiatan dan Kreativitas', role: 'KABINET' },
  
  // Anggota Divisi
  { label: 'Anggota MedInfo', role: 'ANGGOTA' },
  { label: 'Anggota Konselor Sebaya', role: 'ANGGOTA' },
  { label: 'Anggota Pendidik Sebaya', role: 'ANGGOTA' },
  { label: 'Anggota Humas', role: 'ANGGOTA' },
  { label: 'Anggota Informasi', role: 'ANGGOTA' },
  { label: 'Anggota Konseling dan Pendamping', role: 'ANGGOTA' },
  { label: 'Anggota Kegiatan dan Kreativitas', role: 'ANGGOTA' }
];

export default function AdminOrgPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL'); // ALL | CURRENT | ARCHIVE
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isPembinaMode, setIsPembinaMode] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('PEMBINA');
  const [jabatan, setJabatan] = useState('');
  const [yearStart, setYearStart] = useState(new Date().getFullYear());
  const [yearEnd, setYearEnd] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [quote, setQuote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  
  // Link to existing member state
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  const openConfirm = useUIStore((state) => state.openConfirm);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await getOrgMembers();
      setMembers(res.data);
    } catch (err) {
      toast.error('Gagal mengambil data struktur organisasi');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllActiveMembers = async () => {
    try {
      const res = await getMembers({ status: 'ACTIVE' });
      setAllMembers(res.data || []);
    } catch (err) {
      console.error('Failed to load members for selection:', err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchAllActiveMembers();
  }, []);

  const handleOpenAddModal = (forPembina = false) => {
    setEditingId(null);
    setName('');
    setSelectedMemberId(forPembina ? 'MANUAL' : '');
    setRole(forPembina ? 'PEMBINA' : 'KABINET');
    setJabatan(forPembina ? 'Pembina' : '');
    setIsPembinaMode(forPembina);
    setYearStart(new Date().getFullYear());
    setYearEnd('');
    setIsCurrent(false);
    setQuote('');
    setPhotoFile(null);
    setPhotoPreview('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (m) => {
    setEditingId(m.id);
    setName(m.name);
    // Use stored memberId FK directly (no more fragile name-matching)
    const existingMemberId = m.memberId || '';
    setSelectedMemberId(existingMemberId || (m.role === 'PEMBINA' ? 'MANUAL' : ''));
    setRole(m.role);
    setJabatan(m.jabatan);
    setIsPembinaMode(m.role === 'PEMBINA');
    setYearStart(m.yearStart);
    setYearEnd(m.yearEnd || '');
    setIsCurrent(m.isCurrent);
    setQuote(m.quote || '');
    setPhotoFile(null);
    // Use effectivePhoto (member photo if linked, else orgMember's own photo)
    setPhotoPreview(m.effectivePhoto ? getUploadUrl(m.effectivePhoto) : '');
    setModalOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error('Ukuran foto pengurus maksimal adalah 25MB.');
        return;
      }
      const compToast = toast.loading('Mengompresi foto...');
      compressImage(file)
        .then((compressed) => {
          setPhotoFile(compressed);
          setPhotoPreview(URL.createObjectURL(compressed));
          toast.success('Foto siap diupload (berhasil dikompresi).', { id: compToast });
        })
        .catch(() => {
          setPhotoFile(file);
          setPhotoPreview(URL.createObjectURL(file));
          toast.error('Gagal mengompresi, menggunakan file asli.', { id: compToast });
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !jabatan || !yearStart) {
      return toast.error('Harap isi semua kolom wajib!');
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('role', role);
    formData.append('jabatan', jabatan);
    formData.append('yearStart', yearStart);
    if (yearEnd) formData.append('yearEnd', yearEnd);
    formData.append('isCurrent', isCurrent);
    if (quote) formData.append('quote', quote);
    // Only upload photo if no member is linked (orphan entries)
    if (photoFile && (!selectedMemberId || selectedMemberId === 'MANUAL')) {
      formData.append('photo', photoFile);
    }
    // Send memberId FK
    if (selectedMemberId && selectedMemberId !== 'MANUAL') {
      formData.append('memberId', selectedMemberId);
    } else if (editingId) {
      // On edit: if explicitly set to MANUAL, signal unlink
      if (selectedMemberId === 'MANUAL') formData.append('memberId', 'NONE');
    }

    try {
      if (editingId) {
        await updateOrgMember(editingId, formData);
        toast.success('Pengurus berhasil diperbarui');
      } else {
        await createOrgMember(formData);
        toast.success('Pengurus baru berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengurus');
    }
  };

  const handleDelete = (id) => {
    openConfirm({
      title: 'Hapus Pengurus',
      message: 'Apakah Anda yakin ingin menghapus data pengurus ini? Tindakan ini tidak dapat dibatalkan.',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteOrgMember(id);
          toast.success('Pengurus berhasil dihapus');
          fetchMembers();
        } catch (err) {
          toast.error('Gagal menghapus pengurus');
        }
      }
    });
  };

  const ROLE_ORDER = { KETUA: 1, WAKIL: 2, KABINET: 3, PEMBINA: 4, ANGGOTA: 5 };

  const sortedMembers = [...members].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));

  // Exclude members already assigned to the structure (except current editing member)
  const assignedMemberIds = new Set(members.map((m) => m.memberId).filter(Boolean));
  const availableMembers = allMembers.filter((m) => !assignedMemberIds.has(m.id) || m.id === selectedMemberId);

  return (
    <div className={styles.page}>
      <AdminHeader title="Struktur Organisasi" subtitle="Manajemen pengurus dan pembina aktif PIK-R MANSEKU">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => handleOpenAddModal(false)}>
            <Plus size={16} /> Tambah Pengurus
          </button>
          <button className="btn btn-secondary" onClick={() => handleOpenAddModal(true)}>
            <Plus size={16} /> Tambah Pembina
          </button>
        </div>
      </AdminHeader>

      <div className={styles.content}>
        {loading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : sortedMembers.length === 0 ? (
          <div className={styles.empty}>Belum ada data pengurus aktif terdaftar.</div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Foto</th>
                  <th>Nama Pengurus</th>
                  <th>Jabatan</th>
                  <th>Tingkat Peran</th>
                  <th>Tahun Mulai</th>
                  <th>Akun Terhubung</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((m, idx) => (
                  <tr key={m.id}>
                    <td>{idx + 1}</td>
                    <td>
                      {m.effectivePhoto ? (
                        <img src={getUploadUrl(m.effectivePhoto)} alt={m.name} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>{m.name[0]}</div>
                      )}
                    </td>
                    <td className={styles.name}>{m.name}</td>
                    <td><strong>{m.jabatan}</strong></td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[m.role.toLowerCase()]}`}>
                        {m.role}
                      </span>
                    </td>
                    <td>{m.yearStart}</td>
                    <td>
                      {m.memberId ? (
                        <span className={styles.linkedBadge}>
                          <Link size={12} /> {m.member?.nisn ? `NISN: ${m.member.nisn}` : 'Terhubung (Pembina)'}
                        </span>
                      ) : (
                        <span className={styles.orphanBadge}>
                          <Unlink size={12} /> Mandiri
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditModal(m)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(m.id)} title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Edit Data Pengurus' : (isPembinaMode ? 'Tambah Pembina Baru' : 'Tambah Pengurus Baru')}</h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              {(!selectedMemberId || selectedMemberId === 'MANUAL') && (
                <div className={styles.photoSection}>
                  <div className={styles.photoPreviewWrapper}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                    ) : (
                      <div className={styles.photoPlaceholder}><Upload size={24} /></div>
                    )}
                  </div>
                  <label className={styles.photoLabel}>
                    <Upload size={14} /> Pilih Foto Pengurus
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className={styles.fileInput} />
                  </label>
                </div>
              )}

              {selectedMemberId && selectedMemberId !== 'MANUAL' && (() => {
                const linked = allMembers.find(m => m.id === selectedMemberId);
                return linked?.photoPath ? (
                  <div className={styles.linkedPhotoInfo}>
                    <img src={getUploadUrl(linked.photoPath)} alt={linked.name} className={styles.linkedPhotoAvatar} />
                    <span>Foto & Data diambil otomatis dari akun <strong>{linked.name}</strong>.</span>
                  </div>
                ) : (
                  <div className={styles.linkedPhotoInfo}>
                    <div className={styles.linkedPhotoPlaceholder}>{linked?.name?.[0] || '?'}</div>
                    <span>Anggota <strong>{linked?.name}</strong> terhubung (Belum ada foto).</span>
                  </div>
                );
              })()}

              <div className={styles.grid}>
                 <div className="form-group">
                   <label className="form-label">
                     {isPembinaMode 
                       ? (editingId ? 'Tautkan ke Akun Pembina' : 'Pilih Akun Pembina *') 
                       : (editingId ? 'Tautkan ke Akun Anggota' : 'Pilih Akun Anggota *')}
                   </label>
                   <select
                     className="form-select"
                     value={selectedMemberId}
                     onChange={(e) => {
                       const val = e.target.value;
                       setSelectedMemberId(val);
                       if (val && val !== 'MANUAL') {
                         const found = allMembers.find((m) => m.id === val);
                         if (found) setName(found.name);
                       } else if (!editingId) {
                         setName('');
                       }
                     }}
                     required={!isPembinaMode && !editingId}
                   >
                     <option value="">{editingId ? '— Pilih Akun —' : '— Pilih Akun Terdaftar —'}</option>
                     {editingId && <option value="MANUAL">✕ Lepas tautan (tanpa akun)</option>}
                     {availableMembers
                       .filter(m => isPembinaMode ? m.role === 'PEMBINA' : m.role !== 'PEMBINA')
                       .map((m) => (
                         <option key={m.id} value={m.id}>
                           {m.name} ({m.role} - {m.className || 'Umum'})
                         </option>
                       ))}
                   </select>
                 </div>
                 
                 <div className="form-group">
                   <label className="form-label">Nama Lengkap *</label>
                   <input
                     type="text"
                     className="form-input"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     readOnly={selectedMemberId && selectedMemberId !== 'MANUAL'}
                     required
                     style={selectedMemberId && selectedMemberId !== 'MANUAL' ? { backgroundColor: 'var(--color-surface-2)', cursor: 'not-allowed' } : {}}
                     placeholder={selectedMemberId && selectedMemberId !== 'MANUAL' ? "Terisi otomatis dari akun" : "Masukkan nama lengkap"}
                   />
                 </div>
                 
                 <div className="form-group">
                   <label className="form-label">Jabatan Kepengurusan *</label>
                   {isPembinaMode ? (
                     <input
                       type="text"
                       className="form-input"
                       value="Pembina"
                       readOnly
                       style={{ backgroundColor: 'var(--color-surface-2)', cursor: 'not-allowed' }}
                     />
                   ) : (
                     <select
                       className="form-select"
                       value={jabatan}
                       onChange={(e) => {
                         const val = e.target.value;
                         setJabatan(val);
                         const matchedPos = POSITIONS.find((p) => p.label === val);
                         if (matchedPos) {
                           setRole(matchedPos.role);
                         }
                       }}
                       required
                     >
                       <option value="">— Pilih Jabatan —</option>
                       {POSITIONS.map((p) => (
                         <option key={p.label} value={p.label}>
                           {p.label}
                         </option>
                       ))}
                     </select>
                   )}
                 </div>

                <div className="form-group">
                  <label className="form-label">Tahun Mulai Menjabat *</label>
                  <input type="number" className="form-input" value={yearStart} onChange={(e) => setYearStart(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Kata Sambutan / Kutipan (Quote)</label>
                <textarea className="form-textarea" rows={3} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Tuliskan kata motivasi atau sambutan singkat..." />
              </div>


              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

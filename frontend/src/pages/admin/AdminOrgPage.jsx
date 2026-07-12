import { useState, useEffect } from 'react';
import { getOrgMembers, createOrgMember, updateOrgMember, deleteOrgMember } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import { useUIStore } from '@/stores/uiStore';
import { Network, Plus, Edit2, Trash2, Check, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminOrgPage.module.css';

export default function AdminOrgPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL'); // ALL | CURRENT | ARCHIVE
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('KABINET');
  const [jabatan, setJabatan] = useState('');
  const [yearStart, setYearStart] = useState(new Date().getFullYear());
  const [yearEnd, setYearEnd] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [quote, setQuote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  
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

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setRole('KABINET');
    setJabatan('');
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
    setRole(m.role);
    setJabatan(m.jabatan);
    setYearStart(m.yearStart);
    setYearEnd(m.yearEnd || '');
    setIsCurrent(m.isCurrent);
    setQuote(m.quote || '');
    setPhotoFile(null);
    setPhotoPreview(m.photoPath ? `http://localhost:25552${m.photoPath}` : '');
    setModalOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
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
    if (photoFile) formData.append('photo', photoFile);

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

  const ROLE_ORDER = { KETUA: 1, WAKIL: 2, KABINET: 3, PEMBINA: 4 };

  const filteredMembers = members
    .filter((m) => {
      if (tab === 'CURRENT') return m.isCurrent;
      if (tab === 'ARCHIVE') return !m.isCurrent;
      return true;
    })
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));


  return (
    <div className={styles.page}>
      <AdminHeader title="Struktur Organisasi" subtitle="Manajemen pengurus, pembina, dan kabinet PIK-R MANSEKU">
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} /> Tambah Pengurus
        </button>
      </AdminHeader>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'ALL' ? styles.active : ''}`} onClick={() => setTab('ALL')}>Semua</button>
          <button className={`${styles.tab} ${tab === 'CURRENT' ? styles.active : ''}`} onClick={() => setTab('CURRENT')}>Menjabat Saat Ini</button>
          <button className={`${styles.tab} ${tab === 'ARCHIVE' ? styles.active : ''}`} onClick={() => setTab('ARCHIVE')}>Arsip Kepengurusan</button>
        </div>

        {loading ? (
          <SkeletonTable rows={5} cols={8} />
        ) : filteredMembers.length === 0 ? (
          <div className={styles.empty}>Belum ada data pengurus di kategori ini.</div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Foto</th>
                  <th>Nama</th>
                  <th>Jabatan</th>
                  <th>Peran</th>
                  <th>Tahun</th>
                  <th>Aktif</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, idx) => (
                  <tr key={m.id}>
                    <td>{idx + 1}</td>
                    <td>
                      {m.photoPath ? (
                        <img src={`http://localhost:25552${m.photoPath}`} alt={m.name} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>{m.name[0]}</div>
                      )}
                    </td>
                    <td className={styles.name}>{m.name}</td>
                    <td>{m.jabatan}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[m.role.toLowerCase()]}`}>
                        {m.role}
                      </span>
                    </td>
                    <td>{m.yearStart}{m.yearEnd ? ` - ${m.yearEnd}` : ' - sekarang'}</td>
                    <td>
                      {m.isCurrent ? (
                        <span className={styles.yes}><Check size={16} /></span>
                      ) : (
                        <span className={styles.no}><X size={16} /></span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
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
              <h3>{editingId ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru'}</h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
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

              <div className={styles.grid}>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Peran Organisasi *</label>
                  <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="PEMBINA">PEMBINA</option>
                    <option value="KETUA">KETUA</option>
                    <option value="WAKIL">WAKIL KETUA</option>
                    <option value="KABINET">KABINET/PENGURUS HARIAN</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jabatan Spesifik (misal: Sekretaris Umum) *</label>
                  <input type="text" className="form-input" value={jabatan} onChange={(e) => setJabatan(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Mulai Menjabat *</label>
                  <input type="number" className="form-input" value={yearStart} onChange={(e) => setYearStart(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Selesai Menjabat (kosongkan jika masih menjabat)</label>
                  <input type="number" className="form-input" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} />
                </div>
                <div className="form-group checkbox-group">
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
                    Menjabat Saat Ini (Aktif)
                  </label>
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

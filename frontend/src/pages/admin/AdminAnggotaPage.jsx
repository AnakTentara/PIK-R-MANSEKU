import { useState, useEffect, useMemo } from 'react';
import { getMembers, updateMember, deleteMember } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import { useUIStore } from '@/stores/uiStore';
import { Edit, Trash2, Search, AlertTriangle, Key, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminAnggotaPage.module.css';

const ITEMS_PER_PAGE = 10;

export default function AdminAnggotaPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL'); // ALL | ACTIVE | ALUMNI
  const [filterKelas, setFilterKelas] = useState('');
  const [filterAngkatan, setFilterAngkatan] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPasswords, setShowPasswords] = useState({});

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    className: '',
    email: '',
    whatsappNumber: '',
    plainPassword: '',
    status: 'ACTIVE',
  });

  const openConfirm = useUIStore((state) => state.openConfirm);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await getMembers();
      setMembers(res.data || []);
    } catch {
      toast.error('Gagal memuat data anggota.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (m) => {
    setSelectedMember(m);
    setEditForm({
      name: m.name || '',
      className: m.className || '',
      email: m.email || '',
      whatsappNumber: m.whatsappNumber || '',
      plainPassword: m.plainPassword || '',
      status: m.status || 'ACTIVE',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.whatsappNumber.trim()) {
      toast.error('Semua kolom wajib diisi.');
      return;
    }

    try {
      await updateMember(selectedMember.id, editForm);
      toast.success('Data anggota berhasil diperbarui.');
      setEditModalOpen(false);
      fetchMembers();
    } catch {
      toast.error('Gagal memperbarui data anggota.');
    }
  };

  const handleDeleteClick = (m) => {
    openConfirm({
      title: 'Hapus Anggota Tetap',
      message: `Apakah Anda yakin ingin menghapus "${m.name}" secara permanen dari database anggota PIK-R?`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteMember(m.id);
          toast.success('Anggota berhasil dihapus.');
          fetchMembers();
        } catch {
          toast.error('Gagal menghapus anggota.');
        }
      }
    });
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Get unique kelas and angkatan for filter dropdowns
  const kelasOptions = useMemo(() => [...new Set(members.map(m => m.className).filter(Boolean))].sort(), [members]);
  const angkatanOptions = useMemo(() => [...new Set(members.map(m => m.joinYear).filter(Boolean))].sort((a, b) => b - a), [members]);

  // Filter
  const filteredMembers = useMemo(() => members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.nisn || '').includes(search);
    const matchesTab = statusTab === 'ALL' ? true : m.status === statusTab;
    const matchesKelas = filterKelas ? m.className === filterKelas : true;
    const matchesAngkatan = filterAngkatan ? String(m.joinYear) === String(filterAngkatan) : true;
    return matchesSearch && matchesTab && matchesKelas && matchesAngkatan;
  }), [members, search, statusTab, filterKelas, filterAngkatan]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset page when filters change
  const handleSearchChange = (val) => { setSearch(val); setCurrentPage(1); };
  const handleKelasChange = (val) => { setFilterKelas(val); setCurrentPage(1); };
  const handleAngkatanChange = (val) => { setFilterAngkatan(val); setCurrentPage(1); };
  const handleTabChange = (tab) => { setStatusTab(tab); setCurrentPage(1); };

  const activeCount = members.filter(m => m.status === 'ACTIVE').length;
  const alumniCount = members.filter(m => m.status === 'ALUMNI').length;

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Daftar Anggota PIK-R"
        subtitle={`${activeCount} Anggota Aktif | ${alumniCount} Alumni`}
      />

      <div className={styles.body}>
        {/* Info Box */}
        <div className={styles.infoBanner}>
          <AlertTriangle size={18} />
          <span>
            Anggota PIK-R memiliki masa aktif maksimal 3 tahun, setelah itu status otomatis berubah menjadi <strong>ALUMNI</strong>.
          </span>
        </div>

        {/* Tabs & Filters */}
        <div className={styles.tabHeader}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${statusTab === 'ALL' ? styles.active : ''}`} onClick={() => handleTabChange('ALL')}>Semua ({members.length})</button>
            <button className={`${styles.tab} ${statusTab === 'ACTIVE' ? styles.active : ''}`} onClick={() => handleTabChange('ACTIVE')}>Aktif ({activeCount})</button>
            <button className={`${styles.tab} ${statusTab === 'ALUMNI' ? styles.active : ''}`} onClick={() => handleTabChange('ALUMNI')}>Alumni ({alumniCount})</button>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cari nama / NISN..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <select className={styles.filterSelect} value={filterKelas} onChange={(e) => handleKelasChange(e.target.value)}>
              <option value="">Semua Kelas</option>
              {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <select className={styles.filterSelect} value={filterAngkatan} onChange={(e) => handleAngkatanChange(e.target.value)}>
              <option value="">Semua Angkatan</option>
              {angkatanOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className={styles.tableWrap}>
          {loading ? (
            <SkeletonTable rows={5} cols={8} />
          ) : filteredMembers.length === 0 ? (
            <div className={styles.empty}>Belum ada data anggota di kategori ini.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>NISN</th>
                  <th>Nama Lengkap</th>
                  <th>Kelas</th>
                  <th>Angkatan</th>
                  <th>Status</th>
                  <th>Sandi Akun</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 1 ? styles.rowAlt : ''}>
                    <td className={styles.tdNum}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                    <td className={styles.tdMono}>{m.nisn}</td>
                    <td className={styles.tdName}>{m.name}</td>
                    <td>{m.className}</td>
                    <td>{m.joinYear}</td>
                    <td>
                      <span className={m.status === 'ACTIVE' ? styles.badgeActive : styles.badgeAlumni}>
                        {m.status === 'ACTIVE' ? 'AKTIF' : 'ALUMNI'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.passwordCell}>
                        <Key size={14} className={styles.keyIcon} />
                        <span className={styles.passwordText}>
                          {showPasswords[m.id] ? m.plainPassword || '—' : '••••••'}
                        </span>
                        <button
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => togglePasswordVisibility(m.id)}
                        >
                          {showPasswords[m.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditClick(m)}
                          title="Edit Anggota & Sandi"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteClick(m)}
                          title="Hapus Anggota Tetap"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Menampilkan {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredMembers.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} dari {filteredMembers.length} anggota
              </span>
              <div className={styles.paginationControls}>
                <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    typeof p === 'string' ? (
                      <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>…</span>
                    ) : (
                      <button key={p} className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`} onClick={() => handlePageChange(p)}>{p}</button>
                    )
                  )}
                <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Edit Anggota &amp; Sandi</h3>
            </div>
            <form onSubmit={handleSaveEdit} className={styles.modalForm}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">Nama Lengkap</label>
                <input
                  id="edit-name"
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-class">Kelas</label>
                <input
                  id="edit-class"
                  type="text"
                  className="form-input"
                  value={editForm.className}
                  onChange={(e) => setEditForm((f) => ({ ...f, className: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-wa">No. WhatsApp</label>
                <input
                  id="edit-wa"
                  type="text"
                  className="form-input"
                  value={editForm.whatsappNumber}
                  onChange={(e) => setEditForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-password">Sandi Akun (Plaintext)</label>
                <input
                  id="edit-password"
                  type="text"
                  className="form-input"
                  placeholder="Ketik password baru jika ingin mengubah..."
                  value={editForm.plainPassword}
                  onChange={(e) => setEditForm((f) => ({ ...f, plainPassword: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-status">Status Keanggotaan</label>
                <select
                  id="edit-status"
                  className="form-select"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="ACTIVE">AKTIF</option>
                  <option value="ALUMNI">ALUMNI</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary">
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditModalOpen(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


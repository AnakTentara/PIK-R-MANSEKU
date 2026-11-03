import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { getMembers, createMember, updateMember, deleteMember, bulkSetAlumni } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import { useUIStore } from '@/stores/uiStore';
import { Edit, Trash2, Search, AlertTriangle, Key, Eye, EyeOff, ChevronLeft, ChevronRight, Plus, Copy, CheckCircle, Upload, User, GraduationCap, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { getUploadUrl } from '@/api/axios';
import { getMemberAttendance } from '@/api/absen';
import { getOrgPositions, exportMembersExcel, downloadMembersTemplate } from '@/api/admin';
import { compressImage } from '@/utils/compressor';
import ImageCropModal from '@/components/common/ImageCropModal';
import styles from './AdminAnggotaPage.module.css';
import PickerField, { compareKelas, compareText } from '@/components/common/PickerField';
import SelectField from '@/components/common/SelectField';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import ReplaceFlow from '@/components/admin/ReplaceFlow';
import MemberExcelModal, { saveBlob } from '@/components/admin/MemberExcelModal';

const KELAS_OPTIONS = [];
['X', 'XI', 'XII'].forEach((tingkat) => {
  const maxClass = tingkat === 'X' ? 9 : 8;
  for (let i = 1; i <= maxClass; i++) {
    KELAS_OPTIONS.push(`${tingkat}-${i}`);
  }
});

const ITEMS_PER_PAGE = 10;

export default function AdminAnggotaPage() {
  const { adminUser } = useAuthStore();
  const isMedinfo = adminUser?.role === 'MEDINFO';

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
    gender: '',
    asalSekolah: '',
    joinYear: '',
    role: 'member',
    jabatan: '',
    bio: '',
  });
  const [positions, setPositions] = useState([]);
  const [excelOpen, setExcelOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [replace, setReplace] = useState(null); // { kind: 'edit' | 'add', jabatan, oldHolders, newPerson }
  const [editAttendance, setEditAttendance] = useState(null); // ringkasan kehadiran anggota yang diedit
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawPhotoSrc, setRawPhotoSrc] = useState('');

  // Upload photo states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortControllerRef = useRef(null);

  const handleCropComplete = (croppedFile, previewUrl) => {
    setEditPhotoFile(croppedFile);
    setEditPhotoPreview(previewUrl);
    setCropModalOpen(false);
    toast.success('Foto profil berhasil dipotong & siap diupload!');
  };

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    nisn: '',
    name: '',
    className: '',
    email: '',
    whatsappNumber: '',
    gender: '',
    role: 'member',
    jabatan: '',
    reason: '',
  });

  // Credentials Modal State
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const openConfirm = useUIStore((state) => state.openConfirm);

  useEffect(() => {
    fetchMembers();
    if (!isMedinfo) getOrgPositions().then((r) => setPositions(r.data)).catch(() => {});
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
      gender: m.gender || '',
      asalSekolah: m.asalSekolah || '',
      joinYear: m.joinYear || '',
      role: m.role || 'member',
      jabatan: m.jabatan || '',
      bio: m.bio || '',
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(m.photoPath ? getUploadUrl(m.photoPath) : '');
    setEditModalOpen(true);
    setEditAttendance(null);
    getMemberAttendance(m.id).then((r) => setEditAttendance(r.data.counts)).catch(() => {});
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  // Jabatan tunggal yang dipegang orang lain -> minta konfirmasi penggantian dulu
  const pendingReplace = (jabatan, selfId) => {
    const p = positions.find((x) => x.label === jabatan);
    return p?.unique ? p.holders.filter((h) => h.memberId !== selfId) : [];
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.whatsappNumber.trim()) {
      toast.error('Semua kolom wajib diisi.');
      return;
    }
    const old = editForm.status === 'ACTIVE' && editForm.jabatan ? pendingReplace(editForm.jabatan, selectedMember?.id) : [];
    if (old.length) {
      setReplace({
        kind: 'edit', jabatan: editForm.jabatan, oldHolders: old,
        newPerson: { name: editForm.name.trim(), photoPath: selectedMember?.photoPath, className: editForm.className, caption: 'Pejabat baru' }
      });
      return;
    }
    doSaveEdit();
  };

  const doSaveEdit = async (displaceMode) => {

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Use FormData if there's a photo to upload
      let payload;
      if (editPhotoFile) {
        payload = new FormData();
        // bio tetap dikirim walau kosong, supaya bisa dihapus
        Object.entries(editForm).forEach(([k, v]) => { if ((v !== '' || k === 'bio') && v !== undefined) payload.append(k, v); });
        if (displaceMode) payload.append('displaceMode', displaceMode);
        payload.append('photo', editPhotoFile);
      } else {
        payload = displaceMode ? { ...editForm, displaceMode } : editForm;
      }
      await updateMember(selectedMember.id, payload, {
        timeout: 0, // Disable timeout for uploads
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      toast.success('Data anggota berhasil diperbarui.');
      setEditModalOpen(false);
      fetchMembers();
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        toast.error('Upload dibatalkan.');
      } else {
        toast.error('Gagal memperbarui data anggota.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportMembersExcel(statusTab === 'ALL' ? undefined : statusTab);
      saveBlob(res.data, `Anggota_PIKR_${statusTab === 'ACTIVE' ? 'AKTIF' : statusTab === 'ALUMNI' ? 'ALUMNI' : 'SEMUA'}.xlsx`);
    } catch {
      toast.error('Gagal mengekspor Excel.');
    } finally {
      setExporting(false);
    }
  };

  const handleTemplate = async () => {
    try { saveBlob((await downloadMembersTemplate()).data, 'Templat_Impor_Anggota_PIKR.xlsx'); }
    catch { toast.error('Gagal mengunduh templat.'); }
  };

  const handleOpenAddModal = () => {
    setAddForm({
      nisn: '',
      name: '',
      className: '',
      email: '',
      whatsappNumber: '',
      gender: '',
      role: 'member',
      jabatan: '',
      reason: '',
    });
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    const isPembinaRole = addForm.role === 'PEMBINA';
    if (
      !addForm.nisn ||
      !addForm.name.trim() ||
      (!isPembinaRole && !addForm.className) ||
      !addForm.email.trim() ||
      !addForm.whatsappNumber.trim() ||
      !addForm.gender
    ) {
      toast.error('Semua kolom bertanda * wajib diisi.');
      return;
    }

    if (addForm.nisn.length !== 10 || !/^\d+$/.test(addForm.nisn)) {
      toast.error('NISN harus 10 digit angka.');
      return;
    }

    const wanted = addForm.role === 'PEMBINA' ? '' : addForm.jabatan;
    const old = wanted ? pendingReplace(wanted, null) : [];
    if (old.length) {
      setReplace({
        kind: 'add', jabatan: wanted, oldHolders: old,
        newPerson: { name: addForm.name.trim(), className: addForm.className, caption: 'Pejabat baru' }
      });
      return;
    }
    doSaveAdd();
  };

  const doSaveAdd = async (displaceMode) => {
    const loadingToast = toast.loading('Menambahkan anggota...');
    try {
      const res = await createMember(displaceMode ? { ...addForm, displaceMode } : addForm);
      toast.success('Anggota berhasil ditambahkan!', { id: loadingToast });
      setCreatedCredentials(res.data.member);
      setAddModalOpen(false);
      setCredentialsModalOpen(true);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan anggota.', { id: loadingToast });
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
  // Pemilih jabatan: kategori (Pimpinan Inti / Ketua Bidang / Anggota Bidang) + pemegang saat ini
  const positionOptions = (selfId) => positions
    .filter((p) => p.role !== 'PEMBINA')
    .map((p) => {
      const others = p.holders.filter((h) => h.memberId !== selfId);
      return {
        value: p.label,
        label: p.label,
        group: p.group,
        description: p.unique ? (others.length ? `Dipegang ${others[0].name}` : 'Kosong') : `${p.holders.length} orang`,
        badge: p.unique && others.length ? 'Akan menggantikan' : undefined
      };
    });
  const displaceNote = (label, selfId) => {
    const p = positions.find((x) => x.label === label);
    const others = p?.unique ? p.holders.filter((h) => h.memberId !== selfId) : [];
    return others.length ? `${others.map((h) => h.name).join(', ')} saat ini menjabat ${label} dan akan dipindahkan ke arsip.` : null;
  };

  const kelasOptions = useMemo(() => [...new Set(members.map(m => m.className).filter(Boolean))].sort(compareKelas), [members]);
  const angkatanOptions = useMemo(() => [...new Set(members.map(m => m.joinYear).filter(Boolean))].sort((a, b) => b - a), [members]);

  // Filter + urutan: status (Aktif dulu, Alumni paling belakang) lalu kelas (X-1 ... XII-8) lalu nama A-Z.
  // Nomor di tabel hanya penanda urutan tampil.
  const STATUS_ORDER = { ACTIVE: 0, ALUMNI: 1 };
  const filteredMembers = useMemo(() => members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.nisn || '').includes(search);
    const matchesTab = statusTab === 'ALL' ? true : m.status === statusTab;
    const matchesKelas = filterKelas ? m.className === filterKelas : true;
    const matchesAngkatan = filterAngkatan ? String(m.joinYear) === String(filterAngkatan) : true;
    return matchesSearch && matchesTab && matchesKelas && matchesAngkatan;
  }).sort((x, y) =>
    (STATUS_ORDER[x.status] ?? 9) - (STATUS_ORDER[y.status] ?? 9) ||
    compareKelas(x.className, y.className) ||
    compareText(x.name, y.name)
  ), [members, search, statusTab, filterKelas, filterAngkatan]);

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

  // Bulk Alumni Modal State
  const [alumniModalOpen, setAlumniModalOpen] = useState(false);
  const [selectedAngkatan, setSelectedAngkatan] = useState('');
  const [bulkAlumniLoading, setBulkAlumniLoading] = useState(false);

  const activeAngkatanOptions = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'ACTIVE' && m.role !== 'PEMBINA');
    return [...new Set(activeMembers.map(m => m.joinYear).filter(Boolean))].sort((a, b) => a - b);
  }, [members]);

  const selectedAngkatanCount = useMemo(() => {
    if (!selectedAngkatan) return 0;
    return members.filter(m => m.status === 'ACTIVE' && m.joinYear === parseInt(selectedAngkatan) && m.role !== 'PEMBINA').length;
  }, [members, selectedAngkatan]);

  const handleBulkAlumni = async () => {
    if (!selectedAngkatan) return toast.error('Pilih angkatan terlebih dahulu.');
    setBulkAlumniLoading(true);
    try {
      const res = await bulkSetAlumni(parseInt(selectedAngkatan));
      toast.success(res.data.message);
      setAlumniModalOpen(false);
      setSelectedAngkatan('');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status alumni.');
    } finally {
      setBulkAlumniLoading(false);
    }
  };

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
            Status anggota dikelola secara manual oleh admin. Gunakan tombol <strong>"Wisudakan Angkatan"</strong> untuk mengubah status satu angkatan menjadi Alumni.
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
            <SelectField className={styles.filterSelect} value={filterKelas} onChange={(e) => handleKelasChange(e.target.value)}>
              <option value="">Semua Kelas</option>
              {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </SelectField>
            <SelectField className={styles.filterSelect} value={filterAngkatan} onChange={(e) => handleAngkatanChange(e.target.value)}>
              <option value="">Semua Angkatan</option>
              {angkatanOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </SelectField>
          </div>

          <div className={styles.actionRow}>
            <button className="btn btn-secondary" onClick={handleExport} disabled={exporting} title="Unduh daftar anggota sesuai tab yang dipilih">
              <FileSpreadsheet size={16} /> {exporting ? 'Menyiapkan…' : 'Ekspor Excel'}
            </button>
            {!isMedinfo && (
              <>
                <button className="btn btn-secondary" onClick={() => setExcelOpen(true)} title="Tambah / perbarui banyak anggota dari Excel">
                  <Upload size={16} /> Impor Excel
                </button>
                <button className="btn btn-primary" onClick={handleOpenAddModal}>
                  <Plus size={16} /> Tambah Anggota
                </button>
                <button className={styles.btnAlumni} onClick={() => setAlumniModalOpen(true)}>
                  <GraduationCap size={16} /> Wisudakan Angkatan
                </button>
              </>
            )}
          </div>
        </div>

        {/* Members Table */}
        <div className={styles.tableWrap}>
          {loading ? (
            <SkeletonTable rows={5} cols={9} />
          ) : filteredMembers.length === 0 ? (
            <div className={styles.empty}>Belum ada data anggota di kategori ini.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Foto</th>
                  <th>NISN</th>
                  <th>Nama Lengkap</th>
                  <th>Kelas</th>
                  <th>Jabatan</th>
                  <th>Angkatan</th>
                  <th>Status</th>
                  <th>Sandi Akun</th>
                  {!isMedinfo && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 1 ? styles.rowAlt : ''}>
                    <td className={styles.tdNum}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                    <td>
                      <PhotoAvatar src={m.photoPath ? getUploadUrl(m.photoPath) : ''} name={m.name} className={styles.memberAvatar} placeholderClassName={styles.memberAvatarPlaceholder} />
                    </td>
                    <td className={styles.tdMono}>{m.nisn}</td>
                    <td className={styles.tdName}>{m.name}</td>
                    <td>{m.className}</td>
                    <td>
                      {m.alumniLabel
                        ? <span className={styles.badgeAlumniInti}>{m.alumniLabel}</span>
                        : m.jabatan || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
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
                    {!isMedinfo && (
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
                    )}
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
          <div className={`${styles.modalCard} ${styles.wideEditModalCard}`}>
            <div className={styles.modalHeader}>
              <h3>Edit Anggota &amp; Akun</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>NISN: <strong>{selectedMember?.nisn}</strong></p>
            </div>
            <form onSubmit={handleSaveEdit} className={styles.modalForm}>
              <fieldset disabled={uploading} style={{ border: 'none', padding: 0, margin: 0 }}>
                <div className={styles.modalFormInner}>
                  {/* Photo Upload */}
                  <div className={styles.photoEditSection}>
                    <div className={styles.photoEditPreview}>
                      {editPhotoPreview ? (
                        <img src={editPhotoPreview} alt="Foto" />
                      ) : (
                        <div className={styles.photoEditPlaceholder}><User size={28} /></div>
                      )}
                    </div>
                    <label className={`${styles.photoEditBtn} ${uploading ? styles.disabledBtn : ''}`} style={uploading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                      <Upload size={14} /> {editPhotoPreview ? 'Ganti Foto' : 'Upload Foto'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 25 * 1024 * 1024) {
                              toast.error('Ukuran foto profil maksimal adalah 25MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setRawPhotoSrc(reader.result);
                              setCropModalOpen(true);
                            };
                            reader.readAsDataURL(file);
                            e.target.value = ''; // reset input so same file can be selected again
                          }
                        }}
                      />
                    </label>
                    <p className={styles.photoEditHint}>Foto profil anggota akan tampil di pohon organisasi jika anggota ini terhubung sebagai pengurus.</p>
                    {selectedMember?.memberCode && (
                      <p className={styles.photoEditHint} style={{ marginTop: 8 }}>
                        ID Card: <code>{selectedMember.memberCode}</code> ·{' '}
                        <a href={`/@${selectedMember.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent-dark)', fontWeight: 600 }}>
                          Lihat biodata publik →
                        </a>
                      </p>
                    )}
                    {editAttendance && (
                      <p className={styles.photoEditHint} style={{ marginTop: 4 }}>
                        Kehadiran 1 tahun: <b style={{ color: 'var(--color-success)' }}>{editAttendance.HADIR} hadir</b> · {editAttendance.SAKIT} sakit · {editAttendance.IZIN} izin ·{' '}
                        <b style={{ color: 'var(--color-error)' }}>{editAttendance.ALFA} alfa</b>
                      </p>
                    )}
                  </div>

                  <div className={styles.editGrid}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-name">Nama Lengkap *</label>
                      <input id="edit-name" type="text" className="form-input" value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-class">Kelas</label>
                      <input id="edit-class" type="text" className="form-input" value={editForm.className}
                        onChange={(e) => setEditForm((f) => ({ ...f, className: e.target.value }))} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-email">Email *</label>
                      <input id="edit-email" type="email" className="form-input" value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-wa">No. WhatsApp *</label>
                      <input id="edit-wa" type="text" className="form-input" value={editForm.whatsappNumber}
                        onChange={(e) => setEditForm((f) => ({ ...f, whatsappNumber: e.target.value }))} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Jenis Kelamin</label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        {['Laki-laki', 'Perempuan'].map((g) => (
                          <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
                            <input type="radio" name="edit-gender" value={g}
                              checked={editForm.gender === g}
                              onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))} />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-asal">Asal Sekolah</label>
                      <input id="edit-asal" type="text" className="form-input" value={editForm.asalSekolah}
                        onChange={(e) => setEditForm((f) => ({ ...f, asalSekolah: e.target.value }))} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-year">Tahun Bergabung</label>
                      <input id="edit-year" type="number" className="form-input" value={editForm.joinYear}
                        min="2000" max="2099"
                        onChange={(e) => setEditForm((f) => ({ ...f, joinYear: e.target.value }))} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Jabatan Kepengurusan</label>
                      {editForm.status === 'ALUMNI' ? (
                        <input type="text" className="form-input" readOnly value="Alumni tidak memiliki jabatan aktif"
                          style={{ backgroundColor: 'var(--color-surface-2)', cursor: 'not-allowed' }} />
                      ) : editForm.role === 'PEMBINA' ? (
                        <input type="text" className="form-input" readOnly value="Pembina"
                          style={{ backgroundColor: 'var(--color-surface-2)', cursor: 'not-allowed' }} />
                      ) : (
                        <PickerField
                          value={editForm.jabatan}
                          options={positionOptions(selectedMember?.id)}
                          title="Pilih jabatan kepengurusan"
                          placeholder="Anggota biasa (tanpa jabatan)"
                          clearLabel="Anggota biasa (tanpa jabatan)"
                          searchable
                          onChange={(v) => setEditForm((f) => ({ ...f, jabatan: v, role: v ? (positions.find((p) => p.label === v)?.role || f.role) : 'member' }))}
                        />
                      )}
                      {(() => {
                        const note = displaceNote(editForm.jabatan, selectedMember?.id);
                        return note ? <p className={styles.photoEditHint} style={{ marginTop: 6, color: 'var(--color-pending)' }}>{note}</p> : null;
                      })()}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-status">Status Keanggotaan</label>
                      <SelectField id="edit-status" className="form-select" value={editForm.status}
                        onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                        <option value="ACTIVE">AKTIF</option>
                        <option value="ALUMNI">ALUMNI</option>
                      </SelectField>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-password">Sandi Akun (Plaintext)</label>
                      <input id="edit-password" type="text" className="form-input"
                        placeholder="Kosongkan jika tidak ingin mengubah sandi..."
                        value={editForm.plainPassword}
                        onChange={(e) => setEditForm((f) => ({ ...f, plainPassword: e.target.value }))} />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label" htmlFor="edit-bio">Bio / Kata-kata ({(editForm.bio || '').length}/300)</label>
                      <textarea id="edit-bio" className="form-textarea" rows={2} maxLength={300}
                        placeholder="Tampil di biodata publik dari QR ID Card"
                        value={editForm.bio}
                        onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </fieldset>

              <div className={styles.modalActions}>
                {uploading ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Mengupload foto profil...</span>
                      <strong style={{ color: 'var(--color-primary)' }}>{uploadProgress}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-surface-2)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.2s ease-out' }}></div>
                    </div>
                    <button type="button" className="btn btn-danger" onClick={handleCancelUpload} style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}>
                      Batal Upload
                    </button>
                  </div>
                ) : (
                  <>
                    <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Batal</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Tambah Anggota Baru secara Manual</h3>
            </div>
            <form onSubmit={handleSaveAdd} className={styles.modalForm}>
              <div className="form-group">
                <label className="form-label" htmlFor="add-nisn">NISN *</label>
                <input
                  id="add-nisn"
                  type="text"
                  maxLength={10}
                  className="form-input"
                  placeholder="Masukkan 10 digit NISN"
                  value={addForm.nisn}
                  onChange={(e) => setAddForm((f) => ({ ...f, nisn: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-name">Nama Lengkap *</label>
                <input
                  id="add-name"
                  type="text"
                  className="form-input"
                  placeholder="Nama sesuai dokumen resmi"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-class">Kelas {addForm.role === 'PEMBINA' ? '(Opsional)' : '*'}</label>
                <SelectField
                  id="add-class"
                  className="form-select"
                  value={addForm.className}
                  onChange={(e) => setAddForm((f) => ({ ...f, className: e.target.value }))}
                >
                  <option value="">— Pilih Kelas —</option>
                  {KELAS_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </SelectField>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-email">Email *</label>
                <input
                  id="add-email"
                  type="email"
                  className="form-input"
                  placeholder="email@contoh.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-wa">No. WhatsApp *</label>
                <input
                  id="add-wa"
                  type="text"
                  className="form-input"
                  placeholder="08xxxxxxxxxx"
                  value={addForm.whatsappNumber}
                  onChange={(e) => setAddForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Jenis Kelamin *</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="add-gender"
                      value="Laki-laki"
                      checked={addForm.gender === 'Laki-laki'}
                      onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value }))}
                    />
                    <span>Laki-laki</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="add-gender"
                      value="Perempuan"
                      checked={addForm.gender === 'Perempuan'}
                      onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value }))}
                    />
                    <span>Perempuan</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Jabatan Kepengurusan</label>
                <PickerField
                  value={addForm.role === 'PEMBINA' ? 'Pembina' : addForm.jabatan}
                  options={[{ value: 'Pembina', label: 'Pembina', group: 'Pembina', description: 'Pembina PIK-R' }, ...positionOptions(null)]}
                  title="Pilih jabatan kepengurusan"
                  placeholder="Anggota biasa (tanpa jabatan)"
                  clearLabel="Anggota biasa (tanpa jabatan)"
                  searchable
                  onChange={(v) => setAddForm((f) => {
                    if (!v) return { ...f, jabatan: '', role: 'member' };
                    const pos = positions.find((p) => p.label === v);
                    return { ...f, jabatan: v === 'Pembina' ? '' : v, role: v === 'Pembina' ? 'PEMBINA' : (pos?.role || 'member') };
                  })}
                />
                {(() => {
                  const note = displaceNote(addForm.jabatan, null);
                  return note ? <p className={styles.photoEditHint} style={{ marginTop: 6, color: 'var(--color-pending)' }}>{note}</p> : null;
                })()}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="add-reason">Alasan Bergabung (Opsional)</label>
                <textarea
                  id="add-reason"
                  className="form-textarea"
                  rows={3}
                  placeholder="Tuliskan motivasi/alasan masuk..."
                  value={addForm.reason}
                  onChange={(e) => setAddForm((f) => ({ ...f, reason: e.target.value }))}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary">
                  Tambah Anggota
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAddModalOpen(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Success Modal */}
      {credentialsModalOpen && createdCredentials && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '400px', textAlign: 'center', padding: '24px' }}>
            <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
              Anggota Berhasil Ditambahkan!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Akun anggota tetap telah aktif. Harap catat kredensial berikut untuk diberikan kepada siswa yang bersangkutan:
            </p>

            <div style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>NAMA LENGKAP</span>
                <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{createdCredentials.name}</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>USERNAME / NISN</span>
                <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>{createdCredentials.nisn}</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>KATA SANDI SEMENTARA</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '1.125rem', color: 'var(--color-accent)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {createdCredentials.plainPassword}
                  </strong>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.plainPassword);
                      toast.success('Sandi berhasil disalin!');
                    }}
                    title="Salin Sandi"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setCredentialsModalOpen(false)}
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}

      {/* Wisudakan Angkatan Modal */}
      {alumniModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setAlumniModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h2 className={styles.modalTitle}>
              <GraduationCap size={22} /> Wisudakan Angkatan
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: 1.5 }}>
              Semua anggota aktif pada angkatan yang dipilih akan diubah statusnya menjadi <strong>ALUMNI</strong>. Pembina tidak terpengaruh.
            </p>

            <label className={styles.formLabel}>Pilih Angkatan</label>
            <SelectField
              className={styles.formInput}
              value={selectedAngkatan}
              onChange={(e) => setSelectedAngkatan(e.target.value)}
              style={{ marginBottom: '12px' }}
            >
              <option value="">-- Pilih Angkatan --</option>
              {activeAngkatanOptions.map((yr) => (
                <option key={yr} value={yr}>Angkatan {yr}</option>
              ))}
            </SelectField>

            {selectedAngkatan && (
              <div className={styles.alumniPreview}>
                <AlertTriangle size={16} />
                <span><strong>{selectedAngkatanCount}</strong> anggota aktif angkatan {selectedAngkatan} akan menjadi Alumni.</span>
              </div>
            )}

            <div className={styles.modalActions}>
              <button type="button" className="btn btn-ghost" onClick={() => setAlumniModalOpen(false)}>Batal</button>
              <button
                type="button"
                className={styles.btnAlumniConfirm}
                onClick={handleBulkAlumni}
                disabled={!selectedAngkatan || bulkAlumniLoading || selectedAngkatanCount === 0}
              >
                {bulkAlumniLoading ? 'Memproses...' : `Wisudakan ${selectedAngkatanCount} Anggota`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop & Rotate Modal */}
      {cropModalOpen && (
        <ImageCropModal
          imageSrc={rawPhotoSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setCropModalOpen(false)}
        />
      )}

      <MemberExcelModal open={excelOpen} onClose={() => setExcelOpen(false)} onDone={fetchMembers} />

      <ReplaceFlow
        open={!!replace}
        jabatan={replace?.jabatan || ''}
        oldHolders={replace?.oldHolders || []}
        newPerson={replace?.newPerson || { name: '' }}
        onCancel={() => setReplace(null)}
        onConfirm={(mode) => {
          const kind = replace.kind;
          setReplace(null);
          if (kind === 'edit') doSaveEdit(mode); else doSaveAdd(mode);
        }}
      />
    </div>
  );
}


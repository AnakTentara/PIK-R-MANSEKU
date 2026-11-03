import { useState, useEffect } from 'react';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, getMembers, createMember, updateMember, deleteMember } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import { Plus, Edit2, Trash2, UserCheck, Shield, Loader2, User, Eye, EyeOff } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import toast from 'react-hot-toast';
import styles from './AdminUsersPage.module.css';
import SelectField from '@/components/common/SelectField';

const ROLES = [
  { value: 'DEVELOPER', label: 'Developer (Super Admin)' },
  { value: 'KABINET_UMUM', label: 'Kabinet Umum (Admin Operasional)' },
  { value: 'MEDINFO', label: 'Anggota MedInfo (Jurnalis/Read-only)' }
];

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);

  // Lists
  const [pembinaList, setPembinaList] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});

  // Modals
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [pembinaModalOpen, setPembinaModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRole, setAdminRole] = useState('KABINET_UMUM');

  // Pembina / Member Form State
  const [pembinaForm, setPembinaForm] = useState({
    name: '',
    whatsappNumber: '',
    email: '',
    gender: 'Laki-laki',
    plainPassword: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const openConfirm = useUIStore((st) => st.openConfirm);

  useEffect(() => {
    fetchAllAccounts();
  }, []);

  const fetchAllAccounts = async () => {
    setLoading(true);
    try {
      const [membersRes, adminRes] = await Promise.all([
        getMembers(),
        getAdminUsers()
      ]);

      const allM = membersRes.data || [];
      setPembinaList(allM.filter(m => m.role === 'PEMBINA'));
      setAdminList(adminRes.data?.users || []);
    } catch (err) {
      toast.error('Gagal memuat daftar akun.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordShow = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Admin Modal Handlers ──
  const handleOpenAdminModal = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setAdminUsername(user.username);
      setAdminPassword('');
      setAdminRole(user.role);
    } else {
      setEditingId(null);
      setAdminUsername('');
      setAdminPassword('');
      setAdminRole('KABINET_UMUM');
    }
    setAdminModalOpen(true);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminUsername.trim()) return toast.error('Username wajib diisi.');
    if (!editingId && !adminPassword.trim()) return toast.error('Password wajib diisi.');

    setSubmitting(true);
    try {
      if (editingId) {
        const payload = { username: adminUsername, role: adminRole };
        if (adminPassword.trim()) payload.password = adminPassword;
        await updateAdminUser(editingId, payload);
        toast.success('Akun Admin berhasil diperbarui!');
      } else {
        await createAdminUser({ username: adminUsername, password: adminPassword, role: adminRole });
        toast.success('Akun Admin baru berhasil dibuat!');
      }
      setAdminModalOpen(false);
      fetchAllAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan akun admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = (user) => {
    if (user.username === 'pikr-manseku') return toast.error('Akun Master tidak dapat dihapus.');
    openConfirm({
      title: 'Hapus akun admin?',
      message: `Akun "${user.username}" tidak akan bisa login lagi.`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteAdminUser(user.id);
          toast.success('Akun admin berhasil dihapus.');
          fetchAllAccounts();
        } catch {
          toast.error('Gagal menghapus admin.');
        }
      }
    });
  };

  // ── Pembina Modal Handlers ──
  const handleOpenPembinaModal = (pembina = null) => {
    if (pembina) {
      setEditingId(pembina.id);
      setPembinaForm({
        name: pembina.name || '',
        whatsappNumber: pembina.whatsappNumber || '',
        email: pembina.email || '',
        gender: pembina.gender || 'Laki-laki',
        plainPassword: pembina.plainPassword || ''
      });
    } else {
      setEditingId(null);
      setPembinaForm({
        name: '',
        whatsappNumber: '',
        email: '',
        gender: 'Laki-laki',
        plainPassword: ''
      });
    }
    setPembinaModalOpen(true);
  };

  const handlePembinaSubmit = async (e) => {
    e.preventDefault();
    if (!pembinaForm.name.trim() || !pembinaForm.whatsappNumber.trim() || !pembinaForm.email.trim()) {
      return toast.error('Nama, No. WhatsApp, dan Email wajib diisi.');
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateMember(editingId, {
          name: pembinaForm.name,
          whatsappNumber: pembinaForm.whatsappNumber,
          email: pembinaForm.email,
          gender: pembinaForm.gender,
          plainPassword: pembinaForm.plainPassword,
          role: 'PEMBINA'
        });
        toast.success('Akun Pembina berhasil diperbarui!');
      } else {
        await createMember({
          name: pembinaForm.name,
          whatsappNumber: pembinaForm.whatsappNumber,
          email: pembinaForm.email,
          gender: pembinaForm.gender,
          plainPassword: pembinaForm.plainPassword,
          role: 'PEMBINA',
          status: 'ACTIVE'
        });
        toast.success('Akun Pembina baru berhasil dibuat!');
      }
      setPembinaModalOpen(false);
      fetchAllAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan akun Pembina.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMemberAccount = (m) => openConfirm({
    title: 'Hapus akun pembina?',
    message: `Akun "${m.name.trim()}" dihapus permanen. Jabatannya di struktur organisasi dipindahkan ke arsip.`,
    danger: true,
    onConfirm: async () => {
      try {
        await deleteMember(m.id);
        toast.success('Akun berhasil dihapus.');
        fetchAllAccounts();
      } catch {
        toast.error('Gagal menghapus akun.');
      }
    }
  });

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Manajemen Akun Terpadu"
        subtitle="Akun Pembina dan akun pengelola website (Developer / Admin). Akun anggota dikelola di menu Anggota PIK-R."
      />

      {loading ? (
        <div className={styles.loadingContainer}>
          <Loader2 className="spinner" size={32} />
          <p>Memuat daftar akun...</p>
        </div>
      ) : (
        <div className={styles.sections}>
          {/* ── Pembina ── */}
          <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}><UserCheck size={18} /> Pembina <span className={styles.sectionCount}>{pembinaList.length}</span></h2>
            <p className={styles.sectionHint}>Akun Pembina tanpa NISN. Jabatan "Pembina" di Struktur Organisasi ikut tersinkron.</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenPembinaModal()}><Plus size={16} /> Tambah Pembina</button>
        </div>
            {pembinaList.length === 0 ? (
              <div className={styles.emptyContainer}>
                <UserCheck size={40} className={styles.emptyIcon} />
                <p>Belum ada akun Pembina. Klik "Tambah Pembina" untuk membuatnya.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>No.</th><th>Nama Lengkap</th><th>No. WhatsApp</th><th>Email</th><th>Jenis Kelamin</th><th>Kata Sandi</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pembinaList.map((p, idx) => (
                      <tr key={p.id}>
                        <td>{idx + 1}</td>
                        <td className={styles.usernameCol}><UserCheck size={16} style={{ color: 'var(--color-accent)' }} />{p.name.trim()}</td>
                        <td>{p.whatsappNumber}</td>
                        <td>{p.email}</td>
                        <td>{p.gender}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{showPasswords[p.id] ? (p.plainPassword || '—') : '••••••••'}</span>
                            <button className="btn btn-ghost btn-sm" onClick={() => togglePasswordShow(p.id)}>
                              {showPasswords[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.actions}>
                            <button className="btn btn-ghost" onClick={() => handleOpenPembinaModal(p)} title="Edit Pembina"><Edit2 size={14} /></button>
                            <button className="btn btn-ghost text-error" onClick={() => handleDeleteMemberAccount(p)} title="Hapus"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Developer & Admin Website ── */}
          <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}><Shield size={18} /> Developer &amp; Admin Website <span className={styles.sectionCount}>{adminList.length}</span></h2>
            <p className={styles.sectionHint}>Akun pengelola dashboard. Developer penuh, Kabinet Umum operasional, MedInfo hanya baca.</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenAdminModal()}><Plus size={16} /> Tambah Admin</button>
        </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No.</th><th>Username</th><th>Tingkat Otoritas (Role)</th><th>Tanggal Dibuat</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {adminList.map((user, idx) => (
                    <tr key={user.id}>
                      <td>{idx + 1}</td>
                      <td className={styles.usernameCol}>
                        <User size={14} className={styles.usernameIcon} />
                        {user.username}
                        {user.username === 'pikr-manseku' && <span className={styles.masterBadge}>Master</span>}
                      </td>
                      <td>
                        <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}>
                          <Shield size={12} style={{ marginRight: 4 }} />
                          {ROLES.find(r => r.value === user.role)?.label || user.role}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.actions}>
                          <button className="btn btn-ghost" onClick={() => handleOpenAdminModal(user)} title="Edit User"><Edit2 size={14} /></button>
                          <button className="btn btn-ghost text-error" onClick={() => handleDeleteAdmin(user)} disabled={user.username === 'pikr-manseku'} title="Hapus User"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ── Admin System Modal ── */}
      {adminModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setAdminModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setAdminModalOpen(false)}>×</button>
            <h3 className={styles.modalTitle}>
              {editingId ? 'Edit Akun Admin' : 'Tambah Akun Admin Baru'}
            </h3>
            <form onSubmit={handleAdminSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="user-username">Username</label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    id="user-username"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="Masukkan username admin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    disabled={editingId && adminUsername === 'pikr-manseku'}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="user-password">
                  {editingId ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
                </label>
                <div className={styles.inputWrapper}>
                  <Key size={16} className={styles.inputIcon} />
                  <input
                    id="user-password"
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder={editingId ? '••••••••' : 'Masukkan password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required={!editingId}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="user-role">Tingkat Kewenangan (Role)</label>
                <SelectField
                  id="user-role"
                  className="form-input"
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  disabled={editingId && adminUsername === 'pikr-manseku'}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </SelectField>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-ghost" onClick={() => setAdminModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting && <span className="spinner" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Akun Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Pembina Modal (TANPA NISN) ── */}
      {pembinaModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setPembinaModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setPembinaModalOpen(false)}>×</button>
            <h3 className={styles.modalTitle}>
              {editingId ? 'Edit Akun Pembina' : 'Tambah Akun Pembina Baru (Tanpa NISN)'}
            </h3>
            <form onSubmit={handlePembinaSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="pembina-name">Nama Lengkap Pembina *</label>
                <input
                  id="pembina-name"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Dra. Hj. Nur Aini, M.Pd"
                  value={pembinaForm.name}
                  onChange={(e) => setPembinaForm({ ...pembinaForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pembina-wa">No. WhatsApp *</label>
                <input
                  id="pembina-wa"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: 081234567890"
                  value={pembinaForm.whatsappNumber}
                  onChange={(e) => setPembinaForm({ ...pembinaForm, whatsappNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pembina-email">Email *</label>
                <input
                  id="pembina-email"
                  type="email"
                  className="form-input"
                  placeholder="pembina@man1muaraenim.sch.id"
                  value={pembinaForm.email}
                  onChange={(e) => setPembinaForm({ ...pembinaForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pembina-gender">Jenis Kelamin *</label>
                <SelectField
                  id="pembina-gender"
                  className="form-select"
                  value={pembinaForm.gender}
                  onChange={(e) => setPembinaForm({ ...pembinaForm, gender: e.target.value })}
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </SelectField>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pembina-pass">
                  {editingId ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi Pembina'}
                </label>
                <input
                  id="pembina-pass"
                  type="text"
                  className="form-input"
                  placeholder={editingId ? 'Kosongkan jika tidak diubah' : 'Jika kosong, password dibuat otomatis'}
                  value={pembinaForm.plainPassword}
                  onChange={(e) => setPembinaForm({ ...pembinaForm, plainPassword: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-ghost" onClick={() => setPembinaModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting && <span className="spinner" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Akun Pembina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

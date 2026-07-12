import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '@/api/candidates';
import { useAuthStore } from '@/stores/authStore';
import SkeletonProfile from '@/components/skeletons/SkeletonProfile';
import { LogOut, Edit2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './ProfilePage.module.css';

const KELAS_OPTIONS = [];
['X', 'XI', 'XII'].forEach((t) => {
  for (let i = 1; i <= 8; i++) KELAS_OPTIONS.push(`${t}-${i}`);
});

const STATUS_MAP = {
  LULUS: { label: 'Lulus', cls: 'badge-success' },
  TIDAK_LULUS: { label: 'Tidak Lulus', cls: 'badge-error' },
  PENDING: { label: 'Pending', cls: 'badge-pending' },
};

export default function ProfilePage() {
  const { candidateUser, updateCandidateUser, logoutCandidate } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const data = res.data?.candidate || res.data;
      setProfile(data);
      setForm({
        name: data.name || '',
        className: data.className || '',
        whatsappNumber: data.whatsappNumber || '',
        email: data.email || '',
      });
    } catch {
      toast.error('Gagal memuat profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(form);
      const updated = res.data?.candidate || res.data;
      setProfile(updated);
      updateCandidateUser(updated);
      toast.success('Profil berhasil diperbarui!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logoutCandidate();
    navigate('/login');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const statusInfo = STATUS_MAP[profile?.status] || STATUS_MAP.PENDING;

  if (loading) {
    return (
      <div className="page-wrapper">
        <section className="section">
          <div className="container">
            <SkeletonProfile />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container">
          <div className={styles.layout}>
            {/* Header Card */}
            <div className={styles.headerCard}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.headerInfo}>
                <h1 className={styles.name}>{profile?.name}</h1>
                <p className={styles.nisn}>NISN: <span>{profile?.nisn}</span></p>
              </div>
              <span className={`badge ${statusInfo.cls} ${styles.statusBadge}`}>
                {statusInfo.label}
              </span>
            </div>

            {/* Detail Grid */}
            {!editing ? (
              <>
                <div className={styles.grid}>
                  <FieldCard label="Kelas" value={profile?.className || '—'} />
                  <FieldCard label="Jenis Kelamin" value={profile?.gender || '—'} />
                  <FieldCard label="No. WhatsApp" value={profile?.whatsappNumber || '—'} />
                  <FieldCard label="Email" value={profile?.email || '—'} />
                  <FieldCard
                    label="Status"
                    value={statusInfo.label}
                    fullWidth
                  />
                  <FieldCard
                    label="Alasan Bergabung"
                    value={profile?.reason || '—'}
                    fullWidth
                  />
                </div>
                <div className={styles.actions}>
                  <button
                    onClick={() => setEditing(true)}
                    className="btn btn-secondary"
                  >
                    <Edit2 size={15} />
                    Edit Profil
                  </button>
                  <button onClick={handleLogout} className="btn btn-ghost">
                    <LogOut size={15} />
                    Keluar dari Akun
                  </button>
                </div>
              </>
            ) : (
              /* Edit Form */
              <form onSubmit={handleSave} className={styles.editForm}>
                <div className={styles.editGrid}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-name">Nama Lengkap</label>
                    <input
                      id="edit-name"
                      type="text"
                      className="form-input"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-class">Kelas</label>
                    <select
                      id="edit-class"
                      className="form-select"
                      value={form.className}
                      onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                    >
                      <option value="">— Pilih Kelas —</option>
                      {KELAS_OPTIONS.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-wa">No. WhatsApp</label>
                    <input
                      id="edit-wa"
                      type="text"
                      className="form-input"
                      value={form.whatsappNumber}
                      onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-email">Email</label>
                    <input
                      id="edit-email"
                      type="email"
                      className="form-input"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  {/* Read-only fields */}
                  <div className="form-group">
                    <label className="form-label">NISN</label>
                    <input type="text" className="form-input" value={profile?.nisn || ''} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <input type="text" className="form-input" value={statusInfo.label} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  </div>
                </div>
                <div className={styles.editActions}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner" /> : <Save size={15} />}
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                    <X size={15} />
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function FieldCard({ label, value, fullWidth }) {
  return (
    <div className={`${styles.fieldCard} ${fullWidth ? styles.fullWidth : ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}

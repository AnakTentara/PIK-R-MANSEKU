import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProfile, updateProfile } from '@/api/candidates';
import { useAuthStore } from '@/stores/authStore';
import SkeletonProfile from '@/components/skeletons/SkeletonProfile';
import { LogOut, Edit2, X, Save, Download, Heart, Bookmark, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUploadUrl } from '@/api/axios';
import { formatDate } from '@/utils/formatDate';
import { estimateReadingTime } from '@/utils/readingTime';
import styles from './ProfilePage.module.css';

const KELAS_OPTIONS = [];
['X', 'XI', 'XII'].forEach((t) => {
  const maxClass = t === 'X' ? 9 : 8;
  for (let i = 1; i <= maxClass; i++) KELAS_OPTIONS.push(`${t}-${i}`);
});

const STATUS_MAP = {
  LULUS: { label: 'Lulus Seleksi (Anggota)', cls: 'badge-success' },
  TIDAK_LULUS: { label: 'Tidak Lulus', cls: 'badge-error' },
  PENDING: { label: 'Pending (Calon Anggota)', cls: 'badge-pending' },
  ACTIVE: { label: 'Anggota Aktif', cls: 'badge-success' },
  ALUMNI: { label: 'Alumni', cls: 'badge-pending' }
};

export default function ProfilePage() {
  const { candidateUser, updateCandidateUser, logoutCandidate } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Lists from local storage
  const [activeTab, setActiveTab] = useState('liked'); // 'liked' | 'saved' | 'commented'
  const [likedPosts, setLikedPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);

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
        reason: data.reason || '',
        asalSekolah: data.asalSekolah || '',
        gender: data.gender || ''
      });

      if (data && data.nisn) {
        const likedKey = `likes_${data.nisn}`;
        const savedKey = `bookmarks_${data.nisn}`;
        const commentedKey = `comments_${data.nisn}`;

        setLikedPosts(JSON.parse(localStorage.getItem(likedKey) || '[]'));
        setSavedPosts(JSON.parse(localStorage.getItem(savedKey) || '[]'));
        setCommentedPosts(JSON.parse(localStorage.getItem(commentedKey) || '[]'));
      }
    } catch {
      toast.error('Gagal memuat profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('className', form.className);
    formData.append('whatsappNumber', form.whatsappNumber);
    formData.append('email', form.email);
    formData.append('reason', form.reason || '');
    formData.append('asalSekolah', form.asalSekolah || '');
    formData.append('gender', form.gender || '');
    if (photoFile) {
      formData.append('photo', photoFile);
    }
    
    try {
      const res = await updateProfile(formData);
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

  const handleDownloadProfile = () => {
    if (!profile) return;
    const border = "==================================================";
    const divider = "--------------------------------------------------";
    const text = [
      border,
      "        KARTU ANGGOTA RESMI PIK-R MANSEKU",
      border,
      `Nama Lengkap    : ${profile.name || '—'}`,
      `NISN            : ${profile.nisn || '—'}`,
      `Kelas           : ${profile.className || '—'}`,
      `Jenis Kelamin   : ${profile.gender || '—'}`,
      `Asal Sekolah    : ${profile.asalSekolah || '—'}`,
      `No. WhatsApp    : ${profile.whatsappNumber || '—'}`,
      `Email           : ${profile.email || '—'}`,
      `Status          : ${STATUS_MAP[profile.status]?.label || 'ANGGOTA'}`,
      `Tahun Gabung    : ${profile.joinYear || new Date(profile.createdAt).getFullYear()}`,
      divider,
      "Alasan Bergabung:",
      `"${profile.reason || '—'}"`,
      border,
      "  Generasi Berencana, Generasi Berprestasi!",
      border
    ].join("\n");

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `KARTU_ANGGOTA_PIKR_${profile.nisn || 'PROFIL'}.txt`;
    link.click();
    toast.success('Profil berhasil diunduh sebagai kartu digital!');
  };

  const handleLogout = () => {
    logoutCandidate();
    navigate('/login');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const statusInfo = STATUS_MAP[profile?.status] || { label: profile?.status || 'Pending', cls: 'badge-pending' };

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
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className={styles.layout}>
            {/* Top: Profile Card */}
            <div className={styles.profileCard}>
              <div className={styles.cardHeader}>
                <div className={styles.avatarWrap}>
                  {profile?.photoPath ? (
                    <img src={getUploadUrl(profile.photoPath)} alt={profile.name} className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarText}>{initials}</div>
                  )}
                </div>
                <div className={styles.primaryInfo}>
                  <h1 className={styles.name}>{profile?.name}</h1>
                  <div className={styles.metaRow}>
                    <span className={styles.nisn}>NISN: {profile?.nisn}</span>
                    <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                  </div>
                </div>
                <div className={styles.headerActions}>
                  <button onClick={() => setEditing(!editing)} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
                    {editing ? <X size={13} /> : <Edit2 size={13} />}
                    {editing ? 'Batal' : 'Edit Profil'}
                  </button>
                  <button onClick={handleDownloadProfile} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                    <Download size={13} />
                    Unduh Info
                  </button>
                  <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <LogOut size={13} />
                  </button>
                </div>
              </div>

              <div className={styles.cardBodyDetails}>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Kelas</span>
                    <span className={styles.detailValue}>{profile?.className || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Asal Sekolah (Lama)</span>
                    <span className={styles.detailValue}>{profile?.asalSekolah || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Jenis Kelamin</span>
                    <span className={styles.detailValue}>{profile?.gender || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>No. WhatsApp</span>
                    <span className={styles.detailValue}>{profile?.whatsappNumber || '—'}</span>
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{profile?.email || '—'}</span>
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.detailLabel}>Alasan Masuk PIK-R</span>
                    <p className={styles.detailQuote}>"{profile?.reason || '—'}"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Edit Form */}
            {editing && (
              <div className={styles.editCardPanel}>
                <h2 className={styles.panelTitle}>Perbarui Informasi Profil</h2>
                <form onSubmit={handleSave} className={styles.editForm}>
                  <div className={styles.photoUploadSection}>
                    <div className={styles.photoPreviewWrapper}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                      ) : (
                        <div className={styles.photoPlaceholder}>{initials}</div>
                      )}
                    </div>
                    <label className={styles.photoLabel}>
                      Unggah Foto Profil
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setPhotoFile(file);
                            setPhotoPreview(URL.createObjectURL(file));
                          }
                        }}
                        className={styles.fileInput}
                      />
                    </label>
                  </div>

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
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-asal">Asal Sekolah</label>
                      <input
                        id="edit-asal"
                        type="text"
                        className="form-input"
                        value={form.asalSekolah}
                        onChange={(e) => setForm((f) => ({ ...f, asalSekolah: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-gender">Jenis Kelamin</label>
                      <select
                        id="edit-gender"
                        className="form-select"
                        value={form.gender}
                        onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" htmlFor="edit-reason">Alasan Masuk PIK-R</label>
                      <textarea
                        id="edit-reason"
                        className="form-textarea"
                        rows={3}
                        value={form.reason}
                        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className={styles.editActions}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <span className="spinner" /> : <Save size={14} />}
                      {saving ? 'Menyimpan...' : 'Simpan Profil'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Bottom: Tabs (Likes, Saved, Commented) */}
            <div className={styles.tabsSection}>
              <div className={styles.tabHeaders}>
                <button
                  onClick={() => setActiveTab('liked')}
                  className={`${styles.tabBtn} ${activeTab === 'liked' ? styles.tabActive : ''}`}
                >
                  <Heart size={16} fill={activeTab === 'liked' ? 'currentColor' : 'none'} />
                  Artikel Disukai ({likedPosts.length})
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`${styles.tabBtn} ${activeTab === 'saved' ? styles.tabActive : ''}`}
                >
                  <Bookmark size={16} fill={activeTab === 'saved' ? 'currentColor' : 'none'} />
                  Artikel Disimpan ({savedPosts.length})
                </button>
                <button
                  onClick={() => setActiveTab('commented')}
                  className={`${styles.tabBtn} ${activeTab === 'commented' ? styles.tabActive : ''}`}
                >
                  <MessageSquare size={16} />
                  Komentar Artikel ({commentedPosts.length})
                </button>
              </div>

              <div className={styles.tabContentPanel}>
                {activeTab === 'liked' && (
                  <PostList posts={likedPosts} emptyMessage="Belum ada artikel yang disukai. Jelajahi halaman blog untuk menyukainya!" />
                )}
                {activeTab === 'saved' && (
                  <PostList posts={savedPosts} emptyMessage="Belum ada artikel yang disimpan. Simpan artikel menarik untuk dibaca nanti!" />
                )}
                {activeTab === 'commented' && (
                  <PostList posts={commentedPosts} emptyMessage="Belum ada artikel yang Anda komentari." />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PostList({ posts, emptyMessage }) {
  if (posts.length === 0) {
    return <p className={styles.emptyText}>{emptyMessage}</p>;
  }

  const getFirstImage = (html) => {
    if (!html) return null;
    const match = html.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <div className={styles.postsGrid}>
      {posts.map((post) => {
        const firstImg = getFirstImage(post.content);
        return (
          <Link key={post.id} to={`/blog/${post.slug}`} className={styles.postCard}>
            {firstImg && (
              <div className={styles.postThumbnail}>
                <img src={getUploadUrl(firstImg)} alt={post.title} />
              </div>
            )}
            <div className={styles.postCardBody}>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postExcerpt}>{stripHtml(post.content).slice(0, 90)}...</p>
              <div className={styles.postMeta}>
                <span>{formatDate(post.createdAt)}</span>
                <span className={styles.metaDivider}>•</span>
                <span className={styles.readingTime}>
                  <Clock size={11} style={{ marginRight: '3px' }} />
                  {estimateReadingTime(post.content)}
                </span>
                <span className={styles.readMoreLink}>
                  Baca <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

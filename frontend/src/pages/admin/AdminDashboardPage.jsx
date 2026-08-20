import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, triggerGitPullReload } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import { ClipboardList, Users, CheckCircle, XCircle, FileText, MessageSquare, AlertCircle, RefreshCw, GitPullRequest, Settings, Megaphone, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingGit, setSyncingGit] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch {
      toast.error('Gagal memuat data statistik dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGitReload = async () => {
    if (!window.confirm('Jalankan Git Pull & Reload Server sekarang? Server akan memuat update terbaru dari GitHub.')) return;
    setSyncingGit(true);
    try {
      const res = await triggerGitPullReload();
      if (res.data.success) {
        toast.success(res.data.message);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      toast.error('Gagal melakukan sync git.');
    } finally {
      setSyncingGit(false);
    }
  };

  const cand = stats?.candidates || { total: 0, passed: 0, notPassed: 0, pending: 0 };
  const memb = stats?.members || { active: 0 };
  const blog = stats?.blog || { totalNews: 0, totalBlogPosts: 0, pendingBlogDrafts: 0, recentComments: 0 };

  const formattedTime = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Dashboard Utama"
        subtitle="Analisis data organisasi, pendaftar, rilis berita, dan blog komunitas"
      >
        <button
          type="button"
          onClick={handleSyncGitReload}
          disabled={syncingGit}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
        >
          {syncingGit ? <span className="spinner" /> : <GitPullRequest size={14} color="#ea580c" />}
          {syncingGit ? 'Syncing...' : 'Sync Git & Reload Server'}
        </button>
      </AdminHeader>

      <div className={styles.body}>
        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <h2 className={styles.welcomeGreeting}>Welcome back, Admin!</h2>
          <p className={styles.welcomeTime}>{formattedTime}</p>
        </div>

        {/* Quick Actions */}
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.quickActions}>
          <div className={styles.quickActionCard} onClick={() => navigate('/admin/pendaftaran')}>
            <ClipboardList className={styles.quickActionIcon} size={24} />
            <span className={styles.quickActionLabel}>Pendaftaran</span>
          </div>
          <div className={styles.quickActionCard} onClick={() => navigate('/admin/anggota')}>
            <Users className={styles.quickActionIcon} size={24} />
            <span className={styles.quickActionLabel}>Anggota</span>
          </div>
          <div className={styles.quickActionCard} onClick={() => navigate('/admin/blog')}>
            <FileText className={styles.quickActionIcon} size={24} />
            <span className={styles.quickActionLabel}>Blog</span>
          </div>
          <div className={styles.quickActionCard} onClick={() => navigate('/admin/pengumuman')}>
            <Megaphone className={styles.quickActionIcon} size={24} />
            <span className={styles.quickActionLabel}>Pengumuman</span>
          </div>
          <div className={styles.quickActionCard} onClick={() => navigate('/admin/org')}>
            <LayoutDashboard className={styles.quickActionIcon} size={24} />
            <span className={styles.quickActionLabel}>Organisasi</span>
          </div>
          <div className={styles.quickActionCard} onClick={() => navigate('/admin/settings')}>
            <Settings className={styles.quickActionIcon} size={24} />
            <span className={styles.quickActionLabel}>Settings</span>
          </div>
        </div>

        {/* Section Title 1 */}
        <h3 className={styles.sectionTitle}>Analisis Pendaftaran & Anggota</h3>
        
        {/* Statistics Grid Rows */}
        <div className={styles.statsGrid}>
          <div 
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => navigate('/admin/pendaftaran')}
            title="Klik untuk buka halaman Pendaftaran"
          >
            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
              <ClipboardList size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Calon Pendaftar</span>
              <span className={styles.statValue}>{loading ? '...' : cand.total}</span>
            </div>
          </div>

          <div 
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => navigate('/admin/anggota')}
            title="Klik untuk buka halaman Anggota PIK-R"
          >
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
              <Users size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Anggota Aktif</span>
              <span className={styles.statValue}>{loading ? '...' : memb.active}</span>
            </div>
          </div>

          <div 
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => navigate('/admin/pendaftaran?status=LULUS')}
            title="Klik untuk filter pendaftar yang Lolos"
          >
            <div className={`${styles.statIcon} ${styles.statIconGreenLight}`}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Pendaftar Lulus</span>
              <span className={styles.statValue}>{loading ? '...' : cand.passed}</span>
            </div>
          </div>

          <div 
            className={`${styles.statCard} ${styles.clickableCard}`}
            onClick={() => navigate('/admin/pendaftaran?status=TIDAK_LULUS')}
            title="Klik untuk filter pendaftar yang Tidak Lolos"
          >
            <div className={`${styles.statIcon} ${styles.statIconRed}`}>
              <XCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Tidak Lulus</span>
              <span className={styles.statValue}>{loading ? '...' : cand.notPassed}</span>
            </div>
          </div>
        </div>

        {/* Section Title 2 */}
        <h3 className={styles.sectionTitle} style={{ marginTop: '24px' }}>Statistik Konten & Komunitas</h3>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
              <FileText size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Berita Resmi</span>
              <span className={styles.statValue}>{loading ? '...' : blog.totalNews}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
              <Users size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Blog Publik (Published)</span>
              <span className={styles.statValue}>{loading ? '...' : blog.totalBlogPosts}</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${blog.pendingBlogDrafts > 0 ? styles.draftAlertCard : ''}`}>
            <div className={`${styles.statIcon} ${blog.pendingBlogDrafts > 0 ? styles.statIconRed : ''}`}>
              <AlertCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Draft Blog Pending</span>
              <span className={styles.statValue} style={{ color: blog.pendingBlogDrafts > 0 ? '#ea580c' : 'inherit' }}>
                {loading ? '...' : blog.pendingBlogDrafts}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreenLight}`}>
              <MessageSquare size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Komentar Baru (7 Hari)</span>
              <span className={styles.statValue}>{loading ? '...' : blog.recentComments}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, triggerGitPullReload } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  ClipboardList, Users, CheckCircle, XCircle, FileText,
  MessageSquare, AlertCircle, GitPullRequest, Settings,
  Megaphone, LayoutDashboard, UserPlus, Bell, PenSquare,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import styles from './AdminDashboardPage.module.css';

/* ── Animated Counter Hook ── */
function useCountUp(target, duration = 1500, started = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!started || target === 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, started]);

  return value;
}

/* ── Greeting helper ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'Selamat Pagi';
  if (h >= 11 && h < 15) return 'Selamat Siang';
  if (h >= 15 && h < 19) return 'Selamat Sore';
  return 'Selamat Malam';
}

/* ── Dummy Activity Feed ── */
const ACTIVITY_FEED = [
  { id: 1, icon: UserPlus,     color: '#2563eb', text: 'Pendaftar baru: Rizky Aditya mendaftar sebagai calon anggota', time: '2 menit lalu' },
  { id: 2, icon: CheckCircle,  color: '#16a34a', text: 'Status pendaftar Siti Nurhaliza diubah menjadi Lulus', time: '14 menit lalu' },
  { id: 3, icon: PenSquare,    color: '#f97316', text: 'Blog baru "Kegiatan PIK-R Agustus" dikirim dan menunggu review', time: '1 jam lalu' },
  { id: 4, icon: Megaphone,    color: '#d97706', text: 'Pengumuman "Rekrutmen Periode II" telah dipublikasikan', time: '3 jam lalu' },
  { id: 5, icon: Bell,         color: '#7c3aed', text: 'Komentar baru pada artikel "Kesehatan Remaja" menunggu moderasi', time: '5 jam lalu' },
];

/* ── Stat Card with Counter ── */
function StatCard({ label, value, icon: Icon, iconClass, trend, trendLabel = 'dari bulan lalu', onClick, title, alertClass, loading, animDelay = 0 }) {
  const counted = useCountUp(loading ? 0 : (value ?? 0), 1500, !loading);
  const isUp = trend > 0;
  const isDown = trend < 0;

  return (
    <div
      className={`${styles.statCard} ${onClick ? styles.clickableCard : ''} ${alertClass ? styles[alertClass] : ''}`}
      onClick={onClick}
      title={title}
      style={{ animationDelay: `${animDelay}s` }}
    >
      {/* Trend badge */}
      {trend !== undefined && (
        <span className={`${styles.trendBadge} ${isUp ? styles.trendUp : isDown ? styles.trendDown : styles.trendNeutral}`}>
          {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : null}
          {isUp ? `+${trend}` : isDown ? `${trend}` : '±0'} {trendLabel}
        </span>
      )}

      <div className={`${styles.statIcon} ${iconClass ? styles[iconClass] : ''}`}>
        <Icon size={22} />
      </div>
      <div className={styles.statInfo}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>
          {loading ? <span className={styles.statSkeleton} /> : counted}
        </span>
      </div>
    </div>
  );
}

/* ── Quick Action Card ── */
function QuickActionCard({ icon: Icon, label, onClick, badge }) {
  return (
    <div className={styles.quickActionCard} onClick={onClick}>
      <div className={styles.quickActionIconWrap}>
        <Icon size={28} className={styles.quickActionIcon} />
        {badge > 0 && <span className={styles.quickActionBadge}>{badge > 99 ? '99+' : badge}</span>}
      </div>
      <span className={styles.quickActionLabel}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingGit, setSyncingGit] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const adminUser = useAuthStore((s) => s.adminUser);

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
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch {
      toast.error('Gagal melakukan sync git.');
    } finally {
      setSyncingGit(false);
    }
  };

  const cand = stats?.candidates || { total: 0, passed: 0, notPassed: 0, pending: 0 };
  const memb = stats?.members   || { active: 0 };
  const blog = stats?.blog      || { totalNews: 0, totalBlogPosts: 0, pendingBlogDrafts: 0, recentComments: 0 };

  const formattedTime = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const greeting = getGreeting();
  const adminName = adminUser?.name || 'Admin';

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

        {/* ── Welcome / Greeting ── */}
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeLeft}>
            <h2 className={styles.welcomeGreeting}>
              {greeting}, <span className={styles.welcomeName}>{adminName}!</span> 👋
            </h2>
            <p className={styles.welcomeTime}>{formattedTime}</p>
            <p className={styles.welcomeSub}>Berikut ringkasan aktivitas organisasi PIK-R MANSEKU hari ini.</p>
          </div>
          <div className={styles.welcomeOrb} aria-hidden="true" />
        </div>

        {/* ── Quick Actions ── */}
        <section>
          <h3 className={styles.sectionTitle}>Quick Actions</h3>
          <div className={styles.quickActions}>
            <QuickActionCard icon={ClipboardList} label="Pendaftaran" onClick={() => navigate('/admin/pendaftaran')} badge={cand.pending} />
            <QuickActionCard icon={Users}         label="Anggota"     onClick={() => navigate('/admin/anggota')} />
            <QuickActionCard icon={FileText}      label="Blog"        onClick={() => navigate('/admin/blog')} badge={blog.pendingBlogDrafts} />
            <QuickActionCard icon={Megaphone}     label="Pengumuman"  onClick={() => navigate('/admin/pengumuman')} />
            <QuickActionCard icon={LayoutDashboard} label="Organisasi" onClick={() => navigate('/admin/org')} />
            <QuickActionCard icon={Settings}      label="Settings"    onClick={() => navigate('/admin/settings')} />
          </div>
        </section>

        {/* ── Stat Section 1 ── */}
        <section>
          <h3 className={styles.sectionTitle}>Analisis Pendaftaran &amp; Anggota</h3>
          <div className={styles.statsGrid}>
            <StatCard label="Calon Pendaftar"  value={cand.total}     icon={ClipboardList} iconClass="statIconBlue"       trend={0}  loading={loading} onClick={() => navigate('/admin/pendaftaran')}             title="Klik untuk buka halaman Pendaftaran" animDelay={0.05} />
            <StatCard label="Anggota Aktif"    value={memb.active}    icon={Users}         iconClass="statIconGreen"      trend={0}  loading={loading} onClick={() => navigate('/admin/anggota')}                 title="Klik untuk buka halaman Anggota PIK-R" animDelay={0.10} />
            <StatCard label="Pendaftar Lulus"  value={cand.passed}    icon={CheckCircle}   iconClass="statIconGreenLight" trend={0}  loading={loading} onClick={() => navigate('/admin/pendaftaran?status=LULUS')} title="Klik untuk filter pendaftar yang Lolos" animDelay={0.15} />
            <StatCard label="Tidak Lulus"      value={cand.notPassed} icon={XCircle}       iconClass="statIconRed"        trend={0}  loading={loading} onClick={() => navigate('/admin/pendaftaran?status=TIDAK_LULUS')} title="Klik untuk filter pendaftar yang Tidak Lolos" animDelay={0.20} />
          </div>
        </section>

        {/* ── Stat Section 2 ── */}
        <section>
          <h3 className={styles.sectionTitle}>Statistik Konten &amp; Komunitas</h3>
          <div className={styles.statsGrid}>
            <StatCard label="Berita Resmi"          value={blog.totalNews}         icon={FileText}      iconClass="statIconBlue"       trend={0} loading={loading} animDelay={0.05} />
            <StatCard label="Blog Publik (Published)" value={blog.totalBlogPosts}   icon={Users}         iconClass="statIconGreen"      trend={0} loading={loading} animDelay={0.10} />
            <StatCard label="Draft Blog Pending"    value={blog.pendingBlogDrafts} icon={AlertCircle}   iconClass={blog.pendingBlogDrafts > 0 ? 'statIconRed' : ''} alertClass={blog.pendingBlogDrafts > 0 ? 'draftAlertCard' : ''} trend={0} loading={loading} animDelay={0.15} />
            <StatCard label="Komentar Baru (7 Hari)" value={blog.recentComments}   icon={MessageSquare} iconClass="statIconGreenLight"  trend={0} loading={loading} animDelay={0.20} />
          </div>
        </section>

        {/* ── Activity Feed ── */}
        <section>
          <h3 className={styles.sectionTitle}>Aktivitas Terbaru</h3>
          <div className={styles.activityFeed}>
            {ACTIVITY_FEED.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={styles.activityItem} style={{ animationDelay: `${0.05 * i}s` }}>
                  <div className={styles.activityIconWrap} style={{ color: item.color, background: `${item.color}18` }}>
                    <Icon size={15} />
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{item.text}</p>
                    <span className={styles.activityTime}>{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

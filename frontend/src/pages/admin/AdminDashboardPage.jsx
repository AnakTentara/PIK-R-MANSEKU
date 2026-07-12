import { useState, useEffect } from 'react';
import { getCandidates, getSettings } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import { ClipboardList, Users, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSessionOpen, setIsSessionOpen] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Settings for session and content
      const settingsRes = await getSettings();
      const settingsList = settingsRes.data?.settings || [];
      
      const sessionSetting = settingsList.find((s) => s.key === 'REGISTRATION_SESSION');
      if (sessionSetting?.value) {
        setIsSessionOpen(JSON.parse(sessionSetting.value).status === 'open');
      } else {
        setIsSessionOpen(true);
      }

      // 2. Fetch candidates
      const candRes = await getCandidates();
      setCandidates(candRes.data || []);
    } catch {
      toast.error('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalCalon = candidates.length;
  const totalLulus = candidates.filter((c) => c.status === 'LULUS').length;
  const totalTidakLulus = candidates.filter((c) => c.status === 'TIDAK_LULUS').length;

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Dashboard Utama"
        subtitle="Analisis data organisasi dan konten landing page"
      />

      <div className={styles.body}>
        {/* Statistics Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
              <ClipboardList size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Calon Pendaftar</span>
              <span className={styles.statValue}>{loading ? '...' : totalCalon}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
              <Users size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Anggota PIK-R</span>
              <span className={styles.statValue}>
                {loading ? '...' : !isSessionOpen ? totalLulus : '0 (Sesi Terbuka)'}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreenLight}`}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Peserta Lolos (Sesi Ini)</span>
              <span className={styles.statValue}>{loading ? '...' : totalLulus}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconRed}`}>
              <XCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Peserta Tidak Lolos</span>
              <span className={styles.statValue}>{loading ? '...' : totalTidakLulus}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

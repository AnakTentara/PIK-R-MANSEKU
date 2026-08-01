import { useState, useEffect } from 'react';
import { getSettings, saveSettings, downloadBackupDb } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import { Save, Database, Mail, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminSettingsPage.module.css';

const DEFAULT_SMTP = { host: '', port: '587', user: '', password: '', from: '' };

export default function AdminSettingsPage() {
  const [smtpConfig, setSmtpConfig] = useState(DEFAULT_SMTP);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await getSettings();
      const settings = res.data?.settings || res.data || [];

      const smtpSetting = settings.find((s) => s.key === 'SMTP_CONFIG');

      if (smtpSetting?.value) {
        try {
          setSmtpConfig({ ...DEFAULT_SMTP, ...JSON.parse(smtpSetting.value) });
        } catch {}
      }
    } catch {
      toast.error('Gagal memuat pengaturan.');
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSavingSmtp(true);
    try {
      await saveSettings({ key: 'SMTP_CONFIG', value: JSON.stringify(smtpConfig) });
      toast.success('Konfigurasi SMTP berhasil disimpan!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan konfigurasi SMTP.');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    const loadingToast = toast.loading('Mengunduh backup database...');
    try {
      const res = await downloadBackupDb();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'pikr_manseku_backup.db');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup database berhasil diunduh!', { id: loadingToast });
    } catch (err) {
      toast.error('Gagal mengunduh backup database.', { id: loadingToast });
    } finally {
      setDownloadingBackup(false);
    }
  };

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Pengaturan Sistem"
        subtitle="Konfigurasi email server dan cadangan database"
      />

      <div className={styles.body}>
        {loadingSettings ? (
          <div className={styles.skelGrid}>
            <div className={`skeleton ${styles.skelCard}`} />
            <div className={`skeleton ${styles.skelCard}`} />
          </div>
        ) : (
          <div className={styles.grid}>
            {/* SMTP Config */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <Mail size={18} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Konfigurasi SMTP Email</h2>
                  <p className={styles.cardSubtitle}>
                    Digunakan untuk pengiriman notifikasi ke kandidat
                  </p>
                </div>
              </div>
              <form onSubmit={handleSaveSmtp} className={styles.form}>
                <div className={styles.formRow}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label" htmlFor="smtp-host">Host</label>
                    <input
                      id="smtp-host"
                      type="text"
                      className="form-input"
                      placeholder="smtp.gmail.com"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig((f) => ({ ...f, host: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="smtp-port">Port</label>
                    <input
                      id="smtp-port"
                      type="number"
                      className="form-input"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig((f) => ({ ...f, port: e.target.value }))}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="smtp-user">Username</label>
                    <input
                      id="smtp-user"
                      type="text"
                      className="form-input"
                      placeholder="user@gmail.com"
                      value={smtpConfig.user}
                      onChange={(e) => setSmtpConfig((f) => ({ ...f, user: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="smtp-password">Password / App Key</label>
                    <input
                      id="smtp-password"
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={smtpConfig.password}
                      onChange={(e) => setSmtpConfig((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="smtp-from">From Email</label>
                  <input
                    id="smtp-from"
                    type="email"
                    className="form-input"
                    placeholder="no-reply@pikrmanseku.com"
                    value={smtpConfig.from}
                    onChange={(e) => setSmtpConfig((f) => ({ ...f, from: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={savingSmtp} style={{ alignSelf: 'flex-start' }}>
                  {savingSmtp ? <span className="spinner" /> : <Save size={15} />}
                  {savingSmtp ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
              </form>
            </div>

            {/* Maintenance Config */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <Database size={18} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Pemeliharaan & Cadangan Data</h2>
                  <p className={styles.cardSubtitle}>
                    Unduh salinan cadangan database SQLite lokal Anda secara berkala
                  </p>
                </div>
              </div>
              <div className={styles.maintenanceBody}>
                <p className={styles.maintenanceDesc}>
                  File cadangan ini berisi semua data pengguna, anggota aktif, pendaftaran, testimoni, dan histori kelulusan. Disarankan untuk mencadangkan file ini secara manual sebelum melakukan pembaruan sistem.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDownloadBackup}
                  disabled={downloadingBackup}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {downloadingBackup ? <span className="spinner" /> : <Download size={15} />}
                  {downloadingBackup ? 'Mengunduh...' : 'Unduh Cadangan Database (.db)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


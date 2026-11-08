import { useState, useEffect } from 'react';
import { getAdminReports, updateReportStatus, takeReportAction } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import { formatDate } from '@/utils/formatDate';
import { getUploadUrl } from '@/api/axios';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trash2,
  UserX,
  AlertTriangle,
  FileText,
  MessageSquare,
  User,
  Loader2,
  ExternalLink
} from 'lucide-react';
import styles from './AdminReportsPage.module.css';

const REASON_LABELS = {
  SPAM: 'Spam atau Penipuan',
  PELECEHAN: 'Perundungan / Pelecehan',
  KONTEN_TIDAK_PANTAS: 'Konten Tidak Pantas',
  AKUN_PALSU: 'Akun Palsu / Menyamar',
  LAINNYA: 'Lainnya'
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('OPEN');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [openCount, setOpenCount] = useState(0);
  const [actionBusy, setActionBusy] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [statusTab, typeFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await getAdminReports({ status: statusTab, type: typeFilter });
      setReports(res.data.reports || []);
      setOpenCount(res.data.openCount || 0);
    } catch {
      toast.error('Gagal memuat laporan pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setActionBusy(id);
    try {
      await updateReportStatus(id, newStatus);
      toast.success(newStatus === 'DISMISSED' ? 'Laporan ditolak / diabaikan.' : 'Laporan ditandai selesai.');
      fetchReports();
    } catch {
      toast.error('Gagal memperbarui status laporan.');
    } finally {
      setActionBusy(null);
    }
  };

  const handleAction = async (id, actionType, confirmPrompt) => {
    if (!window.confirm(confirmPrompt)) return;
    setActionBusy(id);
    try {
      await takeReportAction(id, actionType);
      toast.success('Tindakan moderasi berhasil diterapkan!');
      fetchReports();
    } catch {
      toast.error('Gagal mengeksekusi tindakan.');
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Moderasi & Laporan Pengguna"
        subtitle="Tinjau laporan anggota terhadap postingan blog, komentar diskusi, dan profil"
      />

      <div className={styles.body}>
        {/* Tab Header */}
        <div className={styles.tabHeader}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${statusTab === 'OPEN' ? styles.active : ''}`}
              onClick={() => setStatusTab('OPEN')}
            >
              Menunggu Tindakan {openCount > 0 && <span className={styles.badgeOpen}>{openCount}</span>}
            </button>
            <button
              className={`${styles.tab} ${statusTab === 'REVIEWED' ? styles.active : ''}`}
              onClick={() => setStatusTab('REVIEWED')}
            >
              Selesai Ditinjau
            </button>
            <button
              className={`${styles.tab} ${statusTab === 'DISMISSED' ? styles.active : ''}`}
              onClick={() => setStatusTab('DISMISSED')}
            >
              Ditolak / Diabaikan
            </button>
            <button
              className={`${styles.tab} ${statusTab === 'ALL' ? styles.active : ''}`}
              onClick={() => setStatusTab('ALL')}
            >
              Semua Status
            </button>
          </div>
        </div>

        {/* List of Reports */}
        {loading ? (
          <div className={styles.emptyState}>
            <Loader2 className="spinner" size={36} />
            <p>Memuat laporan...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 className={styles.emptyIcon} />
            <h3>Tidak Ada Laporan</h3>
            <p>Bagus! Semua konten dan komunitas dalam keadaan aman dan tertib.</p>
          </div>
        ) : (
          <div className={styles.reportsList}>
            {reports.map((report) => (
              <div key={report.id} className={styles.reportCard}>
                <div className={styles.cardHead}>
                  <div className={styles.reporterMeta}>
                    <img
                      src={report.reporter?.photoPath ? getUploadUrl(report.reporter.photoPath) : '/media/logos/default_avatar.png'}
                      alt={report.reporter?.name || 'Pelapor'}
                      className={styles.reporterAvatar}
                    />
                    <div>
                      <div className={styles.reporterName}>{report.reporter?.name || 'Anggota Anonim'}</div>
                      <div className={styles.reporterClass}>
                        Kelas {report.reporter?.className || '-'} · Dilaporkan pada {formatDate(report.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.reasonTag}>
                      <AlertTriangle size={14} />
                      {REASON_LABELS[report.reason] || report.reason}
                    </span>
                    <span
                      className={`${styles.statusTag} ${
                        report.status === 'OPEN'
                          ? styles.statusOpen
                          : report.status === 'REVIEWED'
                          ? styles.statusReviewed
                          : styles.statusDismissed
                      }`}
                    >
                      {report.status === 'OPEN' ? 'Perlu Tindakan' : report.status === 'REVIEWED' ? 'Selesai' : 'Diabaikan'}
                    </span>
                  </div>
                </div>

                {/* Catatan Pelapor */}
                {report.note && (
                  <div className={styles.noteBox}>
                    <strong>Catatan Pelapor:</strong> "{report.note}"
                  </div>
                )}

                {/* Target Information */}
                <div className={styles.targetBox}>
                  <div className={styles.targetLabel}>
                    Objek yang Dilaporkan: {report.targetType}
                  </div>
                  {report.targetType === 'POST' && (
                    <div className={styles.targetContent}>
                      {report.targetData ? (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
                            <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                            "{report.targetData.title}"
                          </div>
                          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                            Penulis: <strong>{report.targetData.memberAuthor?.name || 'Anggota'}</strong> · Status: {report.targetData.status}
                          </div>
                          <div style={{ marginTop: '6px', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                            Cuplikan: {report.targetData.contentSnippet}...
                          </div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>[Postingan ini sudah dihapus]</span>
                      )}
                    </div>
                  )}

                  {report.targetType === 'COMMENT' && (
                    <div className={styles.targetContent}>
                      {report.targetData ? (
                        <>
                          <div style={{ fontWeight: 600 }}>
                            <MessageSquare size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                            "{report.targetData.content}"
                          </div>
                          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
                            Komentar oleh: <strong>{report.targetData.username}</strong> pada postingan: "{report.targetData.post?.title || '-'}"
                          </div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>[Komentar ini sudah dihapus]</span>
                      )}
                    </div>
                  )}

                  {report.targetType === 'MEMBER' && (
                    <div className={styles.targetContent}>
                      {report.targetData ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <User size={18} />
                          <div>
                            <strong>{report.targetData.name}</strong> (@{report.targetData.slug}) · Kelas {report.targetData.className} · Status: {report.targetData.status}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>[Akun tidak ditemukan]</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className={styles.cardActions}>
                  {report.targetData && (report.targetType === 'POST' || report.targetType === 'COMMENT') && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleAction(report.id, 'DELETE_CONTENT', 'Hapus konten ini secara permanen dari website?')}
                      disabled={actionBusy === report.id}
                    >
                      <Trash2 size={14} /> Hapus Konten
                    </button>
                  )}

                  {report.targetData && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => handleAction(report.id, 'DEACTIVATE_USER', 'Nonaktifkan status akun anggota ini (INACTIVE)?')}
                      disabled={actionBusy === report.id}
                    >
                      <UserX size={14} /> Nonaktifkan Akun
                    </button>
                  )}

                  {report.status === 'OPEN' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleStatusChange(report.id, 'DISMISSED')}
                        disabled={actionBusy === report.id}
                      >
                        <XCircle size={14} /> Tolak Laporan
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange(report.id, 'REVIEWED')}
                        disabled={actionBusy === report.id}
                      >
                        <CheckCircle2 size={14} /> Tandai Selesai
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

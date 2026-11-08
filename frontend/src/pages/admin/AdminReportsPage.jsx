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
  MENYAKITI_DIRI: 'Tanda menyakiti diri (prioritas)',
  LAINNYA: 'Lainnya'
};

const TYPE_LABELS = {
  POST: 'Postingan blog', COMMENT: 'Komentar blog', MEMBER: 'Akun anggota',
  RC_POST: 'Postingan Ruang Cerita', RC_STORY: 'Cerita Ruang Cerita', RC_COMMENT: 'Komentar Ruang Cerita', RC_MESSAGE: 'Pesan pribadi (yang dilaporkan saja)'
};
const DELETABLE = new Set(['POST', 'COMMENT', 'RC_POST', 'RC_STORY', 'RC_COMMENT', 'RC_MESSAGE']);

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

  // Bekukan akun sosial N hari (status anggota, absensi, ID Card tetap)
  const handleFreeze = async (id) => {
    const days = window.prompt('Bekukan akun sosial (Ruang Cerita & blog) selama berapa hari? Pilih 1, 3, 7, atau 30.\nStatus anggota, absensi, dan ID Card TIDAK berubah.', '7');
    if (days === null) return;
    if (![1, 3, 7, 30].includes(Number(days))) { toast.error('Pilih 1, 3, 7, atau 30 hari.'); return; }
    const reason = window.prompt('Alasan (ditampilkan ke pemilik akun):', 'Melanggar pedoman komunitas Ruang Cerita') || '';
    setActionBusy(id);
    try {
      await takeReportAction(id, 'FREEZE_USER', { days: Number(days), reason });
      toast.success(`Akun sosial dibekukan ${days} hari.`);
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membekukan akun.');
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
                    Objek yang Dilaporkan: {TYPE_LABELS[report.targetType] || report.targetType}
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

                  {['RC_POST', 'RC_STORY', 'RC_COMMENT', 'RC_MESSAGE'].includes(report.targetType) && (
                    <div className={styles.targetContent}>
                      {report.targetData ? (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          {report.targetData.thumb && (
                            <img src={getUploadUrl(report.targetData.thumb)} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>"{report.targetData.contentSnippet || report.targetData.content || '-'}"</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
                              Oleh: <strong>{report.targetData.memberAuthor?.name || report.targetData.username || 'Anggota'}</strong>
                              {report.targetData.memberAuthor?.slug ? ` (@${report.targetData.memberAuthor.slug})` : ''}
                              {report.targetData.status ? ` · ${report.targetData.status}` : ''}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>[Konten sudah dihapus]</span>
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
                  {report.targetData && DELETABLE.has(report.targetType) && (
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
                      onClick={() => handleFreeze(report.id)}
                      disabled={actionBusy === report.id}
                      title="Membekukan akun sosial (Ruang Cerita & blog). Status anggota, absensi, dan ID Card tidak berubah."
                    >
                      <UserX size={14} /> Bekukan Akun Sosial
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

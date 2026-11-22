import { useState, useEffect, useCallback } from 'react';
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
  ExternalLink,
  X,
  Clock,
  BookOpen,
  Hash,
} from 'lucide-react';
import styles from './AdminReportsPage.module.css';

const REASON_LABELS = {
  SPAM: 'Spam atau Penipuan',
  PELECEHAN: 'Perundungan / Pelecehan',
  KONTEN_TIDAK_PANTAS: 'Konten Tidak Pantas',
  AKUN_PALSU: 'Akun Palsu / Menyamar',
  MENYAKITI_DIRI: 'Tanda menyakiti diri (prioritas)',
  LAINNYA: 'Lainnya',
};

const TYPE_LABELS = {
  POST: 'Postingan blog',
  COMMENT: 'Komentar blog',
  MEMBER: 'Akun anggota',
  RC_POST: 'Postingan Ruang Cerita',
  RC_STORY: 'Cerita Ruang Cerita',
  RC_COMMENT: 'Komentar Ruang Cerita',
  RC_MESSAGE: 'Pesan pribadi (yang dilaporkan saja)',
};

const DELETABLE = new Set(['POST', 'COMMENT', 'RC_POST', 'RC_STORY', 'RC_COMMENT', 'RC_MESSAGE']);

const TYPE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Semua' },
  { value: 'POST', label: 'Postingan' },
  { value: 'COMMENT', label: 'Komentar' },
  { value: 'MEMBER', label: 'Akun' },
  { value: 'RC_POST', label: 'Ruang Cerita' },
];

const STATUS_TABS = [
  { value: 'OPEN', label: 'Menunggu Tindakan' },
  { value: 'REVIEWED', label: 'Selesai Ditinjau' },
  { value: 'DISMISSED', label: 'Ditolak / Diabaikan' },
  { value: 'ALL', label: 'Semua Status' },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('OPEN');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [counts, setCounts] = useState({ OPEN: 0, REVIEWED: 0, DISMISSED: 0, ALL: 0 });
  const [actionBusy, setActionBusy] = useState(null);

  // Drawer state
  const [drawerReport, setDrawerReport] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = (report) => {
    setDrawerReport(report);
    setDrawerOpen(true);
  };

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => setDrawerReport(null), 300);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDrawer]);

  useEffect(() => {
    fetchReports();
  }, [statusTab, typeFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await getAdminReports({ status: statusTab, type: typeFilter });
      setReports(res.data.reports || []);
      setCounts({
        OPEN: res.data.openCount || 0,
        REVIEWED: res.data.reviewedCount || 0,
        DISMISSED: res.data.dismissedCount || 0,
        ALL: res.data.totalCount || 0,
      });
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
      closeDrawer();
      fetchReports();
    } catch {
      toast.error('Gagal memperbarui status laporan.');
    } finally {
      setActionBusy(null);
    }
  };

  const handleFreeze = async (id) => {
    const days = window.prompt(
      'Bekukan akun sosial (Ruang Cerita & blog) selama berapa hari? Pilih 1, 3, 7, atau 30.\nStatus anggota, absensi, dan ID Card TIDAK berubah.',
      '7'
    );
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

  const isPriority = (report) => report.reason === 'MENYAKITI_DIRI';

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Moderasi & Laporan Konten"
        subtitle="Tinjau laporan anggota terhadap postingan blog, komentar diskusi, dan profil"
      />

      <div className={styles.body}>
        {/* Status Tabs */}
        <div className={styles.tabRow}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              className={`${styles.tab} ${statusTab === tab.value ? styles.tabActive : ''}`}
              onClick={() => setStatusTab(tab.value)}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span className={`${styles.tabBadge} ${tab.value === 'OPEN' ? styles.tabBadgeRed : ''}`}>
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Type Filter Pills */}
        <div className={styles.pillBar}>
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.pill} ${typeFilter === opt.value ? styles.pillActive : ''}`}
              onClick={() => setTypeFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
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
              <div
                key={report.id}
                className={`${styles.reportCard} ${isPriority(report) ? styles.priorityRow : ''}`}
                onClick={() => openDrawer(report)}
              >
                <div className={styles.cardHead}>
                  <div className={styles.reporterMeta}>
                    {isPriority(report) && (
                      <span className={styles.priorityBadge}>🔴 PRIORITAS</span>
                    )}
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

                  <div className={styles.cardMeta}>
                    <span className={`${styles.typePill}`}>
                      {TYPE_LABELS[report.targetType] || report.targetType}
                    </span>
                    <span className={styles.reasonTag}>
                      <AlertTriangle size={12} />
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

                {report.note && (
                  <div className={styles.noteBox}>
                    <strong>Catatan Pelapor:</strong> "{report.note}"
                  </div>
                )}

                <div className={styles.targetPreview}>
                  <span className={styles.targetLabel}>
                    {TYPE_LABELS[report.targetType] || report.targetType}
                  </span>
                  <span className={styles.targetSnippet}>
                    {report.targetData
                      ? report.targetData.title || report.targetData.contentSnippet || report.targetData.content || report.targetData.name || '—'
                      : '[Konten sudah dihapus]'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer Overlay */}
      {drawerReport && (
        <>
          <div
            className={`${styles.drawerOverlay} ${drawerOpen ? styles.drawerOverlayVisible : ''}`}
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <aside
            className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
            aria-label="Detail Laporan"
          >
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>
                <ShieldAlert size={18} />
                Detail Laporan
                {isPriority(drawerReport) && (
                  <span className={styles.priorityBadge}>🔴 PRIORITAS</span>
                )}
              </div>
              <button className={styles.drawerClose} onClick={closeDrawer} aria-label="Tutup">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className={styles.drawerBody}>
              {/* Reporter Info */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>Pelapor</div>
                <div className={styles.reporterMeta}>
                  <img
                    src={drawerReport.reporter?.photoPath ? getUploadUrl(drawerReport.reporter.photoPath) : '/media/logos/default_avatar.png'}
                    alt={drawerReport.reporter?.name || 'Pelapor'}
                    className={styles.reporterAvatar}
                  />
                  <div>
                    <div className={styles.reporterName}>{drawerReport.reporter?.name || 'Anggota Anonim'}</div>
                    <div className={styles.reporterClass}>
                      Kelas {drawerReport.reporter?.className || '-'} · {formatDate(drawerReport.createdAt)}
                    </div>
                  </div>
                </div>
              </section>

              {/* Reason + Status */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>Alasan & Status</div>
                <div className={styles.drawerTags}>
                  <span className={styles.reasonTag}>
                    <AlertTriangle size={12} />
                    {REASON_LABELS[drawerReport.reason] || drawerReport.reason}
                  </span>
                  <span
                    className={`${styles.statusTag} ${
                      drawerReport.status === 'OPEN'
                        ? styles.statusOpen
                        : drawerReport.status === 'REVIEWED'
                        ? styles.statusReviewed
                        : styles.statusDismissed
                    }`}
                  >
                    {drawerReport.status === 'OPEN' ? 'Perlu Tindakan' : drawerReport.status === 'REVIEWED' ? 'Selesai' : 'Diabaikan'}
                  </span>
                </div>
              </section>

              {/* Reporter Note */}
              {drawerReport.note && (
                <section className={styles.drawerSection}>
                  <div className={styles.drawerSectionTitle}>Catatan Pelapor</div>
                  <div className={styles.noteBox}>"{drawerReport.note}"</div>
                </section>
              )}

              {/* Target Content */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>
                  Objek yang Dilaporkan: {TYPE_LABELS[drawerReport.targetType] || drawerReport.targetType}
                </div>
                <div className={styles.targetBox}>
                  {drawerReport.targetType === 'POST' && (
                    drawerReport.targetData ? (
                      <>
                        <div className={styles.targetContentTitle}>
                          <FileText size={15} />
                          "{drawerReport.targetData.title}"
                        </div>
                        <div className={styles.targetContentMeta}>
                          Penulis: <strong>{drawerReport.targetData.memberAuthor?.name || 'Anggota'}</strong> · Status: {drawerReport.targetData.status}
                        </div>
                        <div className={styles.targetContentSnippet}>
                          {drawerReport.targetData.contentSnippet}...
                        </div>
                      </>
                    ) : (
                      <span className={styles.deletedNote}>[Postingan ini sudah dihapus]</span>
                    )
                  )}

                  {drawerReport.targetType === 'COMMENT' && (
                    drawerReport.targetData ? (
                      <>
                        <div className={styles.targetContentTitle}>
                          <MessageSquare size={15} />
                          "{drawerReport.targetData.content}"
                        </div>
                        <div className={styles.targetContentMeta}>
                          Komentar oleh: <strong>{drawerReport.targetData.username}</strong> pada postingan: "{drawerReport.targetData.post?.title || '-'}"
                        </div>
                      </>
                    ) : (
                      <span className={styles.deletedNote}>[Komentar ini sudah dihapus]</span>
                    )
                  )}

                  {['RC_POST', 'RC_STORY', 'RC_COMMENT', 'RC_MESSAGE'].includes(drawerReport.targetType) && (
                    drawerReport.targetData ? (
                      <div className={styles.rcTargetWrap}>
                        {drawerReport.targetData.thumb && (
                          <img
                            src={getUploadUrl(drawerReport.targetData.thumb)}
                            alt=""
                            className={styles.rcThumb}
                          />
                        )}
                        <div>
                          <div className={styles.targetContentTitle}>
                            "{drawerReport.targetData.contentSnippet || drawerReport.targetData.content || '-'}"
                          </div>
                          <div className={styles.targetContentMeta}>
                            Oleh: <strong>{drawerReport.targetData.memberAuthor?.name || drawerReport.targetData.username || 'Anggota'}</strong>
                            {drawerReport.targetData.memberAuthor?.slug ? ` (@${drawerReport.targetData.memberAuthor.slug})` : ''}
                            {drawerReport.targetData.status ? ` · ${drawerReport.targetData.status}` : ''}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className={styles.deletedNote}>[Konten sudah dihapus]</span>
                    )
                  )}

                  {drawerReport.targetType === 'MEMBER' && (
                    drawerReport.targetData ? (
                      <div className={styles.memberTargetWrap}>
                        <User size={18} />
                        <div className={styles.targetContentMeta}>
                          <strong>{drawerReport.targetData.name}</strong> (@{drawerReport.targetData.slug}) · Kelas {drawerReport.targetData.className} · Status: {drawerReport.targetData.status}
                        </div>
                      </div>
                    ) : (
                      <span className={styles.deletedNote}>[Akun tidak ditemukan]</span>
                    )
                  )}
                </div>
              </section>

              {/* Activity Log */}
              <section className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>
                  <Clock size={13} /> Log Aktivitas
                </div>
                <div className={styles.activityLog}>
                  <div className={styles.activityItem}>
                    <span className={styles.activityDot} />
                    <span className={styles.activityText}>
                      Laporan dibuat pada {formatDate(drawerReport.createdAt)}
                    </span>
                  </div>
                  {drawerReport.reviewedAt && (
                    <div className={styles.activityItem}>
                      <span className={`${styles.activityDot} ${styles.activityDotGreen}`} />
                      <span className={styles.activityText}>
                        Ditinjau oleh Admin pada {formatDate(drawerReport.reviewedAt)}
                        {drawerReport.reviewedBy?.name ? ` — ${drawerReport.reviewedBy.name}` : ''}
                      </span>
                    </div>
                  )}
                  {drawerReport.status === 'DISMISSED' && (
                    <div className={styles.activityItem}>
                      <span className={`${styles.activityDot} ${styles.activityDotGray}`} />
                      <span className={styles.activityText}>Laporan ditolak / diabaikan</span>
                    </div>
                  )}
                  {drawerReport.status === 'OPEN' && !drawerReport.reviewedAt && (
                    <div className={styles.activityItem}>
                      <span className={`${styles.activityDot} ${styles.activityDotOrange}`} />
                      <span className={styles.activityText}>Menunggu tindakan admin</span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Drawer Action Bar */}
            <div className={styles.drawerActions}>
              {drawerReport.targetData && DELETABLE.has(drawerReport.targetType) && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleAction(drawerReport.id, 'DELETE_CONTENT', 'Hapus konten ini secara permanen dari website?')}
                  disabled={actionBusy === drawerReport.id}
                >
                  <Trash2 size={14} /> Hapus Konten
                </button>
              )}

              {drawerReport.targetData && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleFreeze(drawerReport.id)}
                  disabled={actionBusy === drawerReport.id}
                  title="Membekukan akun sosial (Ruang Cerita & blog). Status anggota, absensi, dan ID Card tidak berubah."
                >
                  <UserX size={14} /> Bekukan Akun Sosial
                </button>
              )}

              {drawerReport.status === 'OPEN' && (
                <>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleStatusChange(drawerReport.id, 'DISMISSED')}
                    disabled={actionBusy === drawerReport.id}
                  >
                    <XCircle size={14} /> Tolak Laporan
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStatusChange(drawerReport.id, 'REVIEWED')}
                    disabled={actionBusy === drawerReport.id}
                  >
                    <CheckCircle2 size={14} /> Tandai Selesai
                  </button>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

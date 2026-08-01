import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  sendNowAnnouncement,
  getDebugGroups,
  addDebugGroup,
  getDebugLogs,
  simulateIncomingMessage
} from '@/api/admin';
import {
  Megaphone,
  Calendar,
  Clock,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Paperclip,
  Radio,
  Sparkles,
  Users,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  FileText,
  FileCheck,
  Terminal,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminPengumumanPage.module.css';

export default function AdminPengumumanPage() {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history' | 'debugger'

  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ total: 0, scheduled: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  // Group Debugger state
  const [debugGroups, setDebugGroups] = useState([]);
  const [debugLogs, setDebugLogs] = useState([]);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [copiedJid, setCopiedJid] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [targetGroup, setTargetGroup] = useState('GROUP_WA_CALON');
  const [targetJid, setTargetJid] = useState('');
  const [targetName, setTargetName] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sendNow, setSendNow] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Manual Group Add State
  const [newGroupJid, setNewGroupJid] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);

  // Simulation State
  const [simGroupJid, setSimGroupJid] = useState('');
  const [simGroupName, setSimGroupName] = useState('Grup PIK-R MANSEKU');
  const [simSender, setSimSender] = useState('Panitia Test');
  const [simText, setSimText] = useState('!id');
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAnnouncements();
      if (res.data.success) {
        setAnnouncements(res.data.announcements || []);
        setStats(res.data.stats || { total: 0, scheduled: 0, sent: 0, failed: 0 });
      }
    } catch (err) {
      toast.error('Gagal mengambil data pengumuman.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDebugData = async () => {
    setLoadingDebug(true);
    try {
      const [gRes, lRes] = await Promise.all([getDebugGroups(), getDebugLogs()]);
      if (gRes.data.success) setDebugGroups(gRes.data.groups || []);
      if (lRes.data.success) setDebugLogs(lRes.data.logs || []);
    } catch (err) {
      toast.error('Gagal mengambil data debug grup.');
    } finally {
      setLoadingDebug(false);
    }
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'debugger') {
      fetchDebugData();
    }
  };

  const handleCopyJid = (jidStr) => {
    navigator.clipboard.writeText(jidStr);
    setCopiedJid(jidStr);
    toast.success(`Group JID disalin: ${jidStr}`);
    setTimeout(() => setCopiedJid(''), 2500);
  };

  const handleSelectGroupForForm = (group) => {
    setTargetGroup('CUSTOM_JID');
    setTargetJid(group.jid);
    setTargetName(group.name);
    setActiveTab('create');
    toast.success(`Grup "${group.name}" dipilih sebagai target pengumuman!`);
  };

  const handleInsertTemplateVar = (varName) => {
    setMessage(prev => prev + ` ${varName} `);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Judul dan Isi Pesan wajib diisi.');
      return;
    }

    if (!sendNow && !scheduledAt) {
      toast.error('Tentukan tanggal & jam jadwal atau pilih Kirim Sekarang.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('targetGroup', targetGroup);
      formData.append('targetJid', targetJid);
      formData.append('targetName', targetName);
      formData.append('message', message);
      formData.append('sendNow', sendNow);
      if (scheduledAt) formData.append('scheduledAt', scheduledAt);
      if (mediaFile) formData.append('media', mediaFile);

      const res = await createAnnouncement(formData);
      if (res.data.success) {
        toast.success(res.data.message);
        // Reset form
        setTitle('');
        setMessage('');
        setScheduledAt('');
        setMediaFile(null);
        setSendNow(false);
        fetchData();
        setActiveTab('history');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pengumuman.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Batalkan dan hapus pengumuman ini?')) return;
    try {
      const res = await deleteAnnouncement(id);
      if (res.data.success) {
        toast.success('Pengumuman berhasil dihapus.');
        fetchData();
      }
    } catch (err) {
      toast.error('Gagal menghapus pengumuman.');
    }
  };

  const handleSendNow = async (id) => {
    try {
      const res = await sendNowAnnouncement(id);
      if (res.data.success) {
        toast.success('Pengumuman dipicu untuk dikirim sekarang!');
        fetchData();
      }
    } catch (err) {
      toast.error('Gagal memicu pengiriman.');
    }
  };

  const handleAddManualGroup = async (e) => {
    e.preventDefault();
    if (!newGroupJid.trim() || !newGroupName.trim()) {
      toast.error('JID dan Nama Grup wajib diisi.');
      return;
    }
    setAddingGroup(true);
    try {
      const res = await addDebugGroup({ jid: newGroupJid, name: newGroupName });
      if (res.data.success) {
        toast.success('Group JID berhasil ditambahkan.');
        setNewGroupJid('');
        setNewGroupName('');
        fetchDebugData();
      }
    } catch (err) {
      toast.error('Gagal menambahkan grup.');
    } finally {
      setAddingGroup(false);
    }
  };

  const handleSimulateMsg = async (e) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const res = await simulateIncomingMessage({
        groupJid: simGroupJid,
        groupName: simGroupName,
        sender: simSender,
        text: simText
      });
      if (res.data.success) {
        toast.success('Simulasi berhasil! Group JID dan log tercatat.');
        fetchDebugData();
      }
    } catch (err) {
      toast.error('Simulasi gagal.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className={styles.container}>
      <AdminHeader
        title="Pengumuman & Broadcast Scheduled"
        subtitle="Buat, jadwalkan, dan kelola pesan broadcast ke Grup WhatsApp / Calon Anggota (Media Photo, Video, File)"
      />

      {/* Top Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            <Megaphone size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Total Pengumuman</h4>
            <div className={styles.number}>{stats.total}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Clock size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Antrean Terjadwal</h4>
            <div className={styles.number} style={{ color: '#ea580c' }}>{stats.scheduled}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#15803d' }}>
            <CheckCircle size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Berhasil Terkirim</h4>
            <div className={styles.number} style={{ color: '#15803d' }}>{stats.sent}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef2f2', color: '#b91c1c' }}>
            <AlertTriangle size={22} />
          </div>
          <div className={styles.statInfo}>
            <h4>Gagal Kirim</h4>
            <div className={styles.number} style={{ color: '#b91c1c' }}>{stats.failed}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.mainNav}>
        <button
          className={`${styles.navTab} ${activeTab === 'create' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('create')}
        >
          <Plus size={16} /> Buat Pengumuman Baru
        </button>

        <button
          className={`${styles.navTab} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('history')}
        >
          <Clock size={16} /> Antrean & Riwayat ({announcements.length})
        </button>

        <button
          className={`${styles.navTab} ${activeTab === 'debugger' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('debugger')}
        >
          <Radio size={16} /> WA Group Debugger & Listener
        </button>
      </div>

      {/* ── TAB 1: FORM BUAT PENGUMUMAN BARU ── */}
      {activeTab === 'create' && (
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>
              <Sparkles size={18} color="#ea580c" />
              <div>
                <h3>Form Pengumuman & Broadcast WhatsApp</h3>
                <p>Kirim pesan & lampiran media sekarang atau jadwalkan otomatis pada jam tertentu</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className={styles.formGrid}>
            {/* Judul */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Judul Pengumuman (Internal Admin)</label>
              <input
                type="text"
                placeholder="Contoh: Pengumuman Kelulusan POS 1 & Jadwal POS 2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            {/* Target Group */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Target Tujuan Penerima</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className={styles.select}
              >
                <option value="GROUP_WA_CALON">Grup Calon Anggota PIK-R (Personalisasi Peserta)</option>
                <option value="GROUP_WA_PENGURUS">Grup Pengurus & Anggota Aktif</option>
                <option value="CUSTOM_JID">Grup WhatsApp Khusus (Group JID e.g. 120363...)</option>
              </select>
            </div>

            {/* Custom Group JID if selected */}
            {targetGroup === 'CUSTOM_JID' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Group JID / Channel ID (e.g. 1203630123456789@g.us)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1203630123456789@g.us"
                    value={targetJid}
                    onChange={(e) => setTargetJid(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nama Label Grup Target (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Grup Panitia Seleksi 2026"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </>
            )}

            {/* Content Text */}
            <div className={`${styles.formGroup} ${styles.formFullWidth}`}>
              <label className={styles.label}>
                Isi Pesan Broadcast WhatsApp
              </label>
              <textarea
                rows={6}
                placeholder="Ketik isi pengumuman broadcast... Kamu bisa pakai formatting WA (*tebal*, _miring_) dan variabel template."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={styles.textarea}
                required
              />

              {/* Template Variable Pills */}
              <div className={styles.templateBadges}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Sisipkan Variabel:</span>
                <button type="button" onClick={() => handleInsertTemplateVar('{nama}')} className={styles.btnTemplate}>+ {`{nama}`}</button>
                <button type="button" onClick={() => handleInsertTemplateVar('{kelas}')} className={styles.btnTemplate}>+ {`{kelas}`}</button>
                <button type="button" onClick={() => handleInsertTemplateVar('{nisn}')} className={styles.btnTemplate}>+ {`{nisn}`}</button>
              </div>
            </div>

            {/* Media Attachment File */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Paperclip size={14} /> Lampiran Media (Foto, Video, PDF/Dokumen)
              </label>
              <input
                type="file"
                accept="image/*,video/*,.pdf,.xlsx,.docx"
                onChange={(e) => setMediaFile(e.target.files[0] || null)}
                className={styles.input}
              />
              {mediaFile && (
                <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
                  Terlampir: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              )}
            </div>

            {/* Schedule Option */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Waktu Pengiriman</label>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.84rem' }}>
                  <input
                    type="checkbox"
                    checked={sendNow}
                    onChange={(e) => setSendNow(e.target.checked)}
                    style={{ accentColor: '#ea580c', width: '16px', height: '16px' }}
                  />
                  <span>⚡ Kirim Langsung Sekarang</span>
                </label>
              </div>

              {!sendNow && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className={styles.input}
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <div className={`${styles.formGroup} ${styles.formFullWidth}`} style={{ marginTop: '10px' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', fontWeight: 700, padding: '10px 24px', width: 'max-content' }}
              >
                {submitting ? <span className="spinner" /> : <Send size={16} />}
                {submitting ? 'Memproses...' : (sendNow ? 'Kirim Broadcast Sekarang' : 'Jadwalkan Pengumuman')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: ANTREAN TERJADWAL & RIWAYAT ── */}
      {activeTab === 'history' && (
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>
              <Clock size={18} color="#ea580c" />
              <div>
                <h3>Antrean Pengumuman Terjadwal & Riwayat Broadcast</h3>
                <p>Daftar seluruh pesan pengumuman yang sedang mengantre atau telah selesai dikirim</p>
              </div>
            </div>

            <button type="button" onClick={fetchData} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} /> Refresh List
            </button>
          </div>

          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Judul Pengumuman</th>
                    <th>Target Tujuan</th>
                    <th>Lampiran Media</th>
                    <th>Waktu Pengiriman</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a) => {
                    const isScheduled = a.status === 'SCHEDULED';
                    const isSent = a.status === 'SENT';
                    const isFailed = a.status === 'FAILED';

                    return (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.title}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', maxWdith: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.message}
                          </div>
                        </td>

                        <td>
                          {a.targetJid ? (
                            <div>
                              <span className={styles.jidBadge}>
                                {a.targetJid.slice(0, 15)}...
                                <button type="button" onClick={() => handleCopyJid(a.targetJid)} className={styles.btnCopy}>
                                  <Copy size={12} />
                                </button>
                              </span>
                              {a.targetName && <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>{a.targetName}</div>}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                              {a.targetGroup === 'GROUP_WA_CALON' ? 'Grup Calon Anggota' : 'Grup Pengurus'}
                            </span>
                          )}
                        </td>

                        <td>
                          {a.mediaUrl ? (
                            <span style={{ fontSize: '0.78rem', background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                              📁 {a.mediaType} ({a.mediaName || 'File'})
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>— Tanpa Media</span>
                          )}
                        </td>

                        <td>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                            {new Date(a.scheduledAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                          {isScheduled && (
                            <div style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: 600 }}>
                              ⏳ Mengantre Pengiriman
                            </div>
                          )}
                        </td>

                        <td>
                          {isScheduled && <span className={`${styles.statusBadge} ${styles.statusScheduled}`}>⏳ Terjadwal</span>}
                          {isSent && (
                            <span className={`${styles.statusBadge} ${styles.statusSent}`}>
                              ✓ Terkirim ({a.totalSent}/{a.totalTarget})
                            </span>
                          )}
                          {isFailed && <span className={`${styles.statusBadge} ${styles.statusFailed}`}>❌ Gagal Kirim</span>}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {isScheduled && (
                              <button
                                type="button"
                                onClick={() => handleSendNow(a.id)}
                                title="Kirim Langsung Sekarang"
                                className="btn btn-warning btn-sm"
                                style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff' }}
                              >
                                <Send size={12} /> Kirim Now
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(a.id)}
                              title="Hapus / Batalkan"
                              className="btn btn-danger btn-sm"
                            >
                              <Trash2 size={12} /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {announcements.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Belum ada pengumuman terjadwal. Klik tab <strong>"Buat Pengumuman Baru"</strong> di atas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: WA GROUP DEBUGGER & LISTENER ── */}
      {activeTab === 'debugger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Detected Groups List */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderTitle}>
                <Radio size={18} color="#ea580c" />
                <div>
                  <h3>WhatsApp Group JID Inspector & Listener</h3>
                  <p>Salin Channel ID / Group JID tempat akun WhatsApp admin terhubung</p>
                </div>
              </div>

              <button type="button" onClick={fetchDebugData} className="btn btn-secondary btn-sm">
                <RefreshCw size={14} /> Refresh Debugger
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama Grup WhatsApp</th>
                    <th>Group JID / Channel ID</th>
                    <th>Pesan Terakhir</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {debugGroups.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.name}</strong>
                      </td>
                      <td>
                        <span className={styles.jidBadge}>
                          {g.jid}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {new Date(g.lastMsgAt || g.updatedAt).toLocaleString('id-ID')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleCopyJid(g.jid)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                          >
                            {copiedJid === g.jid ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                            {copiedJid === g.jid ? 'Tersalin!' : 'Copy JID'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectGroupForForm(g)}
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                          >
                            Pilih Target
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {debugGroups.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        Belum ada grup WA terdeteksi secara otomatis. Kamu bisa mengetik <code>!id</code> di grup WA tempat bot berada atau memasukkan JID secara manual di bawah.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Manual Group JID Input Form */}
            <div style={{ marginTop: '20px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                ➕ Tambah / Register Group JID Manual
              </h4>
              <form onSubmit={handleAddManualGroup} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Group JID (misal: 1203630123456789@g.us)"
                  value={newGroupJid}
                  onChange={(e) => setNewGroupJid(e.target.value)}
                  className={styles.input}
                  style={{ flex: 1, minWidth: '220px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Nama Grup (misal: Grup Calon Anggota)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={styles.input}
                  style={{ flex: 1, minWidth: '200px' }}
                  required
                />
                <button type="submit" disabled={addingGroup} className="btn btn-primary btn-sm" style={{ backgroundColor: '#0f172a', borderColor: '#0f172a' }}>
                  {addingGroup ? <span className="spinner" /> : <Plus size={14} />} Simpan Group JID
                </button>
              </form>
            </div>
          </div>

          {/* Test Incoming Message Listener Simulation */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderTitle}>
                <Terminal size={18} color="#ea580c" />
                <div>
                  <h3>Simulasi Test Message Listener (!id Debugger)</h3>
                  <p>Uji coba respons tangkapan pesan masuk grup tanpa perlu bot terhubung</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSimulateMsg} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="text"
                placeholder="Group JID (misal: 120363987654321@g.us)"
                value={simGroupJid}
                onChange={(e) => setSimGroupJid(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Nama Grup (misal: Grup Panitia PIK-R)"
                value={simGroupName}
                onChange={(e) => setSimGroupName(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Pengirim (misal: Admin Test)"
                value={simSender}
                onChange={(e) => setSimSender(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Teks Pesan (misal: !id)"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                className={styles.input}
              />

              <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                <button type="submit" disabled={simulating} className="btn btn-warning btn-sm" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff', fontWeight: 700 }}>
                  {simulating ? <span className="spinner" /> : <Play size={14} />} Jalankan Simulasi Message Listener
                </button>
              </div>
            </form>
          </div>

          {/* Live Message Log Feed */}
          <div className={styles.cardSection}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color="#ea580c" /> Log Tangkapan Pesan Masuk Real-Time ({debugLogs.length})
            </h4>

            <div style={{ background: '#0f172a', color: '#e2e8f0', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.78rem', maxHeight: '250px', overflowY: 'auto' }}>
              {debugLogs.map((log) => (
                <div key={log.id} style={{ marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                  <span style={{ color: '#f97316' }}>[{new Date(log.createdAt).toLocaleTimeString('id-ID')}]</span>{' '}
                  <span style={{ color: '#38bdf8' }}>{log.sender || 'Sender'}</span> @{' '}
                  <span style={{ color: '#a7f3d0' }}>{log.receiverJid}</span>:{' '}
                  <span>"{log.content}"</span>
                </div>
              ))}

              {debugLogs.length === 0 && (
                <div style={{ color: '#64748b' }}>Belum ada log pesan terdeteksi.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

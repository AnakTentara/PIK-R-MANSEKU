import { useState, useEffect, useRef } from 'react';
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
  Play,
  Zap,
  HelpCircle,
  Image as ImageIcon,
  X,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Layers,
  ChevronRight,
  UserCheck,
  PhoneCall,
  Search,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminPengumumanPage.module.css';

// ─── WhatsApp Text Formatter Helper ───────────────────────────────────────────
function formatWhatsAppText(text) {
  if (!text) return '';
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code block ```code```
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.06);padding:4px 6px;border-radius:4px;font-family:monospace;font-size:0.8rem;margin:4px 0;">$1</pre>');
  // Bold *text*
  formatted = formatted.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
  // Italic _text_
  formatted = formatted.replace(/_([^_<\n]+)_/g, '<em>$1</em>');
  // Strike ~text~
  formatted = formatted.replace(/~([^~<\n]+)~/g, '<del>$1</del>');
  // Inline code `code`
  formatted = formatted.replace(/`([^`\n]+)`/g, '<code style="background:rgba(0,0,0,0.05);padding:1px 4px;border-radius:3px;font-family:monospace;font-size:0.8rem;">$1</code>');
  // URLs
  formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#0284c7;text-decoration:underline;">$1</a>');
  // Linebreaks
  formatted = formatted.replace(/\n/g, '<br/>');

  return formatted;
}

// ─── Presets Template ─────────────────────────────────────────────────────────
const PRESET_TEMPLATES = [
  {
    label: '📢 Pertemuan Rutin',
    text: `*PENGUMUMAN PERTEMUAN RUTIN PIK-R MANSEKU* 🌟\n\nHalo *{nama}* ({kelas})!\n\nDiberitahukan kepada seluruh anggota bahwa pertemuan rutin PIK-R MANSEKU akan dilaksanakan pada:\n📅 *Hari/Tgl:* {hari}, {tanggal}\n🕒 *Waktu:* 14.30 WIB s.d Selesai\n📍 *Tempat:* Ruang Multimedia MAN 1 Muara Enim\n\n_Mohon hadir tepat waktu dan membawa buku catatan konseling sebaya._\n\nSalam GenRe! 👌\n*{organisasi}*`
  },
  {
    label: '🎉 Kelulusan Seleksi',
    text: `*PENGUMUMAN HASIL SELEKSI CALON ANGGOTA PIK-R* 🏆\n\nHalo *{nama}* (NISN: {nisn})!\n\nSelamat! Berdasarkan hasil seleksi POS Wawancara, Minat Bakat, dan Studi Kasus, kamu dinyatakan *LULUS* sebagai Calon Anggota PIK-R MANSEKU Periode ini.\n\nCek pengumuman resmi dan nomor registrasimu di:\n🔗 {link_kelulusan}\n\nTetap semangat dan jadilah agen perubahan remaja sehat!\n\nMengetahui,\n*Pembina:* {nama_pembina}\n*Ketua Umum:* {nama_ketua}`
  },
  {
    label: '✨ Info Ruang Cerita',
    text: `*KABAR BAIK DARI PIK-R MANSEKU!* 💬\n\nHalo *{nama}*!\nKamu lagi butuh teman cerita, curhat aman, atau butuh saran sebaya yang 100% rahasia?\n\nKunjungi platform *Ruang Cerita* kami:\n🔗 {link_ruang_cerita}\n\nAda fitur *Sahabat AI Konseling* dan *Bilik Konseling Sebaya* siap mendengar kapan saja.\n\n_{sekolah} — Remaja Sehat, Cerdas, Berkarakter!_`
  }
];

export default function AdminPengumumanPage() {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history' | 'debugger'

  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ total: 0, scheduled: 0, sent: 0, failed: 0 });
  const [variables, setVariables] = useState({});
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
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preview State
  const [previewPersona, setPreviewPersona] = useState('calon'); // 'calon' | 'pengurus' | 'grup'
  const textareaRef = useRef(null);

  // History Filter & Modal
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('ALL');
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);

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

  // Update media preview when mediaFile changes
  useEffect(() => {
    if (!mediaFile) {
      setMediaPreviewUrl('');
      return;
    }
    if (mediaFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(mediaFile);
      setMediaPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setMediaPreviewUrl('');
    }
  }, [mediaFile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAnnouncements();
      if (res.data.success) {
        setAnnouncements(res.data.announcements || []);
        setStats(res.data.stats || { total: 0, scheduled: 0, sent: 0, failed: 0 });
        if (res.data.variables) {
          setVariables(res.data.variables);
        }
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

  // Insert Variable at textarea cursor position
  const handleInsertVar = (varCode) => {
    const el = textareaRef.current;
    if (!el) {
      setMessage((prev) => prev + ` ${varCode} `);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const prevText = message;
    const newText = prevText.substring(0, start) + ` ${varCode} ` + prevText.substring(end);
    setMessage(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varCode.length + 2, start + varCode.length + 2);
    }, 50);
  };

  // Wrap selected text or insert formatting syntax
  const handleWrapFormat = (symbol) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const sel = message.substring(start, end);
    const replacement = sel ? `${symbol}${sel}${symbol}` : `${symbol}teks${symbol}`;
    const newText = message.substring(0, start) + replacement + message.substring(end);
    setMessage(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + symbol.length, start + replacement.length - symbol.length);
    }, 50);
  };

  const handleQuickSchedule = (type) => {
    const now = new Date();
    if (type === '1hour') {
      now.setHours(now.getHours() + 1);
    } else if (type === 'tomorrowMorning') {
      now.setDate(now.getDate() + 1);
      now.setHours(8, 0, 0, 0);
    } else if (type === 'tomorrowAfternoon') {
      now.setDate(now.getDate() + 1);
      now.setHours(16, 0, 0, 0);
    }
    // format to YYYY-MM-DDTHH:mm local
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    setScheduledAt(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
    setSendNow(false);
    toast.success('Waktu jadwal diatur otomatis!');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Judul Pengumuman dan Isi Pesan wajib diisi.');
      return;
    }

    if (!sendNow && !scheduledAt) {
      toast.error('Tentukan tanggal & jam jadwal atau pilih Kirim Langsung Sekarang.');
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
    if (!window.confirm('Yakin ingin membatalkan dan menghapus pengumuman ini?')) return;
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
    if (!window.confirm('Kirim pengumuman ini sekarang ke seluruh target penerima?')) return;
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

  // Generate live preview text with simulated variables
  const getSimulatedMessageText = () => {
    if (!message) return 'Halo! Ketik pesan pengumuman di samping untuk melihat preview langsung di sini... ✨';

    let preview = message;
    const personaData = {
      calon: {
        '{nama}': 'Ahmad Maulana (Calon)',
        '{kelas}': 'X.1',
        '{nisn}': '0078129381'
      },
      pengurus: {
        '{nama}': 'Febriady (Ketua Umum)',
        '{kelas}': 'XI.MIPA 2',
        '{nisn}': '0061298471'
      },
      grup: {
        '{nama}': 'Teman-teman',
        '{kelas}': 'Semua Kelas',
        '{nisn}': '-'
      }
    };

    const currentPersona = personaData[previewPersona] || personaData.calon;
    // Apply persona variables
    for (const [k, v] of Object.entries(currentPersona)) {
      preview = preview.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'gi'), v);
    }

    // Apply global variables
    for (const [k, v] of Object.entries(variables || {})) {
      preview = preview.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'gi'), v);
    }

    return preview;
  };

  // Calculate human schedule diff
  const getHumanScheduleText = () => {
    if (sendNow) return '⚡ Pesan akan dikirim LANGSUNG setelah tombol Simpan ditekan.';
    if (!scheduledAt) return '🕒 Belum dijadwalkan (Tentukan tanggal & jam di atas).';
    const target = new Date(scheduledAt);
    const now = new Date();
    const diffMs = target - now;

    const formattedDate = target.toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';

    if (diffMs <= 0) {
      return `⚠️ Waktu yang dipilih (${formattedDate}) sudah lewat atau waktu saat ini. Pengumuman akan segera dikirim.`;
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `🕒 Dikirim pada ${formattedDate} (sekitar ${diffHours > 0 ? `${diffHours} jam ` : ''}${diffMins} menit lagi).`;
  };

  // Filtered History list
  const filteredAnnouncements = announcements.filter((a) => {
    if (historyFilter === 'SCHEDULED' && a.status !== 'SCHEDULED') return false;
    if (historyFilter === 'SENT' && a.status !== 'SENT') return false;
    if (historyFilter === 'FAILED' && a.status !== 'FAILED') return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        (a.targetName && a.targetName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <AdminHeader
        title="Pengumuman & Broadcast WhatsApp"
        subtitle="Buat pengumuman terjadwal, kirim broadcast otomatis, dan kelola target grup WhatsApp dengan mudah."
      />

      {/* Top Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Megaphone size={24} />
          </div>
          <div className={styles.statInfo}>
            <h4>Total Broadcast</h4>
            <div className={styles.number}>{stats.total}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fff7ed', color: '#ea580c' }}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <h4>Antrean Terjadwal</h4>
            <div className={styles.number} style={{ color: '#ea580c' }}>{stats.scheduled}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <h4>Berhasil Terkirim</h4>
            <div className={styles.number} style={{ color: '#16a34a' }}>{stats.sent}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statInfo}>
            <h4>Gagal Kirim</h4>
            <div className={styles.number} style={{ color: '#dc2626' }}>{stats.failed}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.mainNav}>
        <button
          className={`${styles.navTab} ${activeTab === 'create' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('create')}
        >
          <Plus size={18} /> Buat Pengumuman Baru
        </button>

        <button
          className={`${styles.navTab} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('history')}
        >
          <Clock size={18} /> Antrean & Riwayat ({announcements.length})
        </button>

        <button
          className={`${styles.navTab} ${activeTab === 'debugger' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('debugger')}
        >
          <Radio size={18} /> Deteksi Grup WhatsApp ({debugGroups.length})
        </button>
      </div>

      {/* ── TAB 1: FORM BUAT PENGUMUMAN BARU DENGAN LIVE WA PREVIEW ── */}
      {activeTab === 'create' && (
        <div className={styles.createGrid}>
          {/* Left: Input Form */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderTitle}>
                <Sparkles size={20} color="#ea580c" />
                <div>
                  <h3>Form Pengumuman WhatsApp</h3>
                  <p>Lengkapi informasi di bawah ini. Preview tampilan pesan di ponsel WhatsApp tampil otomatis di sebelah kanan.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className={styles.formColumn}>
              {/* Judul Pengumuman */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Judul Pengumuman</span>
                  <span className={styles.labelHint}>(Hanya untuk catatan admin)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pengumuman Seleksi Tahap 1 & Wawancara"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              {/* Target Penerima (Visual Card Selector) */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Target Penerima Pesan</span>
                  <span className={styles.labelHint}>Pilih siapa yang akan menerima broadcast</span>
                </label>
                <div className={styles.targetCardsGrid}>
                  {/* Calon Anggota */}
                  <div
                    className={`${styles.targetCard} ${targetGroup === 'GROUP_WA_CALON' ? styles.targetCardActive : ''}`}
                    onClick={() => {
                      setTargetGroup('GROUP_WA_CALON');
                      setPreviewPersona('calon');
                    }}
                  >
                    <div className={styles.targetCardTop}>
                      <div className={styles.targetCardIcon}>
                        <Users size={18} />
                      </div>
                      <div className={styles.targetCardRadio}>
                        {targetGroup === 'GROUP_WA_CALON' && <div className={styles.targetCardRadioInner} />}
                      </div>
                    </div>
                    <div className={styles.targetCardTitle}>Calon Anggota</div>
                    <div className={styles.targetCardDesc}>Personalisasi otomatis nama, kelas, & NISN masing-masing pendaftar seleksi.</div>
                  </div>

                  {/* Pengurus & Anggota Aktif */}
                  <div
                    className={`${styles.targetCard} ${targetGroup === 'GROUP_WA_PENGURUS' ? styles.targetCardActive : ''}`}
                    onClick={() => {
                      setTargetGroup('GROUP_WA_PENGURUS');
                      setPreviewPersona('pengurus');
                    }}
                  >
                    <div className={styles.targetCardTop}>
                      <div className={styles.targetCardIcon}>
                        <UserCheck size={18} />
                      </div>
                      <div className={styles.targetCardRadio}>
                        {targetGroup === 'GROUP_WA_PENGURUS' && <div className={styles.targetCardRadioInner} />}
                      </div>
                    </div>
                    <div className={styles.targetCardTitle}>Anggota Aktif</div>
                    <div className={styles.targetCardDesc}>Kirim pesan langsung ke seluruh nomor anggota & pengurus aktif PIK-R.</div>
                  </div>

                  {/* Grup WA Khusus */}
                  <div
                    className={`${styles.targetCard} ${targetGroup === 'CUSTOM_JID' ? styles.targetCardActive : ''}`}
                    onClick={() => {
                      setTargetGroup('CUSTOM_JID');
                      setPreviewPersona('grup');
                      if (debugGroups.length === 0) fetchDebugData();
                    }}
                  >
                    <div className={styles.targetCardTop}>
                      <div className={styles.targetCardIcon}>
                        <MessageSquare size={18} />
                      </div>
                      <div className={styles.targetCardRadio}>
                        {targetGroup === 'CUSTOM_JID' && <div className={styles.targetCardRadioInner} />}
                      </div>
                    </div>
                    <div className={styles.targetCardTitle}>Grup WhatsApp</div>
                    <div className={styles.targetCardDesc}>Kirim langsung ke obrolan grup WA tertentu menggunakan ID Grup (JID).</div>
                  </div>
                </div>

                {/* Sub-form if CUSTOM_JID is selected */}
                {targetGroup === 'CUSTOM_JID' && (
                  <div style={{ marginTop: '10px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                        Pilih dari Grup Terdeteksi Otomatis:
                      </label>
                      <select
                        className={styles.select}
                        style={{ marginTop: '4px' }}
                        value={targetJid}
                        onChange={(e) => {
                          const jid = e.target.value;
                          setTargetJid(jid);
                          const found = debugGroups.find((g) => g.jid === jid);
                          if (found) setTargetName(found.name);
                        }}
                      >
                        <option value="">-- Pilih Grup WA Terdaftar --</option>
                        {debugGroups.map((g) => (
                          <option key={g.id} value={g.jid}>
                            {g.name} ({g.jid})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#64748b' }}>Group JID Manual</label>
                        <input
                          type="text"
                          placeholder="misal: 1203630123456789@g.us"
                          value={targetJid}
                          onChange={(e) => setTargetJid(e.target.value)}
                          className={styles.input}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#64748b' }}>Nama Label Grup (Opsional)</label>
                        <input
                          type="text"
                          placeholder="misal: Grup Panitia Seleksi"
                          value={targetName}
                          onChange={(e) => setTargetName(e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Cepat */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Gunakan Template Siap Pakai</span>
                  <span className={styles.labelHint}>(Opsional - klik untuk mengganti teks)</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      className={styles.quickChip}
                      onClick={() => {
                        if (message.trim() && !window.confirm('Ganti isi pesan saat ini dengan template ini?')) return;
                        setMessage(tmpl.text);
                        toast.success(`Template ${tmpl.label} diterapkan!`);
                      }}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Isi Pesan Broadcast WhatsApp dengan Toolbar */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Isi Pesan WhatsApp</span>
                  <span className={styles.labelHint}>{message.length} karakter</span>
                </label>

                {/* Formatting Toolbar */}
                <div className={styles.formatToolbar}>
                  <button type="button" onClick={() => handleWrapFormat('*')} className={styles.btnFormat} title="Teks Tebal (*kata*)">
                    <Bold size={13} /> Tebal
                  </button>
                  <button type="button" onClick={() => handleWrapFormat('_')} className={styles.btnFormat} title="Teks Miring (_kata_)">
                    <Italic size={13} /> Miring
                  </button>
                  <button type="button" onClick={() => handleWrapFormat('~')} className={styles.btnFormat} title="Teks Coret (~kata~)">
                    <Strikethrough size={13} /> Coret
                  </button>
                  <button type="button" onClick={() => handleWrapFormat('```')} className={styles.btnFormat} title="Teks Monospace (```kata```)">
                    <Code size={13} /> Kode
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={8}
                  placeholder="Tulis pesan pengumuman broadcast di sini... Sisipkan variabel dinamis dengan mengklik badge di bawah."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${styles.textarea} ${styles.textareaWithToolbar}`}
                  required
                />

                {/* Categorized Variables Insert Box */}
                <div className={styles.variablesContainer}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    💡 Klik Variabel untuk Menyisipkan Otomatis:
                  </div>

                  {/* Kategori 1: Data Penerima */}
                  <div className={styles.varCategory}>
                    <div className={styles.varCatHeader}>
                      <Users size={12} /> Data Penerima (Otomatis per siswa)
                    </div>
                    <div className={styles.varPillsWrap}>
                      <button type="button" onClick={() => handleInsertVar('{nama}')} className={styles.varPill}>
                        <span>{`{nama}`}</span>
                        <span className={styles.varPillDesc}>Nama Siswa</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{kelas}')} className={styles.varPill}>
                        <span>{`{kelas}`}</span>
                        <span className={styles.varPillDesc}>Kelas</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{nisn}')} className={styles.varPill}>
                        <span>{`{nisn}`}</span>
                        <span className={styles.varPillDesc}>NISN</span>
                      </button>
                    </div>
                  </div>

                  {/* Kategori 2: Data Organisasi */}
                  <div className={styles.varCategory}>
                    <div className={styles.varCatHeader}>
                      <Sparkles size={12} /> Data Organisasi & Pembina
                    </div>
                    <div className={styles.varPillsWrap}>
                      <button type="button" onClick={() => handleInsertVar('{nama_pembina}')} className={styles.varPill}>
                        <span>{`{nama_pembina}`}</span>
                        <span className={styles.varPillDesc}>{variables['{nama_pembina}'] || 'Pembina'}</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{nama_ketua}')} className={styles.varPill}>
                        <span>{`{nama_ketua}`}</span>
                        <span className={styles.varPillDesc}>{variables['{nama_ketua}'] || 'Ketua Umum'}</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{total_anggota}')} className={styles.varPill}>
                        <span>{`{total_anggota}`}</span>
                        <span className={styles.varPillDesc}>{variables['{total_anggota}'] || 'Total'}</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{organisasi}')} className={styles.varPill}>
                        <span>{`{organisasi}`}</span>
                        <span className={styles.varPillDesc}>PIK-R MANSEKU</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{sekolah}')} className={styles.varPill}>
                        <span>{`{sekolah}`}</span>
                        <span className={styles.varPillDesc}>MAN 1 Muara Enim</span>
                      </button>
                    </div>
                  </div>

                  {/* Kategori 3: Waktu & Tanggal */}
                  <div className={styles.varCategory}>
                    <div className={styles.varCatHeader}>
                      <Clock size={12} /> Waktu & Tanggal (Saat Kirim)
                    </div>
                    <div className={styles.varPillsWrap}>
                      <button type="button" onClick={() => handleInsertVar('{hari}')} className={styles.varPill}>
                        <span>{`{hari}`}</span>
                        <span className={styles.varPillDesc}>{variables['{hari}'] || 'Hari'}</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{tanggal}')} className={styles.varPill}>
                        <span>{`{tanggal}`}</span>
                        <span className={styles.varPillDesc}>{variables['{tanggal}'] || 'Tanggal'}</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{jam}')} className={styles.varPill}>
                        <span>{`{jam}`}</span>
                        <span className={styles.varPillDesc}>{variables['{jam}'] || 'WIB'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Kategori 4: Tautan Pintas */}
                  <div className={styles.varCategory}>
                    <div className={styles.varCatHeader}>
                      <Paperclip size={12} /> Tautan Pintas Website
                    </div>
                    <div className={styles.varPillsWrap}>
                      <button type="button" onClick={() => handleInsertVar('{link_web}')} className={styles.varPill}>
                        <span>{`{link_web}`}</span>
                        <span className={styles.varPillDesc}>Website</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{link_ruang_cerita}')} className={styles.varPill}>
                        <span>{`{link_ruang_cerita}`}</span>
                        <span className={styles.varPillDesc}>Ruang Cerita</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{link_kelulusan}')} className={styles.varPill}>
                        <span>{`{link_kelulusan}`}</span>
                        <span className={styles.varPillDesc}>Cek Kelulusan</span>
                      </button>
                      <button type="button" onClick={() => handleInsertVar('{link_daftar}')} className={styles.varPill}>
                        <span>{`{link_daftar}`}</span>
                        <span className={styles.varPillDesc}>Pendaftaran</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lampiran Media File */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Lampiran Media (Foto, Video, Brosur PDF)</span>
                  <span className={styles.labelHint}>Opsional</span>
                </label>

                {!mediaFile ? (
                  <label className={styles.uploadDropzone}>
                    <Paperclip size={24} color="#ea580c" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155' }}>
                      Pilih atau Seret Foto / Dokumen ke sini
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      Format: Gambar (JPG/PNG), Video (MP4), atau Dokumen (PDF, XLSX, DOCX)
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*,.pdf,.xlsx,.docx"
                      onChange={(e) => setMediaFile(e.target.files[0] || null)}
                      style={{ display: 'none' }}
                    />
                  </label>
                ) : (
                  <div className={styles.mediaPreviewBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileCheck size={18} />
                      <span>{mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaFile(null)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Mode Waktu Pengiriman (Segmented Control - BUKAN BOOLEAN BASIC) */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span>Metode Pengiriman</span>
                  <span className={styles.labelHint}>Pilih waktu eksekusi</span>
                </label>

                <div className={styles.scheduleSegmentWrap}>
                  <button
                    type="button"
                    className={`${styles.scheduleSegmentBtn} ${!sendNow ? styles.scheduleSegmentBtnActive : ''}`}
                    onClick={() => setSendNow(false)}
                  >
                    <Clock size={16} /> 🕒 Jadwalkan Waktu Otomatis
                  </button>
                  <button
                    type="button"
                    className={`${styles.scheduleSegmentBtn} ${sendNow ? styles.scheduleSegmentBtnActive : ''}`}
                    onClick={() => setSendNow(true)}
                  >
                    <Zap size={16} /> ⚡ Kirim Langsung Sekarang
                  </button>
                </div>

                {/* Sub-pilihan jika dijadwalkan */}
                {!sendNow && (
                  <div className={styles.scheduleDatePickerBox}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>
                        Tentukan Tanggal & Jam Pengiriman (WIB):
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className={styles.input}
                        required={!sendNow}
                      />
                    </div>

                    {/* Quick shortcuts */}
                    <div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginRight: '6px' }}>Pintasan Waktu:</span>
                      <div className={styles.quickScheduleChips} style={{ display: 'inline-flex' }}>
                        <button type="button" onClick={() => handleQuickSchedule('1hour')} className={styles.quickChip}>+1 Jam Lagi</button>
                        <button type="button" onClick={() => handleQuickSchedule('tomorrowMorning')} className={styles.quickChip}>Besok Pagi (08:00)</button>
                        <button type="button" onClick={() => handleQuickSchedule('tomorrowAfternoon')} className={styles.quickChip}>Besok Sore (16:00)</button>
                      </div>
                    </div>

                    <div className={styles.humanScheduleHint}>
                      <Clock size={14} /> {getHumanScheduleText()}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: '#ea580c',
                    borderColor: '#ea580c',
                    fontWeight: 700,
                    padding: '12px 28px',
                    fontSize: '0.96rem',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting ? <span className="spinner" /> : <Send size={18} />}
                  {submitting ? 'Memproses broadcast...' : (sendNow ? 'Kirim Broadcast Sekarang' : 'Simpan & Jadwalkan Pengumuman')}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Real-Time WhatsApp Mockup Preview */}
          <div className={styles.previewColumn}>
            {/* Persona Switcher */}
            <div className={styles.previewPersonaSwitch}>
              <span style={{ fontWeight: 600, color: '#475569' }}>Simulasi Penerima:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewPersona('calon')}
                  style={{
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: previewPersona === 'calon' ? '#ea580c' : '#f1f5f9',
                    color: previewPersona === 'calon' ? '#fff' : '#475569'
                  }}
                >
                  Calon
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPersona('pengurus')}
                  style={{
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: previewPersona === 'pengurus' ? '#ea580c' : '#f1f5f9',
                    color: previewPersona === 'pengurus' ? '#fff' : '#475569'
                  }}
                >
                  Pengurus
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPersona('grup')}
                  style={{
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: previewPersona === 'grup' ? '#ea580c' : '#f1f5f9',
                    color: previewPersona === 'grup' ? '#fff' : '#475569'
                  }}
                >
                  Grup
                </button>
              </div>
            </div>

            {/* Phone Screen Mockup */}
            <div className={styles.waMockupWrapper}>
              {/* WhatsApp Header */}
              <div className={styles.waHeader}>
                <div className={styles.waHeaderAvatar}>
                  <img src="/media/logos/L_PIK-R_Title.png" alt="PIK-R" onError={(e) => { e.target.style.display = 'none'; }} />
                  <span>P</span>
                </div>
                <div className={styles.waHeaderInfo}>
                  <div className={styles.waHeaderName}>
                    <span>PIK-R MANSEKU Bot</span>
                    <CheckCircle size={14} color="#4ade80" />
                  </div>
                  <div className={styles.waHeaderStatus}>Official Broadcast • Online</div>
                </div>
                <PhoneCall size={18} style={{ opacity: 0.8 }} />
              </div>

              {/* Chat Canvas with Wallpaper */}
              <div className={styles.waChatBody}>
                <div className={styles.waDatePill}>Hari ini</div>

                {/* Simulated Outgoing Message Bubble */}
                <div className={styles.waBubble}>
                  {/* Media Attachment Preview inside Bubble */}
                  {mediaFile && (
                    <>
                      {mediaPreviewUrl ? (
                        <div className={styles.waBubbleMedia}>
                          <img src={mediaPreviewUrl} alt="Preview" />
                        </div>
                      ) : (
                        <div className={styles.waBubbleDoc}>
                          <FileText size={28} color="#ea580c" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {mediaFile.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {(mediaFile.size / 1024 / 1024).toFixed(2)} MB • Dokumen
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Formatted Text Message */}
                  <div
                    className={styles.waBubbleText}
                    dangerouslySetInnerHTML={{ __html: formatWhatsAppText(getSimulatedMessageText()) }}
                  />

                  {/* Footer (Timestamp + Double Blue Checkmarks) */}
                  <div className={styles.waBubbleFooter}>
                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={styles.waCheckmarks}>✓✓</span>
                  </div>
                </div>
              </div>

              {/* Simulated WhatsApp Keyboard Bar */}
              <div className={styles.waFooterSim}>
                <div className={styles.waInputSim}>Ketik pesan...</div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Send size={14} />
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
              📱 Preview tampilan asli di smartphone penerima WhatsApp
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ANTREAN TERJADWAL & RIWAYAT ── */}
      {activeTab === 'history' && (
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitle}>
              <Clock size={20} color="#ea580c" />
              <div>
                <h3>Antrean & Riwayat Broadcast</h3>
                <p>Seluruh daftar pengumuman yang sedang menunggu jadwal maupun yang telah selesai dikirim.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Filter status */}
              <select
                className={styles.select}
                style={{ width: 'auto', padding: '7px 12px', fontSize: '0.84rem' }}
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
              >
                <option value="ALL">Semua Status</option>
                <option value="SCHEDULED">⏳ Mengantre (Terjadwal)</option>
                <option value="SENT">✓ Berhasil Terkirim</option>
                <option value="FAILED">❌ Gagal Kirim</option>
              </select>

              <button type="button" onClick={fetchData} className="btn btn-secondary btn-sm">
                <RefreshCw size={14} /> Refresh Data
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Cari pengumuman berdasarkan judul atau isi pesan..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className={styles.input}
              style={{ paddingLeft: '36px' }}
            />
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          </div>

          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Judul & Cuplikan Pesan</th>
                    <th>Target Penerima</th>
                    <th>Lampiran</th>
                    <th>Jadwal Kirim</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnouncements.map((a) => {
                    const isScheduled = a.status === 'SCHEDULED';
                    const isSent = a.status === 'SENT';
                    const isFailed = a.status === 'FAILED';

                    return (
                      <tr key={a.id}>
                        <td style={{ maxWidth: '320px' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{a.title}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {a.message}
                          </div>
                        </td>

                        <td>
                          {a.targetJid ? (
                            <div>
                              <span className={styles.jidBadge}>
                                {a.targetJid.slice(0, 16)}...
                                <button type="button" onClick={() => handleCopyJid(a.targetJid)} className={styles.btnCopy}>
                                  <Copy size={11} />
                                </button>
                              </span>
                              {a.targetName && <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>{a.targetName}</div>}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                              {a.targetGroup === 'GROUP_WA_CALON' ? '👥 Calon Anggota' : '🎖️ Anggota Aktif'}
                            </span>
                          )}
                        </td>

                        <td>
                          {a.mediaUrl ? (
                            <span style={{ fontSize: '0.76rem', background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                              📁 {a.mediaType} ({a.mediaName || 'File'})
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>— Tanpa Media</span>
                          )}
                        </td>

                        <td>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                            {new Date(a.scheduledAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB
                          </div>
                          {isScheduled && (
                            <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 600, marginTop: '1px' }}>
                              ⏳ Mengantre
                            </div>
                          )}
                        </td>

                        <td>
                          {isScheduled && <span className={`${styles.statusBadge} ${styles.statusScheduled}`}>⏳ Mengantre</span>}
                          {isSent && (
                            <span className={`${styles.statusBadge} ${styles.statusSent}`}>
                              ✓ Terkirim ({a.totalSent}/{a.totalTarget})
                            </span>
                          )}
                          {isFailed && <span className={`${styles.statusBadge} ${styles.statusFailed}`}>❌ Gagal Kirim</span>}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setViewingAnnouncement(a)}
                              title="Lihat Detail Pesan"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 8px' }}
                            >
                              <Eye size={13} />
                            </button>

                            {isScheduled && (
                              <button
                                type="button"
                                onClick={() => handleSendNow(a.id)}
                                title="Kirim Langsung Sekarang"
                                className="btn btn-warning btn-sm"
                                style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', color: '#fff', padding: '5px 8px' }}
                              >
                                <Send size={13} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(a.id)}
                              title="Hapus / Batalkan"
                              className="btn btn-danger btn-sm"
                              style={{ padding: '5px 8px' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAnnouncements.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        Tidak ada pengumuman yang sesuai dengan filter atau kata kunci.
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Layman Guide Banner */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
              <Radio size={22} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', fontWeight: 700, color: '#166534' }}>
                Cara Mudah Menghubungkan Grup WhatsApp ke Sistem
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#15803d', lineHeight: 1.5 }}>
                1. Masukkan nomor WhatsApp bot PIK-R ke grup WA yang diinginkan.<br/>
                2. Ketik perintah <code>!id</code> di dalam obrolan grup tersebut.<br/>
                3. Sistem akan otomatis menangkap dan menyimpan ID grup di tabel bawah. Klik tombol <strong>"Pilih Jadi Target"</strong> untuk langsung mulai broadcast ke grup tersebut!
              </p>
            </div>
          </div>

          {/* Detected Groups List */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderTitle}>
                <Radio size={20} color="#ea580c" />
                <div>
                  <h3>Daftar Grup WhatsApp Terdeteksi</h3>
                  <p>Grup yang sudah terhubung dengan bot WhatsApp PIK-R MANSEKU.</p>
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
                    <th>Group JID (ID Obrolan)</th>
                    <th>Aktivitas Terakhir</th>
                    <th style={{ textAlign: 'center' }}>Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {debugGroups.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{g.name}</strong>
                      </td>
                      <td>
                        <span className={styles.jidBadge}>
                          {g.jid}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(g.lastMsgAt || g.updatedAt).toLocaleString('id-ID')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleCopyJid(g.jid)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {copiedJid === g.jid ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                            {copiedJid === g.jid ? 'Disalin' : 'Copy ID'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectGroupForForm(g)}
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Send size={12} /> Pilih Jadi Target
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {debugGroups.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        Belum ada grup WA terdeteksi secara otomatis. Ikuti panduan di atas atau daftarkan JID grup manual di bawah.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Manual Group JID Input Form */}
            <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
                ➕ Daftarkan ID Grup WhatsApp Secara Manual
              </h4>
              <form onSubmit={handleAddManualGroup} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Group JID (misal: 1203630123456789@g.us)"
                  value={newGroupJid}
                  onChange={(e) => setNewGroupJid(e.target.value)}
                  className={styles.input}
                  style={{ flex: 1, minWidth: '240px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Nama Grup (misal: Grup Anggota Angkatan 2026)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={styles.input}
                  style={{ flex: 1, minWidth: '220px' }}
                  required
                />
                <button type="submit" disabled={addingGroup} className="btn btn-primary btn-sm" style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', whiteSpace: 'nowrap' }}>
                  {addingGroup ? <span className="spinner" /> : <Plus size={14} />} Simpan Grup
                </button>
              </form>
            </div>
          </div>

          {/* Test Incoming Message Listener Simulation */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderTitle}>
                <Terminal size={20} color="#ea580c" />
                <div>
                  <h3>Simulasi Pesan Masuk (!id Test Listener)</h3>
                  <p>Gunakan untuk menguji tangkapan pesan masuk tanpa perlu bot WhatsApp sedang terhubung.</p>
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
                  {simulating ? <span className="spinner" /> : <Play size={14} />} Jalankan Simulasi Listener
                </button>
              </div>
            </form>
          </div>

          {/* Live Message Log Feed */}
          <div className={styles.cardSection}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color="#ea580c" /> Log Tangkapan Pesan Masuk ({debugLogs.length})
            </h4>

            <div style={{ background: '#0f172a', color: '#e2e8f0', padding: '16px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.8rem', maxHeight: '250px', overflowY: 'auto' }}>
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

      {/* ── DETAIL MODAL VIEW ── */}
      {viewingAnnouncement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {viewingAnnouncement.title}
              </h3>
              <button onClick={() => setViewingAnnouncement(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '0.84rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Status:</strong> {viewingAnnouncement.status}</div>
              <div><strong>Jadwal:</strong> {new Date(viewingAnnouncement.scheduledAt).toLocaleString('id-ID')} WIB</div>
              <div><strong>Terkirim ke:</strong> {viewingAnnouncement.totalSent || 0} dari {viewingAnnouncement.totalTarget || 0} target</div>
              {viewingAnnouncement.mediaName && <div><strong>Lampiran:</strong> {viewingAnnouncement.mediaName}</div>}
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.5, color: '#1e293b' }}>
              {viewingAnnouncement.message}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(viewingAnnouncement.message);
                  toast.success('Isi pesan disalin ke clipboard!');
                }}
              >
                <Copy size={14} /> Salin Pesan
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setViewingAnnouncement(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

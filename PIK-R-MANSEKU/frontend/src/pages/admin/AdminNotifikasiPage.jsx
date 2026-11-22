import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Send, 
  Smartphone, 
  History, 
  Calendar, 
  Trash2, 
  ExternalLink, 
  Plus, 
  X, 
  Upload, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Link2,
  Clock,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getAdminPushStats, 
  getAdminPushHistory, 
  deletePushHistory, 
  sendPushBroadcast, 
  sendPushTest,
  uploadPushImage,
  getAdminPertemuan,
  saveAdminPertemuan,
  getVapidPublicKey,
  subscribePush
} from '@/api/push';
import AdminHeader from '@/components/admin/AdminHeader';
import styles from './AdminNotifikasiPage.module.css';

const DEFAULT_ICONS = [
  { label: 'Logo PIK-R (Standar)', value: '/media/logos/logo_pik-r.png' },
  { label: 'Logo MAN 1 Pasuruan', value: '/media/logos/logo_man.png' },
  { label: 'Logo Kemenag', value: '/media/logos/logo_kemenag.png' },
];

const CATEGORIES = [
  { label: 'Umum & Informasi', value: 'UMUM' },
  { label: 'Jadwal & Pertemuan', value: 'JADWAL' },
  { label: 'Pengumuman Penting', value: 'PENGUMUMAN' },
  { label: 'Seleksi & Kelulusan', value: 'KELULUSAN' },
];

export default function AdminNotifikasiPage() {
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' | 'pertemuan' | 'history'
  const [stats, setStats] = useState({ subscriberCount: 0, broadcastCount: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State Broadcast
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'UMUM',
    icon: '/media/logos/logo_pik-r.png',
    image: '',
    url: '',
    actions: []
  });

  // Schedule Pertemuan Form State
  const [scheduleData, setScheduleData] = useState({
    title: 'Pertemuan Rutin PIK-R MANSEKU',
    datetime: '',
    location: 'Ruang Sekretariat PIK-R MANSEKU',
    dresscode: 'Seragam PDH PIK-R / Rapih',
    agenda: 'Pembahasan program kerja dan sharing session.',
    notes: 'Harap hadir tepat waktu dan membawa catatan pribadi.',
    contactPerson: 'Admin PIK-R',
    isActive: true
  });

  const fileInputRef = useRef(null);

  // Load stats, history, & schedule
  const loadData = async () => {
    try {
      const [statsRes, historyRes, scheduleRes] = await Promise.all([
        getAdminPushStats().catch(() => ({ data: { subscriberCount: 0, broadcastCount: 0 } })),
        getAdminPushHistory().catch(() => ({ data: { history: [] } })),
        getAdminPertemuan().catch(() => ({ data: { schedule: null } }))
      ]);

      setStats(statsRes.data);
      setHistory(historyRes.data.history || []);
      if (scheduleRes.data?.schedule) {
        setScheduleData(scheduleRes.data.schedule);
      }
    } catch (err) {
      console.error('Error loadData:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Form Change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add Action Button
  const handleAddAction = () => {
    if (formData.actions.length >= 2) {
      toast.error('Maksimal 2 tombol aksi interaktif');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      actions: [...prev.actions, { action: `action_${Date.now()}`, title: '', url: '' }]
    }));
  };

  // Update Action Button
  const handleUpdateAction = (index, key, val) => {
    const nextActions = [...formData.actions];
    nextActions[index][key] = val;
    setFormData((prev) => ({ ...prev, actions: nextActions }));
  };

  // Remove Action Button
  const handleRemoveAction = (index) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  // Upload Rich Image Banner
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Mengunggah gambar banner...');
    try {
      const res = await uploadPushImage(file);
      setFormData((prev) => ({ ...prev, image: res.data.url }));
      toast.success('Gambar banner berhasil diunggah!', { id: toastId });
    } catch (err) {
      toast.error('Gagal mengunggah gambar: ' + (err.response?.data?.message || err.message), { id: toastId });
    }
  };

  // Kirim Siaran Massal
  const handleSendBroadcast = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('Judul dan pesan notifikasi wajib diisi');
      return;
    }

    if (!window.confirm(`Siarkan notifikasi "${formData.title}" ke seluruh ${stats.subscriberCount} perangkat terdaftar?`)) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Mengirim notifikasi massal...');
    try {
      const res = await sendPushBroadcast(formData);
      toast.success(res.data.message || 'Notifikasi massal berhasil disiarkan!', { id: toastId });
      setFormData({
        title: '',
        body: '',
        category: 'UMUM',
        icon: '/media/logos/logo_pik-r.png',
        image: '',
        url: '',
        actions: []
      });
      loadData();
    } catch (err) {
      toast.error('Gagal menyiarkan: ' + (err.response?.data?.message || err.message), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Uji Coba di Perangkat Ini
  const handleTestNotification = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Browser ini tidak mendukung Web Push');
      return;
    }

    const toastId = toast.loading('Mempersiapkan uji coba perangkat...');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Izin notifikasi ditolak di browser ini', { id: toastId });
        return;
      }

      const sw = await navigator.serviceWorker.ready;
      let sub = await sw.pushManager.getSubscription();

      if (!sub) {
        const { data } = await getVapidPublicKey();
        const convertedKey = urlB64ToUint8Array(data.publicKey);
        sub = await sw.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });

        // Register to database
        const subJson = sub.toJSON();
        await subscribePush({
          endpoint: sub.endpoint,
          keys: subJson.keys,
          role: 'ADMIN'
        });
      }

      // Kirim tes push
      await sendPushTest({
        subscription: sub.toJSON(),
        notification: {
          title: formData.title || '🔔 Uji Coba Notifikasi PIK-R MANSEKU',
          body: formData.body || 'Notifikasi push bekerja dengan sempurna di perangkat ini!',
          icon: formData.icon,
          image: formData.image || null,
          url: formData.url || '/',
          actions: formData.actions
        }
      });

      toast.success('Notifikasi uji coba terkirim ke perangkat ini!', { id: toastId });
      loadData();
    } catch (err) {
      toast.error('Gagal uji coba: ' + (err.response?.data?.message || err.message), { id: toastId });
    }
  };

  // Simpan Jadwal Pertemuan
  const handleSaveSchedule = async (e) => {
    e?.preventDefault();
    const toastId = toast.loading('Menyimpan jadwal pertemuan...');
    try {
      const res = await saveAdminPertemuan(scheduleData);
      toast.success(res.data.message || 'Jadwal berhasil disimpan!', { id: toastId });
    } catch (err) {
      toast.error('Gagal menyimpan jadwal: ' + (err.response?.data?.message || err.message), { id: toastId });
    }
  };

  // Isi Form Broadcast dari Jadwal Pertemuan
  const handlePrefillBroadcastFromSchedule = () => {
    const dateFormatted = scheduleData.datetime
      ? new Date(scheduleData.datetime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      : 'segera';

    setFormData({
      title: `📅 Pengingat: ${scheduleData.title}`,
      body: `Pertemuan pada ${dateFormatted} WIB di ${scheduleData.location}. Wajib hadir tepat waktu ya! Klik untuk melihat hitung mundur & detail agenda.`,
      category: 'JADWAL',
      icon: '/media/logos/logo_pik-r.png',
      image: '',
      url: '/push/pertemuan',
      actions: [
        { action: 'view_schedule', title: 'Lihat Detail & Agenda', url: '/push/pertemuan' }
      ]
    });

    setActiveTab('broadcast');
    toast.success('Formulir siaran terisi dari jadwal pertemuan!');
  };

  // Hapus Riwayat
  const handleDeleteHistory = async (id) => {
    if (!window.confirm('Hapus riwayat notifikasi ini?')) return;
    try {
      await deletePushHistory(id);
      toast.success('Riwayat dihapus');
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      toast.error('Gagal menghapus riwayat');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header with Sidebar Toggle */}
      <AdminHeader
        title="Notifikasi Massal & Jadwal"
        subtitle="Kirim pengumuman resmi PIK-R MANSEKU ke seluruh perangkat anggota & pengunjung melalui Web Push & Native App."
      />

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>
            <Smartphone size={22} />
          </div>
          <div className={styles.statInfoWrap}>
            <div className={styles.statNumber}>{stats.subscriberCount}</div>
            <div className={styles.statLabel}>Perangkat Terdaftar (Aktif)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: '#ecfdf5', color: '#059669' }}>
            <Send size={22} />
          </div>
          <div className={styles.statInfoWrap}>
            <div className={styles.statNumber}>{stats.broadcastCount}</div>
            <div className={styles.statLabel}>Total Siaran Terkirim</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={22} />
          </div>
          <div className={styles.statInfoWrap}>
            <span className={styles.statLinkBadge}>/push/pertemuan</span>
            <div className={styles.statLabel}>Halaman Hitung Mundur Jadwal</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'broadcast' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('broadcast')}
        >
          <Send size={16} /> Buat & Siarkan Notifikasi
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'pertemuan' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('pertemuan')}
        >
          <Calendar size={16} /> Atur Jadwal Pertemuan (/push/pertemuan)
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} /> Riwayat Pengiriman ({history.length})
        </button>
      </div>

      {/* TAB 1: BROADCAST NOTIFIKASI */}
      {activeTab === 'broadcast' && (
        <div className={styles.broadcastGrid}>
          {/* Form Side */}
          <div className={styles.cardSection}>
            <h2 className={styles.sectionTitle}>
              <Sparkles size={18} color="#ea580c" />
              Detail Pesan Notifikasi
            </h2>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Kategori Pengumuman</label>
              <select
                className={styles.formSelect}
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Judul Notifikasi *</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Contoh: 📅 Jadwal Kumpul Rutin PIK-R MANSEKU"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Isi Pesan / Deskripsi *</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Tuliskan isi pesan pengumuman secara jelas dan ringkas..."
                value={formData.body}
                onChange={(e) => handleChange('body', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Pilihan Ikon Notifikasi</label>
              <select
                className={styles.formSelect}
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
              >
                {DEFAULT_ICONS.map((ico) => (
                  <option key={ico.value} value={ico.value}>{ico.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Gambar Banner Besar (Opsional)</label>
              <div className={styles.uploadRow}>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="URL gambar atau unggah langsung..."
                  value={formData.image}
                  onChange={(e) => handleChange('image', e.target.value)}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className={styles.fileInput}
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> Unggah
                </button>
              </div>
              <div className={styles.formHint}>Akan muncul sebagai Big Picture banner di Android & Notification Center.</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Target Tautan Klik (Opsional)</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Bawaan otomatis: /push/DD-MM-YYYY_n (atau ketik /push/pertemuan)"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
              />
              <div className={styles.formHint}>Kosongkan bila ingin otomatis membuat halaman detail /push/DD-MM-YYYY_n.</div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionsBuilder}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#4b3f36' }}>
                  Tombol Tindakan Interaktif ({formData.actions.length}/2)
                </span>
                {formData.actions.length < 2 && (
                  <button type="button" className={styles.addActionBtn} onClick={handleAddAction}>
                    <Plus size={13} /> Tambah Tombol
                  </button>
                )}
              </div>

              {formData.actions.map((act, idx) => (
                <div key={idx} className={styles.actionRow}>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Teks Tombol (mis: Buka Jadwal)"
                    value={act.title}
                    onChange={(e) => handleUpdateAction(idx, 'title', e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="URL (mis: /push/pertemuan)"
                    value={act.url}
                    onChange={(e) => handleUpdateAction(idx, 'url', e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.removeActionBtn}
                    onClick={() => handleRemoveAction(idx)}
                    title="Hapus tombol"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Submit Toolbar */}
            <div className={styles.formToolbar}>
              <button
                type="button"
                className={styles.sendBroadcastBtn}
                onClick={handleSendBroadcast}
                disabled={loading}
              >
                <Send size={16} /> Siarkan ke Seluruh Perangkat ({stats.subscriberCount})
              </button>

              <button
                type="button"
                className={styles.testBtn}
                onClick={handleTestNotification}
                title="Kirim notifikasi ke browser Anda untuk melihat hasilnya langsung di layar"
              >
                <Smartphone size={16} /> Uji Coba di Perangkat Ini
              </button>
            </div>
          </div>

          {/* Live Mobile Preview Side */}
          <div className={styles.previewSticky}>
            <div className={styles.cardSection}>
              <h2 className={styles.sectionTitle}>
                <Eye size={18} color="#ea580c" />
                Pratinjau Layar HP (Realtime)
              </h2>

              <div className={styles.mockupPhone}>
                <div className={styles.mockupHeader}>
                  <span>14:00</span>
                  <span>📶 100% 🔋</span>
                </div>

                <div className={styles.mockupBubble}>
                  <div className={styles.mockupTop}>
                    <div className={styles.mockupAppBadge}>
                      <img src={formData.icon || '/media/logos/logo_pik-r.png'} alt="" className={styles.mockupAppIcon} />
                      <span>PIK-R MANSEKU • {formData.category}</span>
                    </div>
                    <div className={styles.mockupTime}>baru saja</div>
                  </div>

                  <div className={styles.mockupContentRow}>
                    <div className={styles.mockupMainText}>
                      <div className={styles.mockupTitle}>
                        {formData.title || 'Judul Notifikasi Pengumuman'}
                      </div>
                      <div className={styles.mockupBody}>
                        {formData.body || 'Pratinjau teks isi notifikasi akan otomatis tampil di sini saat Anda mengetik...'}
                      </div>
                    </div>
                    <img
                      src={formData.icon || '/media/logos/logo_pik-r.png'}
                      alt=""
                      className={styles.mockupThumb}
                    />
                  </div>

                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Banner Preview"
                      className={styles.mockupBigPicture}
                    />
                  )}

                  {formData.actions.length > 0 && (
                    <div className={styles.mockupActions}>
                      {formData.actions.map((act, i) => (
                        <div key={i} className={styles.mockupActionBtn}>
                          {act.title || `Tombol ${i + 1}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATUR JADWAL PERTEMUAN */}
      {activeTab === 'pertemuan' && (
        <div className={styles.cardSection}>
          <div className={styles.pertemuanHeader}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              <Calendar size={18} color="#ea580c" />
              Kelola Jadwal Pertemuan (/push/pertemuan)
            </h2>
            <div className={styles.pertemuanActions}>
              <a
                href="/push/pertemuan"
                target="_blank"
                rel="noreferrer"
                className={styles.testBtn}
              >
                <ExternalLink size={14} /> Lihat Halaman Publik
              </a>
              <button
                type="button"
                className={styles.sendBroadcastBtn}
                onClick={handlePrefillBroadcastFromSchedule}
              >
                <Send size={14} /> Buat Siaran Pengingat
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveSchedule}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Judul Pertemuan / Agenda *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={scheduleData.title}
                  onChange={(e) => setScheduleData({ ...scheduleData, title: e.target.value })}
                  placeholder="Contoh: Pertemuan Rutin Mingguan PIK-R MANSEKU"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Waktu Pertemuan (Tanggal & Jam) *</label>
                <input
                  type="datetime-local"
                  className={styles.formInput}
                  value={scheduleData.datetime ? scheduleData.datetime.slice(0, 16) : ''}
                  onChange={(e) => setScheduleData({ ...scheduleData, datetime: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Lokasi / Tempat Pertemuan *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={scheduleData.location}
                  onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                  placeholder="Contoh: Ruang Sekretariat PIK-R MANSEKU"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dresscode / Pakaian</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={scheduleData.dresscode}
                  onChange={(e) => setScheduleData({ ...scheduleData, dresscode: e.target.value })}
                  placeholder="Contoh: Seragam PDH PIK-R / Rapih"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Agenda Utama</label>
              <textarea
                className={styles.formTextarea}
                value={scheduleData.agenda}
                onChange={(e) => setScheduleData({ ...scheduleData, agenda: e.target.value })}
                placeholder="Rincian poin-poin agenda pembahasan pertemuan..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Catatan Penting Pengurus</label>
              <textarea
                className={styles.formTextarea}
                value={scheduleData.notes}
                onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                placeholder="Catatan seperti membawa barang tertentu, penugasan, dll..."
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="submit" className={styles.sendBroadcastBtn}>
                <CheckCircle2 size={16} /> Simpan Perubahan Jadwal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: RIWAYAT SIARAN */}
      {activeTab === 'history' && (
        <div className={styles.cardSection}>
          <h2 className={styles.sectionTitle}>
            <History size={18} color="#ea580c" />
            Riwayat Notifikasi yang Pernah Disiarkan
          </h2>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8a7a6b' }}>
              Belum ada riwayat pengiriman notifikasi massal.
            </div>
          ) : (
            <div className={styles.historyTableWrapper}>
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Kode (#)</th>
                    <th>Judul & Pesan</th>
                    <th>Target Tautan</th>
                    <th>Terkirim</th>
                    <th>Pengirim</th>
                    <th>Waktu</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: '#ea580c', fontFamily: 'monospace' }}>
                          #{h.code || h.id.slice(0, 8)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{h.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#635347', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {h.body}
                        </div>
                      </td>
                      <td>
                        <a
                          href={h.url || `/push/${h.code || h.id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#ea580c', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        >
                          <span>{h.url || `/push/${h.code}`}</span>
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>{h.sentCount}</span>
                        {h.failCount > 0 && <span style={{ color: '#dc2626', marginLeft: 4 }}>({h.failCount} gagal)</span>}
                      </td>
                      <td>{h.sentBy || 'Admin'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#8a7a6b' }}>
                        {new Date(h.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteHistory(h.id)}
                          title="Hapus riwayat"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Helper untuk mengonversi Base64 string ke Uint8Array (VAPID Key)
 */
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

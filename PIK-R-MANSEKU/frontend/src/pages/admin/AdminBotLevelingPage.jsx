import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Users, Zap, Bell, TrendingUp, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import toast from 'react-hot-toast';
import { getBotLeveling, saveBotLeveling } from '@/api/admin';
import styles from './AdminBotLevelingPage.module.css';

const DEFAULT_CONFIG = {
  enabled: true,
  trackedGroups: [],
  levelUpDm: true,
  levelUpMessage: '🎉 Selamat *{name}*, kamu naik ke *Level {level}* di grup ini! Terus aktif ya! 💪',
  xpPerMessage: 1,
  levels: [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]
};

export default function AdminBotLevelingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [original, setOriginal] = useState(DEFAULT_CONFIG);

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await getBotLeveling();
      const cfg = res.data.config || DEFAULT_CONFIG;
      setConfig(cfg);
      setOriginal(cfg);
      setGroups(res.data.groups || []);
    } catch (err) {
      toast.error('Gagal memuat pengaturan: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveBotLeveling(config);
      setOriginal(config);
      toast.success('Pengaturan leveling berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setConfig(original);
    toast('Perubahan dibatalkan.', { icon: '↩️' });
  }

  function toggleGroup(jid) {
    setConfig(prev => ({
      ...prev,
      trackedGroups: prev.trackedGroups.includes(jid)
        ? prev.trackedGroups.filter(g => g !== jid)
        : [...prev.trackedGroups, jid]
    }));
  }

  function updateLevel(index, raw) {
    const val = parseInt(raw, 10);
    if (isNaN(val) || val < 0) return;
    setConfig(prev => {
      const lv = [...prev.levels];
      lv[index] = val;
      return { ...prev, levels: lv };
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <AdminHeader title="Pengaturan Leveling Bot WA" subtitle="Kelola sistem XP & level anggota" />
        <div className={styles.spinnerWrap}><Loader2 size={30} className={styles.spin} /></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Pengaturan Leveling Bot WA"
        subtitle="Kelola sistem XP, level, dan notifikasi naik level anggota grup"
      />

      <div className={styles.body}>
        <Link to="/admin/settings/bot" className={styles.back}>
          <ArrowLeft size={16} /> Kembali ke Pengaturan Bot
        </Link>

        {/* ── Aktifkan Leveling ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><TrendingUp size={18} /></div>
            <div>
              <h2 className={styles.cardTitle}>Sistem Leveling</h2>
              <p className={styles.cardSubtitle}>Aktifkan pelacakan XP & level berdasarkan aktivitas chat grup</p>
            </div>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${config.enabled ? styles.toggleOn : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            aria-pressed={config.enabled}
          >
            {config.enabled
              ? <><ToggleRight size={22} /> <span>Aktif — leveling berjalan</span></>
              : <><ToggleLeft size={22} /> <span>Nonaktif — XP tidak dihitung</span></>}
          </button>
        </section>

        {/* ── XP per Pesan ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Zap size={18} /></div>
            <div>
              <h2 className={styles.cardTitle}>XP per Pesan</h2>
              <p className={styles.cardSubtitle}>Jumlah XP yang didapat anggota setiap mengirim pesan di grup yang dilacak</p>
            </div>
          </div>
          <div className={styles.xpRow}>
            <input
              type="number"
              min="1"
              max="100"
              value={config.xpPerMessage}
              onChange={e => setConfig(prev => ({ ...prev, xpPerMessage: parseInt(e.target.value, 10) || 1 }))}
              className={`form-input ${styles.xpInput}`}
            />
            <span className={styles.xpLabel}>XP per pesan</span>
          </div>
        </section>

        {/* ── Grup yang Dilacak ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Users size={18} /></div>
            <div>
              <h2 className={styles.cardTitle}>Grup yang Dilacak</h2>
              <p className={styles.cardSubtitle}>
                Pilih grup WA yang XP-nya dihitung. Jika tidak ada yang dipilih, semua grup aktif akan dilacak.
              </p>
            </div>
          </div>
          {groups.length === 0 ? (
            <p className={styles.empty}>
              Belum ada grup WA yang terdaftar di sistem. Bot perlu bergabung dan mengirim pesan terlebih dahulu agar grup muncul di sini.
            </p>
          ) : (
            <div className={styles.groupList}>
              {groups.map(g => (
                <label key={g.jid} className={styles.groupItem}>
                  <input
                    type="checkbox"
                    checked={config.trackedGroups.includes(g.jid)}
                    onChange={() => toggleGroup(g.jid)}
                    className={styles.checkbox}
                  />
                  <div className={styles.groupInfo}>
                    <span className={styles.groupName}>{g.name || g.jid}</span>
                    <span className={styles.groupMeta}>{g.jid}{g.memberCount ? ` · ${g.memberCount} anggota` : ''}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
          {config.trackedGroups.length === 0 && groups.length > 0 && (
            <p className={styles.hint}>⚠️ Tidak ada grup dipilih — semua grup aktif akan dilacak.</p>
          )}
        </section>

        {/* ── Notifikasi Naik Level ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Bell size={18} /></div>
            <div>
              <h2 className={styles.cardTitle}>Notifikasi Naik Level</h2>
              <p className={styles.cardSubtitle}>Kirim DM ke anggota saat mereka naik level</p>
            </div>
          </div>

          <button
            type="button"
            className={`${styles.toggle} ${config.levelUpDm ? styles.toggleOn : ''}`}
            onClick={() => setConfig(prev => ({ ...prev, levelUpDm: !prev.levelUpDm }))}
            aria-pressed={config.levelUpDm}
          >
            {config.levelUpDm
              ? <><ToggleRight size={22} /> <span>Kirim DM saat naik level</span></>
              : <><ToggleLeft size={22} /> <span>Notifikasi DM dimatikan</span></>}
          </button>

          <div className="form-group">
            <label className="form-label" htmlFor="lvlmsg">Pesan Selamat Naik Level</label>
            <textarea
              id="lvlmsg"
              className="form-input"
              rows={4}
              value={config.levelUpMessage}
              onChange={e => setConfig(prev => ({ ...prev, levelUpMessage: e.target.value }))}
              placeholder="🎉 Selamat {name}, kamu naik ke Level {level}!"
              disabled={!config.levelUpDm}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
            <p className={styles.hint}>
              Variabel yang didukung:{' '}
              <code className={styles.code}>{'{name}'}</code> — nama anggota,{' '}
              <code className={styles.code}>{'{level}'}</code> — level baru.{' '}
              Gunakan <code className={styles.code}>*teks*</code> untuk <b>tebal</b> di WhatsApp.
            </p>
          </div>
        </section>

        {/* ── Ambang Batas Level ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #dbeafe, #93c5fd33)', color: '#2563eb' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Ambang Batas Level (XP)</h2>
              <p className={styles.cardSubtitle}>
                XP minimum untuk setiap level (Lv. 0 — Lv. {config.levels.length - 1}). Level 0 selalu 0 XP.
              </p>
            </div>
          </div>
          <div className={styles.levelsGrid}>
            {config.levels.map((xp, i) => (
              <div key={i} className={styles.levelRow}>
                <span className={styles.levelLabel}>Lv. {i}</span>
                <input
                  type="number"
                  min="0"
                  value={xp}
                  onChange={e => updateLevel(i, e.target.value)}
                  disabled={i === 0}
                  className={`form-input ${styles.levelInput}`}
                />
                <span className={styles.xpSuffix}>XP</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tombol Aksi ── */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="btn btn-secondary"
          >
            <RotateCcw size={15} /> Reset Perubahan
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? <><Loader2 size={15} className={styles.spin} /> Menyimpan…</> : <><Save size={15} /> Simpan Pengaturan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

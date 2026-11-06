import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Power, RotateCw, LogOut, QrCode, KeyRound, Send, Camera, Save, Terminal, Trash2,
  BadgeCheck, Smartphone, Loader2, Copy, ShieldAlert, Pause, Play, MessageCircle
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { useUIStore } from '@/stores/uiStore';
import {
  getWaStatus, startWaBot, stopWaBot, restartWaBot, logoutWaBot, updateWaProfile, updateWaPhoto, sendWaTest, waStreamUrl
} from '@/api/admin';
import styles from './AdminBotPage.module.css';

const STATUS = {
  open: { label: 'Terhubung', tone: 'ok' },
  starting: { label: 'Menyalakan…', tone: 'wait' },
  connecting: { label: 'Menyambung…', tone: 'wait' },
  qr: { label: 'Menunggu dipindai', tone: 'wait' },
  pairing: { label: 'Menunggu kode dimasukkan', tone: 'wait' },
  closed: { label: 'Terputus', tone: 'bad' },
  logged_out: { label: 'Tautan diputus', tone: 'bad' },
  off: { label: 'Mati', tone: 'off' },
  locked: { label: 'Dikunci mati (.env)', tone: 'off' }
};
const errMsg = (err, fb) => err?.response?.data?.message || fb;
const fmtUptime = (s) => {
  if (!s) return '-';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${d} hari ${h} jam` : h ? `${h} jam ${m} menit` : `${m} menit`;
};
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

export default function AdminBotPage() {
  const openConfirm = useUIStore((s) => s.openConfirm);
  const [st, setSt] = useState(null);
  const [logs, setLogs] = useState([]);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState('');
  const [method, setMethod] = useState('qr'); // qr | code
  const [pairPhone, setPairPhone] = useState('');
  const [profile, setProfile] = useState({ name: '', about: '' });
  const [testTo, setTestTo] = useState('');
  const [follow, setFollow] = useState(true);
  const [filter, setFilter] = useState('all');
  const termRef = useRef(null);
  const lastId = useRef(0);
  const fileRef = useRef(null);

  // ── Status + log langsung (SSE). Bila putus, EventSource menyambung sendiri. ──
  useEffect(() => {
    let es;
    let closed = false;
    const open = () => {
      es = new EventSource(waStreamUrl(lastId.current));
      es.addEventListener('open', () => setLive(true));
      es.addEventListener('status', (e) => setSt(JSON.parse(e.data)));
      es.addEventListener('log', (e) => {
        const l = JSON.parse(e.data);
        if (l.id <= lastId.current) return;
        lastId.current = l.id;
        setLogs((prev) => (prev.length > 500 ? [...prev.slice(-400), l] : [...prev, l]));
      });
      es.onerror = () => {
        setLive(false);
        // 401 (token kedaluwarsa) tidak perlu dicoba terus: muat status lewat API biasa
        if (es.readyState === EventSource.CLOSED && !closed) setTimeout(open, 3000);
      };
    };
    open();
    getWaStatus().then((r) => setSt((cur) => cur || r.data)).catch(() => {});
    return () => { closed = true; es?.close(); };
  }, []);

  // Isi formulir profil dari data bot saat pertama terhubung
  const meKey = st?.me?.id;
  useEffect(() => {
    if (st?.me) setProfile({ name: st.me.name || '', about: st.me.about || '' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meKey]);

  useEffect(() => {
    if (follow && termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [logs, follow]);

  const run = useCallback(async (key, fn, okText) => {
    setBusy(key);
    try {
      const r = await fn();
      if (r?.data && 'status' in r.data) setSt(r.data);
      if (okText) toast.success(okText);
    } catch (err) {
      toast.error(errMsg(err, 'Gagal, coba lagi.'));
    } finally {
      setBusy('');
    }
  }, []);

  const status = st?.status || 'off';
  const meta = STATUS[status] || STATUS.off;
  const isOn = !['off', 'locked', 'logged_out', 'closed'].includes(status);
  const connected = status === 'open';
  const needLink = !connected && ['qr', 'pairing', 'logged_out'].includes(status);

  const togglePower = () => {
    if (isOn) {
      openConfirm({
        title: 'Matikan bot WhatsApp?',
        message: 'Bot berhenti membalas perintah dan tidak mengirim notifikasi. Sesi tetap tersimpan, jadi menyalakan lagi tidak perlu scan ulang.',
        danger: true,
        onConfirm: () => run('power', stopWaBot, 'Bot dimatikan')
      });
    } else {
      run('power', () => startWaBot(), 'Bot dinyalakan');
    }
  };
  const requestCode = (e) => {
    e.preventDefault();
    const phone = pairPhone.replace(/\D/g, '');
    if (phone.length < 10) { toast.error('Isi nomor WhatsApp bot, mis. 0812xxxx atau 62812xxxx'); return; }
    run('pair', () => startWaBot(phone));
  };
  const doLogout = () => openConfirm({
    title: 'Putuskan tautan bot?',
    message: 'Bot keluar dari WhatsApp dan sesi dihapus. Untuk menyambung lagi harus scan QR atau memasukkan kode dari HP bot.',
    danger: true,
    onConfirm: () => run('logout', logoutWaBot, 'Tautan bot diputus')
  });
  const saveProfile = (e) => {
    e.preventDefault();
    run('profile', () => updateWaProfile(profile), 'Profil bot disimpan');
  };
  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Maksimal 5 MB'); return; }
    run('photo', () => updateWaPhoto(file), 'Foto profil bot diganti');
  };
  const sendTest = (e) => {
    e.preventDefault();
    run('test', () => sendWaTest(testTo), 'Pesan uji terkirim, cek WhatsApp tujuan');
  };

  const shownLogs = useMemo(() => (filter === 'all' ? logs : logs.filter((l) => (filter === 'error' ? l.level === 'error' || l.level === 'warn' : l.level === filter))), [logs, filter]);
  const copyLogs = () => {
    navigator.clipboard.writeText(shownLogs.map((l) => `[${fmtTime(l.at)}] ${l.level.toUpperCase()} ${l.msg}`).join('\n'))
      .then(() => toast.success('Log disalin'), () => toast.error('Gagal menyalin'));
  };

  return (
    <div className={styles.page}>
      <AdminHeader title="Atur Bot WhatsApp" subtitle="Koneksi, profil, dan terminal debug bot PIK-R MANSEKU" />

      <div className={styles.body}>
        <Link to="/admin/settings" className={styles.back}><ArrowLeft size={16} /> Pengaturan</Link>

        {/* ── Status + tombol nyala/mati ── */}
        <section className={`${styles.card} ${styles.statusCard} ${styles['tone_' + meta.tone]}`}>
          <div className={styles.statusMain}>
            <span className={styles.dot} aria-hidden="true" />
            <div>
              <div className={styles.statusLabel}>{meta.label}</div>
              <div className={styles.statusSub}>
                {connected ? `Aktif ${fmtUptime(st?.uptimeSec)} · ${st?.sent || 0} pesan terkirim · ${st?.received || 0} pesan masuk sejak server menyala`
                  : status === 'locked' ? 'DISABLE_WHATSAPP=1 di .env server ini. Hapus baris itu lalu reload backend untuk mengizinkan bot.'
                  : status === 'off' ? 'Bot tidak membalas perintah dan tidak mengirim notifikasi.'
                  : st?.lastError || 'Menunggu WhatsApp…'}
              </div>
            </div>
          </div>
          <div className={styles.statusActions}>
            {connected && (
              <button type="button" className="btn btn-secondary" disabled={!!busy} onClick={() => run('restart', restartWaBot, 'Bot dimulai ulang')}>
                {busy === 'restart' ? <Loader2 size={15} className={styles.spin} /> : <RotateCw size={15} />} Mulai ulang
              </button>
            )}
            <button type="button" role="switch" aria-checked={isOn} disabled={status === 'locked' || !!busy}
              className={`${styles.power} ${isOn ? styles.powerOn : ''}`} onClick={togglePower}>
              {busy === 'power' ? <Loader2 size={18} className={styles.spin} /> : <Power size={18} />}
              {isOn ? 'Aktif' : 'Nyalakan Bot'}
              <span className={styles.powerKnob} aria-hidden="true" />
            </button>
          </div>
        </section>

        <div className={styles.grid}>
          {/* ── Hubungkan (QR / kode) atau Profil Bot ── */}
          {!connected ? (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}><Smartphone size={18} /> Hubungkan ke WhatsApp</h2>
              {!isOn && status !== 'logged_out' ? (
                <p className={styles.muted}>Nyalakan bot dulu. Jika sesi lama masih tersimpan, bot langsung terhubung tanpa scan.</p>
              ) : (
                <>
                  <div className={styles.seg} role="tablist">
                    <button type="button" role="tab" aria-selected={method === 'qr'} className={method === 'qr' ? styles.segOn : ''} onClick={() => setMethod('qr')}><QrCode size={15} /> Scan QR</button>
                    <button type="button" role="tab" aria-selected={method === 'code'} className={method === 'code' ? styles.segOn : ''} onClick={() => setMethod('code')}><KeyRound size={15} /> Pakai Kode</button>
                  </div>
                  {method === 'qr' ? (
                    <div className={styles.qrWrap}>
                      {st?.qrSvg ? (
                        <div className={styles.qr} dangerouslySetInnerHTML={{ __html: st.qrSvg }} aria-label="QR untuk menautkan bot" />
                      ) : (
                        <div className={`${styles.qr} ${styles.qrWait}`}>
                          {status === 'logged_out'
                            ? <button type="button" className="btn btn-primary" onClick={() => run('power', () => startWaBot())}><QrCode size={15} /> Tampilkan QR</button>
                            : <><Loader2 size={26} className={styles.spin} /><span>Menyiapkan QR…</span></>}
                        </div>
                      )}
                      <ol className={styles.steps}>
                        <li>Buka WhatsApp di HP bot</li>
                        <li>Ketuk <b>⋮</b> / <b>Setelan</b> → <b>Perangkat tertaut</b></li>
                        <li>Ketuk <b>Tautkan perangkat</b>, lalu arahkan kamera ke QR ini</li>
                        <li>QR berganti otomatis tiap ±20 detik</li>
                      </ol>
                    </div>
                  ) : (
                    <div className={styles.codeWrap}>
                      {st?.pairingCode ? (
                        <>
                          <div className={styles.pairCode} aria-label="Kode pairing">{st.pairingCode}</div>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(st.pairingCode.replace(/-/g, '')).then(() => toast.success('Kode disalin'))}><Copy size={14} /> Salin kode</button>
                          <ol className={styles.steps}>
                            <li>Di HP bot: <b>Perangkat tertaut</b> → <b>Tautkan perangkat</b></li>
                            <li>Ketuk <b>Tautkan dengan nomor telepon saja</b></li>
                            <li>Masukkan kode di atas</li>
                          </ol>
                        </>
                      ) : (
                        <form onSubmit={requestCode} className={styles.pairForm}>
                          <label className="form-label" htmlFor="pair-phone">Nomor WhatsApp bot</label>
                          <div className={styles.inline}>
                            <input id="pair-phone" className="form-input" inputMode="tel" placeholder="mis. 0812 3456 7890" value={pairPhone} onChange={(e) => setPairPhone(e.target.value)} />
                            <button type="submit" className="btn btn-primary" disabled={!!busy}>{busy === 'pair' ? <Loader2 size={15} className={styles.spin} /> : <KeyRound size={15} />} Minta Kode</button>
                          </div>
                          <p className={styles.muted}>Kode 8 huruf muncul di sini. Cocok bila QR sulit dipindai (mis. layar laptop jauh dari HP).</p>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          ) : (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}><MessageCircle size={18} /> Profil Bot</h2>
              <div className={styles.profileHead}>
                <button type="button" className={styles.avatar} onClick={() => fileRef.current?.click()} disabled={!!busy} title="Ganti foto profil">
                  {st?.me?.picture ? <img src={st.me.picture} alt="Foto profil bot" referrerPolicy="no-referrer" /> : <span>{(st?.me?.name || 'B').slice(0, 1)}</span>}
                  <i>{busy === 'photo' ? <Loader2 size={14} className={styles.spin} /> : <Camera size={14} />}</i>
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPhoto} />
                <div className={styles.profileMeta}>
                  <div className={styles.profileName}>
                    {st?.me?.verifiedName || st?.me?.name || 'Bot'}
                    {st?.me?.verifiedName && <BadgeCheck size={18} className={styles.verified} aria-label="Terverifikasi" />}
                  </div>
                  <div className={styles.profilePhone}>+{st?.me?.phone}</div>
                  {st?.me?.business?.category && <div className={styles.muted}>{st.me.business.category}</div>}
                </div>
              </div>
              <form onSubmit={saveProfile} className={styles.form}>
                <div className="form-group">
                  <label className="form-label" htmlFor="bot-name">Nama Bot</label>
                  <input id="bot-name" className="form-input" maxLength={25} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  {st?.me?.verifiedName && <small className={styles.muted}>Akun terverifikasi: nama yang tampil ke orang lain adalah nama bisnis terverifikasi ({st.me.verifiedName}); mengubahnya harus lewat Meta.</small>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="bot-about">Info (About)</label>
                  <input id="bot-about" className="form-input" maxLength={139} value={profile.about} onChange={(e) => setProfile({ ...profile, about: e.target.value })} placeholder="mis. Bot resmi PIK-R MANSEKU · ketik /menu" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor Telepon Bot</label>
                  <div className={styles.readonly}>+{st?.me?.phone}</div>
                </div>
                <div className={styles.formActions}>
                  <button type="button" className="btn btn-ghost text-danger" onClick={doLogout} disabled={!!busy}><LogOut size={15} /> Putuskan Tautan</button>
                  <button type="submit" className="btn btn-primary" disabled={!!busy}>{busy === 'profile' ? <Loader2 size={15} className={styles.spin} /> : <Save size={15} />} Simpan Profil</button>
                </div>
              </form>
            </section>
          )}

          {/* ── Uji kirim + perintah bot ── */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}><Send size={18} /> Uji Kirim</h2>
            <form onSubmit={sendTest} className={styles.inline}>
              <input className="form-input" inputMode="tel" placeholder="Nomor tujuan, mis. 0812…" value={testTo} onChange={(e) => setTestTo(e.target.value)} disabled={!connected} />
              <button type="submit" className="btn btn-primary" disabled={!connected || !!busy || testTo.replace(/\D/g, '').length < 9}>
                {busy === 'test' ? <Loader2 size={15} className={styles.spin} /> : <Send size={15} />} Kirim
              </button>
            </form>
            <p className={styles.muted}>Mengirim kartu contoh bergambar ke nomor tujuan untuk memastikan bot benar-benar bisa mengirim.</p>
            <h3 className={styles.subTitle}>Perintah yang dikenali bot</h3>
            <ul className={styles.cmds}>
              <li><code>/menu</code> daftar perintah (kartu)</li>
              <li><code>/cek nama atau NISN</code> hasil seleksi (kartu)</li>
              <li><code>/absen</code> kehadiran pribadi 90 hari (kartu, japri)</li>
              <li><code>/rekap</code> tabel kehadiran hari ini (pengurus inti)</li>
              <li><code>/sandi</code>, <code>/sandi ganti</code> sandi akun & OTP (japri)</li>
              <li><code>!id</code> ID grup untuk pengumuman terjadwal</li>
            </ul>
            <div className={styles.note}>
              <ShieldAlert size={16} />
              <span>Kartu dan tabel dikirim sebagai <b>gambar</b>, bukan pesan tombol. Pesan tombol/list hanya resmi lewat WhatsApp Business Platform (Cloud API); lewat WhatsApp Web sering tidak tampil di HP penerima, dan pustaka modifikasi yang memaksakannya (mis. ourin-baileys) sudah ditandai malware.</span>
            </div>
          </section>
        </div>

        {/* ── Terminal debug ── */}
        <section className={`${styles.card} ${styles.termCard}`}>
          <div className={styles.termHead}>
            <h2 className={styles.cardTitle}><Terminal size={18} /> Terminal Debug</h2>
            <span className={`${styles.livePill} ${live ? styles.liveOn : ''}`}>{live ? 'LANGSUNG' : 'TERPUTUS'}</span>
            <div className={styles.termTools}>
              <select className={styles.termSelect} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Saring log">
                <option value="all">Semua</option>
                <option value="info">Info</option>
                <option value="error">Peringatan & galat</option>
              </select>
              <button type="button" className={styles.termBtn} onClick={() => setFollow((f) => !f)} title={follow ? 'Jeda gulir otomatis' : 'Ikuti log terbaru'}>{follow ? <Pause size={14} /> : <Play size={14} />}</button>
              <button type="button" className={styles.termBtn} onClick={copyLogs} title="Salin log"><Copy size={14} /></button>
              <button type="button" className={styles.termBtn} onClick={() => setLogs([])} title="Bersihkan layar"><Trash2 size={14} /></button>
            </div>
          </div>
          <div className={styles.term} ref={termRef} onScroll={(e) => {
            const el = e.currentTarget;
            const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
            if (atBottom !== follow) setFollow(atBottom);
          }}>
            {shownLogs.length === 0 && <div className={styles.termEmpty}>Belum ada log. Nyalakan bot untuk melihat prosesnya di sini.</div>}
            {shownLogs.map((l) => (
              <div key={l.id} className={`${styles.line} ${styles['lv_' + l.level]}`}>
                <span className={styles.time}>{fmtTime(l.at)}</span>
                <span className={styles.lvl}>{l.level === 'error' ? 'ERR' : l.level === 'warn' ? 'WRN' : 'INF'}</span>
                <span className={styles.msg}>{l.msg}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

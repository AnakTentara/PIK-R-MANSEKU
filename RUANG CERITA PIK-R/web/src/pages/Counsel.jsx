import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HeartHandshake, Phone, ShieldCheck, ChevronLeft, Send, Loader2, AlertTriangle, CheckCircle2, UserCheck, EyeOff, Star, MessageCircle, Info, Sparkles, ArrowRight, Wind, FileText, Clock, X } from 'lucide-react';
import { rc, errMsg } from '@/lib/api.js';
import { ago, clock } from '@/lib/format.js';
import { useLive, refreshBadges } from '@/lib/live.js';
import { Avatar, Spinner, Empty, Sheet } from '@/components/ui.jsx';
import BreathingModal from '@/components/BreathingModal.jsx';
import styles from './Counsel.module.css';

/**
 * Bilik Konseling — BUKAN chat biasa.
 * Siswa membuka sesi (boleh anonim) → antrean → konselor sebaya bertugas mengambil → percakapan berdua.
 * Desain sengaja tenang: tanpa angka suka/pengikut, warna lembut, nomor bantuan resmi selalu terlihat.
 */
export default function Counsel() {
  const { id } = useParams();
  return id ? <Session id={id} /> : <Lobby />;
}

function Helplines({ items, compact = false }) {
  return (
    <div className={`${styles.help} ${compact ? styles.helpCompact : ''}`}>
      <b><Phone size={15} /> Butuh bantuan sekarang?</b>
      {items.map((h) => (
        <a key={h.name} href={h.wa ? `https://wa.me/${h.wa}` : `tel:${h.tel}`} className={styles.helpRow}>
          <span>{h.name}</span><small>{h.detail}</small>
        </a>
      ))}
      <small className={styles.helpFoot}>Atau temui langsung guru BK / pembina PIK-R di sekolah.</small>
    </div>
  );
}

function Lobby() {
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [busy, setBusy] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  const load = useCallback(() => rc.counsel().then((r) => setD(r.data)).catch((err) => toast.error(errMsg(err))), []);
  useEffect(() => { load(); }, [load]);
  useLive('counsel', useCallback(() => load(), [load]));

  const open = d?.mine?.find((s) => s.status !== 'CLOSED');
  const start = async (e) => {
    e.preventDefault();
    if (!topic) { toast.error('Pilih topik dulu, ya'); return; }
    setBusy(true);
    try {
      const r = await rc.openCounsel({ topic, text, anonymous });
      if (r.data.helplines) toast('Kamu tidak sendirian. Nomor bantuan ada di halaman sesi.', { icon: '🧡', duration: 6000 });
      navigate(`/konseling/${r.data.session.id}`);
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const claim = async (s) => {
    try { await rc.counselClaim(s.id); refreshBadges(); navigate(`/konseling/${s.id}`); } catch (err) { toast.error(errMsg(err)); load(); }
  };

  if (!d) return <Spinner />;
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.heroIcon}><HeartHandshake size={30} /></span>
        <h1>Bilik Konseling Sebaya</h1>
        <p>Ruang aman untuk bercerita tentang pertemanan, keluarga, sekolah, atau perasaanmu. Didengarkan tanpa dihakimi.</p>
        <button type="button" className={styles.how} onClick={() => setHowOpen(true)}><Info size={14} /> Bagaimana privasiku dijaga?</button>
      </section>

      {/* Sahabat AI PIK-R 24/7 Card */}
      <div className={styles.aiCard}>
        <div className={styles.aiCardLeft}>
          <div className={styles.aiCardIcon}>
            <Sparkles size={24} />
          </div>
          <div>
            <div className={styles.aiCardTitleRow}>
              <h3>Sahabat AI PIK-R</h3>
              <span className={styles.aiBadge}>Online 24/7</span>
            </div>
            <p>Butuh teman curhat sekarang juga? Ngobrol bebas tanpa antre bersama konselor virtual sebaya.</p>
          </div>
        </div>
        <Link to="/konseling/ai" className={styles.aiCardBtn}>
          <span>Mulai Chat AI</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {d.isCounselor && (
        <section className={styles.block}>
          <h2><UserCheck size={18} /> Ruang konselor</h2>
          {d.handling.length > 0 && <h3 className={styles.sub}>Sedang kamu tangani</h3>}
          {d.handling.map((s) => <SessionRow key={s.id} s={s} onClick={() => navigate(`/konseling/${s.id}`)} />)}
          <h3 className={styles.sub}>Antrean ({d.queue.length})</h3>
          {d.queue.length === 0 ? <p className={styles.muted}>Tidak ada yang menunggu. Terima kasih sudah bertugas 🧡</p>
            : d.queue.map((s) => (
              <div key={s.id} className={`${styles.queueRow} ${s.urgent ? styles.urgentRow : ''}`}>
                <span className={styles.queueAv}>{s.urgent ? <AlertTriangle size={18} /> : <EyeOff size={18} />}</span>
                <span className={styles.queueText}><b>{s.student.alias}</b><small>{s.topicLabel} · menunggu {ago(s.createdAt)}{s.urgent ? ' · MENDESAK' : ''}</small></span>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => claim(s)}>Ambil</button>
              </div>
            ))}
        </section>
      )}

      {open ? (
        <section className={styles.block}>
          <h2>Sesimu yang sedang berjalan</h2>
          <SessionRow s={open} onClick={() => navigate(`/konseling/${open.id}`)} />
        </section>
      ) : (
        <form className={styles.block} onSubmit={start}>
          <h2>Mulai bercerita</h2>
          <div className={styles.topics} role="radiogroup" aria-label="Topik">
            {Object.entries(d.topics).map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={topic === k} className={topic === k ? styles.topicOn : ''} onClick={() => setTopic(k)}>{label}</button>
            ))}
          </div>
          <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
            placeholder="Ceritakan sedikit apa yang ingin kamu bicarakan. Tidak apa-apa kalau belum rapi." />
          <label className={styles.anon}>
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            <span><b>Anonim untuk konselor</b><small>Konselor hanya melihat nama samaran, bukan nama dan fotomu.</small></span>
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || text.trim().length < 3}>{busy ? <Loader2 size={18} className="spin" /> : 'Kirim ke konselor'}</button>
        </form>
      )}

      <section className={styles.block}>
        <h2>Konselor bertugas hari ini</h2>
        {d.onDuty.length === 0 ? <p className={styles.muted}>Belum ada konselor yang bertugas hari ini. Ceritamu tetap masuk antrean dan dibalas secepatnya.</p> : (
          <div className={styles.duty}>
            {d.onDuty.map((c) => <div key={c.username}><Avatar user={c} size={48} /><b>{c.name.split(' ')[0]}</b>{c.bio && <small>{c.bio}</small>}</div>)}
          </div>
        )}
      </section>

      {d.mine.filter((s) => s.status === 'CLOSED').length > 0 && (
        <section className={styles.block}>
          <h2>Riwayat sesimu</h2>
          {d.mine.filter((s) => s.status === 'CLOSED').map((s) => <SessionRow key={s.id} s={s} onClick={() => navigate(`/konseling/${s.id}`)} />)}
        </section>
      )}

      <Helplines items={d.helplines} />

      <Sheet open={howOpen} onClose={() => setHowOpen(false)} title="Privasi di Bilik Konseling" size="sm">
        <ul className={styles.privacy}>
          <li><ShieldCheck size={18} /> Hanya kamu dan konselor yang mengambil sesimu yang bisa membaca percakapan.</li>
          <li><EyeOff size={18} /> Bila anonim, konselor hanya melihat nama samaran seperti "Senja Teduh #482".</li>
          <li><MessageCircle size={18} /> Isi percakapan dienkripsi saat disimpan di server.</li>
          <li><AlertTriangle size={18} /> Jujur saja: bila ada tanda kamu dalam bahaya (misalnya ingin menyakiti diri atau mengalami kekerasan), konselor bisa meminta pendampingan pembina / guru BK. Hanya dalam keadaan itu pembina dapat melihat siapa kamu, supaya kamu bisa ditolong.</li>
        </ul>
      </Sheet>
    </div>
  );
}

function SessionRow({ s, onClick }) {
  return (
    <button type="button" className={`${styles.sessionRow} ${s.urgent && s.status !== 'CLOSED' ? styles.urgentRow : ''}`} onClick={onClick}>
      <span className={styles.status} data-s={s.status}>{s.status === 'WAITING' ? 'Menunggu' : s.status === 'ACTIVE' ? 'Berjalan' : 'Selesai'}</span>
      <span className={styles.queueText}>
        <b>{s.role === 'COUNSELOR' ? s.student.alias : s.topicLabel}</b>
        <small>{s.role === 'COUNSELOR' ? s.topicLabel : s.counselor ? `bersama ${s.counselor.name.split(' ')[0]}` : 'menunggu konselor'} · {ago(s.lastAt)}</small>
      </span>
    </button>
  );
}

function Session({ id }) {
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [closing, setClosing] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const scroller = useRef(null);

  const load = useCallback(async () => {
    try { const r = await rc.counselSession(id); setD(r.data); requestAnimationFrame(() => scroller.current?.scrollTo({ top: 1e9 })); } catch (err) { toast.error(errMsg(err)); navigate('/konseling'); }
  }, [id, navigate]);
  useEffect(() => { load(); }, [load]);
  useLive('counsel', useCallback((e) => { if (!e.sessionId || e.sessionId === id) load(); }, [id, load]));

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const r = await rc.counselSend(id, body);
      setD((x) => ({
        ...x,
        items: r.data.aiReply ? [...x.items, r.data.message, r.data.aiReply] : [...x.items, r.data.message]
      }));
      setText('');
      if (r.data.helplines) toast('Kamu tidak sendirian 🧡 Nomor bantuan ada di atas.', { duration: 6000 });
      requestAnimationFrame(() => scroller.current?.scrollTo({ top: 1e9, behavior: 'smooth' }));
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const close = async () => {
    try { await rc.counselClose(id, rating || undefined); setClosing(false); load(); toast.success('Sesi diselesaikan'); } catch (err) { toast.error(errMsg(err)); }
  };

  const escalate = async () => {
    if (!window.confirm('Minta pendampingan pembina / guru BK untuk sesi ini? Gunakan bila siswa mungkin dalam bahaya atau masalahnya di luar kemampuan konselor sebaya.')) return;
    try { await rc.counselEscalate(id); toast.success('Pembina akan diberi tahu lewat dashboard'); load(); } catch (err) { toast.error(errMsg(err)); }
  };

  const toggleAi = async () => {
    try {
      const res = await rc.counselToggleAi(id, !s.aiActive);
      setD((prev) => ({
        ...prev,
        session: { ...prev.session, aiActive: res.data.aiActive },
        items: res.data.message ? [...prev.items, res.data.message] : prev.items
      }));
      toast.success(res.data.aiActive ? 'Sahabat AI diaktifkan' : 'AI dimatikan. Kamu mengambil alih');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await rc.counselSummary(id);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error(errMsg(err, 'Gagal memuat ringkasan'));
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleRequestHuman = async () => {
    if (!window.confirm('Ingin beralih berbicara langsung dengan konselor sebaya?')) return;
    try {
      const res = await rc.counselRequestHuman(id);
      setD((prev) => ({
        ...prev,
        session: { ...prev.session, aiActive: false },
        items: res.data.message ? [...prev.items, res.data.message] : prev.items
      }));
      toast.success('Konselor sebaya telah dipanggil 🤝');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (!d) return <Spinner />;
  const s = d.session;
  const asCounselor = s.role === 'COUNSELOR';

  return (
    <div className={styles.chat}>
      <header className={styles.chatHead}>
        <button type="button" className="icon-btn" onClick={() => navigate('/konseling')} aria-label="Kembali"><ChevronLeft size={26} /></button>
        <span className={styles.chatWho}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <b>{asCounselor ? s.student.alias : s.counselor ? `Konselor ${s.counselor.name.split(' ')[0]}` : 'Konselor Sebaya'}</b>
            {s.status !== 'CLOSED' && (
              s.aiActive ? (
                <span className={`${styles.statusPill} ${styles.statusAi}`}><Sparkles size={11} /> AI</span>
              ) : s.counselor ? (
                <span className={`${styles.statusPill} ${styles.statusHuman}`}><UserCheck size={11} /> Konselor</span>
              ) : (
                <span className={`${styles.statusPill} ${styles.statusWaiting}`}><Clock size={11} /> Antrean</span>
              )
            )}
          </div>
          <small>{s.topicLabel} · {s.status === 'WAITING' ? 'di antrean' : s.status === 'ACTIVE' ? 'sesi berjalan' : 'selesai'}{s.urgent ? ' · prioritas' : ''}</small>
        </span>

        <button type="button" className={styles.breatheBtn} onClick={() => setBreathingOpen(true)} title="Latihan Napas Tenang">
          <Wind size={14} />
          <span>Napas</span>
        </button>

        {asCounselor && s.status !== 'CLOSED' && (
          <>
            <button
              type="button"
              className={styles.summaryBtn}
              onClick={fetchSummary}
              disabled={loadingSummary}
              title="Ringkasan Kilat AI"
            >
              {loadingSummary ? <Loader2 size={13} className="spin" /> : <FileText size={13} />}
              <span>Ringkasan</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${s.aiActive ? styles.aiActiveBtn : styles.aiOffBtn}`}
              onClick={toggleAi}
              title={s.aiActive ? 'Matikan AI untuk mengambil alih sesi' : 'Nyalakan kembali AI'}
            >
              <Sparkles size={13} />
              <span>{s.aiActive ? 'AI Aktif' : 'AI Jeda'}</span>
            </button>
          </>
        )}
        {s.status !== 'CLOSED' && <button type="button" className="btn btn-soft btn-sm" onClick={() => setClosing(true)}>Selesai</button>}
      </header>

      {asCounselor && summary && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryHead}>
            <b><FileText size={14} /> Ringkasan Kasus (AI)</b>
            <button type="button" onClick={() => setSummary(null)} aria-label="Tutup"><X size={15} /></button>
          </div>
          <p>{summary}</p>
        </div>
      )}

      {s.urgent && !asCounselor && <Helplines items={d.helplines} compact />}
      {asCounselor && s.urgent && (
        <div className={styles.counselorAlert}>
          <AlertTriangle size={16} /> Sesi ini ditandai mendesak. Dengarkan dengan tenang, jangan menghakimi, dan
          <button type="button" onClick={escalate}>minta pendampingan pembina</button> bila siswa mungkin dalam bahaya.
        </div>
      )}

      <div className={styles.msgs} ref={scroller}>
        {d.items.map((m) => (
          m.fromRole === 'SYSTEM' ? (
            <div key={m.id} className={styles.sys}>{m.text}</div>
          ) : m.fromRole === 'AI' ? (
            <div key={m.id} className={`${styles.msg} ${styles.aiMsg}`}>
              <div className={styles.aiMsgBadge}>
                <Sparkles size={12} />
                <span>Sahabat AI</span>
              </div>
              <p>{m.text}</p>
              <small>{clock(m.createdAt)}</small>
            </div>
          ) : (
            <div key={m.id} className={`${styles.msg} ${m.mine ? styles.mineMsg : ''}`}>
              <p>{m.text}</p>
              <small>{clock(m.createdAt)}</small>
            </div>
          )
        ))}
      </div>

      {s.status === 'CLOSED' ? (
        <div className={styles.closedCard}>
          <div className={styles.closedIcon}>🌻</div>
          <h3>Terima Kasih Sudah Bercerita</h3>
          <p>
            Membuka diri dan berbagi adalah bentuk keberanian besar. Tetap semangat, kamu sangat berharga dan tidak pernah sendirian.
          </p>
          <Link to="/konseling" className="btn btn-primary btn-sm">Mulai Sesi Baru</Link>
        </div>
      ) : (
        <>
          {!asCounselor && s.aiActive && (
            <div className={styles.requestHumanBar}>
              <span>Sahabat AI mendampingi. Butuh teman konselor?</span>
              <button type="button" className={styles.requestHumanBtn} onClick={handleRequestHuman}>
                <UserCheck size={12} />
                <span>Chat Konselor</span>
              </button>
            </div>
          )}
          <form className={styles.compose} onSubmit={send}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={1}
              maxLength={2000}
              placeholder={asCounselor ? 'Balas dengan empati…' : 'Tulis ceritamu…'}
            />
            <button type="submit" disabled={!text.trim() || busy} aria-label="Kirim">
              {busy ? <Loader2 size={18} className="spin" /> : <Send size={19} />}
            </button>
            {asCounselor && (
              <button type="button" className={styles.escalateBtn} onClick={escalate} title="Minta pendampingan pembina">
                <AlertTriangle size={18} />
              </button>
            )}
          </form>
        </>
      )}

      <Sheet open={closing} onClose={() => setClosing(false)} title="Selesaikan sesi?" size="sm"
        footer={<button type="button" className="btn btn-primary btn-block" onClick={close}>Selesaikan</button>}>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', textAlign: 'center' }}>
          {!asCounselor ? (
            <>
              <p className={styles.muted}>Apakah sesi ini membantumu? (opsional, hanya dilihat pembina sebagai evaluasi)</p>
              <div className={styles.stars}>{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} bintang`}><Star size={30} fill={n <= rating ? 'currentColor' : 'none'} /></button>)}</div>
            </>
          ) : <p className={styles.muted}>Pastikan siswa sudah merasa cukup. Ia bisa membuka sesi baru kapan saja.</p>}
        </div>
      </Sheet>

      <BreathingModal open={breathingOpen} onClose={() => setBreathingOpen(false)} />
    </div>
  );
}

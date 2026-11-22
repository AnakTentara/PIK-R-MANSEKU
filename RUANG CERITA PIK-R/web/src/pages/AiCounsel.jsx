import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles, ChevronLeft, Send, Plus, Trash2,
  Clock, AlertCircle, Phone, Shield, MessageSquare,
  Wind, X, Check, History
} from 'lucide-react';
import { rc, errMsg } from '@/lib/api.js';
import { ago, clock } from '@/lib/format.js';
import { Spinner } from '@/components/ui.jsx';
import BreathingModal from '@/components/BreathingModal.jsx';
import s from './AiCounsel.module.css';

/* ── Konfigurasi ── */
const TONES = [
  { id: 'listen',  icon: '🫂', label: 'Dengar' },
  { id: 'solve',   icon: '💡', label: 'Solusi' },
  { id: 'comfort', icon: '🌿', label: 'Tenang' },
];

const SUGGESTIONS = [
  'Stres tugas 😔',
  'Salah paham teman 💔',
  'Overthinking 🌪️',
  'Nggak pede 💭',
  'Curhat soal keluarga 🏠',
  'Lagi kesepian ☁️',
];

/* ── Limit Ring di header (kompak 36×36) ── */
function LimitBtn({ used = 0, total = 50, percent = 0 }) {
  const remaining = Math.max(0, total - used);
  const r = 14;
  const circ = r * 2 * Math.PI;
  const offset = circ - ((100 - Math.min(100, percent)) / 100) * circ;
  const color = percent >= 80 ? '#dc2626' : percent >= 50 ? '#eab308' : '#16a34a';

  return (
    <div
      className={s.limitBtn}
      title={`${remaining} pesan tersisa hari ini. Reset 00:00 WIB.`}
    >
      <svg viewBox="0 0 36 36" className={s.limitRingSvg}>
        <circle cx="18" cy="18" r={r} stroke="var(--surface-3)" strokeWidth="3" fill="none" />
        <circle
          cx="18" cy="18" r={r}
          stroke={color} strokeWidth="3" fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <span className={s.limitNum} style={{ color }}>{remaining}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Komponen utama
   ═══════════════════════════════════════════ */
export default function AiCounsel() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sessions, setSessions]         = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [limit, setLimit]               = useState({ usedToday: 0, total: 50, percent: 0, remaining: 50 });
  const [tone, setTone]                 = useState('listen');
  const [draft, setDraft]               = useState('');
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);

  const scrollRef   = useRef(null);
  const inputRef    = useRef(null);
  const skipLoad    = useRef(false);        // cegah race condition saat buat sesi baru

  const currentTone = TONES.find((t) => t.id === tone) || TONES[0];

  /* Draft persist */
  const draftKey = `pikr_ai_draft_${id || 'new'}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      setDraft(saved || '');
    } catch { /* silent */ }
  }, [id, draftKey]);

  const handleDraftChange = (e) => {
    const v = e.target.value;
    setDraft(v);
    try { v ? localStorage.setItem(draftKey, v) : localStorage.removeItem(draftKey); } catch { /* silent */ }
  };

  /* Load sessions + limit */
  const loadList = useCallback(async () => {
    try {
      const [sr, lr] = await Promise.all([rc.aiSessions(), rc.aiLimit()]);
      setSessions(sr.data.sessions || []);
      setLimit(lr.data);
    } catch (err) { toast.error(errMsg(err)); }
  }, []);

  /* Load sesi aktif */
  const loadSession = useCallback(async (sid) => {
    setLoading(true);
    try {
      const res = await rc.aiSession(sid);
      setActiveSession(res.data.session);
      setMessages(res.data.messages || []);
      if (res.data.session?.tone) setTone(res.data.session.tone);
      if (res.data.limit) setLimit(res.data.limit);
    } catch (err) {
      toast.error(errMsg(err, 'Sesi tidak ditemukan'));
      navigate('/konseling/ai', { replace: true });
    } finally { setLoading(false); }
  }, [navigate]);

  /* Efek saat id berubah */
  useEffect(() => {
    if (skipLoad.current) { skipLoad.current = false; return; }
    setMessages([]);
    loadList().then(() => {
      if (id) loadSession(id);
      else { setActiveSession(null); setMessages([]); setLoading(false); }
    });
  }, [id, loadList, loadSession]);

  /* Auto-scroll */
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  /* Buat sesi baru dari drawer */
  const handleNewSession = async (initTone = tone) => {
    try {
      const res = await rc.aiCreateSession(initTone);
      const ns = res.data.session;
      setSessions((p) => [ns, ...p]);
      setShowHistory(false);
      setTone(initTone);
      navigate(`/konseling/ai/${ns.id}`);
    } catch (err) { toast.error(errMsg(err)); }
  };

  /* Ganti mood */
  const handleMood = async (m) => {
    setTone(m);
    setShowMoodMenu(false);
    if (id) {
      try { await rc.aiTone(id, m); }
      catch { /* sync otomatis saat chat berikutnya */ }
    }
  };

  /* Hapus sesi */
  const handleDelete = async (e, sid) => {
    e.stopPropagation();
    if (!confirm('Hapus percakapan ini?')) return;
    try {
      await rc.aiDeleteSession(sid);
      setSessions((p) => p.filter((x) => x.id !== sid));
      try { localStorage.removeItem(`pikr_ai_draft_${sid}`); } catch { /* silent */ }
      toast.success('Dihapus');
      if (id === sid) navigate('/konseling/ai');
    } catch (err) { toast.error(errMsg(err)); }
  };

  /* Kirim pesan */
  const handleSend = async (textToSend) => {
    const text = (textToSend || draft).trim();
    if (!text || sending) return;

    let sid = id;

    if (!sid) {
      try {
        const cr = await rc.aiCreateSession(tone);
        const ns = cr.data.session;
        sid = ns.id;
        setSessions((p) => [ns, ...p]);
        setActiveSession(ns);
        skipLoad.current = true;
        navigate(`/konseling/ai/${sid}`, { replace: true });
      } catch (err) { toast.error(errMsg(err, 'Gagal mulai sesi')); return; }
    }

    setDraft('');
    try { localStorage.removeItem(draftKey); } catch { /* silent */ }

    const tempMsg = { id: `tmp-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages((p) => [...p, tempMsg]);
    setSending(true);

    try {
      const res = await rc.aiChat(sid, text, tone);
      const aiMsg = { id: `ai-${Date.now()}`, role: 'model', content: res.data.reply, createdAt: new Date().toISOString() };
      setMessages((p) => [...p, aiMsg]);
      if (res.data.limit) setLimit(res.data.limit);
      if (res.data.redirectToCounsel)
        toast('Kuota habis. Konselor sebaya siap menemanimu 🧡', { duration: 5000, icon: '🤝' });
      setSessions((p) =>
        p.map((x) => x.id === sid ? { ...x, title: text.slice(0, 50), updatedAt: new Date().toISOString() } : x)
      );
    } catch (err) {
      toast.error(errMsg(err, 'Gagal mengirim'));
      setMessages((p) => p.filter((m) => m.id !== tempMsg.id));
      setDraft(text);
    } finally { setSending(false); }
  };

  /* Chip klik */
  const handleChip = (sug) => {
    setDraft(sug);
    try { localStorage.setItem(draftKey, sug); } catch { /* silent */ }
    inputRef.current?.focus();
  };

  const limitExceeded = limit.remaining <= 0;

  /* ═══════════════════════════
     Render
     ═══════════════════════════ */
  return (
    <div className={s.page}>

      {/* ── Header ── */}
      <header className={s.head}>
        <button type="button" className={s.iconBtn} onClick={() => id ? navigate('/konseling/ai') : navigate('/konseling')} aria-label="Kembali">
          <ChevronLeft size={22} />
        </button>

        <div className={s.aiMark}>
          <Sparkles size={16} />
        </div>

        <div className={s.headMeta}>
          <div className={s.headName}>Sahabat AI</div>
          <div className={s.headSub}>{sending ? 'Sedang mengetik…' : 'Konselor Sebaya Virtual'}</div>
        </div>

        {/* Mood pill — klik buka dropdown */}
        <div className={s.moodAnchor}>
          <button type="button" className={s.moodPill} onClick={() => setShowMoodMenu((v) => !v)}>
            <span>{currentTone.icon}</span>
            <span>{currentTone.label}</span>
          </button>

          {showMoodMenu && (
            <>
              <div className={s.backdrop} onClick={() => setShowMoodMenu(false)} />
              <div className={s.dropdown}>
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${s.dropItem} ${tone === t.id ? s.dropItemOn : ''}`}
                    onClick={() => handleMood(t.id)}
                  >
                    <span className={s.dropEmoji}>{t.icon}</span>
                    {t.label}
                    {tone === t.id && <Check size={13} className={s.dropCheck} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={s.headRight}>
          <button type="button" className={s.iconBtn} onClick={() => setBreathingOpen(true)} title="Latihan Napas" aria-label="Latihan Napas">
            <Wind size={18} />
          </button>
          <LimitBtn used={limit.usedToday} total={limit.total} percent={limit.percent} />
          <button type="button" className={s.iconBtn} onClick={() => setShowHistory(true)} title="Riwayat" aria-label="Riwayat">
            <History size={18} />
          </button>
        </div>
      </header>

      {/* ── Chat Stream ── */}
      <div className={s.stream} ref={scrollRef}>
        {loading ? (
          <div className={s.loading}>
            <Spinner />
            <span>Menyiapkan ruang ceritamu…</span>
          </div>
        ) : messages.length === 0 ? (
          /* Welcome screen */
          <div className={s.welcome}>
            <div className={s.welcomeTop}>
              <span className={s.welcomeTag}><Sparkles size={11} /> Ruang Curhat Sebaya</span>
              <h2 className={s.welcomeTitle}>Mau cerita apa hari ini?</h2>
              <p className={s.welcomeSub}>Aman, rahasia, tanpa dihakimi.</p>
            </div>

            {/* Mood tabs — 3 tab ringkas */}
            <div className={s.moodTabs}>
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${s.moodTab} ${tone === t.id ? s.moodTabOn : ''}`}
                  onClick={() => handleMood(t.id)}
                >
                  <span className={s.moodTabEmoji}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Suggestion chips */}
            <div className={s.chips}>
              <span className={s.chipsLabel}>Topik awal</span>
              <div className={s.chipsWrap}>
                {SUGGESTIONS.map((sg, i) => (
                  <button key={i} type="button" className={s.chip} onClick={() => handleChip(sg)}>
                    {sg}
                  </button>
                ))}
              </div>
            </div>

            <div className={s.welcomeFoot}>
              <Shield size={11} />
              <span>Terenkripsi · Reset kuota 00:00 WIB</span>
            </div>
          </div>
        ) : (
          /* Pesan */
          <div className={s.msgs}>
            {messages.map((m) => (
              <div key={m.id} className={`${s.msgRow} ${m.role === 'user' ? s.msgMine : s.msgAi}`}>
                {m.role === 'model' && (
                  <div className={s.aiBadge}><Sparkles size={12} /></div>
                )}
                <div className={s.msgCol}>
                  <div className={`${s.bubble} ${m.role === 'user' ? s.bubbleMine : s.bubbleAi}`}>
                    <div className={`${s.mdContent} ${m.role === 'user' ? s.mdContentMine : ''}`}>
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                  <span className={s.bubbleTime}>{clock(m.createdAt)}</span>
                </div>
              </div>
            ))}

            {sending && (
              <div className={`${s.typingRow}`}>
                <div className={s.aiBadge}><Sparkles size={12} /></div>
                <div className={s.typingBubble}>
                  <span className={s.dot} />
                  <span className={s.dot} />
                  <span className={s.dot} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Chip bar saat ada pesan ── */}
      {messages.length > 0 && !limitExceeded && (
        <div className={s.chipBar}>
          {SUGGESTIONS.map((sg, i) => (
            <button key={i} type="button" className={s.chip} onClick={() => handleChip(sg)}>{sg}</button>
          ))}
        </div>
      )}

      {/* ── Limit habis / Composer ── */}
      {limitExceeded ? (
        <div className={s.limitBanner}>
          <div className={s.limitBannerTitle}>
            <AlertCircle size={16} /> Kuota harian habis (50/50)
          </div>
          <p className={s.limitBannerSub}>
            Reset besok pukul 00:00 WIB. Butuh teman bicara sekarang? Konselor sebaya siap.
          </p>
          <Link to="/konseling" className={s.limitBannerLink}>
            <Phone size={13} /> Bilik Konseling
          </Link>
        </div>
      ) : (
        <footer className={s.composer}>
          <form
            className={s.composerInner}
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ceritakan apa yang kamu rasakan…"
              className={s.composerInput}
              disabled={sending}
            />
            <button type="submit" className={s.sendBtn} disabled={!draft.trim() || sending} aria-label="Kirim">
              <Send size={16} />
            </button>
          </form>
          <div className={s.composerFoot}>
            <small>Sahabat AI bukan pengganti konselor profesional.</small>
          </div>
        </footer>
      )}

      {/* ── History Drawer ── */}
      {showHistory && <div className={s.drawerOverlay} onClick={() => setShowHistory(false)} />}
      <aside className={`${s.drawer} ${showHistory ? s.drawerOpen : ''}`}>
        <div className={s.drawerHead}>
          <span className={s.drawerTitle}>Riwayat</span>
          <button type="button" className={s.iconBtn} onClick={() => setShowHistory(false)} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <button type="button" className={s.newBtn} onClick={() => handleNewSession(tone)}>
          <Plus size={15} /> Obrolan Baru
        </button>

        <div className={s.sessList}>
          {sessions.length === 0 ? (
            <div className={s.emptyDrawer}>
              <MessageSquare size={28} strokeWidth={1.5} />
              <span>Belum ada riwayat.</span>
            </div>
          ) : sessions.map((sess) => (
            <div
              key={sess.id}
              className={`${s.sessItem} ${sess.id === id ? s.sessOn : ''}`}
              onClick={() => { setShowHistory(false); navigate(`/konseling/ai/${sess.id}`); }}
            >
              <div className={s.sessInfo}>
                <div className={s.sessTitle}>{sess.title || 'Obrolan baru'}</div>
                <div className={s.sessDate}>{ago(sess.updatedAt)}</div>
              </div>
              <button type="button" className={s.deleteBtn} onClick={(e) => handleDelete(e, sess.id)} aria-label="Hapus">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Breathing Modal ── */}
      <BreathingModal open={breathingOpen} onClose={() => setBreathingOpen(false)} />
    </div>
  );
}

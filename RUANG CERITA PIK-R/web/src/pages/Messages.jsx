import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, PenSquare, Image as ImageIcon, Send, Loader2, Reply, Smile, Pencil, Undo2, X, Eye, Lock, BellOff, LogOut, Info, Search, Check, Flag, Camera as CameraIcon, Copy } from 'lucide-react';
import { rc, errMsg, mediaUrl } from '@/lib/api.js';
import { ago, clock, activeLabel } from '@/lib/format.js';
import { useSession } from '@/lib/session.js';
import { useLive, refreshBadges } from '@/lib/live.js';
import { useBackClose } from '@/lib/back.js';
import { Avatar, Sheet, MenuList, Empty, Spinner } from '@/components/ui.jsx';
import styles from './Messages.module.css';

const MediaEditor = lazy(() => import('@/components/MediaEditor.jsx'));
const Camera = lazy(() => import('@/components/Camera.jsx'));

/**
 * Tinggi keyboard HP: visualViewport menyusut saat keyboard muncul.
 * Dipakai untuk mengangkat bar ketik (sebagian browser tidak mengubah 100dvh).
 */
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  return inset;
}

/**
 * Gestur gelembung pesan:
 *  - tekan lama (≥ 420 ms) atau klik kanan = popup reaksi & aksi di dekat pesan
 *  - geser ke kanan ≥ 64 px = balas (getar singkat sebagai tanda)
 */
function useBubbleGestures({ onLongPress, onSwipeReply }) {
  const st = useRef(null);
  const down = (e, m) => {
    if (m.kind === 'UNSENT' || e.button > 0) return;
    const el = e.currentTarget;
    st.current = { m, el, x: e.clientX, y: e.clientY, dx: 0, axis: null, fired: false, timer: setTimeout(() => {
      if (!st.current || st.current.axis) return;
      st.current.fired = true;
      navigator.vibrate?.(12);
      onLongPress(m, el.getBoundingClientRect());
    }, 420) };
  };
  const move = (e) => {
    const g = st.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis && Math.hypot(dx, dy) > 8) {
      g.axis = Math.abs(dx) > Math.abs(dy) && dx > 0 ? 'x' : 'y';
      clearTimeout(g.timer);
      if (g.axis === 'x') g.el.setPointerCapture?.(e.pointerId);
    }
    if (g.axis !== 'x') return;
    g.dx = Math.max(0, Math.min(90, dx));
    const row = g.el.closest('[data-row]');
    row.style.transform = `translateX(${g.dx}px)`;
    row.dataset.reply = g.dx >= 64 ? 'ready' : '';
    if (g.dx >= 64 && !g.buzzed) { g.buzzed = true; navigator.vibrate?.(8); }
  };
  const up = () => {
    const g = st.current;
    st.current = null;
    if (!g) return;
    clearTimeout(g.timer);
    if (g.axis === 'x') {
      const row = g.el.closest('[data-row]');
      row.style.transition = 'transform .25s var(--ease-out)';
      row.style.transform = '';
      row.dataset.reply = '';
      setTimeout(() => { row.style.transition = ''; }, 260);
      if (g.dx >= 64) onSwipeReply(g.m);
    }
    return g.fired;
  };
  return { down, move, up };
}

const REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥'];

/**
 * Pesan. Desktop: kotak masuk kiri + percakapan kanan (2 kolom, seperti Instagram). HP: satu kolom.
 * Isi pesan dienkripsi di server; pesan dari bukan-pengikut masuk "Permintaan" (akun remaja).
 */
export default function Messages() {
  const { id } = useParams();
  return (
    <div className={styles.page}>
      <div className={`${styles.inboxCol} ${id ? styles.hideMobile : ''}`}><Inbox activeId={id} /></div>
      <div className={`${styles.threadCol} ${!id ? styles.hideMobile : ''}`}>
        {id ? <Thread key={id} id={id} /> : (
          <div className={styles.placeholder}>
            <span className={styles.phIcon}><Send size={34} /></span>
            <b>Pesanmu</b>
            <p>Kirim foto & pesan pribadi ke teman atau grup. Isi pesan dienkripsi saat disimpan.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Inbox({ activeId }) {
  const navigate = useNavigate();
  const me = useSession((s) => s.me?.user);
  const [box, setBox] = useState('main');
  const [items, setItems] = useState(null);
  const [requests, setRequests] = useState(0);
  const [notes, setNotes] = useState([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await rc.inbox(box === 'requests' ? 'requests' : undefined);
      setItems(r.data.items); if (r.data.requests !== undefined) setRequests(r.data.requests);
    } catch (err) { setItems([]); toast.error(errMsg(err)); }
  }, [box]);
  useEffect(() => { setItems(null); load(); }, [load]);
  useEffect(() => { rc.notes().then((r) => setNotes(r.data.items)).catch(() => {}); }, []);
  useLive('message', useCallback(() => load(), [load]));
  useLive('read', useCallback(() => load(), [load]));

  const myNote = notes.find((n) => n.mine);
  return (
    <div className={styles.inbox}>
      <header className={styles.inboxHead}>
        <h1>{me?.username}</h1>
        <button type="button" className="icon-btn" onClick={() => setNewOpen(true)} aria-label="Pesan baru"><PenSquare size={22} /></button>
      </header>
      <div className={`${styles.notes} no-scrollbar`}>
        <button type="button" className={styles.note} onClick={() => setNoteOpen(true)}>
          <span className={styles.bubble}>{myNote ? myNote.note : 'Tulis catatan…'}</span>
          <Avatar user={me} size={62} />
          <small>Catatanmu</small>
        </button>
        {notes.filter((n) => !n.mine).map((n) => (
          <Link key={n.user.username} to={`/${n.user.username}`} className={styles.note}>
            <span className={styles.bubble}>{n.note}</span>
            <Avatar user={n.user} size={62} />
            <small>{n.user.username}</small>
          </Link>
        ))}
      </div>
      <div className={styles.boxTabs}>
        <button type="button" className={box === 'main' ? styles.boxOn : ''} onClick={() => setBox('main')}>Pesan</button>
        <button type="button" className={box === 'requests' ? styles.boxOn : ''} onClick={() => setBox('requests')}>Permintaan{requests > 0 ? ` (${requests})` : ''}</button>
      </div>
      {box === 'requests' && <p className={styles.reqNote}>Pesan dari akun yang tidak kamu ikuti. Mereka tidak tahu kamu sudah membacanya sampai kamu menerima.</p>}
      <div className={styles.list}>
        {items === null ? <Spinner /> : items.length === 0 ? (
          <Empty title={box === 'requests' ? 'Tidak ada permintaan' : 'Belum ada pesan'}>{box === 'requests' ? null : 'Mulai obrolan dengan teman lewat tombol pena di atas.'}</Empty>
        ) : items.map((t) => (
          <button key={t.id} type="button" className={`${styles.row} ${activeId === t.id ? styles.rowOn : ''}`} onClick={() => navigate(`/pesan/${t.id}`)}>
            <span className={styles.rowAv}>
              {t.isGroup ? <span className={styles.groupAv}><Avatar user={t.users[0]} size={34} /><Avatar user={t.users[1]} size={34} /></span> : <Avatar user={t.users[0]} size={56} />}
            </span>
            <span className={styles.rowText}>
              <b className={t.unread ? styles.unread : ''}>{t.title}</b>
              <small className={t.unread ? styles.unread : ''}>{t.last.mine ? 'Kamu: ' : ''}{t.last.text} · {ago(t.last.at)}</small>
            </span>
            {t.muted && <BellOff size={15} className="muted" />}
            {t.unread > 0 && <i className={styles.unreadDot} />}
          </button>
        ))}
      </div>
      <NoteSheet open={noteOpen} onClose={() => setNoteOpen(false)} current={myNote?.note} onSaved={(note) => setNotes((list) => [...list.filter((n) => !n.mine), ...(note ? [{ user: me, note, mine: true, at: new Date() }] : [])])} />
      <NewMessage open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}

function NoteSheet({ open, onClose, current, onSaved }) {
  const [v, setV] = useState('');
  useEffect(() => { if (open) setV(current || ''); }, [open, current]);
  const save = async (note) => {
    try { await rc.setNote(note); onSaved(note); onClose(); toast.success(note ? 'Catatan dibagikan ke teman yang saling mengikuti' : 'Catatan dihapus'); } catch (err) { toast.error(errMsg(err)); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Catatan" size="sm"
      footer={<div style={{ display: 'flex', gap: 8 }}>{current && <button type="button" className="btn btn-soft" onClick={() => save('')}>Hapus</button>}<button type="button" className="btn btn-primary btn-block" onClick={() => save(v.trim())} disabled={!v.trim()}>Bagikan</button></div>}>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input className="field" value={v} onChange={(e) => setV(e.target.value.slice(0, 60))} placeholder="Apa yang sedang kamu pikirkan?" autoFocus />
        <small className="muted">{v.length}/60 · terlihat 24 jam oleh teman yang saling mengikuti</small>
      </div>
    </Sheet>
  );
}

function NewMessage({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [people, setPeople] = useState([]);
  const [picked, setPicked] = useState([]);
  const [title, setTitle] = useState('');
  useEffect(() => { if (!open) { setQ(''); setPicked([]); setTitle(''); } }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => (q.trim() ? rc.search(q.trim()) : rc.connections(useSession.getState().me.user.username, 'following'))
      .then((r) => setPeople(r.data.items.filter((u) => !u.self))).catch(() => {}), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, q]);
  const start = async () => {
    try { const r = await rc.openThread(picked.length === 1 ? { username: picked[0].username } : { usernames: picked.map((p) => p.username), title }); onClose(); navigate(`/pesan/${r.data.threadId}`); } catch (err) { toast.error(errMsg(err)); }
  };
  const toggle = (u) => setPicked((p) => (p.some((x) => x.username === u.username) ? p.filter((x) => x.username !== u.username) : [...p, u].slice(0, 31)));
  return (
    <Sheet open={open} onClose={onClose} title="Pesan baru" size="sm"
      footer={<button type="button" className="btn btn-primary btn-block" disabled={!picked.length} onClick={start}>{picked.length > 1 ? `Buat grup (${picked.length})` : 'Obrolan'}</button>}>
      <div className={styles.newTo}>
        <span>Ke:</span>
        {picked.map((p) => <button key={p.username} type="button" onClick={() => toggle(p)}>{p.username} <X size={12} /></button>)}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari…" autoFocus />
      </div>
      {picked.length > 1 && <div style={{ padding: '0 16px 8px' }}><input className="field" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 50))} placeholder="Nama grup (opsional)" /></div>}
      <ul className={styles.pickList}>
        {people.map((u) => (
          <li key={u.username}><button type="button" onClick={() => toggle(u)}>
            <Avatar user={u} size={44} /><span><b>{u.name}</b><small>{u.username}</small></span>
            <i className={picked.some((p) => p.username === u.username) ? styles.checkOn : styles.check}>{picked.some((p) => p.username === u.username) && <Check size={14} strokeWidth={3} />}</i>
          </button></li>
        ))}
      </ul>
    </Sheet>
  );
}

function Thread({ id }) {
  const navigate = useNavigate();
  const me = useSession((s) => s.me?.user);
  const [t, setT] = useState(null);
  const [items, setItems] = useState([]);
  const [seenBy, setSeenBy] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [typing, setTyping] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msgMenu, setMsgMenu] = useState(null);
  const [info, setInfo] = useState(false);
  const [image, setImage] = useState(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [onceView, setOnceView] = useState(null);
  const [editorItems, setEditorItems] = useState(null);
  const [camOpen, setCamOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const kb = useKeyboardInset();
  const inputRef = useRef(null);
  const longPressed = useRef(false);
  const scroller = useRef(null);
  const fileRef = useRef(null);
  const lastTyping = useRef(0);
  const typingTimer = useRef(null);

  const scrollDown = (smooth = true) => requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }));
  const load = useCallback(async () => {
    try {
      const r = await rc.thread(id);
      setT(r.data.thread); setItems(r.data.items); setSeenBy(r.data.seenBy); setHasMore(r.data.hasMore);
      scrollDown(false);
      if (r.data.thread.status === 'ACCEPTED') rc.read(id).then(refreshBadges).catch(() => {});
    } catch (err) { toast.error(errMsg(err)); navigate('/pesan'); }
  }, [id, navigate]);
  useEffect(() => { load(); }, [load]);

  useLive('message', useCallback((d) => {
    if (d.threadId !== id) return;
    setItems((list) => (list.some((m) => m.id === d.message.id) ? list : [...list, d.message]));
    setTyping(null);
    scrollDown();
    rc.read(id).then(refreshBadges).catch(() => {});
  }, [id]));
  useLive('message-update', useCallback((d) => {
    if (d.threadId !== id) return;
    setItems((list) => list.map((m) => (m.id !== d.id ? m : {
      ...m,
      ...(d.text !== undefined ? { text: d.text, edited: true } : {}),
      ...(d.unsent ? { kind: 'UNSENT', text: null, url: null } : {}),
      ...(d.reactions ? { reactions: d.reactions } : {}),
      ...(d.opened ? { opened: true } : {})
    })));
  }, [id]));
  useLive('read', useCallback((d) => { if (d.threadId === id) setSeenBy((s) => s.map((x) => (x.memberId === d.memberId ? { ...x, lastReadAt: d.at } : x))); }, [id]));
  useLive('typing', useCallback((d) => {
    if (d.threadId !== id) return;
    setTyping(d.user); clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(null), 3500);
    scrollDown();
  }, [id]));

  const loadOlder = async () => {
    if (!items[0]) return;
    const el = scroller.current; const h = el.scrollHeight;
    try { const r = await rc.thread(id, items[0].id); setItems((list) => [...r.data.items, ...list]); setHasMore(r.data.hasMore); requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - h; }); } catch { /* abaikan */ }
  };
  const onType = (v) => {
    setText(v);
    if (Date.now() - lastTyping.current > 2500 && v) { lastTyping.current = Date.now(); rc.typing(id).catch(() => {}); }
  };
  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if ((!body && !image) || busy) return;
    if (editing) {
      try { await rc.editMessage(editing.id, body); setItems((l) => l.map((m) => (m.id === editing.id ? { ...m, text: body, edited: true } : m))); setEditing(null); setText(''); } catch (err) { toast.error(errMsg(err)); }
      return;
    }
    setBusy(true);
    const fd = new FormData();
    if (body) fd.append('text', body);
    if (image) { fd.append('image', image.file); fd.append('viewOnce', String(viewOnce)); }
    if (replyTo) fd.append('replyToId', replyTo.id);
    try {
      const r = await rc.send(id, fd);
      setItems((l) => [...l, r.data.message]); setText(''); setReplyTo(null); setImage(null); setViewOnce(false); scrollDown();
    } catch (err) { toast.error(errMsg(err, 'Pesan tidak terkirim')); } finally { setBusy(false); }
  };
  const react = async (m, emoji) => {
    setMsgMenu(null);
    const mine = m.reactions.find((r) => r.memberId === me.id);
    try { const r = await rc.reactMessage(m.id, mine?.emoji === emoji ? null : emoji); setItems((l) => l.map((x) => (x.id === m.id ? { ...x, reactions: r.data.reactions } : x))); } catch (err) { toast.error(errMsg(err)); }
  };
  const unsend = async (m) => {
    setMsgMenu(null);
    try { await rc.unsend(m.id); setItems((l) => l.map((x) => (x.id === m.id ? { ...x, kind: 'UNSENT', text: null, url: null } : x))); } catch (err) { toast.error(errMsg(err)); }
  };
  const openOnce = async (m) => {
    try { const r = await rc.openOnce(m.id); setOnceView(r.data.url); setItems((l) => l.map((x) => (x.id === m.id ? { ...x, opened: true } : x))); } catch (err) { toast.error(errMsg(err)); }
  };
  const answer = async (accept) => {
    try { await rc.answerThread(id, accept); if (accept) { toast.success('Permintaan diterima'); load(); } else { navigate('/pesan'); } } catch (err) { toast.error(errMsg(err)); }
  };
  const startReply = useCallback((m) => { setReplyTo(m); setEditing(null); requestAnimationFrame(() => inputRef.current?.focus()); }, []);
  const gestures = useBubbleGestures({
    onLongPress: (m, rect) => { longPressed.current = true; setMenuRect(rect); setMsgMenu(m); },
    onSwipeReply: startReply
  });
  // Foto pesan: pilih / kamera → penyunting → kirim langsung dari penyunting
  const sendEdited = async (out) => {
    const it = out[0];
    if (!it) return;
    const fd = new FormData();
    if (text.trim()) fd.append('text', text.trim());
    fd.append('image', it.file);
    fd.append('viewOnce', String(viewOnce));
    if (replyTo) fd.append('replyToId', replyTo.id);
    setBusy(true);
    try {
      const r = await rc.send(id, fd);
      setItems((l) => [...l, r.data.message]); setText(''); setReplyTo(null); setViewOnce(false); setEditorItems(null); scrollDown();
    } catch (err) { toast.error(errMsg(err, 'Foto tidak terkirim')); } finally { setBusy(false); }
  };
  const report = async (m) => {
    setMsgMenu(null);
    if (!window.confirm('Laporkan pesan ini ke pengurus? Hanya pesan ini yang dikirim, bukan seluruh percakapan.')) return;
    try { const r = await rc.report({ targetType: 'RC_MESSAGE', targetId: m.id, reason: 'PELECEHAN' }); toast.success(r.data.message); } catch (err) { toast.error(errMsg(err)); }
  };

  if (!t) return <Spinner />;
  const other = !t.isGroup ? t.users[0] : null;
  const active = other && activeLabel(other.lastSeenAt);
  const lastMine = [...items].reverse().find((m) => m.mine);
  const seen = lastMine && seenBy.some((s) => s.lastReadAt && new Date(s.lastReadAt) >= new Date(lastMine.createdAt));

  return (
    <div className={styles.thread}>
      <header className={styles.threadHead}>
        <button type="button" className={`icon-btn ${styles.backBtn}`} onClick={() => navigate('/pesan')} aria-label="Kembali"><ChevronLeft size={26} /></button>
        <Link to={other ? `/${other.username}` : '#'} className={styles.threadWho} onClick={(e) => t.isGroup && e.preventDefault()}>
          {other ? <Avatar user={other} size={40} /> : <span className={styles.groupAv}><Avatar user={t.users[0]} size={28} /><Avatar user={t.users[1]} size={28} /></span>}
          <span><b>{t.title}</b><small>{active || (t.isGroup ? `${t.users.length + 1} anggota` : other?.username)}</small></span>
        </Link>
        <button type="button" className="icon-btn" onClick={() => setInfo(true)} aria-label="Info percakapan"><Info size={22} /></button>
      </header>

      <div className={styles.messages} ref={scroller}>
        {hasMore && <button type="button" className={styles.older} onClick={loadOlder}>Muat pesan sebelumnya</button>}
        {other && !hasMore && (
          <div className={styles.intro}>
            <Avatar user={other} size={88} />
            <b>{other.name}</b>
            <small>{other.username} · Ruang Cerita</small>
            <Link to={`/${other.username}`} className="btn btn-soft btn-sm">Lihat profil</Link>
            <span className={styles.secure}><Lock size={12} /> Isi pesan dienkripsi saat disimpan</span>
          </div>
        )}
        {items.map((m, i) => {
          const prevM = items[i - 1];
          const showTime = !prevM || new Date(m.createdAt) - new Date(prevM.createdAt) > 30 * 60 * 1000;
          const grouped = prevM && prevM.senderId === m.senderId && !showTime;
          if (m.kind === 'SYSTEM') return <div key={m.id} className={styles.system}>{m.sender?.username} {m.text}</div>;
          return (
            <div key={m.id}>
              {showTime && <div className={styles.timeSep}>{new Date(m.createdAt).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
              <div data-row className={`${styles.msgRow} ${m.mine ? styles.mine : ''} ${grouped ? styles.grouped : ''}`}>
                <span className={styles.swipeIc} aria-hidden="true"><Reply size={16} /></span>
                {!m.mine && <span className={styles.msgAv}>{!items[i + 1] || items[i + 1].senderId !== m.senderId ? <Avatar user={m.sender} size={28} /> : null}</span>}
                <div className={styles.msgCol}>
                  {t.isGroup && !m.mine && !grouped && <small className={styles.senderName}>{m.sender?.username}</small>}
                  {m.replyTo && <div className={styles.replyRef}><Reply size={12} /> {m.replyTo.sender?.username}: {m.replyTo.text}</div>}
                  <button type="button" className={`${styles.bubbleMsg} ${m.kind === 'UNSENT' ? styles.unsent : ''} ${m.kind === 'IMAGE' && !m.viewOnce ? styles.imgBubble : ''}`}
                    onContextMenu={(e) => { e.preventDefault(); if (m.kind !== 'UNSENT' && !longPressed.current) { setMenuRect(e.currentTarget.getBoundingClientRect()); setMsgMenu(m); } }}
                    onPointerDown={(e) => { longPressed.current = false; gestures.down(e, m); }}
                    onPointerMove={gestures.move}
                    onPointerUp={gestures.up}
                    onPointerCancel={gestures.up}
                    onDoubleClick={() => m.kind !== 'UNSENT' && react(m, '❤️')}
                    onClick={(e) => { if (longPressed.current) { e.preventDefault(); return; } if (m.viewOnce && !m.mine && !m.opened) openOnce(m); }}>
                    {m.kind === 'UNSENT' && <i>Pesan ditarik</i>}
                    {m.kind === 'IMAGE' && (m.viewOnce
                      ? <span className={styles.once}><Eye size={16} /> {m.mine ? (m.opened ? 'Dibuka' : 'Foto sekali lihat') : m.opened ? 'Sudah dibuka' : 'Ketuk untuk melihat'}</span>
                      : m.url && <img src={mediaUrl(m.url)} alt="" loading="lazy" />)}
                    {(m.kind === 'POST') && m.ref && (
                      m.ref.gone ? <i>Postingan tidak tersedia</i> : (
                        <Link to={`/p/${m.ref.id}`} className={styles.sharedPost} onClick={(e) => e.stopPropagation()}>
                          <span><Avatar user={m.ref.author} size={22} /> <b>{m.ref.author.username}</b></span>
                          {m.ref.thumb && <img src={mediaUrl(m.ref.thumb)} alt="" />}
                          {m.ref.caption && <small>{m.ref.caption}</small>}
                        </Link>
                      ))}
                    {m.kind === 'STORY_REPLY' && m.ref && (
                      <span className={styles.storyRef}>{m.ref.gone ? 'Membalas cerita (sudah kedaluwarsa)' : <>Membalas cerita {m.mine ? m.ref.author.username : 'kamu'}{m.ref.url && <img src={mediaUrl(m.ref.url)} alt="" />}</>}</span>
                    )}
                    {m.text && m.kind !== 'UNSENT' && <span className={m.kind === 'STORY_REPLY' && /^\p{Extended_Pictographic}+$/u.test(m.text) ? styles.bigEmoji : ''}>{m.text}</span>}
                    {m.edited && m.kind !== 'UNSENT' && <em className={styles.edited}>Diedit</em>}
                  </button>
                  {m.reactions?.length > 0 && <span className={styles.reacts}>{[...new Set(m.reactions.map((r) => r.emoji))].join('')}{m.reactions.length > 1 ? ` ${m.reactions.length}` : ''}</span>}
                </div>
                {m.kind !== 'UNSENT' && <button type="button" className={styles.moreBtn} onClick={(e) => { setMenuRect(e.currentTarget.closest('[data-row]')?.getBoundingClientRect() || null); setMsgMenu(m); }} aria-label="Pilihan pesan"><Smile size={16} /></button>}
              </div>
            </div>
          );
        })}
        {seen && lastMine && <div className={styles.seen}>Dilihat</div>}
        {typing && <div className={styles.typing}><Avatar user={typing} size={24} /><span><i /><i /><i /></span></div>}
      </div>

      {t.status === 'REQUEST' ? (
        <div className={styles.requestBar}>
          <p><b>{t.title}</b> ingin mengirimimu pesan. Terima untuk membalas; mereka tidak tahu kamu sudah membaca sebelum kamu menerima.</p>
          <div><button type="button" className="btn btn-soft" onClick={() => answer(false)}>Hapus</button><button type="button" className="btn btn-primary" onClick={() => answer(true)}>Terima</button></div>
        </div>
      ) : (
        <form className={styles.composer} onSubmit={send} style={kb > 0 ? { paddingBottom: kb + 10 } : undefined}>
          {(replyTo || editing) && (
            <div className={styles.composeNote}>
              {editing ? <><Pencil size={13} /> Mengedit pesan</> : <><Reply size={13} /> Membalas {replyTo.sender?.username || 'pesanmu'}: {replyTo.text?.slice(0, 50)}</>}
              <button type="button" onClick={() => { setReplyTo(null); setEditing(null); setText(''); }} aria-label="Batal"><X size={15} /></button>
            </div>
          )}
          {image && (
            <div className={styles.imagePrev}>
              <img src={image.url} alt="" />
              <label><input type="checkbox" checked={viewOnce} onChange={(e) => setViewOnce(e.target.checked)} /> <Eye size={14} /> Sekali lihat</label>
              <button type="button" onClick={() => setImage(null)} aria-label="Hapus foto"><X size={14} /></button>
            </div>
          )}
          <div className={styles.inputRow}>
            <button type="button" className={`icon-btn ${styles.camBtn}`} onClick={() => setCamOpen(true)} aria-label="Kamera"><CameraIcon size={20} /></button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { if (!f.type.startsWith('image/')) toast.error('Pilih foto'); else if (f.size > 15 * 1024 * 1024) toast.error('Maks. 15 MB'); else setEditorItems([{ file: f, url: URL.createObjectURL(f), video: false }]); } }} />
            <textarea ref={inputRef} className={styles.input} value={text} onChange={(e) => onType(e.target.value)} placeholder="Kirim pesan…" rows={1} maxLength={2000}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 720) { e.preventDefault(); send(); } }} />
            {!text.trim() && !image && !editing && <button type="button" className="icon-btn" onClick={() => fileRef.current?.click()} aria-label="Kirim foto dari galeri"><ImageIcon size={22} /></button>}
            <button type="submit" className={styles.sendBtn} disabled={(!text.trim() && !image) || busy} aria-label="Kirim">{busy ? <Loader2 size={18} className="spin" /> : editing ? <Check size={20} /> : <Send size={20} />}</button>
          </div>
        </form>
      )}

      <MessagePopup m={msgMenu} rect={menuRect} me={me} onClose={() => setMsgMenu(null)} onReact={(e) => react(msgMenu, e)} items={msgMenu && [
              { label: 'Balas', icon: <Reply size={19} />, onClick: () => { startReply(msgMenu); setMsgMenu(null); } },
              msgMenu.mine && msgMenu.kind === 'TEXT' && Date.now() - new Date(msgMenu.createdAt) < 15 * 60 * 1000 && { label: 'Edit', icon: <Pencil size={19} />, hint: 'Bisa diedit sampai 15 menit setelah dikirim', onClick: () => { setEditing(msgMenu); setText(msgMenu.text); setMsgMenu(null); } },
              msgMenu.text && { label: 'Salin', icon: <Copy size={19} />, onClick: () => { navigator.clipboard.writeText(msgMenu.text).then(() => toast.success('Disalin')); setMsgMenu(null); } },
              msgMenu.mine && { label: 'Tarik pesan', icon: <Undo2 size={19} />, danger: true, hint: 'Pesan hilang untuk semua orang', onClick: () => unsend(msgMenu) },
              !msgMenu.mine && { label: 'Laporkan', icon: <Flag size={19} />, danger: true, onClick: () => report(msgMenu) }
            ]} />
      <Sheet open={info} onClose={() => setInfo(false)} title="Detail" size="sm">
        <MenuList items={[
          { label: t.muted ? 'Bunyikan notifikasi' : 'Bisukan pesan', icon: <BellOff size={19} />, onClick: async () => { await rc.muteThread(id, !t.muted); setT({ ...t, muted: !t.muted }); setInfo(false); } },
          other && { label: 'Lihat profil', icon: <Avatar user={other} size={22} />, onClick: () => navigate(`/${other.username}`) },
          '-',
          { label: t.isGroup ? 'Keluar dari grup' : 'Hapus percakapan', icon: <LogOut size={19} />, danger: true, onClick: async () => { if (!window.confirm(t.isGroup ? 'Keluar dari grup ini?' : 'Hapus percakapan dari kotak masukmu?')) return; await rc.leaveThread(id); navigate('/pesan'); } }
        ]} />
      </Sheet>
      {(editorItems || camOpen) && (
        <Suspense fallback={null}>
          {camOpen && !editorItems && (
            <Camera mode="dm" modes={['dm']} photoOnly onCapture={(it) => { setCamOpen(false); setEditorItems([it]); }}
              onGallery={() => { setCamOpen(false); fileRef.current?.click(); }} onClose={() => setCamOpen(false)} />
          )}
          {editorItems && (
            <MediaEditor items={editorItems} target="dm" busy={busy} doneLabel={<><Send size={16} /> Kirim</>} onDone={sendEdited} onCancel={() => setEditorItems(null)}
              footerExtra={(
                <label className={styles.onceToggle}>
                  <input type="checkbox" checked={viewOnce} onChange={(e) => setViewOnce(e.target.checked)} />
                  <Eye size={15} /> Sekali lihat <small>penerima hanya bisa membuka sekali</small>
                </label>
              )} />
          )}
        </Suspense>
      )}
      {onceView && (
        <div className={styles.onceViewer} onClick={() => setOnceView(null)}>
          <img src={mediaUrl(onceView)} alt="" onContextMenu={(e) => e.preventDefault()} draggable="false" />
          <span>Foto sekali lihat · ketuk untuk menutup. Tidak bisa dibuka lagi.</span>
        </div>
      )}
    </div>
  );
}

/**
 * Popup pesan (tekan lama): baris emoji + aksi, muncul di dekat gelembung seperti Instagram.
 * Latar diburamkan; ketuk di luar untuk menutup. Tombol Kembali di HP juga menutup.
 */
function MessagePopup({ m, rect, me, items, onReact, onClose }) {
  useBackClose(!!m, onClose);
  useEffect(() => {
    if (!m) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [m, onClose]);
  if (!m) return null;
  const mineReact = m.reactions?.find((r) => r.memberId === me?.id)?.emoji;
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const menuH = 64 + items.filter(Boolean).filter((x) => x !== '-').length * 50;
  // Di bawah pesan bila muat, kalau tidak di atas
  const below = rect ? rect.bottom + 8 + menuH < vh - 12 : true;
  const top = rect ? (below ? rect.bottom + 8 : Math.max(12, rect.top - 8 - menuH)) : vh / 2 - menuH / 2;
  const width = Math.min(300, vw - 24);
  const left = rect ? Math.min(vw - width - 12, Math.max(12, m.mine ? rect.right - width : rect.left)) : (vw - width) / 2;
  return createPortal(
    <div className={styles.popLayer} onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.pop} style={{ top, left, width, transformOrigin: below ? 'top' : 'bottom' }} role="menu">
        <div className={styles.popReacts}>
          {REACTIONS.map((e) => <button key={e} type="button" className={mineReact === e ? styles.popReactOn : ''} onClick={() => onReact(e)} aria-label={`Reaksi ${e}`}>{e}</button>)}
        </div>
        <MenuList items={items} />
      </div>
    </div>,
    document.body
  );
}

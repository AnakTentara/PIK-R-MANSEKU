import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Heart, Pin, Trash2, Send, Flag, Loader2, Search, Check, X } from 'lucide-react';
import { rc, errMsg } from '@/lib/api.js';
import { ago, compact } from '@/lib/format.js';
import { useSession } from '@/lib/session.js';
import { Avatar, Username, Sheet, Spinner, Empty } from './ui.jsx';
import { RichText } from './PostCard.jsx';
import styles from './Comments.module.css';

const QUICK = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

/** Satu komentar + tombol suka, balas, sematkan, hapus. */
function Comment({ c, postAuthorId, onReply, onChange, onRemove, child = false }) {
  const meId = useSession((s) => s.me?.user?.id);
  const [liked, setLiked] = useState(c.liked);
  const [count, setCount] = useState(c.likeCount);
  const [replies, setReplies] = useState(null);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const like = async () => {
    const want = !liked;
    setLiked(want); setCount((n) => n + (want ? 1 : -1));
    try { const r = await rc.likeComment(c.id, want); setCount(r.data.likeCount); } catch { setLiked(!want); setCount((n) => n + (want ? -1 : 1)); }
  };
  const loadReplies = async () => {
    if (replies) { setReplies(null); return; }
    setLoadingReplies(true);
    try { const r = await rc.comments(c.postId || c._postId, c.id); setReplies(r.data.items); } catch (err) { toast.error(errMsg(err)); } finally { setLoadingReplies(false); }
  };
  const canDelete = c.mine || postAuthorId === meId;
  return (
    <div className={styles.commentThread}>
      <div className={`${styles.item} ${child ? styles.child : ''} ${c.hidden ? styles.hiddenC : ''}`}>
        <Avatar user={c.author} size={child ? 26 : 32} />
        <div className={styles.main}>
          <p className={styles.text}><Username user={c.author} /> <RichText text={c.content} /></p>
          <div className={styles.meta}>
            <span>{ago(c.createdAt)}</span>
            {count > 0 && <span>{compact(count)} suka</span>}
            <button type="button" onClick={() => onReply(c)}>Balas</button>
            {c.pinned && <span className={styles.pinned}><Pin size={11} /> Disematkan</span>}
            {c.hidden && <span className={styles.pinned}>Disembunyikan (kata tersembunyi)</span>}
            {!child && postAuthorId === meId && <button type="button" onClick={() => onChange?.(c, 'pin')}>{c.pinned ? 'Lepas' : 'Sematkan'}</button>}
            {canDelete && <button type="button" onClick={() => onRemove(c)} aria-label="Hapus komentar"><Trash2 size={12} /></button>}
            {!c.mine && <button type="button" onClick={() => onChange?.(c, 'report')} aria-label="Laporkan komentar"><Flag size={12} /></button>}
          </div>
          {!child && c.replyCount > 0 && (
            <button type="button" className={styles.viewReplies} onClick={loadReplies}>
              <i />{loadingReplies ? 'Memuat…' : replies ? 'Sembunyikan balasan' : `Lihat ${c.replyCount} balasan`}
            </button>
          )}
        </div>
        <button type="button" className={`${styles.likeBtn} ${liked ? styles.liked : ''}`} onClick={like} aria-label="Suka komentar"><Heart size={13} fill={liked ? 'currentColor' : 'none'} /></button>
      </div>
      {!child && replies?.map((r) => <Comment key={r.id} c={{ ...r, _postId: c._postId }} postAuthorId={postAuthorId} onReply={() => onReply(c, r.author.username)} onRemove={onRemove} onChange={onChange} child />)}
    </div>
  );
}

/** Daftar komentar + kolom tulis. Dipakai di lembar komentar (HP) dan panel kanan halaman postingan (desktop). */
export function CommentPanel({ post, onCount, autoFocus = false, aboveComposer = null }) {
  const me = useSession((s) => s.me?.user);
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [off, setOff] = useState(post.commentsOff);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const input = useRef(null);

  const load = useCallback(async () => {
    try { const r = await rc.comments(post.id); setItems(r.data.items.map((c) => ({ ...c, _postId: post.id }))); setOff(r.data.commentsOff); } catch (err) { setItems([]); toast.error(errMsg(err, 'Gagal memuat komentar')); }
  }, [post.id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (autoFocus) setTimeout(() => input.current?.focus(), 300); }, [autoFocus]);

  const reply = (c, mention) => {
    setReplyTo(c);
    setText(`@${mention || c.author.username} `);
    input.current?.focus();
  };
  const submit = async (e) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    try {
      const r = await rc.addComment(post.id, content, replyTo?.id);
      const c = { ...r.data.comment, _postId: post.id };
      if (replyTo) setItems((list) => list.map((x) => (x.id === replyTo.id ? { ...x, replyCount: x.replyCount + 1 } : x)));
      else setItems((list) => [c, ...(list || [])]);
      setText(''); setReplyTo(null);
      onCount?.(1);
      if (c.hidden) toast('Komentarmu disembunyikan karena berisi kata yang dibatasi pemilik postingan.', { icon: '🙈' });
    } catch (err) { toast.error(errMsg(err, 'Gagal mengirim komentar')); } finally { setBusy(false); }
  };
  const remove = (c) => setConfirmDelete({ c });
  const doDelete = async () => {
    const { c } = confirmDelete;
    setConfirmDelete(null);
    try { await rc.deleteComment(c.id); setItems((list) => list.filter((x) => x.id !== c.id)); onCount?.(-1); } catch (err) { toast.error(errMsg(err)); }
  };
  const change = async (c, action) => {
    if (action === 'pin') {
      try { await rc.pinComment(c.id, !c.pinned); load(); } catch (err) { toast.error(errMsg(err)); }
    }
    if (action === 'report') {
      if (!window.confirm('Laporkan komentar ini ke pengurus?')) return;
      try { const r = await rc.report({ targetType: 'RC_COMMENT', targetId: c.id, reason: 'PELECEHAN' }); toast.success(r.data.message); } catch (err) { toast.error(errMsg(err)); }
    }
  };

  return (
    <div className={styles.panel}>
      {confirmDelete && createPortal(
        <div className={styles.deletePopupOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.deletePopup} onClick={(e) => e.stopPropagation()}>
            <p>Hapus komentar ini?</p>
            <div className={styles.deletePopupActions}>
              <button type="button" onClick={() => setConfirmDelete(null)}>Batal</button>
              <button type="button" className={styles.deleteConfirmBtn} onClick={doDelete}>Hapus</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div className={styles.list}>
        {post.caption && (
          <div className={styles.item}>
            <Avatar user={post.author} size={32} />
            <div className={styles.main}>
              <p className={styles.text}><Username user={post.author} /> <RichText text={post.caption} /></p>
              <div className={styles.meta}><span>{ago(post.createdAt)}</span></div>
            </div>
          </div>
        )}
        {items === null ? <Spinner /> : items.length === 0 ? (
          <Empty title="Belum ada komentar">{off ? 'Komentar dimatikan untuk postingan ini.' : 'Jadilah yang pertama berkomentar.'}</Empty>
        ) : items.map((c) => <Comment key={c.id} c={c} postAuthorId={post.author.id} onReply={reply} onRemove={remove} onChange={change} />)}
      </div>
      {aboveComposer}
      {(!off || post.mine) && (
        <div className={styles.composer}>
          <div className={styles.quick} data-noswipe>
            {QUICK.map((e) => <button key={e} type="button" onClick={() => { setText((t) => t + e); input.current?.focus(); }}>{e}</button>)}
          </div>
          {replyTo && <div className={styles.replying}>Membalas <b>{replyTo.author.username}</b><button type="button" onClick={() => { setReplyTo(null); setText(''); }}>Batal</button></div>}
          <form className={styles.form} onSubmit={submit}>
            <Avatar user={me} size={32} />
            <input ref={input} className={styles.input} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
              placeholder={`Tambahkan komentar untuk ${post.author.username}…`} aria-label="Tulis komentar" enterKeyHint="send" />
            <button type="submit" className={styles.send} disabled={!text.trim() || busy}>{busy ? <Loader2 size={16} className="spin" /> : 'Kirim'}</button>
          </form>
        </div>
      )}
    </div>
  );
}

export function CommentsSheet({ post, open, onClose, onCount }) {
  return (
    <Sheet open={open} onClose={onClose} title="Komentar" size="md">
      {post && <CommentPanel post={post} onCount={onCount} autoFocus />}
    </Sheet>
  );
}

export function CommentsModal({ post, open, onClose, onCount }) {
  if (!open || !post) return null;
  return createPortal(
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalBox}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Tutup">
          <X size={22} />
        </button>
        <div className={styles.modalHead}><span>Komentar</span></div>
        <CommentPanel post={post} onCount={onCount} autoFocus />
      </div>
    </div>,
    document.body
  );
}

/** Bagikan postingan ke teman (pesan langsung), atau salin tautan. */
export function ShareSheet({ post, open, onClose }) {
  const [q, setQ] = useState('');
  const [people, setPeople] = useState(null);
  const [picked, setPicked] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    setPicked([]); setText('');
    const t = setTimeout(async () => {
      try {
        const r = q.trim() ? await rc.search(q.trim()) : await rc.connections(useSession.getState().me.user.username, 'following');
        setPeople(r.data.items.filter((p) => !p.self));
      } catch { setPeople([]); }
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, q]);
  const toggle = (u) => setPicked((p) => (p.includes(u) ? p.filter((x) => x !== u) : p.length >= 20 ? p : [...p, u]));
  const send = async () => {
    setBusy(true);
    try { const r = await rc.share(post.id, picked, text); toast.success(`Terkirim ke ${r.data.sent} orang`); onClose(); } catch (err) { toast.error(errMsg(err, 'Gagal mengirim')); } finally { setBusy(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/p/${post.id}`); toast.success('Tautan disalin'); } catch { /* abaikan */ } };
  return (
    <Sheet open={open} onClose={onClose} title="Bagikan" size="md"
      footer={picked.length ? (
        <div className={styles.shareFoot}>
          <input className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis pesan…" maxLength={500} />
          <button type="button" className="btn btn-primary btn-block" onClick={send} disabled={busy}>{busy ? <Loader2 size={17} className="spin" /> : `Kirim${picked.length > 1 ? ` terpisah (${picked.length})` : ''}`}</button>
        </div>
      ) : <button type="button" className="btn btn-soft btn-block" onClick={copy}>Salin tautan</button>}>
      <div className={styles.shareSearch}>
        <Search size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari" aria-label="Cari teman" />
      </div>
      {people === null ? <Spinner /> : people.length === 0 ? <Empty title="Tidak ada hasil">Ikuti teman untuk mulai berbagi.</Empty> : (
        <div className={styles.shareGrid}>
          {people.map((p) => (
            <button key={p.username} type="button" className={styles.person} onClick={() => toggle(p.username)} aria-pressed={picked.includes(p.username)}>
              <span className={styles.personAv}><Avatar user={p} size={58} />{picked.includes(p.username) && <i className={styles.tick}><Check size={14} strokeWidth={3} /></i>}</span>
              <span className={styles.personName}>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

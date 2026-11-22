import { memo, useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Users2, Pin, Flag, Trash2, Link2, Pencil, MessageSquareOff, EyeOff } from 'lucide-react';
import { rc, errMsg, mediaUrl } from '@/lib/api.js';
import { compact, formatStatCount, agoLong, ago, tokenize } from '@/lib/format.js';
import { Avatar, Username, Sheet, MenuList } from './ui.jsx';
import { LikersModal } from './LikersModal.jsx';
import styles from './PostCard.module.css';

/** Teks dengan @sebutan & #tagar yang bisa diketuk. */
export function RichText({ text }) {
  return tokenize(text).map((p, i) => {
    if (p.t === 'mention') return <Link key={i} to={`/${p.v.slice(1).toLowerCase()}`} className={styles.mention}>{p.v}</Link>;
    if (p.t === 'tag') return <Link key={i} to={`/cari?q=${encodeURIComponent(p.v)}`} className={styles.mention}>{p.v}</Link>;
    if (p.t === 'url') return <a key={i} href={p.v} target="_blank" rel="noopener noreferrer nofollow" className={styles.mention}>{p.v.replace(/^https?:\/\//, '').slice(0, 40)}</a>;
    return <span key={i}>{p.v}</span>;
  });
}

/** Carousel media: geser (scroll-snap), titik penanda, ketuk dua kali untuk suka. */
export function Media({ media, onDoubleTap, ratio }) {
  const [i, setI] = useState(0);
  const [heart, setHeart] = useState(0);
  const strip = useRef(null);
  const lastTap = useRef(0);
  const first = media[0];
  // Rasio mengikuti media pertama: paling tegak 9:16, paling lebar 16:9, bawaan 3:4
  const r = ratio || (first?.width && first?.height ? Math.min(16 / 9, Math.max(9 / 16, first.width / first.height)) : 3 / 4);
  const tap = () => {
    const t = Date.now();
    if (t - lastTap.current < 300) { setHeart((h) => h + 1); onDoubleTap?.(); }
    lastTap.current = t;
  };
  const go = (n) => strip.current?.scrollTo({ left: n * strip.current.clientWidth, behavior: 'smooth' });
  return (
    <div className={styles.media} style={{ aspectRatio: r }} onClick={tap}>
      <div className={`${styles.strip} no-scrollbar`} ref={strip}
        onScroll={(e) => { const n = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth); if (n !== i) setI(n); }}>
        {media.map((m, n) => (
          <div key={m.id || n} className={styles.slide}>
            {m.kind === 'VIDEO'
              ? <video src={mediaUrl(m.url)} playsInline muted loop autoPlay={n === i} controls={false} preload="metadata" />
              : <img src={mediaUrl(m.url)} alt={m.alt || ''} loading={n === 0 ? 'eager' : 'lazy'} decoding="async" draggable="false" />}
          </div>
        ))}
      </div>
      {media.length > 1 && (
        <>
          <span className={styles.counter}>{i + 1}/{media.length}</span>
          {i > 0 && <button type="button" className={`${styles.arrow} ${styles.left}`} onClick={(e) => { e.stopPropagation(); go(i - 1); }} aria-label="Sebelumnya">‹</button>}
          {i < media.length - 1 && <button type="button" className={`${styles.arrow} ${styles.right}`} onClick={(e) => { e.stopPropagation(); go(i + 1); }} aria-label="Berikutnya">›</button>}
        </>
      )}
      {heart > 0 && <Heart key={heart} className={styles.burst} size={96} fill="#fff" strokeWidth={0} />}
      {media.length > 1 && (
        <div className={styles.dots} aria-hidden="true">{media.map((_, n) => <i key={n} className={n === i ? styles.dotOn : ''} />)}</div>
      )}
    </div>
  );
}

/** Tombol suka dengan animasi pegas; menyimpan status secara optimistis. */
export function useLike(post, onChange) {
  const [state, setState] = useState({ liked: post.liked, count: post.likeCount });
  const busy = useRef(false);
  const toggle = useCallback(async (force) => {
    const want = force ?? !state.liked;
    if (want === state.liked || busy.current) return;
    busy.current = true;
    setState((s) => ({ liked: want, count: Math.max(0, s.count + (want ? 1 : -1)) }));
    try {
      const r = await rc.like(post.id, want);
      setState({ liked: r.data.liked, count: r.data.likeCount });
      onChange?.({ liked: r.data.liked, likeCount: r.data.likeCount });
    } catch (err) {
      setState((s) => ({ liked: !want, count: Math.max(0, s.count + (want ? -1 : 1)) }));
      toast.error(errMsg(err, 'Gagal menyukai'));
    } finally { busy.current = false; }
  }, [post.id, state.liked, onChange]);
  return [state, toggle];
}

/** Kartu postingan di beranda. */
const PostCard = memo(function PostCard({ post, onOpen, onShare, onChange, onRemoved }) {
  const navigate = useNavigate();
  const [{ liked, count }, toggleLike] = useLike(post, onChange);
  const [saved, setSaved] = useState(post.saved);
  const [menu, setMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);
  const longCaption = post.caption.length > 140 || post.caption.split('\n').length > 2;

  const toggleSave = async () => {
    const want = !saved;
    setSaved(want);
    try { await rc.save(post.id, want); if (want) toast.success('Disimpan ke koleksimu'); } catch (err) { setSaved(!want); toast.error(errMsg(err, 'Gagal menyimpan')); }
  };
  const copyLink = async () => {
    setMenu(false);
    try { await navigator.clipboard.writeText(`${window.location.origin}/p/${post.id}`); toast.success('Tautan disalin'); } catch { toast.error('Gagal menyalin'); }
  };
  const remove = async () => {
    setMenu(false);
    if (!window.confirm('Hapus postingan ini? Tidak bisa dibatalkan.')) return;
    try { await rc.deletePost(post.id); toast.success('Postingan dihapus'); onRemoved?.(post.id); } catch (err) { toast.error(errMsg(err, 'Gagal menghapus')); }
  };
  const report = async () => {
    setMenu(false);
    const reason = window.prompt('Kenapa kamu melaporkan postingan ini?\n1 Spam  2 Perundungan  3 Tidak pantas  4 Tanda menyakiti diri  5 Lainnya', '3');
    const map = { 1: 'SPAM', 2: 'PELECEHAN', 3: 'KONTEN_TIDAK_PANTAS', 4: 'MENYAKITI_DIRI', 5: 'LAINNYA' };
    if (!map[reason]) return;
    try { const r = await rc.report({ targetType: 'RC_POST', targetId: post.id, reason: map[reason] }); toast.success(r.data.message); } catch (err) { toast.error(errMsg(err, 'Gagal melapor')); }
  };
  const toggleFlag = async (field, label) => {
    setMenu(false);
    try { const r = await rc.updatePost(post.id, { [field]: !post[field] }); onChange?.(r.data.post); toast.success(label); } catch (err) { toast.error(errMsg(err, 'Gagal menyimpan')); }
  };

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <Link to={`/${post.author.username}`}><Avatar user={post.author} size={36} /></Link>
        <div className={styles.headText}>
          <div className={styles.headLine}>
            <Username user={post.author} />
            <span className={styles.dotSep}>•</span>
            <time className="muted" dateTime={post.createdAt}>{ago(post.createdAt)}</time>
            {post.audience === 'CLOSE_FRIENDS' && <span className={styles.cfBadge} title="Hanya untuk teman dekat"><Users2 size={12} /></span>}
          </div>
          {post.tags?.length > 0 && <small className={styles.withLine}>bersama <Link to={`/${post.tags[0].username}`}><b>{post.tags[0].username}</b></Link>{post.tags.length > 1 ? ` dan ${post.tags.length - 1} lainnya` : ''}</small>}
        </div>
        {post.pinned && <Pin size={16} className={styles.pinIcon} aria-label="Disematkan" />}
        <button type="button" className="icon-btn" onClick={() => setMenu(true)} aria-label="Pilihan postingan"><MoreHorizontal size={20} /></button>
      </header>

      <Media media={post.media} onDoubleTap={() => toggleLike(true)} />

      <div className={styles.actions}>
        <div className={styles.actGroup}>
          <button type="button" className={`${styles.act} ${liked ? styles.liked : ''}`} onClick={() => toggleLike()} aria-label={liked ? 'Batal suka' : 'Suka'} aria-pressed={liked}>
            <Heart size={25} fill={liked ? 'currentColor' : 'none'} />
          </button>
          {!post.hideLikes && count > 0 && (
            <span className={styles.actCount} onClick={() => setLikersOpen(true)}>{formatStatCount(count)}</span>
          )}
        </div>

        <div className={styles.actGroup}>
          <button type="button" className={styles.act} onClick={() => onOpen?.(post)} aria-label="Komentar" disabled={post.commentsOff && !post.mine}>
            <MessageCircle size={25} />
          </button>
          {post.commentCount > 0 && (
            <span className={styles.actCount} onClick={() => onOpen?.(post)}>{formatStatCount(post.commentCount)}</span>
          )}
        </div>

        <div className={styles.actGroup}>
          <button type="button" className={styles.act} onClick={() => onShare?.(post)} aria-label="Bagikan">
            <Send size={24} />
          </button>
          {post.shareCount > 0 && (
            <span className={styles.actCount}>{formatStatCount(post.shareCount)}</span>
          )}
        </div>

        <button type="button" className={`${styles.act} ${styles.saveBtn} ${saved ? styles.saved : ''}`} onClick={toggleSave} aria-label={saved ? 'Hapus dari simpanan' : 'Simpan'} aria-pressed={saved}>
          <Bookmark size={25} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={styles.body}>
        {!post.hideLikes && count > 0 && (
          <button type="button" className={styles.likes} onClick={() => setLikersOpen(true)}>
            {post.likedBy && count > 1
              ? <>Disukai oleh <b>{post.likedBy.username}</b> dan <b>{compact(count - 1)} lainnya</b></>
              : <b>{compact(count)} suka</b>}
          </button>
        )}
        {post.caption && (
          <p className={`${styles.caption} ${!expanded && longCaption ? styles.clamp : ''}`}>
            <Username user={post.author} /> <RichText text={post.caption} />
          </p>
        )}
        {!expanded && longCaption && <button type="button" className={styles.more} onClick={() => setExpanded(true)}>selengkapnya</button>}
        {post.commentCount > 0 && (
          <button type="button" className={styles.viewComments} onClick={() => onOpen?.(post)}>
            Lihat {post.commentCount > 1 ? `semua ${compact(post.commentCount)} komentar` : '1 komentar'}
          </button>
        )}
        {post.previewComments?.slice(0, 2).map((c) => (
          <p key={c.id} className={styles.previewComment}><Username user={c.author} /> <RichText text={c.content} /></p>
        ))}
        {post.commentsOff && <p className="muted" style={{ fontSize: 13 }}>Komentar dimatikan.</p>}
        <time className={styles.time} dateTime={post.createdAt}>{agoLong(post.createdAt)}{post.editedAt ? ' · Diedit' : ''}</time>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} size="sm">
        <MenuList items={post.mine ? [
          { label: post.pinned ? 'Lepas sematan' : 'Sematkan ke profil', icon: <Pin size={19} />, onClick: () => toggleFlag('pinned', post.pinned ? 'Sematan dilepas' : 'Disematkan ke profil') },
          { label: post.hideLikes ? 'Tampilkan jumlah suka' : 'Sembunyikan jumlah suka', icon: <EyeOff size={19} />, onClick: () => toggleFlag('hideLikes', 'Tersimpan') },
          { label: post.commentsOff ? 'Nyalakan komentar' : 'Matikan komentar', icon: <MessageSquareOff size={19} />, onClick: () => toggleFlag('commentsOff', 'Tersimpan') },
          { label: 'Edit keterangan', icon: <Pencil size={19} />, onClick: () => { setMenu(false); navigate(`/p/${post.id}?edit=1`); } },
          { label: 'Salin tautan', icon: <Link2 size={19} />, onClick: copyLink },
          '-',
          { label: 'Hapus', icon: <Trash2 size={19} />, danger: true, onClick: remove }
        ] : [
          { label: 'Salin tautan', icon: <Link2 size={19} />, onClick: copyLink },
          { label: 'Kunjungi profil', icon: <Avatar user={post.author} size={22} />, onClick: () => { setMenu(false); navigate(`/${post.author.username}`); } },
          '-',
          { label: 'Laporkan', icon: <Flag size={19} />, danger: true, hint: 'Pengurus akan meninjau; identitasmu dirahasiakan', onClick: report }
        ]} />
      </Sheet>
      <LikersModal postId={post.id} open={likersOpen} onClose={() => setLikersOpen(false)} />
    </article>
  );
});

export function DesktopActions({ post, onShare, onChange }) {
  const [{ liked, count }, toggleLike] = useLike(post, onChange);
  const [saved, setSaved] = useState(post.saved);
  const [likersOpen, setLikersOpen] = useState(false);
  const toggleSave = async () => {
    const want = !saved;
    setSaved(want);
    try {
      await rc.save(post.id, want);
      onChange?.({ saved: want });
      if (want) toast.success('Disimpan ke koleksimu');
    } catch (err) {
      setSaved(!want);
      toast.error(errMsg(err, 'Gagal menyimpan'));
    }
  };
  return (
    <div className={styles.desktopActions}>
      <div className={styles.desktopActRow}>
        <div className={styles.desktopActGroup}>
          <button
            type="button"
            className={`${styles.desktopAct} ${liked ? styles.desktopLiked : ''}`}
            onClick={() => toggleLike()}
            aria-label={liked ? 'Batal suka' : 'Suka'}
            aria-pressed={liked}
          >
            <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
          </button>
          {!post.hideLikes && count > 0 && (
            <span className={styles.desktopActCount} onClick={() => setLikersOpen(true)}>
              {formatStatCount(count)}
            </span>
          )}
        </div>

        <div className={styles.desktopActGroup}>
          <button
            type="button"
            className={styles.desktopAct}
            onClick={() => document.querySelector('input[aria-label="Tulis komentar"]')?.focus()}
            aria-label="Komentar"
          >
            <MessageCircle size={24} />
          </button>
          {post.commentCount > 0 && (
            <span
              className={styles.desktopActCount}
              onClick={() => document.querySelector('input[aria-label="Tulis komentar"]')?.focus()}
            >
              {formatStatCount(post.commentCount)}
            </span>
          )}
        </div>

        <div className={styles.desktopActGroup}>
          <button type="button" className={styles.desktopAct} onClick={onShare} aria-label="Bagikan">
            <Send size={23} />
          </button>
          {post.shareCount > 0 && (
            <span className={styles.desktopActCount}>
              {formatStatCount(post.shareCount)}
            </span>
          )}
        </div>

        <button
          type="button"
          className={`${styles.desktopAct} ${styles.desktopSave} ${saved ? styles.desktopSaved : ''}`}
          onClick={toggleSave}
          aria-label={saved ? 'Hapus dari simpanan' : 'Simpan'}
          aria-pressed={saved}
        >
          <Bookmark size={24} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      {!post.hideLikes && count > 0 && (
        <button type="button" className={styles.desktopLikes} onClick={() => setLikersOpen(true)}>
          {post.likedBy && count > 1
            ? <>Disukai oleh <b>{post.likedBy.username}</b> dan <b>{compact(count - 1)} lainnya</b></>
            : <b>{compact(count)} suka</b>}
        </button>
      )}
      <time className={styles.desktopTime} dateTime={post.createdAt}>{agoLong(post.createdAt)}</time>
      <LikersModal postId={post.id} open={likersOpen} onClose={() => setLikersOpen(false)} />
    </div>
  );
}

export default PostCard;

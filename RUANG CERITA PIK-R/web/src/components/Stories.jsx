import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, Plus, Send, Eye, Trash2, MoreHorizontal, Users2, Pause, Play, Heart, ChevronUp, Search } from 'lucide-react';
import { rc, errMsg, mediaUrl } from '@/lib/api.js';
import { ago } from '@/lib/format.js';
import { useSession } from '@/lib/session.js';
import { useBackClose } from '@/lib/back.js';
import { Avatar, Sheet, Spinner, Empty } from './ui.jsx';
import styles from './Stories.module.css';

export const STORY_BG = {
  sunset: 'linear-gradient(160deg, #fb923c, #e11d48)',
  peach: 'linear-gradient(160deg, #fed7aa, #fb7185)',
  mint: 'linear-gradient(160deg, #34d399, #0d9488)',
  sky: 'linear-gradient(160deg, #60a5fa, #6366f1)',
  grape: 'linear-gradient(160deg, #c084fc, #7c3aed)',
  night: 'linear-gradient(160deg, #334155, #0f172a)',
  clay: 'linear-gradient(160deg, #f4f1ee, #e6ded6)'
};
const DURATION = 5500;
const EMOJIS = ['😂', '😮', '😍', '😢', '👏', '🔥', '🎉', '💯'];

/** Baki cerita di atas beranda. */
export function StoryTray({ onCreate, onOpen, refreshKey }) {
  const me = useSession((s) => s.me?.user);
  const [items, setItems] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    rc.stories().then((r) => alive && setItems(r.data.items)).catch(() => alive && setItems((x) => x || []));
    return () => { alive = false; };
  }, [refreshKey, tick]);
  useEffect(() => {
    const onVis = () => document.visibilityState === 'visible' && setTick((t) => t + 1);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  const mine = items?.find((g) => g.self);
  const others = items?.filter((g) => !g.self) || [];
  return (
    <div className={`${styles.tray} no-scrollbar`} role="list" aria-label="Cerita">
      <div className={styles.trayItem} role="listitem">
        <button type="button" className={styles.trayBtn} onClick={() => (mine ? onOpen(0, items) : onCreate())} aria-label={mine ? 'Lihat ceritamu' : 'Buat cerita'}>
          <Avatar user={me} size={62} ring={mine ? 'seen' : 'none'} />
          {!mine && <i className={styles.add}><Plus size={14} strokeWidth={3} /></i>}
        </button>
        {mine && <button type="button" className={styles.addSmall} onClick={onCreate} aria-label="Tambah cerita"><Plus size={13} strokeWidth={3} /></button>}
        <span className={styles.trayName}>Ceritamu</span>
      </div>
      {items === null
        ? Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.trayItem}><div className={`sk ${styles.skRing}`} /><div className="sk" style={{ width: 50, height: 10, marginTop: 6 }} /></div>)
        : others.map((g) => (
          <div key={g.user.username} className={styles.trayItem} role="listitem">
            <button type="button" className={styles.trayBtn} onClick={() => onOpen(items.indexOf(g), items)} aria-label={`Cerita ${g.user.username}`}>
              <Avatar user={g.user} size={62} ring={g.unseen ? (g.closeFriends ? 'cf' : 'story') : 'seen'} />
            </button>
            <span className={`${styles.trayName} ${g.unseen ? '' : styles.seenName}`}>{g.user.username}</span>
          </div>
        ))}
    </div>
  );
}

/**
 * Penampil cerita layar penuh.
 * Ketuk kanan/kiri = berikut/sebelumnya, tahan = jeda, geser ke bawah = tutup, geser kiri/kanan = ganti akun.
 */
export function StoryViewer({ groups, startIndex, onClose, onChanged }) {
  const navigate = useNavigate();
  const me = useSession((s) => s.me?.user);
  const [gi, setGi] = useState(startIndex);
  const [data, setData] = useState(null);
  const [si, setSi] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reply, setReply] = useState('');
  const [viewersOpen, setViewersOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [floating, setFloating] = useState(null);
  const raf = useRef(0);
  const start = useRef(0);
  const elapsed = useRef(0);
  const touch = useRef(null);
  const videoRef = useRef(null);
  useBackClose(true, onClose);

  const group = groups[gi];
  const story = data?.items?.[si];
  const isMine = !!(
    group?.self ||
    (me?.username && (group?.user?.username === me.username || data?.user?.username === me.username)) ||
    (me?.id && (group?.user?.id === me.id || data?.user?.id === me.id))
  );
  const hold = paused || viewersOpen || menu || !!reply;

  // Muat cerita akun yang aktif; mulai dari yang belum ditonton
  useEffect(() => {
    if (!group) { onClose(); return; }
    let alive = true;
    setData(null); setProgress(0); elapsed.current = 0;
    rc.userStories(group.user.username).then((r) => {
      if (!alive) return;
      if (!r.data.items.length) { next(); return; }
      setData(r.data);
      const firstUnseen = r.data.items.findIndex((s) => !s.seen);
      setSi(isMine || firstUnseen < 0 ? 0 : firstUnseen);
    }).catch((err) => { toast.error(errMsg(err)); next(); });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi]);

  const next = useCallback(() => {
    setSi((i) => {
      if (data && i < data.items.length - 1) return i + 1;
      if (gi < groups.length - 1) setGi(gi + 1); else onClose();
      return i;
    });
    elapsed.current = 0; setProgress(0);
  }, [data, gi, groups.length, onClose]);
  const prev = () => {
    elapsed.current = 0; setProgress(0);
    if (si > 0) setSi(si - 1);
    else if (gi > 0) setGi(gi - 1);
  };

  // Tandai ditonton
  useEffect(() => {
    if (story && !isMine && !story.seen) {
      rc.viewStory(story.id).catch(() => {});
      story.seen = true;
      onChanged?.();
    }
  }, [story, isMine, onChanged]);

  // Pengatur waktu (video: mengikuti durasi video)
  useEffect(() => {
    if (!story) return undefined;
    cancelAnimationFrame(raf.current);
    if (hold) { videoRef.current?.pause(); return undefined; }
    videoRef.current?.play().catch(() => {});
    start.current = performance.now() - elapsed.current;
    const dur = story.kind === 'VIDEO' && videoRef.current?.duration ? videoRef.current.duration * 1000 : DURATION;
    const tick = (t) => {
      elapsed.current = t - start.current;
      const p = Math.min(1, elapsed.current / dur);
      setProgress(p);
      if (p >= 1) next(); else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [story, hold, next]);

  const onTouchStart = (e) => {
    const p = e.touches?.[0] || e;
    touch.current = { x: p.clientX, y: p.clientY, t: Date.now() };
    setPaused(true);
  };
  const onTouchEnd = (e) => {
    const p = e.changedTouches?.[0] || e;
    const t0 = touch.current;
    touch.current = null;
    setPaused(false);
    if (!t0) return;
    const dx = p.clientX - t0.x, dy = p.clientY - t0.y, dt = Date.now() - t0.t;
    if (dy > 90 && Math.abs(dx) < 80) { onClose(); return; }
    // Geser ke atas (Swipe Up) oleh pemilik cerita untuk membuka insight & daftar penonton
    if (dy < -60 && Math.abs(dx) < 80) {
      if (isMine) {
        setViewersOpen(true);
        return;
      }
    }
    if (Math.abs(dx) > 70 && Math.abs(dy) < 80) { if (dx < 0) { if (gi < groups.length - 1) setGi(gi + 1); else onClose(); } else if (gi > 0) setGi(gi - 1); return; }
    if (dt < 250 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      if (p.clientX < window.innerWidth * 0.33) prev(); else next();
    }
  };

  const like = async () => {
    const next = !story.liked;
    story.liked = next;
    setData((d) => ({ ...d }));
    if (next) { setFloating({ emoji: '❤️', k: Date.now() }); navigator.vibrate?.(8); }
    try { await rc.likeStory(story.id, next); } catch (err) { story.liked = !next; setData((d) => ({ ...d })); toast.error(errMsg(err)); }
  };
  const react = async (emoji) => {
    setFloating({ emoji, k: Date.now() });
    try { await rc.reactStory(story.id, emoji); } catch (err) { toast.error(errMsg(err)); }
  };
  const sendReply = async (e) => {
    e.preventDefault();
    const text = reply.trim();
    if (!text) return;
    try { await rc.replyStory(story.id, text); setReply(''); toast.success('Balasan terkirim ke Pesan'); } catch (err) { toast.error(errMsg(err)); }
  };
  const answer = async (opt) => {
    try {
      await rc.viewStory(story.id, opt);
      const r = await rc.userStories(group.user.username);
      setData(r.data);
    } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async () => {
    setMenu(false);
    if (!window.confirm('Hapus cerita ini?')) return;
    try { await rc.deleteStory(story.id); toast.success('Cerita dihapus'); onChanged?.(); const left = data.items.filter((s) => s.id !== story.id); if (!left.length) onClose(); else { setData({ ...data, items: left }); setSi(Math.min(si, left.length - 1)); } } catch (err) { toast.error(errMsg(err)); }
  };
  const report = async () => {
    setMenu(false);
    if (!window.confirm('Laporkan cerita ini ke pengurus?')) return;
    try { const r = await rc.report({ targetType: 'RC_STORY', targetId: story.id, reason: 'KONTEN_TIDAK_PANTAS' }); toast.success(r.data.message); } catch (err) { toast.error(errMsg(err)); }
  };

  const sticker = story?.sticker;
  return createPortal(
    <div className={styles.viewer} role="dialog" aria-label="Cerita">
      <div className={styles.stage}>
        {!data || !story ? <div className={styles.loading}><Spinner /></div> : (
          <>
            <div className={styles.bars}>
              {data.items.map((s, i) => <i key={s.id}><b style={{ transform: `scaleX(${i < si ? 1 : i === si ? progress : 0})` }} /></i>)}
            </div>
            <header className={styles.vhead}>
              <button type="button" className={styles.vuser} onClick={() => { onClose(); navigate(`/${data.user.username}`); }}>
                <Avatar user={data.user} size={34} />
                <b>{data.user.username}</b>
                <span>{ago(story.createdAt)}</span>
                {story.audience === 'CLOSE_FRIENDS' && <span className={styles.cf}><Users2 size={11} /> Teman Dekat</span>}
              </button>
              <button type="button" className={styles.vbtn} onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Lanjutkan' : 'Jeda'}>{paused ? <Play size={20} /> : <Pause size={20} />}</button>
              <button type="button" className={styles.vbtn} onClick={() => setMenu(true)} aria-label="Pilihan"><MoreHorizontal size={22} /></button>
              <button type="button" className={styles.vbtn} onClick={onClose} aria-label="Tutup"><X size={24} /></button>
            </header>

            <div className={styles.content} key={story.id}
              onPointerDown={onTouchStart} onPointerUp={onTouchEnd} onPointerCancel={() => { touch.current = null; setPaused(false); }}
              onContextMenu={(e) => e.preventDefault()}>
              {story.kind === 'IMAGE' && (
                <div className={styles.imageStoryWrap}>
                  <div className={styles.storyBgBlur} style={{ backgroundImage: `url(${mediaUrl(story.url)})` }} />
                  <img src={mediaUrl(story.url)} alt="" draggable="false" className={styles.storyImgCentered} />
                </div>
              )}
              {story.kind === 'VIDEO' && <video ref={videoRef} src={mediaUrl(story.url)} playsInline autoPlay muted={false} />}
              {story.kind === 'TEXT' && (
                <div className={styles.textStory} style={{ background: STORY_BG[story.bg] || STORY_BG.sunset }}>
                  <p className={story.bg === 'clay' ? styles.dark : ''}>{story.text}</p>
                </div>
              )}
              {story.kind !== 'TEXT' && story.text && <p className={styles.overlayText}>{story.text}</p>}
            </div>

            {sticker && (
              <div className={styles.sticker} onPointerDown={(e) => e.stopPropagation()}>
                <b>{sticker.q}</b>
                {sticker.type === 'poll' && (
                  <div className={styles.poll}>
                    {sticker.options.map((o, i) => {
                      const total = (story.pollCounts || []).reduce((a, b) => a + b, 0);
                      const pct = story.pollCounts && total ? Math.round((story.pollCounts[i] / total) * 100) : null;
                      return (
                        <button key={o} type="button" disabled={isMine || !!story.myAnswer} onClick={() => answer(o)} className={story.myAnswer === o ? styles.pollMine : ''}>
                          {pct !== null && <i style={{ width: `${pct}%` }} />}
                          <span>{o}</span>{pct !== null && <em>{pct}%</em>}
                        </button>
                      );
                    })}
                  </div>
                )}
                {sticker.type === 'question' && !isMine && (
                  <form className={styles.question} onSubmit={(e) => { e.preventDefault(); const v = e.currentTarget.elements.a.value.trim(); if (v) { answer(v); e.currentTarget.reset(); toast.success('Jawaban terkirim'); } }}>
                    <input name="a" placeholder="Ketik jawabanmu…" maxLength={200} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} />
                  </form>
                )}
              </div>
            )}

            {floating && <span key={floating.k} className={styles.floatEmoji}>{floating.emoji}</span>}

            <footer className={styles.vfoot}>
              {isMine ? (
                <div className={styles.vfootMine}>
                  <button type="button" className={styles.viewersBtn} onClick={() => setViewersOpen(true)} aria-label="Lihat aktivitas penonton">
                    <div className={styles.viewersBtnLeft}>
                      <ChevronUp size={16} className={styles.chevronHint} />
                      <Eye size={17} />
                      <span>{story.viewCount || 0} penonton</span>
                      {story.likeCount > 0 && (
                        <>
                          <span className={styles.dotSep} />
                          <Heart size={15} fill="#ff3b5c" color="#ff3b5c" />
                          <span>{story.likeCount}</span>
                        </>
                      )}
                    </div>
                    <span className={styles.viewersSwipeHint}>Aktivitas</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.emojis}>{EMOJIS.map((e) => <button key={e} type="button" onClick={() => react(e)}>{e}</button>)}</div>
                  <form className={styles.replyForm} onSubmit={sendReply}>
                    <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Balas ${data.user.username}…`} maxLength={1000} />
                    {reply.trim()
                      ? <button type="submit" aria-label="Kirim"><Send size={20} /></button>
                      : <button type="button" className={`${styles.likeBtn} ${story.liked ? styles.liked : ''}`} onClick={like} aria-pressed={!!story.liked} aria-label={story.liked ? 'Batal suka' : 'Suka cerita'}>
                          <Heart size={26} fill={story.liked ? 'currentColor' : 'none'} />
                        </button>}
                  </form>
                </>
              )}
            </footer>
          </>
        )}
      </div>
      <button type="button" className={`${styles.navBtn} ${styles.navPrev}`} onClick={prev} aria-label="Sebelumnya" disabled={gi === 0 && si === 0}>‹</button>
      <button type="button" className={`${styles.navBtn} ${styles.navNext}`} onClick={next} aria-label="Berikutnya">›</button>

      {isMine && story && <ViewersSheet storyId={story.id} open={viewersOpen} onClose={() => setViewersOpen(false)} onDeleteStory={remove} />}
      <Sheet open={menu} onClose={() => setMenu(false)} size="sm">
        <div style={{ padding: 6 }}>
          {isMine
            ? <button type="button" className="btn btn-danger btn-block" onClick={remove}><Trash2 size={17} /> Hapus cerita</button>
            : <button type="button" className="btn btn-soft btn-block" onClick={report}>Laporkan cerita</button>}
        </div>
      </Sheet>
    </div>,
    document.body
  );
}

/** Insight cerita (hanya pemilik): jumlah penonton & suka, daftar penonton dengan tanda suka/reaksi/jawaban. */
function ViewersSheet({ storyId, open, onClose, onDeleteStory }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setData(null);
    setTab('all');
    setQuery('');
    rc.storyViewers(storyId)
      .then((r) => setData(r.data))
      .catch(() => setData({ items: [], viewCount: 0, likeCount: 0 }));
  }, [open, storyId]);

  const baseList = data ? (tab === 'liked' ? data.items.filter((v) => v.liked) : data.items) : [];
  const q = query.trim().toLowerCase();
  const list = q
    ? baseList.filter((v) => v.user.username.toLowerCase().includes(q) || (v.user.name || '').toLowerCase().includes(q))
    : baseList;

  return (
    <Sheet open={open} onClose={onClose} title="Aktivitas Cerita" size="sm">
      {data === null ? (
        <div style={{ padding: '28px 0', display: 'grid', placeItems: 'center' }}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className={styles.insight}>
            <button
              type="button"
              className={tab === 'all' ? styles.insightOn : ''}
              onClick={() => setTab('all')}
            >
              <Eye size={20} />
              <b>{data.viewCount || 0}</b>
              <small>Penonton</small>
            </button>
            <button
              type="button"
              className={tab === 'liked' ? styles.insightOn : ''}
              onClick={() => setTab('liked')}
            >
              <Heart size={20} className={styles.likeIc} fill={data.likeCount > 0 ? 'currentColor' : 'none'} />
              <b>{data.likeCount || 0}</b>
              <small>Menyukai</small>
            </button>
          </div>

          {data.items.length > 3 && (
            <div className={styles.searchBox}>
              <Search size={15} style={{ opacity: 0.6 }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari penonton…"
              />
              {query && (
                <button type="button" className={styles.clearBtn} onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {list.length === 0 ? (
            <Empty
              icon={tab === 'liked' ? <Heart size={28} style={{ opacity: 0.5 }} /> : <Eye size={28} style={{ opacity: 0.5 }} />}
              title={
                query
                  ? 'Tidak ada hasil'
                  : tab === 'liked'
                  ? 'Belum ada yang menyukai'
                  : 'Belum ada penonton'
              }
            >
              {query
                ? `Tidak ada penonton yang cocok dengan "${query}".`
                : tab === 'liked'
                ? 'Yang menyukai ceritamu akan muncul di sini.'
                : 'Penonton yang melihat ceritamu akan muncul di sini.'}
            </Empty>
          ) : (
            <ul className={styles.viewerList}>
              {list.map((v) => (
                <li key={v.user.username}>
                  <Link to={`/${v.user.username}`} onClick={onClose} className={styles.viewerLink}>
                    <span className={styles.vAv}>
                      <Avatar user={v.user} size={42} />
                      {v.liked && (
                        <i className={styles.vLike} title="Menyukai cerita ini">
                          <Heart size={10} fill="#fff" strokeWidth={0} />
                        </i>
                      )}
                    </span>
                    <span className={styles.vDetails}>
                      <b>{v.user.username}</b>
                      <small>
                        {v.user.name ? `${v.user.name} · ` : ''}
                        {ago(v.at)}
                      </small>
                      {v.answer && (
                        <span className={styles.vAnswerBadge}>
                          💬 "{v.answer}"
                        </span>
                      )}
                    </span>
                    <div className={styles.vActionRight}>
                      {v.reaction && (
                        <span className={styles.vReactionEmoji} title="Reaksi emoji">
                          {v.reaction}
                        </span>
                      )}
                      {v.liked && (
                        <Heart size={18} fill="#ff3b5c" color="#ff3b5c" className={styles.vLikedHeart} />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.insightFooter}>
            <p className={styles.insightNote}>
              🔒 Khusus Anda: Hanya Anda yang dapat melihat daftar penonton dan siapa saja yang menyukai cerita ini.
            </p>
            {onDeleteStory && (
              <button type="button" className={styles.deleteStoryShortBtn} onClick={onDeleteStory}>
                <Trash2 size={15} /> Hapus Cerita Ini
              </button>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}

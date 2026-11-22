import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search as SearchIcon, X, Heart, MessageCircle, Send, Layers, ChevronLeft, Lock, MessageSquare, Moon, Eye, Ban, BellOff, Shield, Star, Bookmark, Check, Loader2, Archive as ArchiveIcon, UserPlus } from 'lucide-react';
import { rc, errMsg, mediaUrl } from '@/lib/api.js';
import { ago, agoLong, compact } from '@/lib/format.js';
import { useSession } from '@/lib/session.js';
import { refreshBadges } from '@/lib/live.js';
import { Avatar, Username, Empty, Spinner, Sheet } from '@/components/ui.jsx';
import PostCard, { Media, RichText, useLike } from '@/components/PostCard.jsx';
import { CommentPanel, CommentsSheet, ShareSheet } from '@/components/Comments.jsx';
import { PostDesktopView } from '@/components/PostModal.jsx';
import { STORY_BG } from '@/components/Stories.jsx';
import { Suggestions } from './Home.jsx';
import styles from './More.module.css';

/* ── Cari & Jelajah ─────────────────────────────────────────────────────── */
export function SearchPage({ explore = false }) {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [results, setResults] = useState(null);
  const [grid, setGrid] = useState(null);
  useEffect(() => { rc.explore().then((r) => setGrid(r.data.items)).catch(() => setGrid([])); }, []);
  useEffect(() => {
    const term = q.trim();
    if (!term || term.startsWith('#')) { setResults(null); return undefined; }
    const t = setTimeout(() => rc.search(term).then((r) => setResults(r.data.items)).catch(() => setResults([])), 250);
    return () => clearTimeout(t);
  }, [q]);
  const tag = q.trim().startsWith('#') ? q.trim().toLowerCase() : null;
  const shown = tag ? (grid || []).filter((p) => p.caption.toLowerCase().includes(tag)) : grid;
  return (
    <div className={styles.page}>
      {!explore && (
        <div className={styles.searchBar}>
          <SearchIcon size={18} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }); }} placeholder="Cari nama, @username, atau #tagar" aria-label="Cari" autoFocus={!q} />
          {q && <button type="button" onClick={() => { setQ(''); setParams({}, { replace: true }); }} aria-label="Hapus"><X size={16} /></button>}
        </div>
      )}
      {results ? (
        results.length === 0 ? <Empty title="Tidak ada hasil">Coba ejaan lain atau cari dengan username.</Empty> : (
          <ul className={styles.people}>
            {results.map((u) => (
              <li key={u.username}><Link to={`/${u.username}`}><Avatar user={u} size={48} /><span><Username user={u} link={false} /><small>{u.name}{u.className ? ` · ${u.className}` : ''}{u.following ? ' · Mengikuti' : ''}</small></span></Link></li>
            ))}
          </ul>
        )
      ) : (
        <>
          {!tag && <Suggestions compact />}
          {tag && <h2 className={styles.tagTitle}>{tag}</h2>}
          {shown === null ? <div className={styles.grid}>{Array.from({ length: 9 }, (_, i) => <div key={i} className={`sk ${styles.tile}`} />)}</div>
            : shown.length === 0 ? <Empty title={tag ? 'Belum ada postingan dengan tagar ini' : 'Belum ada yang bisa dijelajahi'}>{tag ? null : 'Postingan publik dari anggota yang belum kamu ikuti akan muncul di sini.'}</Empty>
            : (
              <div className={styles.grid}>
                {shown.map((p, i) => (
                  <Link key={p.id} to={`/p/${p.id}`} className={`${styles.tile} ${i % 10 === 2 ? styles.tall : ''}`}>
                    <img src={mediaUrl(p.media[0]?.thumb || p.media[0]?.url)} alt="" loading="lazy" />
                    {p.media.length > 1 && <Layers size={18} className={styles.multi} />}
                    <span className={styles.hover}><Heart size={17} fill="#fff" /> {compact(p.likeCount)} <MessageCircle size={17} fill="#fff" /> {compact(p.commentCount)}</span>
                  </Link>
                ))}
              </div>
            )}
        </>
      )}
    </div>
  );
}

/* ── Aktivitas (notifikasi) ─────────────────────────────────────────────── */
const NOTIF_TEXT = {
  LIKE: 'menyukai postinganmu.', COMMENT: 'mengomentari:', REPLY: 'membalas komentarmu:', FOLLOW: 'mulai mengikutimu.',
  FOLLOW_REQUEST: 'ingin mengikutimu.', FOLLOW_ACCEPT: 'menerima permintaan mengikutimu.', MENTION: 'menyebutmu:', TAG: 'menandaimu di postingan.',
  STORY_REACT: 'bereaksi ke ceritamu', STORY_LIKE: 'menyukai ceritamu.', COUNSEL: ''
};
function bucket(d) {
  const h = (Date.now() - new Date(d)) / 3.6e6;
  return h < 24 ? 'Hari ini' : h < 24 * 7 ? 'Minggu ini' : h < 24 * 30 ? 'Bulan ini' : 'Sebelumnya';
}
export function ActivityPage() {
  const navigate = useNavigate();
  const me = useSession((s) => s.me);
  const [items, setItems] = useState(null);
  const [requests, setRequests] = useState([]);
  const [reqOpen, setReqOpen] = useState(false);
  const load = useCallback(() => {
    rc.notifications().then((r) => setItems(r.data.items)).catch(() => setItems([]));
    rc.followRequests().then((r) => setRequests(r.data.items)).catch(() => {});
  }, []);
  useEffect(() => { load(); rc.readNotifications().then(refreshBadges).catch(() => {}); }, [load]);
  const followBack = async (n) => {
    try { await rc.follow(n.actor.username); setItems((l) => l.map((x) => (x.actor?.username === n.actor.username ? { ...x, actor: { ...x.actor, following: true } } : x))); } catch (err) { toast.error(errMsg(err)); }
  };
  const answer = async (r, accept) => {
    try { await rc.answerRequest(r.id, accept); setRequests((l) => l.filter((x) => x.id !== r.id)); refreshBadges(); toast.success(accept ? 'Permintaan diterima' : 'Permintaan dihapus'); } catch (err) { toast.error(errMsg(err)); }
  };
  const groups = {};
  for (const n of items || []) (groups[bucket(n.createdAt)] ||= []).push(n);
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notifikasi</h1>
      {requests.length > 0 && (
        <button type="button" className={styles.reqRow} onClick={() => setReqOpen(true)}>
          <span className={styles.reqAv}><Avatar user={requests[0].user} size={44} /></span>
          <span><b>Permintaan mengikuti</b><small>{requests[0].user.username}{requests.length > 1 ? ` + ${requests.length - 1} lainnya` : ''}</small></span>
          <i className={styles.reqDot} />
        </button>
      )}
      {items === null ? <Spinner /> : items.length === 0 ? <Empty icon={<Heart size={30} />} title="Belum ada aktivitas">Saat teman menyukai atau mengomentari postinganmu, kamu akan melihatnya di sini.</Empty> : (
        Object.entries(groups).map(([label, list]) => (
          <section key={label} className={styles.nGroup}>
            <h2>{label}</h2>
            {list.map((n) => (
              <div key={n.id} className={`${styles.nRow} ${n.read ? '' : styles.nUnread}`}
                onClick={() => (n.postId ? navigate(`/p/${n.postId}`) : n.type === 'COUNSEL' ? navigate('/konseling') : n.actor && navigate(`/${n.actor.username}`))} role="button" tabIndex={0}>
                {n.actor ? <Avatar user={n.actor} size={44} /> : <span className={styles.sysAv}><MessageSquare size={20} /></span>}
                <p>{n.actor && <b>{n.actor.username} </b>}{NOTIF_TEXT[n.type]}{n.text && n.type !== 'STORY_LIKE' ? <> {n.type === 'COUNSEL' ? n.text : <q>{n.text}</q>}</> : ''} <span className="muted">{ago(n.createdAt)}</span></p>
                {n.thumb ? <img src={mediaUrl(n.thumb)} alt="" className={styles.nThumb} />
                  : n.type === 'FOLLOW' && n.actor && !n.actor.following ? <button type="button" className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); followBack(n); }}>Ikuti balik</button>
                  : null}
              </div>
            ))}
          </section>
        ))
      )}
      <Sheet open={reqOpen} onClose={() => setReqOpen(false)} title="Permintaan mengikuti" size="sm">
        {requests.length === 0 ? <Empty title="Semua sudah ditanggapi" /> : (
          <ul className={styles.people}>
            {requests.map((r) => (
              <li key={r.id} className={styles.reqItem}>
                <Link to={`/${r.user.username}`} onClick={() => setReqOpen(false)}><Avatar user={r.user} size={44} /><span><b>{r.user.username}</b><small>{r.user.name}</small></span></Link>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => answer(r, true)}>Terima</button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => answer(r, false)}>Hapus</button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </div>
  );
}

/* ── Postingan (detail) ─────────────────────────────────────────────────── */
export function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [post, setPost] = useState(null);
  const [share, setShare] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [morePosts, setMorePosts] = useState(null);
  const [editing, setEditing] = useState(params.get('edit') === '1');
  const [caption, setCaption] = useState('');

  useEffect(() => {
    rc.post(id)
      .then((r) => {
        setPost(r.data.post);
        setCaption(r.data.post.caption);
        if (r.data.post?.author?.username) {
          rc.userPosts(r.data.post.author.username)
            .then((res) => {
              const others = (res.data.items || []).filter((x) => x.id !== id);
              setMorePosts(others);
            })
            .catch(() => setMorePosts([]));
        }
      })
      .catch((err) => {
        toast.error(errMsg(err));
        navigate('/');
      });
  }, [id, navigate]);

  if (!post) return <Spinner />;

  const saveCaption = async () => {
    try {
      const r = await rc.updatePost(id, { caption });
      setPost(r.data.post);
      setEditing(false);
      toast.success('Keterangan diperbarui');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className={styles.postPage}>
      <button type="button" className={`icon-btn ${styles.back}`} onClick={() => navigate(-1)} aria-label="Kembali">
        <ChevronLeft size={26} />
      </button>

      {/* Tampilan Mobile: Kartu post + Postingan lainnya di bawah */}
      <div className={styles.postMobile}>
        <PostCard
          post={post}
          onShare={() => setShare(true)}
          onOpen={() => setCommentsOpen(true)}
          onChange={(p) => setPost((x) => ({ ...x, ...p }))}
          onRemoved={() => navigate('/')}
        />

        <div className={styles.moreFromUser}>
          <div className={styles.moreHeader}>
            Postingan lainnya dari <Link to={`/${post.author.username}`}><b>{post.author.username}</b></Link>
          </div>
          {morePosts === null ? (
            <div className={styles.moreGrid}>
              {Array.from({ length: 6 }, (_, i) => <div key={i} className={`sk ${styles.tileSk}`} />)}
            </div>
          ) : morePosts.length === 0 ? (
            <p className={styles.moreEmpty}>Belum ada postingan lainnya.</p>
          ) : (
            <div className={styles.moreGrid}>
              {morePosts.map((item) => (
                <Link key={item.id} to={`/p/${item.id}`} className={styles.moreTile}>
                  <img src={mediaUrl(item.media[0]?.thumb || item.media[0]?.url)} alt={item.media[0]?.alt || ''} loading="lazy" />
                  {item.media.length > 1 && <Layers size={16} className={styles.moreTileMulti} />}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tampilan Desktop */}
      <div className={styles.postDesktopContainer}>
        <PostDesktopView post={post} onShare={() => setShare(true)} onChange={(p) => setPost((x) => ({ ...x, ...p }))} />
      </div>

      {/* Popup Komentar Mobile: Meluncur dari Bawah ke Atas */}
      <CommentsSheet
        post={post}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCount={(delta) => setPost((p) => ({ ...p, commentCount: Math.max(0, p.commentCount + delta) }))}
      />

      {editing && post.mine && (
        <Sheet open onClose={() => setEditing(false)} title="Edit keterangan" size="md" footer={<button type="button" className="btn btn-primary btn-block" onClick={saveCaption}>Simpan</button>}>
          <div style={{ padding: 16 }}><textarea className="field" rows={6} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2200} /></div>
        </Sheet>
      )}
      {share && <ShareSheet post={post} open={share} onClose={() => setShare(false)} />}
    </div>
  );
}

function DesktopActions({ post, onShare, onChange }) {
  const [{ liked, count }, toggleLike] = useLike(post, onChange);
  const [saved, setSaved] = useState(post.saved);
  const toggleSave = async () => {
    const want = !saved;
    setSaved(want);
    try { await rc.save(post.id, want); if (want) toast.success('Disimpan ke koleksimu'); } catch (err) { setSaved(!want); toast.error(errMsg(err, 'Gagal menyimpan')); }
  };
  return (
    <div className={styles.desktopActions}>
      <div className={styles.desktopActRow}>
        <button type="button" className={`${styles.desktopAct} ${liked ? styles.desktopLiked : ''}`} onClick={() => toggleLike()} aria-label={liked ? 'Batal suka' : 'Suka'} aria-pressed={liked}>
          <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button type="button" className={styles.desktopAct} onClick={() => document.querySelector(`.${styles.postComments} input`)?.focus()} aria-label="Komentar">
          <MessageCircle size={24} />
        </button>
        <button type="button" className={styles.desktopAct} onClick={onShare} aria-label="Bagikan">
          <Send size={23} />
        </button>
        <button type="button" className={`${styles.desktopAct} ${styles.desktopSave} ${saved ? styles.desktopSaved : ''}`} onClick={toggleSave} aria-label={saved ? 'Hapus dari simpanan' : 'Simpan'} aria-pressed={saved}>
          <Bookmark size={24} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      {!post.hideLikes && count > 0 && (
        <div className={styles.desktopLikes}>
          <b>{compact(count)} suka</b>
        </div>
      )}
      <time className={styles.desktopTime} dateTime={post.createdAt}>{agoLong(post.createdAt)}</time>
    </div>
  );
}

export function LikersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  useEffect(() => { rc.likers(id).then((r) => setItems(r.data.items)).catch(() => setItems([])); }, [id]);
  return (
    <div className={styles.page}>
      <header className={styles.subHead}><button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Kembali"><ChevronLeft size={26} /></button><h1>Suka</h1></header>
      {items === null ? <Spinner /> : <ul className={styles.people}>{items.map((u) => <li key={u.username}><Link to={`/${u.username}`}><Avatar user={u} size={44} /><span><b>{u.username}</b><small>{u.name}</small></span></Link></li>)}</ul>}
    </div>
  );
}

/* ── Disimpan ───────────────────────────────────────────────────────────── */
export function SavedPage() {
  const [items, setItems] = useState(null);
  useEffect(() => { rc.saved().then((r) => setItems(r.data.items)).catch(() => setItems([])); }, []);
  return (
    <div className={styles.page}>
      <h1 className={styles.title}><Bookmark size={22} /> Disimpan</h1>
      <p className={styles.note}>Hanya kamu yang bisa melihat postingan yang kamu simpan.</p>
      {items === null ? <Spinner /> : items.length === 0 ? <Empty icon={<Bookmark size={30} />} title="Belum ada yang disimpan">Ketuk ikon simpan di postingan untuk mengumpulkannya di sini.</Empty> : (
        <div className={styles.grid}>{items.map((p) => <Link key={p.id} to={`/p/${p.id}`} className={styles.tile}><img src={mediaUrl(p.media[0]?.thumb || p.media[0]?.url)} alt="" loading="lazy" /></Link>)}</div>
      )}
    </div>
  );
}

/* ── Arsip cerita & membuat sorotan ─────────────────────────────────────── */
export function ArchivePage() {
  const navigate = useNavigate();
  const me = useSession((s) => s.me?.user);
  const [items, setItems] = useState(null);
  const [picked, setPicked] = useState([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { rc.archive().then((r) => setItems(r.data.items)).catch(() => setItems([])); }, []);
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const save = async () => {
    setBusy(true);
    try { await rc.saveHighlight({ title: title || 'Sorotan', storyIds: picked }); toast.success('Sorotan dibuat'); navigate('/profil'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <div className={styles.page}>
      <header className={styles.subHead}><button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Kembali"><ChevronLeft size={26} /></button><h1><ArchiveIcon size={20} /> Arsip cerita</h1></header>
      <p className={styles.note}>Cerita yang sudah lewat 24 jam tersimpan di sini dan hanya terlihat olehmu. Pilih beberapa untuk dijadikan Sorotan di profil.</p>
      {items === null ? <Spinner /> : items.length === 0 ? <Empty icon={<ArchiveIcon size={30} />} title="Arsip masih kosong">Cerita yang kamu bagikan akan tersimpan di sini.</Empty> : (
        <div className={styles.archiveGrid}>
          {items.map((s) => (
            <button key={s.id} type="button" className={`${styles.archItem} ${picked.includes(s.id) ? styles.archOn : ''}`} onClick={() => toggle(s.id)}>
              {s.kind === 'IMAGE' ? <img src={mediaUrl(s.url)} alt="" loading="lazy" /> : s.kind === 'VIDEO' ? <video src={mediaUrl(s.url)} muted /> : <span className={styles.archText} style={{ background: STORY_BG[s.bg] || STORY_BG.sunset }}>{s.text}</span>}
              <small>{new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</small>
              <i>{picked.includes(s.id) && <Check size={14} strokeWidth={3} />}</i>
            </button>
          ))}
        </div>
      )}
      {picked.length > 0 && (
        <div className={styles.archBar}>
          <input className="field" placeholder="Nama sorotan" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 24))} />
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : `Buat (${picked.length})`}</button>
        </div>
      )}
    </div>
  );
}

/* ── Pengaturan & privasi ───────────────────────────────────────────────── */
export function SettingsPage() {
  const me = useSession((s) => s.me);
  const patchMe = useSession((s) => s.patchMe);
  const [s, setS] = useState(me?.settings);
  const [rels, setRels] = useState(null);
  const [cf, setCf] = useState(null);
  useEffect(() => { rc.relations().then((r) => setRels(r.data)).catch(() => {}); rc.closeFriends().then((r) => setCf(r.data.items)).catch(() => {}); }, []);
  if (!s) return <Spinner />;
  const save = async (patch) => {
    const next = { ...s, ...patch };
    setS(next);
    try { const r = await rc.settings(patch); patchMe((m) => ({ ...m, settings: r.data.settings })); toast.success('Tersimpan'); } catch (err) { setS(s); toast.error(errMsg(err)); }
  };
  const undo = async (username, type) => {
    try { await rc.relation(username, type, false); const r = await rc.relations(); setRels(r.data); toast.success('Dibatalkan'); } catch (err) { toast.error(errMsg(err)); }
  };
  const Row = ({ icon, title, hint, children }) => (
    <div className={styles.setRow}><span className={styles.setIcon}>{icon}</span><span className={styles.setText}><b>{title}</b>{hint && <small>{hint}</small>}</span>{children}</div>
  );
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Pengaturan & privasi</h1>
      <section className={styles.setBlock}>
        <h2>Privasi akun</h2>
        <Row icon={<Lock size={19} />} title="Akun privat" hint="Hanya pengikut yang kamu setujui yang bisa melihat postingan & ceritamu. Disarankan untuk remaja.">
          <input type="checkbox" className={styles.switch} checked={s.isPrivate} onChange={(e) => save({ isPrivate: e.target.checked })} />
        </Row>
        <Row icon={<MessageSquare size={19} />} title="Siapa yang bisa mengirimimu pesan">
          <select className={styles.select} value={s.dmPolicy} onChange={(e) => save({ dmPolicy: e.target.value })}>
            <option value="FOLLOWING">Akun yang aku ikuti</option>
            <option value="EVERYONE">Semua anggota (lainnya masuk Permintaan)</option>
            <option value="NONE">Tidak ada</option>
          </select>
        </Row>
        <Row icon={<Eye size={19} />} title="Status aktivitas" hint="Tampilkan 'aktif sekarang' dan tanda dibaca. Bila dimatikan, kamu juga tidak melihat milik orang lain.">
          <input type="checkbox" className={styles.switch} checked={s.showActivity} onChange={(e) => save({ showActivity: e.target.checked })} />
        </Row>
      </section>
      <section className={styles.setBlock}>
        <h2>Kenyamanan</h2>
        <Row icon={<Shield size={19} />} title="Kata tersembunyi" hint="Komentar & permintaan pesan yang berisi kata ini disembunyikan. Pisahkan dengan koma. Kata kasar umum sudah disembunyikan otomatis.">
          <span />
        </Row>
        <textarea className="field" rows={2} defaultValue={s.hiddenWords} onBlur={(e) => e.target.value !== s.hiddenWords && save({ hiddenWords: e.target.value })} placeholder="mis. jelek, gendut" />
        <Row icon={<Moon size={19} />} title="Mode tenang" hint="Pengingat lembut untuk istirahat di jam ini (misalnya jam tidur).">
          <span className={styles.times}>
            <input type="time" value={s.quietStart || ''} onChange={(e) => save({ quietStart: e.target.value || null })} />
            <span>–</span>
            <input type="time" value={s.quietEnd || ''} onChange={(e) => save({ quietEnd: e.target.value || null })} />
          </span>
        </Row>
      </section>
      <section className={styles.setBlock}>
        <h2><Star size={17} /> Teman Dekat ({cf?.length ?? 0})</h2>
        <p className={styles.note}>Tambahkan dari profil pengikutmu (menu Mengikuti ▾). Hanya kamu yang melihat daftar ini.</p>
        <div className={styles.chips}>{(cf || []).map((u) => <Link key={u.username} to={`/${u.username}`}><Avatar user={u} size={22} />{u.username}</Link>)}</div>
      </section>
      {rels && (
        <section className={styles.setBlock}>
          <h2>Akun yang kamu atur</h2>
          {[['blocked', 'Diblokir', 'block', <Ban size={16} key="b" />], ['muted', 'Dibisukan', 'mute', <BellOff size={16} key="m" />], ['restricted', 'Dibatasi', 'restrict', <Shield size={16} key="r" />]].map(([k, label, type, icon]) => (
            <div key={k} className={styles.relGroup}>
              <b>{icon} {label} ({rels[k].length})</b>
              {rels[k].map((u) => <div key={u.username} className={styles.relRow}><Avatar user={u} size={32} /><span>{u.username}</span><button type="button" className="btn btn-soft btn-sm" onClick={() => undo(u.username, type)}>Batalkan</button></div>)}
            </div>
          ))}
        </section>
      )}
      <p className={styles.note} style={{ textAlign: 'center' }}>Nama, foto, dan bio diubah dari <a href="https://pikr-manseku.my.id/profil" style={{ color: 'var(--accent-ink)', fontWeight: 700 }}>profil situs PIK-R</a>.</p>
    </div>
  );
}

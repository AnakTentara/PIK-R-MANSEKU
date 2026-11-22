import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Grid3x3, UserSquare2, Bookmark, Lock, ChevronDown, Settings, Star, BellOff, UserMinus, Flag, Ban, Shield, MessageCircle, Heart, Layers, Plus, Camera, Loader2 } from 'lucide-react';
import { rc, errMsg, mediaUrl } from '@/lib/api.js';
import { compact, activeLabel } from '@/lib/format.js';
import { useSession } from '@/lib/session.js';
import { Avatar, Sheet, MenuList, Empty, Spinner } from '@/components/ui.jsx';
import { StoryViewer, STORY_BG } from '@/components/Stories.jsx';
import { RichText } from '@/components/PostCard.jsx';
import styles from './Profile.module.css';

export default function Profile() {
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();
  const me = useSession((s) => s.me);
  const myUsername = me?.user?.username;

  // Akun sendiri jika membuka /profil atau /:username yang cocok (case-insensitive)
  const isMe = !paramUsername || (!!myUsername && paramUsername.toLowerCase() === myUsername.toLowerCase());
  const username = isMe ? myUsername : paramUsername;

  // Jika membuka URL /:username milik sendiri, alihkan ke /profil agar terpisah dan konsisten
  useEffect(() => {
    if (paramUsername && myUsername && paramUsername.toLowerCase() === myUsername.toLowerCase()) {
      navigate('/profil', { replace: true });
    }
  }, [paramUsername, myUsername, navigate]);

  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState(null);
  const [menu, setMenu] = useState(false);
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(false);
  const [story, setStory] = useState(null);
  const [hl, setHl] = useState(null);

  const load = useCallback(async () => {
    if (!username) return;
    setError(null);
    try { const r = await rc.profile(username); setP(r.data); } catch (err) { setP(null); setError(errMsg(err, 'Akun tidak ditemukan')); }
  }, [username]);
  useEffect(() => { setP(null); setPosts(null); setTab('posts'); load(); }, [load]);
  useEffect(() => {
    if (!p || !username) return;
    setPosts(null);
    if (tab === 'saved' && isMe) {
      rc.saved().then((r) => setPosts(r.data.items)).catch(() => setPosts([]));
    } else {
      rc.userPosts(username, tab === 'tagged' ? 'tagged' : undefined).then((r) => setPosts(r.data.items)).catch(() => setPosts([]));
    }
  }, [p?.user?.id, tab, username, isMe]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (fn, ok) => {
    setBusy(true);
    try { const r = await fn(); if (r?.data?.relation) setP((x) => ({ ...x, relation: r.data.relation, counts: r.data.counts || x.counts })); if (ok) toast.success(ok); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const follow = () => act(() => rc.follow(username)).then(load);
  const unfollow = () => { setMenu(false); act(() => rc.unfollow(username), p.relation.requested ? 'Permintaan dibatalkan' : `Berhenti mengikuti ${username}`); };
  const relation = (type, on, ok) => { setMenu(false); act(() => rc.relation(username, type, on), ok); };
  const block = () => {
    setMenu(false);
    if (!window.confirm(`Blokir ${username}? Kalian saling berhenti mengikuti, dan dia tidak bisa melihat profil, postingan, cerita, atau mengirim pesan. ${username} tidak diberi tahu.`)) return;
    relation('block', true, 'Akun diblokir');
  };
  const report = async () => {
    setMenu(false);
    const reason = window.prompt('Kenapa kamu melaporkan akun ini?\n1 Spam  2 Perundungan  3 Akun palsu  4 Tidak pantas  5 Lainnya', '2');
    const map = { 1: 'SPAM', 2: 'PELECEHAN', 3: 'AKUN_PALSU', 4: 'KONTEN_TIDAK_PANTAS', 5: 'LAINNYA' };
    if (!map[reason]) return;
    try { const r = await rc.report({ targetType: 'MEMBER', targetId: username, reason: map[reason] }); toast.success(r.data.message); } catch (err) { toast.error(errMsg(err)); }
  };
  const message = async () => {
    try { const r = await rc.openThread({ username }); navigate(`/pesan/${r.data.threadId}`); } catch (err) { toast.error(errMsg(err)); }
  };
  const openStory = () => p.hasStory && setStory([{ user: p.user, self: isMe }]);

  if (error) return <div className={styles.page}><Empty icon={<Lock size={30} />} title="Akun tidak tersedia">{error}</Empty></div>;
  if (!p) return <div className={styles.page}><Spinner /></div>;
  const rel = p.relation;
  // Profil sendiri tidak pernah terkunci
  const locked = !isMe && (!rel || !rel.canSee);
  const active = !isMe && activeLabel(p.lastSeenAt);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <button type="button" className={styles.avatarBtn} onClick={openStory} disabled={!p.hasStory} aria-label={p.hasStory ? 'Lihat cerita' : 'Foto profil'}>
          <Avatar user={p.user} size={140} ring={p.hasStory ? 'story' : null} className={styles.avatarBig} />
          <Avatar user={p.user} size={84} ring={p.hasStory ? 'story' : null} className={styles.avatarSmall} />
        </button>
        <div className={styles.headMain}>
          <div className={styles.nameRow}>
            <h1>{p.user.username}</h1>
            {p.isPrivate && <Lock size={16} className="muted" aria-label="Akun privat" />}
            <div className={styles.headActions}>
              {isMe ? (
                <>
                  <a className="btn btn-soft btn-sm" href="https://pikr-manseku.my.id/profil">Edit profil</a>
                  <Link className="btn btn-soft btn-sm" to="/arsip">Arsip</Link>
                  <Link to="/pengaturan" className="icon-btn" aria-label="Pengaturan"><Settings size={20} /></Link>
                </>
              ) : rel.blockedByMe ? (
                <button type="button" className="btn btn-soft btn-sm" onClick={() => relation('block', false, 'Blokir dibuka')} disabled={busy}>Buka blokir</button>
              ) : (
                <>
                  {rel.following ? (
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => setMenu(true)} disabled={busy}>Mengikuti <ChevronDown size={15} /></button>
                  ) : rel.requested ? (
                    <button type="button" className="btn btn-soft btn-sm" onClick={unfollow} disabled={busy}>Diminta</button>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" onClick={follow} disabled={busy}>{busy ? <Loader2 size={14} className="spin" /> : rel.followsMe ? 'Ikuti balik' : 'Ikuti'}</button>
                  )}
                  <button type="button" className="btn btn-soft btn-sm" onClick={message}>Kirim pesan</button>
                  {!rel.following && <button type="button" className="btn btn-soft btn-sm" onClick={() => setMenu(true)} aria-label="Pilihan lainnya"><ChevronDown size={15} /></button>}
                </>
              )}
            </div>
          </div>
          <ul className={styles.stats}>
            <li><b>{compact(p.counts.posts)}</b> postingan</li>
            <li><button type="button" onClick={() => !locked && setList('followers')} disabled={locked}><b>{compact(p.counts.followers)}</b> pengikut</button></li>
            <li><button type="button" onClick={() => !locked && setList('following')} disabled={locked}><b>{compact(p.counts.following)}</b> mengikuti</button></li>
          </ul>
          <div className={styles.bio}>
            <b>{p.user.name}</b>
            {p.title && <span className={`${styles.title} ${p.user.isAlumni ? styles.titleAlumni : ''}`}>{p.title}</span>}
            {p.bio && <p><RichText text={p.bio} /></p>}
            {active && <span className={styles.active}><i /> {active}</span>}
            {!isMe && rel.followsMe && <span className={styles.followsYou}>Mengikuti kamu</span>}
            {p.mutualFollowers?.length > 0 && (
              <span className={styles.mutual}>
                <span className={styles.mutualAv}>{p.mutualFollowers.map((u) => <Avatar key={u.username} user={u} size={20} />)}</span>
                Diikuti oleh <b>{p.mutualFollowers.map((u) => u.username).join(', ')}</b>
              </span>
            )}
          </div>
        </div>
      </header>

      {!locked && (p.highlights.length > 0 || isMe) && (
        <div className={`${styles.highlights} no-scrollbar`}>
          {p.highlights.map((h) => (
            <button key={h.id} type="button" className={styles.hl} onClick={() => setHl(h.id)}>
              <span className={styles.hlCover}>{h.cover ? <img src={mediaUrl(h.cover)} alt="" /> : <Layers size={26} />}</span>
              <span>{h.title}</span>
            </button>
          ))}
          {isMe && <Link to="/arsip" className={styles.hl}><span className={`${styles.hlCover} ${styles.hlNew}`}><Plus size={30} /></span><span>Baru</span></Link>}
        </div>
      )}

      {locked ? (
        <div className={styles.locked}>
          <span className={styles.lockIcon}><Lock size={30} /></span>
          <b>Akun ini privat</b>
          <p>{rel.blocked ? 'Kamu tidak bisa melihat akun ini.' : 'Ikuti akun ini untuk melihat postingan dan ceritanya.'}</p>
        </div>
      ) : (
        <>
          <div className={styles.tabs} role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'posts'} className={tab === 'posts' ? styles.tabOn : ''} onClick={() => setTab('posts')}>
              <Grid3x3 size={16} /> <span>Postingan</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === 'tagged'} className={tab === 'tagged' ? styles.tabOn : ''} onClick={() => setTab('tagged')}>
              <UserSquare2 size={16} /> <span>Ditandai</span>
            </button>
            {isMe && (
              <button type="button" role="tab" aria-selected={tab === 'saved'} className={tab === 'saved' ? styles.tabOn : ''} onClick={() => setTab('saved')}>
                <Bookmark size={16} /> <span>Disimpan</span>
              </button>
            )}
          </div>
          {posts === null ? <div className={styles.grid}>{Array.from({ length: 6 }, (_, i) => <div key={i} className={`sk ${styles.tileSk}`} />)}</div>
            : posts.length === 0 ? (
              <Empty icon={tab === 'saved' ? <Bookmark size={30} /> : tab === 'tagged' ? <UserSquare2 size={30} /> : <Camera size={30} />} title={tab === 'saved' ? 'Belum ada yang disimpan' : tab === 'tagged' ? 'Belum ada foto yang menandai' : isMe ? 'Bagikan momen pertamamu' : 'Belum ada postingan'}>
                {tab === 'saved' ? 'Postingan yang kamu simpan hanya terlihat olehmu.' : tab === 'tagged' ? 'Foto yang menandai akun ini akan muncul di sini.' : isMe ? 'Postinganmu akan tampil di sini.' : null}
              </Empty>
            ) : (
              <div className={styles.grid}>
                {posts.map((x) => (
                  <Link key={x.id} to={`/p/${x.id}`} className={styles.tile}>
                    <img src={mediaUrl(x.media[0]?.thumb || x.media[0]?.url)} alt={x.media[0]?.alt || ''} loading="lazy" />
                    {x.media.length > 1 && <Layers size={18} className={styles.multi} />}
                    {x.pinned && <span className={styles.pinTag}>Disematkan</span>}
                    <span className={styles.tileHover}>{!x.hideLikes && <><Heart size={18} fill="#fff" /> {compact(x.likeCount)}</>} <MessageCircle size={18} fill="#fff" /> {compact(x.commentCount)}</span>
                  </Link>
                ))}
              </div>
            )}
        </>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={p.user.username} size="sm">
        <MenuList items={[
          rel.followsMe && { label: rel.closeFriend ? 'Hapus dari Teman Dekat' : 'Tambahkan ke Teman Dekat', icon: <Star size={19} fill={rel.closeFriend ? 'currentColor' : 'none'} />, hint: 'Hanya kamu yang tahu', onClick: () => relation('close-friend', !rel.closeFriend, rel.closeFriend ? 'Dihapus dari Teman Dekat' : 'Ditambahkan ke Teman Dekat') },
          { label: rel.muted ? 'Batalkan bisukan' : 'Bisukan', icon: <BellOff size={19} />, hint: 'Postingan & ceritanya tidak muncul di berandamu', onClick: () => relation('mute', !rel.muted, rel.muted ? 'Bisukan dibatalkan' : 'Dibisukan') },
          { label: rel.restricted ? 'Batalkan pembatasan' : 'Batasi', icon: <Shield size={19} />, hint: 'Komentarnya hanya terlihat olehnya; pesannya masuk Permintaan', onClick: () => relation('restrict', !rel.restricted, rel.restricted ? 'Pembatasan dibatalkan' : 'Akun dibatasi') },
          rel.following && { label: 'Berhenti mengikuti', icon: <UserMinus size={19} />, onClick: unfollow },
          '-',
          { label: 'Laporkan', icon: <Flag size={19} />, danger: true, onClick: report },
          { label: 'Blokir', icon: <Ban size={19} />, danger: true, onClick: block }
        ]} />
      </Sheet>
      <ConnectionsSheet username={username} kind={list} onClose={() => setList(null)} />
      {story && <StoryViewer groups={story} startIndex={0} onClose={() => setStory(null)} />}
      {hl && <HighlightViewer id={hl} onClose={() => setHl(null)} />}
    </div>
  );
}

function ConnectionsSheet({ username, kind, onClose }) {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    if (!kind) return undefined;
    const t = setTimeout(() => rc.connections(username, kind, q).then((r) => setItems(r.data.items)).catch(() => setItems([])), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [username, kind, q]);
  useEffect(() => { if (!kind) { setItems(null); setQ(''); } }, [kind]);
  return (
    <Sheet open={!!kind} onClose={onClose} title={kind === 'followers' ? 'Pengikut' : 'Mengikuti'} size="sm">
      <div style={{ padding: '10px 14px' }}><input className="field" placeholder="Cari" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {items === null ? <Spinner /> : items.length === 0 ? <Empty title="Tidak ada" /> : (
        <ul className={styles.people}>
          {items.map((u) => (
            <li key={u.username}><Link to={`/${u.username}`} onClick={onClose}><Avatar user={u} size={44} /><span><b>{u.username}</b><small>{u.name}</small></span></Link></li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

function HighlightViewer({ id, onClose }) {
  const [groups, setGroups] = useState(null);
  useEffect(() => {
    rc.highlight(id).then((r) => setGroups({ user: r.data.highlight.user, items: r.data.items })).catch((err) => { toast.error(errMsg(err)); onClose(); });
  }, [id, onClose]);
  if (!groups) return null;
  return <StaticStoryViewer data={groups} onClose={onClose} />;
}

/** Penampil sederhana untuk sorotan (cerita yang disimpan, tanpa reaksi). */
function StaticStoryViewer({ data, onClose }) {
  const [i, setI] = useState(0);
  const s = data.items[i];
  useEffect(() => { const t = setTimeout(() => (i < data.items.length - 1 ? setI(i + 1) : onClose()), 5000); return () => clearTimeout(t); }, [i, data.items.length, onClose]);
  if (!s) return null;
  const bg = STORY_BG[s.bg] || s.bgColor || STORY_BG.sunset;
  return (
    <div className={styles.hlViewer} onClick={(e) => (e.clientX < window.innerWidth / 3 ? setI(Math.max(0, i - 1)) : i < data.items.length - 1 ? setI(i + 1) : onClose())}>
      <div className={styles.hlBars}>{data.items.map((x, n) => <i key={x.id} className={n <= i ? styles.hlBarOn : ''} />)}</div>
      <button type="button" className={styles.hlClose} onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Tutup">×</button>
      {s.kind === 'IMAGE' ? (
        <div className={styles.hlImageStage}>
          <div className={styles.hlBgBlur} style={{ backgroundImage: `url(${mediaUrl(s.url)})` }} />
          <img src={mediaUrl(s.url)} alt="" className={styles.hlImgCentered} />
          {s.text && <p className={styles.hlOverlayText}>{s.text}</p>}
        </div>
      ) : s.kind === 'VIDEO' ? (
        <div className={styles.hlImageStage}>
          <video src={mediaUrl(s.url)} autoPlay playsInline />
          {s.text && <p className={styles.hlOverlayText}>{s.text}</p>}
        </div>
      ) : (
        <div className={styles.hlTextCard} style={{ background: bg }}>
          <p className={`${styles.hlText} ${s.bg === 'clay' ? styles.hlDark : ''}`}>{s.text}</p>
        </div>
      )}
    </div>
  );
}

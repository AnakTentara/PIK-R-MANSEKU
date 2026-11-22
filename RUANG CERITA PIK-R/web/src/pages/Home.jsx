import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, UserPlus, Check, HeartHandshake, Camera } from 'lucide-react';
import { rc, errMsg } from '@/lib/api.js';
import { useSession } from '@/lib/session.js';
import PostCard from '@/components/PostCard.jsx';
import { StoryTray, StoryViewer } from '@/components/Stories.jsx';
import { CommentsSheet, ShareSheet } from '@/components/Comments.jsx';
import { PostModal } from '@/components/PostModal.jsx';
import { Avatar, Username, Empty } from '@/components/ui.jsx';
import styles from './Home.module.css';

/**
 * Beranda: cerita di atas, feed di tengah, saran & pintu konseling di kanan (desktop).
 * Feed kronologis dari akun yang diikuti (tanpa algoritma tersembunyi: remaja tahu kenapa sesuatu muncul).
 * Ujung feed punya pesan "kamu sudah melihat semuanya" untuk mencegah gulir tanpa akhir.
 */
export default function Home({ onCreate, refreshKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const me = useSession((s) => s.me);
  const [posts, setPosts] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [discover, setDiscover] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [trayKey, setTrayKey] = useState(0);
  const [commentsFor, setCommentsFor] = useState(null);
  const [modalPost, setModalPost] = useState(null);
  const [shareFor, setShareFor] = useState(null);
  const sentinel = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await rc.feed();
      setPosts(r.data.items); setCursor(r.data.nextCursor); setDiscover(r.data.discover);
    } catch (err) { setPosts([]); toast.error(errMsg(err, 'Gagal memuat beranda')); }
  }, []);
  useEffect(() => { load(); setTrayKey((k) => k + 1); }, [load, refreshKey]);

  // Muat berikutnya saat mendekati ujung
  useEffect(() => {
    if (!cursor || !sentinel.current) return undefined;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || loadingMore) return;
      setLoadingMore(true);
      try { const r = await rc.feed(cursor, discover ? 'discover' : undefined); setPosts((p) => [...p, ...r.data.items.filter((x) => !p.some((y) => y.id === x.id))]); setCursor(r.data.nextCursor); } catch { /* coba lagi saat gulir */ } finally { setLoadingMore(false); }
    }, { rootMargin: '900px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [cursor, discover, loadingMore]);

  const updatePost = useCallback((id, patch) => setPosts((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p))), []);

  return (
    <div className={styles.layout}>
      <div className={styles.feed}>
        <StoryTray onCreate={() => onCreate('story')} onOpen={(i, groups) => setViewer({ i, groups })} refreshKey={trayKey} />
        {discover && posts?.length > 0 && (
          <div className={styles.discoverNote}><Sparkles size={16} /> Kamu belum mengikuti siapa pun. Ini postingan terbaru dari anggota PIK-R.</div>
        )}
        {posts === null ? <FeedSkeleton /> : posts.length === 0 ? (
          <Empty icon={<Camera size={32} />} title="Belum ada postingan" action={<button type="button" className="btn btn-primary" onClick={() => onCreate('post')}>Bagikan cerita pertama</button>}>
            Ikuti teman-temanmu atau bagikan momen pertamamu di Ruang Cerita.
          </Empty>
        ) : (
          <>
            {posts.map((p) => (
              <PostCard key={p.id} post={p}
                onOpen={(post) => {
                  if (window.innerWidth >= 900) {
                    setModalPost(post);
                  } else {
                    setCommentsFor(post);
                  }
                }}
                onShare={setShareFor}
                onChange={(patch) => updatePost(p.id, patch)}
                onRemoved={(id) => setPosts((list) => list.filter((x) => x.id !== id))} />
            ))}
            {cursor ? <div ref={sentinel} className={styles.more}>{loadingMore && <span className={styles.spinner} />}</div> : (
              <div className={styles.end}>
                <span className={styles.endIcon}><Check size={26} /></span>
                <b>Kamu sudah melihat semuanya</b>
                <p>Postingan dari 3 hari terakhir sudah habis. Saatnya istirahat sejenak 🧡</p>
              </div>
            )}
          </>
        )}
      </div>

      <aside className={styles.right}>
        {me && (
          <div className={styles.meRow}>
            <Link to={`/${me.user.username}`}><Avatar user={me.user} size={46} /></Link>
            <div><Username user={me.user} /><small>{me.user.name}</small></div>
          </div>
        )}
        <Suggestions onFollowed={() => { setTrayKey((k) => k + 1); load(); }} />
        <Link to="/konseling" className={styles.counsel}>
          <span className={styles.counselIcon}><HeartHandshake size={22} /></span>
          <span><b>Bilik Konseling</b><small>Butuh teman bicara? Konselor sebaya siap mendengar, boleh anonim.</small></span>
        </Link>
        <p className={styles.foot}>Ruang Cerita · PIK-R MAN 1 Muara Enim<br />Beriman · Bertanggung Jawab · Berencana</p>
      </aside>

      {viewer && <StoryViewer groups={viewer.groups} startIndex={viewer.i} onClose={() => { setViewer(null); setTrayKey((k) => k + 1); }} />}
      <CommentsSheet
        post={commentsFor}
        open={!!commentsFor && window.innerWidth < 900}
        onClose={() => setCommentsFor(null)}
        onCount={(d) => commentsFor && updatePost(commentsFor.id, { commentCount: Math.max(0, (posts.find((x) => x.id === commentsFor.id)?.commentCount || 0) + d) })}
      />
      {modalPost && (
        <PostModal
          post={modalPost}
          open={!!modalPost}
          onClose={() => setModalPost(null)}
          onChange={(patch) => {
            setModalPost((p) => ({ ...p, ...patch }));
            updatePost(modalPost.id, patch);
          }}
          onShare={() => {
            const p = modalPost;
            setModalPost(null);
            setShareFor(p);
          }}
          onCount={(d) => {
            updatePost(modalPost.id, {
              commentCount: Math.max(0, (posts.find((x) => x.id === modalPost.id)?.commentCount || 0) + d)
            });
          }}
        />
      )}
      {shareFor && <ShareSheet post={shareFor} open={!!shareFor} onClose={() => setShareFor(null)} />}
    </div>
  );
}

function FeedSkeleton() {
  return Array.from({ length: 2 }, (_, i) => (
    <div key={i} className={styles.skCard}>
      <div className={styles.skHead}><div className="sk" style={{ width: 36, height: 36, borderRadius: '50%' }} /><div className="sk" style={{ width: 140, height: 12 }} /></div>
      <div className="sk" style={{ width: '100%', aspectRatio: '4/5', borderRadius: 0 }} />
      <div style={{ padding: 14 }}><div className="sk" style={{ width: '40%', height: 12 }} /><div className="sk" style={{ width: '80%', height: 12, marginTop: 8 }} /></div>
    </div>
  ));
}

/** Saran akun (teman dari teman, sekelas, seangkatan). */
export function Suggestions({ compact = false, onFollowed }) {
  const [items, setItems] = useState(null);
  const [done, setDone] = useState({});
  useEffect(() => { rc.suggestions().then((r) => setItems(r.data.items)).catch(() => setItems([])); }, []);
  const follow = async (u) => {
    setDone((d) => ({ ...d, [u.username]: 'busy' }));
    try { const r = await rc.follow(u.username); setDone((d) => ({ ...d, [u.username]: r.data.relation.following ? 'following' : 'requested' })); if (r.data.relation.following) onFollowed?.(); } catch (err) { setDone((d) => ({ ...d, [u.username]: null })); toast.error(errMsg(err)); }
  };
  if (!items?.length) return null;
  return (
    <section className={compact ? styles.sugCompact : styles.sug}>
      <div className={styles.sugHead}><b>Disarankan untukmu</b></div>
      {items.slice(0, compact ? 12 : 5).map((u) => (
        <div key={u.username} className={styles.sugRow}>
          <Link to={`/${u.username}`}><Avatar user={u} size={compact ? 64 : 36} /></Link>
          <div className={styles.sugText}><Username user={u} /><small>{u.reason}</small></div>
          <button type="button" className={done[u.username] ? 'btn btn-soft btn-sm' : 'btn btn-primary btn-sm'} onClick={() => !done[u.username] && follow(u)} disabled={done[u.username] === 'busy'}>
            {done[u.username] === 'following' ? 'Mengikuti' : done[u.username] === 'requested' ? 'Diminta' : <><UserPlus size={14} /> Ikuti</>}
          </button>
        </div>
      ))}
    </section>
  );
}

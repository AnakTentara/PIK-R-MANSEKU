import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronDown, UserPlus, UserCheck, Share2, Check, Star, BellOff, Bell, UserMinus, Flag, Ban, Pencil,
  GraduationCap, School, CalendarDays, User, BadgeCheck, Heart, BookOpen, Music, Camera, Trophy, Code2,
  Gamepad2, Dumbbell, Utensils, Plane, MessageSquareQuote, Grid3x3, Bookmark, Loader2, ShieldCheck, Tag
} from 'lucide-react';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import Sheet from '@/components/common/Sheet';
import { getUploadUrl } from '@/api/axios';
import { followMember, unfollowMember, setMemberRelation, reportContent, getFollowList } from '@/api/public';
import { getBlogPosts } from '@/api/forum';
import { useAuthStore } from '@/stores/authStore';
import { requireLogin } from '@/stores/quickLoginStore';
import styles from './SocialProfile.module.css';

const ICONS = {
  star: Star, heart: Heart, book: BookOpen, music: Music, camera: Camera, trophy: Trophy,
  code: Code2, game: Gamepad2, sport: Dumbbell, food: Utensils, travel: Plane, quote: MessageSquareQuote
};
const REASONS = [
  ['SPAM', 'Spam atau penipuan'],
  ['PELECEHAN', 'Perundungan atau pelecehan'],
  ['KONTEN_TIDAK_PANTAS', 'Konten tidak pantas'],
  ['AKUN_PALSU', 'Akun palsu / menyamar'],
  ['LAINNYA', 'Lainnya']
];
const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.0', '')} jt` : n >= 1e4 ? `${Math.round(n / 1e3)} rb` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace('.0', '')} rb` : String(n));
const errMsg = (err, fb) => err?.response?.data?.message || fb;

/**
 * Profil anggota bergaya media sosial (/@slug).
 * Info/Tentang dipindah ke dalam kartu profil (di atas tab).
 * Tab: Postingan | Ditandai (hanya isSelf) | Disimpan (hanya isSelf).
 */
export default function SocialProfile({ data, onChange }) {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.candidateUser);
  const [d, setD] = useState(data);
  const [busy, setBusy] = useState('');
  const [menu, setMenu] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [list, setList] = useState(null);
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [copied, setCopied] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);

  useEffect(() => setD(data), [data]);
  useEffect(() => {
    let alive = true;
    setPosts(null);
    getBlogPosts({ author: data.slug, limit: 12 })
      .then((r) => alive && setPosts(r.data.posts || []))
      .catch(() => alive && setPosts([]));
    return () => { alive = false; };
  }, [data.slug]);

  const s = d.social || { followers: 0, following: 0, posts: 0 };
  const v = s.viewer;
  const isSelf = s.isSelf || (me?.slug && me.slug === d.slug);
  const card = d.card || {};

  // Saved posts (dari localStorage) untuk tab Disimpan milik sendiri
  useEffect(() => {
    if (isSelf && me?.nisn) {
      const key = `bookmarks_forum_${me.nisn}`;
      setSavedPosts(JSON.parse(localStorage.getItem(key) || '[]'));
    }
  }, [isSelf, me?.nisn]);

  const hidden = new Set([...(d.cardDesign?.hidden || []), ...(card.hidden || [])]);
  const photo = [card.cardPhoto, d.photoPath].filter(Boolean).map(getUploadUrl)[0];
  const isAlumni = d.isAlumni || d.status === 'ALUMNI';

  const apply = (social) => { const next = { ...d, social }; setD(next); onChange?.(next); };
  const run = async (key, fn, ok) => {
    setBusy(key);
    try {
      const r = await fn();
      if (r?.data && 'followers' in r.data) apply(r.data);
      if (ok) toast.success(ok);
      return true;
    } catch (err) {
      toast.error(errMsg(err, 'Gagal, coba lagi.'));
      return false;
    } finally { setBusy(''); }
  };

  const loginReason = `Masuk untuk mengikuti ${d.name.split(' ')[0]} dan melihat postingannya di beranda.`;
  const follow = () => requireLogin(() => run('follow', () => followMember(d.slug)), loginReason);
  const openMenu = () => requireLogin(() => setMenu(true), 'Masuk untuk mengatur hubunganmu dengan akun ini.');
  const relation = (type, on, ok) => { setMenu(false); run(type, () => setMemberRelation(d.slug, type, on), ok); };
  const unfollow = () => { setMenu(false); run('follow', () => unfollowMember(d.slug), `Berhenti mengikuti ${d.name.split(' ')[0]}`); };
  const block = () => {
    setMenu(false);
    if (!window.confirm(`Blokir ${d.name}? Kalian saling berhenti mengikuti dan dia tidak bisa melihat profil atau postinganmu. ${d.name.split(' ')[0]} tidak diberi tahu.`)) return;
    run('block', () => setMemberRelation(d.slug, 'block', true), 'Akun diblokir');
  };
  const sendReport = async (e) => {
    e.preventDefault();
    if (!reason) return;
    const ok = await run('report', () => reportContent({ targetType: 'MEMBER', target: d.slug, reason, note }), 'Laporan terkirim. Terima kasih!');
    if (ok) { setReportOpen(false); setReason(''); setNote(''); }
  };
  const share = async () => {
    const url = `${window.location.origin}/@${d.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: d.name, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    } catch { /* dibatalkan */ }
  };
  const openList = async (kind) => {
    setList({ kind, items: null });
    try { setList({ kind, items: (await getFollowList(d.slug, kind)).data }); } catch { setList({ kind, items: [] }); }
  };

  // Info/Tentang — tampil di kartu, bukan di tab
  const facts = [
    { key: 'kelas', icon: GraduationCap, label: 'Kelas', value: d.className },
    { key: 'gender', icon: User, label: 'Jenis kelamin', value: d.gender },
    { key: 'asalSekolah', icon: School, label: 'Asal sekolah', value: d.asalSekolah },
    { key: 'angkatan', icon: CalendarDays, label: 'Bergabung', value: d.joinYear ? `Angkatan ${d.joinYear}` : null },
    { key: 'idAnggota', icon: BadgeCheck, label: 'ID anggota', value: d.cardDesign?.showMemberCode === false ? null : d.memberCode, mono: true }
  ].filter((f) => f.value && !hidden.has(f.key));
  const info = (card.info || []).filter((i) => i.label && i.value);
  const hasInfo = facts.length > 0 || info.length > 0;

  // Visible facts (awal 3, bisa expand)
  const visibleFacts = infoExpanded ? facts : facts.slice(0, 3);

  return (
    <article className={styles.profile}>
      {/* ── Kepala: foto + angka ── */}
      <header className={styles.head}>
        <div className={`${styles.ring} ${isAlumni ? styles.ringAlumni : ''}`}>
          {photo && !photoFailed
            ? <img className={styles.photo} src={photo} alt={`Foto ${d.name}`} onError={() => setPhotoFailed(true)} />
            : <PhotoAvatar src="" name={d.name} className={styles.photo} placeholderClassName={`${styles.photo} ${styles.initials}`} />}
        </div>
        <div className={styles.headMain}>
          <div className={styles.handleRow}>
            <h1 className={styles.handle}>{d.slug}</h1>
            {(d.jabatan || '').match(/Ketua|Wakil|Pembina|Koordinator|Sekretaris|Bendahara/i) && !isAlumni && <ShieldCheck size={18} className={styles.verified} aria-label="Pengurus" />}
          </div>
          <dl className={styles.stats}>
            <div><dt>postingan</dt><dd>{compact(s.posts)}</dd></div>
            <button type="button" onClick={() => openList('followers')}><dt>pengikut</dt><dd>{compact(s.followers)}</dd></button>
            <button type="button" onClick={() => openList('following')}><dt>mengikuti</dt><dd>{compact(s.following)}</dd></button>
          </dl>
        </div>
      </header>

      {/* ── Identitas & bio ── */}
      <section className={styles.bioBlock}>
        <h2 className={styles.name}>{d.name}</h2>
        <span className={`${styles.role} ${isAlumni ? styles.roleAlumni : ''}`}>{d.jabatan}</span>
        {!hidden.has('bio') && d.bio && <p className={styles.bio}>{d.bio}</p>}
        {v?.followsYou && <span className={styles.followsYou}>Mengikuti kamu</span>}
      </section>

      {/* ── Info / Tentang — di dalam kartu, bukan tab ── */}
      {hasInfo && (
        <div className={styles.infoCard}>
          <dl className={styles.infoRow}>
            {visibleFacts.map(({ icon: Icon, label, value, mono, key }) => (
              <div key={key} className={styles.infoFact}>
                <span className={styles.infoIcon}><Icon size={15} /></span>
                <span className={styles.infoLabel}>{label}</span>
                <span className={`${styles.infoVal} ${mono ? styles.mono : ''}`}>{value}</span>
              </div>
            ))}
          </dl>
          {(facts.length > 3 || info.length > 0) && (
            <button type="button" className={styles.infoToggle} onClick={() => setInfoExpanded(e => !e)}>
              {infoExpanded ? 'Sembunyikan' : `Lihat ${facts.length - 3 + info.length} info lainnya`}
            </button>
          )}
          {infoExpanded && info.length > 0 && (
            <div className={styles.infoGrid}>
              {info.map((i, n) => {
                const Icon = ICONS[i.icon] || Star;
                return (
                  <div key={n} className={styles.infoGridItem}>
                    <span><Icon size={15} /></span>
                    <div><small>{i.label}</small><b>{i.value}</b></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tombol aksi ── */}
      <div className={styles.actions}>
        {isSelf ? (
          <>
            <Link to="/profil" className={`${styles.btn} ${styles.btnSoft}`}><Pencil size={16} /> Edit profil</Link>
            <button type="button" className={`${styles.btn} ${styles.btnSoft}`} onClick={share}>{copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? 'Tersalin' : 'Bagikan profil'}</button>
          </>
        ) : v?.blocked ? (
          <button type="button" className={`${styles.btn} ${styles.btnSoft}`} disabled={!!busy} onClick={() => run('block', () => setMemberRelation(d.slug, 'block', false), 'Blokir dibuka')}>
            Buka blokir
          </button>
        ) : (
          <>
            {v?.following ? (
              <button type="button" className={`${styles.btn} ${styles.btnSoft} ${styles.followed}`} onClick={openMenu} aria-haspopup="dialog" disabled={!!busy}>
                {busy === 'follow' ? <Loader2 size={16} className={styles.spin} /> : <UserCheck size={16} />} Mengikuti <ChevronDown size={16} className={styles.more} />
              </button>
            ) : (
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={follow} disabled={!!busy}>
                {busy === 'follow' ? <Loader2 size={16} className={styles.spin} /> : <UserPlus size={16} />} {v?.followsYou ? 'Ikuti balik' : 'Ikuti'}
              </button>
            )}
            <button type="button" className={`${styles.btn} ${styles.btnSoft}`} onClick={share}>{copied ? <Check size={16} /> : <Share2 size={16} />} {copied ? 'Tersalin' : 'Bagikan'}</button>
            {!v?.following && (
              <button type="button" className={`${styles.btn} ${styles.btnIcon}`} onClick={openMenu} aria-label="Pilihan lainnya"><ChevronDown size={18} /></button>
            )}
          </>
        )}
      </div>

      {/* ── Tab: Postingan | Ditandai (self) | Disimpan (self) ── */}
      <div className={styles.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'posts'} className={tab === 'posts' ? styles.tabOn : ''} onClick={() => setTab('posts')}>
          <Grid3x3 size={16} /> Postingan
        </button>
        {isSelf && (
          <button type="button" role="tab" aria-selected={tab === 'tagged'} className={tab === 'tagged' ? styles.tabOn : ''} onClick={() => setTab('tagged')}>
            <Tag size={16} /> Ditandai
          </button>
        )}
        {isSelf && (
          <button type="button" role="tab" aria-selected={tab === 'saved'} className={tab === 'saved' ? styles.tabOn : ''} onClick={() => setTab('saved')}>
            <Bookmark size={16} /> Disimpan
          </button>
        )}
      </div>

      {/* ── Konten tab ── */}
      {tab === 'tagged' ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}><Tag size={28} /></span>
          <b>Postingan yang menandakanmu akan muncul di sini</b>
          <small style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Fitur ini akan segera tersedia</small>
        </div>
      ) : tab === 'saved' ? (
        <div className={styles.savedSection}>
          {savedPosts.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}><Bookmark size={28} /></span>
              <b>Belum ada postingan yang disimpan</b>
              <Link to="/blog" className={`${styles.btn} ${styles.btnPrimary}`}>Jelajahi Blog</Link>
            </div>
          ) : (
            <div className={styles.savedList}>
              {savedPosts.map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className={styles.savedItem}>
                  <div className={styles.savedItemBody}>
                    <span className={styles.savedItemCategory}>{p.category}</span>
                    <b className={styles.savedItemTitle}>{p.title}</b>
                  </div>
                  <Bookmark size={16} className={styles.savedItemIcon} />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* tab === 'posts' */
        posts === null ? (
          <div className={styles.grid}>{Array.from({ length: 6 }, (_, i) => <div key={i} className={`skeleton ${styles.tile}`} />)}</div>
        ) : posts.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}><Camera size={28} /></span>
            <b>{isSelf ? 'Bagikan cerita pertamamu' : 'Belum ada postingan'}</b>
            {isSelf && <Link to="/blog/tulis" className={`${styles.btn} ${styles.btnPrimary}`}>Tulis postingan</Link>}
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className={styles.tile}>
                {p.featuredImg
                  ? <img src={getUploadUrl(p.featuredImg)} alt="" loading="lazy" />
                  : <span className={styles.tileText}><b>{p.title}</b><small>{p.excerpt}</small></span>}
                <span className={styles.tileMeta}><Heart size={14} fill="currentColor" /> {p.likeCount} · {p.commentCount} komentar</span>
              </Link>
            ))}
          </div>
        )
      )}

      {/* ── Sheet: menu follow / blokir / laporkan ── */}
      <Sheet open={menu} onClose={() => setMenu(false)} title={d.name}>
        <div className={styles.menu}>
          {v?.following && (
            <button type="button" onClick={() => relation('close-friend', !v.closeFriend, v.closeFriend ? 'Dihapus dari teman dekat' : 'Ditambahkan ke teman dekat')}>
              <span className={styles.menuIcon} data-tone="green"><Star size={18} fill={v.closeFriend ? 'currentColor' : 'none'} /></span>
              <span><b>{v.closeFriend ? 'Hapus dari teman dekat' : 'Tambahkan ke teman dekat'}</b><small>Hanya kamu yang tahu daftar teman dekatmu</small></span>
            </button>
          )}
          <button type="button" onClick={() => relation('mute', !v?.muted, v?.muted ? 'Bisukan dibatalkan' : 'Akun dibisukan')}>
            <span className={styles.menuIcon}>{v?.muted ? <Bell size={18} /> : <BellOff size={18} />}</span>
            <span><b>{v?.muted ? 'Batalkan bisukan' : 'Bisukan'}</b><small>Postingannya tidak muncul untukmu; dia tidak diberi tahu</small></span>
          </button>
          {v?.following && (
            <button type="button" onClick={unfollow}>
              <span className={styles.menuIcon}><UserMinus size={18} /></span>
              <span><b>Berhenti mengikuti</b></span>
            </button>
          )}
          <hr />
          <button type="button" className={styles.danger} onClick={() => { setMenu(false); setReportOpen(true); }}>
            <span className={styles.menuIcon} data-tone="red"><Flag size={18} /></span>
            <span><b>Laporkan</b><small>Pengurus akan meninjau laporanmu</small></span>
          </button>
          <button type="button" className={styles.danger} onClick={block}>
            <span className={styles.menuIcon} data-tone="red"><Ban size={18} /></span>
            <span><b>Blokir</b><small>Saling tidak bisa melihat profil dan postingan</small></span>
          </button>
        </div>
      </Sheet>

      <Sheet open={reportOpen} onClose={() => setReportOpen(false)} title="Laporkan akun">
        <form className={styles.report} onSubmit={sendReport}>
          <p className={styles.muted}>Kenapa kamu melaporkan {d.name.split(' ')[0]}? Identitasmu tidak diberitahukan kepadanya.</p>
          {REASONS.map(([k, label]) => (
            <label key={k} className={`${styles.reason} ${reason === k ? styles.reasonOn : ''}`}>
              <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k)} /> {label}
            </label>
          ))}
          <textarea className="form-textarea" rows={3} maxLength={500} placeholder="Keterangan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="submit" className={`${styles.btn} ${styles.btnDanger}`} disabled={!reason || !!busy}>
            {busy === 'report' ? <Loader2 size={16} className={styles.spin} /> : <Flag size={16} />} Kirim laporan
          </button>
        </form>
      </Sheet>

      <Sheet open={!!list} onClose={() => setList(null)} title={list?.kind === 'followers' ? 'Pengikut' : 'Mengikuti'}>
        {!list?.items ? <div className={styles.listLoading}><Loader2 className={styles.spin} /></div>
          : list.items.length === 0 ? <p className={styles.muted}>Belum ada.</p>
          : (
            <ul className={styles.people}>
              {list.items.map((p) => (
                <li key={p.slug}>
                  <button type="button" onClick={() => { setList(null); navigate(`/@${p.slug}`); }}>
                    <PhotoAvatar src={p.photoPath ? getUploadUrl(p.photoPath) : ''} name={p.name} className={styles.personPhoto} placeholderClassName={`${styles.personPhoto} ${styles.initials}`} />
                    <span><b>{p.slug}</b><small>{p.name}{p.status === 'ALUMNI' ? ' · Alumni' : ''}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      </Sheet>
    </article>
  );
}

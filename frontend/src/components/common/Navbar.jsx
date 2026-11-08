import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  Menu, X, LogOut, User, ChevronDown, Users, GraduationCap, Newspaper, PenSquare, ClipboardList,
  SearchCheck, Info, LayoutGrid, ArrowRight
} from 'lucide-react';
import { getPublicSettings } from '@/api/candidates';
import styles from './Navbar.module.css';

/**
 * Navigasi utama.
 * Menu dikelompokkan supaya tetap rapi walau halaman bertambah (maks. 5 menu utama, hukum Hick):
 *   Anggota ▾ (Anggota, Alumni) · Berita ▾ (Berita, Blog) · Pendaftaran ▾ (Daftar, Cek Kelulusan)
 * Desktop: mega menu lebar; panel kanan menjelaskan sub-halaman yang sedang disorot.
 * HP: akordeon di laci menu.
 * `key` mengikuti pengaturan "tampilkan menu" di halaman Desain (hero.navVisibility).
 */
const NAV = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/kami', label: 'Tentang Kami', key: 'tentangKami' },
  {
    label: 'Anggota', id: 'anggota',
    items: [
      { to: '/anggota', label: 'Anggota Aktif', key: 'anggota', icon: Users, desc: 'Struktur kepengurusan dan seluruh anggota PIK-R MANSEKU periode ini, lengkap dengan profil masing-masing.' },
      { to: '/alumni', label: 'Alumni', key: 'alumni', icon: GraduationCap, desc: 'Kakak-kakak yang pernah mengabdi di PIK-R, beserta kesan dan pesan mereka untuk adik-adik.' }
    ]
  },
  {
    label: 'Berita', id: 'berita',
    items: [
      { to: '/berita', label: 'Berita', key: 'berita', icon: Newspaper, desc: 'Kabar resmi kegiatan, pengumuman, dan informasi kesehatan remaja dari pengurus.' },
      { to: '/blog', label: 'Blog Anggota', key: 'blog', icon: PenSquare, desc: 'Tulisan, cerita, dan opini dari anggota. Baca, beri suka, komentari, dan ikuti penulisnya.' }
    ]
  },
  {
    label: 'Pendaftaran', id: 'daftar',
    items: [
      { to: '/daftar', label: 'Daftar Anggota Baru', icon: ClipboardList, desc: 'Isi formulir pendaftaran calon anggota. Hanya butuh beberapa menit.' },
      { to: '/cek-kelulusan', label: 'Cek Kelulusan', icon: SearchCheck, desc: 'Lihat hasil seleksi dengan NISN atau nama lengkap.' }
    ]
  }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(null);       // id grup mega menu yang terbuka (desktop)
  const [hover, setHover] = useState(null);     // sub-halaman yang disorot (panel penjelasan)
  const [mobileOpen, setMobileOpen] = useState(null); // grup akordeon terbuka (HP)
  const closeTimer = useRef(null);
  const { isCandidateAuthenticated, candidateUser, logoutCandidate, logoutAdmin } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [webEditorConfig, setWebEditorConfig] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    getPublicSettings().then((res) => {
      if (res.data?.webEditorConfig) setWebEditorConfig(res.data.webEditorConfig);
    }).catch(() => {});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Pindah halaman: semua menu ditutup
  useEffect(() => { setOpen(null); setMenuOpen(false); setMobileOpen(null); }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const navVisibility = webEditorConfig?.hero?.navVisibility || {};
  const visible = (x) => !x.key || navVisibility[x.key] !== false;
  const customPages = webEditorConfig?.customPages || [];
  const nav = NAV.map((n) => (n.items ? { ...n, items: n.items.filter(visible) } : n))
    .filter((n) => (n.items ? n.items.length > 0 : visible(n)));
  if (customPages.length) {
    nav.push({
      label: 'Lainnya', id: 'lainnya',
      items: customPages.map((p) => ({ to: `/p/${p.slug}`, label: p.title, icon: LayoutGrid, desc: p.description || `Halaman ${p.title}.` }))
    });
  }

  const groupActive = (g) => g.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));

  // Membuka saat disorot, menutup dengan jeda supaya kursor bisa berpindah ke panel tanpa menu hilang
  const openGroup = useCallback((g) => {
    clearTimeout(closeTimer.current);
    setOpen(g.id);
    setHover((h) => (h && g.items.some((i) => i.to === h.to) ? h : g.items[0]));
  }, []);
  const scheduleClose = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setOpen(null), 160); };
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Kunci scroll halaman saat menu mobile terbuka (mencegah double scroll di HP)
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const logoUrl = '/media/logos/L_PIK-R_Title.png';
  const isAdmin = useAuthStore((s) => s.isAdminAuthenticated);
  const profileTo = candidateUser?.slug ? `/@${candidateUser.slug}` : '/profil';

  const handleLogout = () => { logoutCandidate(); navigate('/login'); setMenuOpen(false); };
  const handleAdminLogout = () => { logoutAdmin(); navigate('/'); setMenuOpen(false); };
  const openPanel = nav.find((n) => n.id === open);

  return (
    <header className={`${styles.navbar} ${scrolled || open ? styles.scrolled : ''}`} role="banner">
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo} aria-label="PIK-R MANSEKU — Beranda">
          <img src={logoUrl} alt="PIK-R MANSEKU Logo" className={styles.logoImg} />
        </Link>

        {/* Desktop */}
        <nav className={styles.desktopNav} aria-label="Navigasi utama" onMouseLeave={scheduleClose}>
          {nav.map((n) => (n.items ? (
            <button
              key={n.id}
              type="button"
              className={`${styles.navLink} ${styles.navGroup} ${groupActive(n) ? styles.active : ''} ${open === n.id ? styles.navGroupOpen : ''}`}
              aria-expanded={open === n.id}
              aria-haspopup="true"
              onMouseEnter={() => openGroup(n)}
              onFocus={() => openGroup(n)}
              onClick={() => (open === n.id ? setOpen(null) : openGroup(n))}
            >
              {n.label}
              <ChevronDown size={15} className={styles.chev} />
            </button>
          ) : (
            <NavLink key={n.to} to={n.to} end={n.end} onMouseEnter={scheduleClose}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
              {n.label}
            </NavLink>
          )))}
        </nav>

        <div className={styles.actions}>
          {isAdmin ? (
            <div className={styles.userMenu}>
              <Link to="/admin" className={styles.userBtn} style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
                <User size={16} />
                <span>Dashboard (Admin)</span>
              </Link>
              <button onClick={handleAdminLogout} className={`btn btn-ghost btn-sm ${styles.logoutBtn}`} title="Keluar Admin">
                <LogOut size={15} />
              </button>
            </div>
          ) : isCandidateAuthenticated ? (
            <div className={styles.userMenu}>
              <Link to={profileTo} className={styles.userBtn}>
                <User size={16} />
                <span>{candidateUser?.name?.split(' ')[0] || 'Profil'}</span>
              </Link>
              <button onClick={handleLogout} className={`btn btn-ghost btn-sm ${styles.logoutBtn}`} title="Keluar">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Masuk Anggota</Link>
              <Link to="/daftar" className="btn btn-primary btn-sm">Daftar Sekarang</Link>
            </>
          )}
        </div>

        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mega menu desktop: selebar layar, daftar di kiri + penjelasan interaktif di kanan */}
      <div
        className={`${styles.mega} ${openPanel ? styles.megaOpen : ''}`}
        onMouseEnter={() => clearTimeout(closeTimer.current)}
        onMouseLeave={scheduleClose}
        aria-hidden={!openPanel}
      >
        {openPanel && (
          <div className={`container ${styles.megaInner}`} key={openPanel.id}>
            <div className={styles.megaList}>
              <span className={styles.megaTitle}>{openPanel.label}</span>
              {openPanel.items.map((i) => {
                const Icon = i.icon || Info;
                return (
                  <Link key={i.to} to={i.to} className={`${styles.megaItem} ${hover?.to === i.to ? styles.megaItemOn : ''}`}
                    onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}>
                    <span className={styles.megaIcon}><Icon size={20} /></span>
                    <span className={styles.megaText}>
                      <b>{i.label}</b>
                      <small>{i.desc}</small>
                    </span>
                  </Link>
                );
              })}
            </div>
            {hover && (
              <div className={styles.megaInfo} key={hover.to} aria-live="polite">
                <span className={styles.megaInfoIcon}>{(() => { const Icon = hover.icon || Info; return <Icon size={34} />; })()}</span>
                <h3>{hover.label}</h3>
                <p>{hover.desc}</p>
                <Link to={hover.to} className={styles.megaGo}>Buka {hover.label} <ArrowRight size={15} /></Link>
              </div>
            )}
          </div>
        )}
      </div>
      {openPanel && <div className={styles.megaScrim} onMouseEnter={scheduleClose} onClick={() => setOpen(null)} aria-hidden="true" />}

      {/* HP: laci menu dengan akordeon */}
      {menuOpen && (
        <div className={styles.mobileDrawer}>
          <nav className={styles.mobileNav} aria-label="Navigasi mobile">
            {nav.map((n) => (n.items ? (
              <div key={n.id} className={styles.mobileGroup}>
                <button type="button" className={`${styles.mobileLink} ${groupActive(n) ? styles.active : ''}`}
                  aria-expanded={mobileOpen === n.id || groupActive(n)}
                  onClick={() => setMobileOpen((m) => (m === n.id ? '__none' : n.id))}>
                  {n.label}
                  <ChevronDown size={17} className={`${styles.chev} ${(mobileOpen === n.id || (groupActive(n) && mobileOpen !== '__none')) ? styles.chevUp : ''}`} />
                </button>
                {(mobileOpen === n.id || (groupActive(n) && mobileOpen !== '__none')) && (
                  <div className={styles.mobileSub}>
                    {n.items.map((i) => {
                      const Icon = i.icon || Info;
                      return (
                        <NavLink key={i.to} to={i.to} onClick={() => setMenuOpen(false)}
                          className={({ isActive }) => `${styles.mobileSubLink} ${isActive ? styles.active : ''}`}>
                          <Icon size={17} />
                          <span><b>{i.label}</b><small>{i.desc}</small></span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.active : ''}`}>
                {n.label}
              </NavLink>
            )))}
            <hr className="divider" />
            {isAdmin ? (
              <>
                <Link to="/admin" onClick={() => setMenuOpen(false)} className={styles.mobileLink} style={{ color: 'var(--color-accent)' }}>
                  <User size={16} /> Dashboard Admin
                </Link>
                <button onClick={handleAdminLogout} className={`${styles.mobileLink} ${styles.logoutMobile}`}>
                  <LogOut size={16} /> Keluar Admin
                </button>
              </>
            ) : isCandidateAuthenticated ? (
              <>
                <Link to={profileTo} onClick={() => setMenuOpen(false)} className={styles.mobileLink}>
                  <User size={16} /> Profil Saya
                </Link>
                <button onClick={handleLogout} className={`${styles.mobileLink} ${styles.logoutMobile}`}>
                  <LogOut size={16} /> Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className={styles.mobileLink}>Masuk Anggota</Link>
                <Link to="/daftar" onClick={() => setMenuOpen(false)} className={`${styles.mobileLink} ${styles.mobileCtaLink}`}>Daftar Sekarang →</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

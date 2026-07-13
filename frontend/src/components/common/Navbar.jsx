import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Menu, X, LogOut, User } from 'lucide-react';
import { getPublicSettings } from '@/api/candidates';
import { getUploadUrl } from '@/api/axios';
import styles from './Navbar.module.css';

const DEFAULT_NAV_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/kami', label: 'Tentang Kami', key: 'tentangKami' },
  { to: '/anggota', label: 'Anggota', key: 'anggota' },
  { to: '/alumni', label: 'Alumni', key: 'alumni' },
  { to: '/blog', label: 'Blog', key: 'blog' },
  { to: '/daftar', label: 'Pendaftaran' },
  { to: '/cek-kelulusan', label: 'Cek Kelulusan' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isCandidateAuthenticated, candidateUser, logoutCandidate } = useAuthStore();
  const navigate = useNavigate();

  const [webEditorConfig, setWebEditorConfig] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Fetch config
    getPublicSettings().then(res => {
      if (res.data?.webEditorConfig) {
        setWebEditorConfig(res.data.webEditorConfig);
      }
    }).catch(console.error);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navVisibility = webEditorConfig?.hero?.navVisibility || {};
  const customPages = webEditorConfig?.customPages || [];

  const activeNavLinks = DEFAULT_NAV_LINKS.filter(link => {
    if (link.key && navVisibility[link.key] === false) return false;
    return true;
  });

  const finalNavLinks = [
    ...activeNavLinks,
    ...customPages.map(page => ({ to: `/p/${page.slug}`, label: page.title }))
  ];

  const logoUrl = webEditorConfig?.hero?.navbarLogoUrl || "/media/logos/L_PIK-R_Title.png";

  const handleLogout = () => {
    logoutCandidate();
    navigate('/login');
    setMenuOpen(false);
  };

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} role="banner">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="PIK-R MANSEKU — Beranda">
          <img
            src={getUploadUrl(logoUrl)}
            alt="PIK-R MANSEKU Logo"
            className={styles.logoImg}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.desktopNav} aria-label="Navigasi utama">
          {finalNavLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Right Actions */}
        <div className={styles.actions}>
          {isCandidateAuthenticated ? (
            <div className={styles.userMenu}>
              <Link to="/profil" className={styles.userBtn}>
                <User size={16} />
                <span>{candidateUser?.name?.split(' ')[0] || 'Profil'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className={`btn btn-ghost btn-sm ${styles.logoutBtn}`}
                title="Keluar"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className={`btn btn-secondary btn-sm`}>
                Masuk Anggota
              </Link>
              <Link to="/daftar" className={`btn btn-primary btn-sm`}>
                Daftar Sekarang
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className={styles.mobileDrawer}>
          <nav className={styles.mobileNav} aria-label="Navigasi mobile">
            {finalNavLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `${styles.mobileLink} ${isActive ? styles.active : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
            <hr className="divider" />
            {isCandidateAuthenticated ? (
              <>
                <Link
                  to="/profil"
                  onClick={() => setMenuOpen(false)}
                  className={styles.mobileLink}
                >
                  <User size={16} /> Profil Saya
                </Link>
                <button onClick={handleLogout} className={`${styles.mobileLink} ${styles.logoutMobile}`}>
                  <LogOut size={16} /> Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className={styles.mobileLink}>
                  Masuk Anggota
                </Link>
                <Link
                  to="/daftar"
                  onClick={() => setMenuOpen(false)}
                  className={`${styles.mobileLink} ${styles.mobileCtaLink}`}
                >
                  Daftar Sekarang →
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

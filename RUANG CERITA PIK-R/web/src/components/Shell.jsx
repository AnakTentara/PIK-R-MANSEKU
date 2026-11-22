import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, HeartHandshake, Heart, PlusSquare, Menu, Settings, Bookmark, Moon, Sun, LogOut, Compass } from 'lucide-react';
import { useSession, useTheme } from '@/lib/session.js';
import { disconnectLive } from '@/lib/live.js';
import { Avatar, Sheet, MenuList } from './ui.jsx';
import styles from './Shell.module.css';

/**
 * Kerangka aplikasi.
 * Desktop (≥ 900 px): sidebar kiri ringkas 76 px yang MELEBAR saat disorot (label muncul), seperti Instagram.
 * HP: bar atas (logo + aktivitas + pesan) dan bar bawah 5 tab yang selalu terjangkau jempol.
 * Urutan tab mengikuti Instagram 2026: Beranda · Cari · Buat · Pesan · Profil.
 * Bilik Konseling punya pintu sendiri (sidebar & bar atas) karena berbeda dari Pesan.
 */
export default function Shell({ children, onCreate }) {
  const me = useSession((s) => s.me);
  const badges = useSession((s) => s.badges);
  const { pathname } = useLocation();
  const [more, setMore] = useState(false);
  const user = me?.user;
  const inThread = /^\/pesan\/.+/.test(pathname) || /^\/konseling\/.+/.test(pathname);

  const nav = [
    { to: '/', label: 'Beranda', icon: Home, end: true },
    { to: '/cari', label: 'Cari', icon: Search },
    { to: '/jelajah', label: 'Jelajah', icon: Compass, desktopOnly: true },
    { to: '/pesan', label: 'Pesan', icon: MessageCircle, badge: badges.dms + badges.dmRequests },
    { to: '/aktivitas', label: 'Notifikasi', icon: Heart, badge: badges.notifs, dot: true, desktopOnly: true },
    { to: '/konseling', label: 'Bilik Konseling', icon: HeartHandshake, badge: badges.counselWaiting, desktopOnly: true }
  ];

  return (
    <div className={styles.app}>
      {/* ── Sidebar desktop ── */}
      <aside className={styles.side} aria-label="Navigasi utama"
        onMouseLeave={(e) => { if (e.currentTarget.contains(document.activeElement)) document.activeElement.blur(); }}>
        <Link to="/" className={styles.brand} aria-label="Ruang Cerita — Beranda">
          <img src="/logo-96.png" alt="" width="34" height="34" />
          <span className={styles.brandText}><b>Ruang Cerita</b><small>PIK-R MANSEKU</small></span>
        </Link>
        <nav className={styles.sideNav}>
          {nav.map(({ to, label, icon: Icon, end, badge, dot }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `${styles.sideItem} ${isActive ? styles.on : ''}`}>
              <span className={styles.sideIcon}>
                <Icon size={24} strokeWidth={pathname === to || (!end && pathname.startsWith(to) && to !== '/') ? 2.6 : 2} />
                {badge > 0 && (dot ? <i className={styles.dot} /> : <i className={styles.badge}>{badge > 9 ? '9+' : badge}</i>)}
              </span>
              <span className={styles.sideLabel}>{label}</span>
            </NavLink>
          ))}
          <button type="button" className={styles.sideItem} onClick={onCreate}>
            <span className={styles.sideIcon}><PlusSquare size={24} /></span>
            <span className={styles.sideLabel}>Buat</span>
          </button>
          {user && (
            <NavLink to="/profil" className={({ isActive }) => `${styles.sideItem} ${isActive ? styles.on : ''}`}>
              <span className={styles.sideIcon}><Avatar user={user} size={26} /></span>
              <span className={styles.sideLabel}>Profil</span>
            </NavLink>
          )}
        </nav>
        <button type="button" className={`${styles.sideItem} ${styles.sideMore}`} onClick={() => setMore(true)}>
          <span className={styles.sideIcon}><Menu size={24} /></span>
          <span className={styles.sideLabel}>Lainnya</span>
        </button>
      </aside>

      {/* ── Bar atas HP ── */}
      {!inThread && (
        <header className={styles.top}>
          <Link to="/" className={styles.topBrand} aria-label="Ruang Cerita — Beranda">
            <img src="/logo-96.png" alt="" width="30" height="30" />
            <span>Ruang Cerita</span>
          </Link>
          <div className={styles.topActions}>
            <Link to="/konseling" className="icon-btn" aria-label="Bilik Konseling">
              <span className={styles.sideIcon}><HeartHandshake size={24} />{badges.counselWaiting > 0 && <i className={styles.badge}>{badges.counselWaiting}</i>}</span>
            </Link>
            <Link to="/aktivitas" className="icon-btn" aria-label="Notifikasi">
              <span className={styles.sideIcon}><Heart size={24} />{badges.notifs > 0 && <i className={styles.dot} />}</span>
            </Link>
          </div>
        </header>
      )}

      <main className={`${styles.main} ${inThread ? styles.mainFull : ''}`}>{children}</main>

      {/* ── Bar bawah HP ── */}
      {!inThread && (
        <nav className={styles.bottom} aria-label="Navigasi">
          <NavLink to="/" end className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabOn : ''}`} aria-label="Beranda"><Home size={26} /></NavLink>
          <NavLink to="/cari" className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabOn : ''}`} aria-label="Cari"><Search size={26} /></NavLink>
          <button type="button" className={`${styles.tab} ${styles.create}`} onClick={onCreate} aria-label="Buat"><PlusSquare size={26} /></button>
          <NavLink to="/pesan" className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabOn : ''}`} aria-label="Pesan">
            <span className={styles.sideIcon}><MessageCircle size={26} />{badges.dms + badges.dmRequests > 0 && <i className={styles.badge}>{badges.dms + badges.dmRequests > 9 ? '9+' : badges.dms + badges.dmRequests}</i>}</span>
          </NavLink>
          {user && <NavLink to="/profil" className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabOn : ''}`} aria-label="Profil"><Avatar user={user} size={28} /></NavLink>}
        </nav>
      )}

      <MoreMenu open={more} onClose={() => setMore(false)} />
    </div>
  );
}

function MoreMenu({ open, onClose }) {
  const { theme, setTheme } = useTheme();
  const logout = useSession((s) => s.logout);
  const dark = document.documentElement.dataset.theme === 'dark';
  const go = (to) => { onClose(); setTimeout(() => { window.location.assign(to); }, 0); };
  return (
    <Sheet open={open} onClose={onClose} title="Lainnya" size="sm">
      <MenuList items={[
        { label: 'Pengaturan & privasi', icon: <Settings size={19} />, onClick: () => go('/pengaturan') },
        { label: 'Disimpan', icon: <Bookmark size={19} />, onClick: () => go('/disimpan') },
        { label: dark ? 'Mode terang' : 'Mode gelap', icon: dark ? <Sun size={19} /> : <Moon size={19} />, hint: theme === 'system' ? 'Saat ini mengikuti sistem' : undefined, onClick: () => setTheme(dark ? 'light' : 'dark') },
        '-',
        { label: 'Keluar', icon: <LogOut size={19} />, danger: true, onClick: () => { disconnectLive(); logout(); onClose(); } }
      ]} />
    </Sheet>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LayoutDashboard, FileText, Settings, LogOut, ClipboardList, Users, Network, MessageSquare, X } from 'lucide-react';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pendaftaran', label: 'Pendaftaran', icon: ClipboardList },
  { to: '/admin/anggota', label: 'Anggota PIK-R', icon: Users },
  { to: '/admin/org', label: 'Struktur Org', icon: Network },
  { to: '/admin/testimoni', label: 'Testimoni Alumni', icon: MessageSquare },
  { to: '/admin/blog', label: 'Blog', icon: FileText },
  { to: '/admin/web-editor', label: 'Web Editor', icon: LayoutDashboard }, // Can use layout icon or similar
  { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export default function AdminSidebar({ isOpen = false, onClose }) {
  const { logoutAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      {/* Logo + Mobile Close Button */}
      <div className={styles.logoArea}>
        <img
          src="/media/logos/logo_pik-r.png"
          alt="PIK-R MANSEKU"
          className={styles.logo}
        />
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>PIK-R</span>
          <span className={styles.logoSub}>Admin Panel</span>
        </div>

        {/* Close button — visible only on mobile */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        <div className={styles.adminInfo}>
          <div className={styles.adminAvatar}>A</div>
          <span className={styles.adminName}>Administrator</span>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn} title="Keluar">
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}

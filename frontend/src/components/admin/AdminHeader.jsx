import { useUIStore } from '@/stores/uiStore';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import styles from './AdminHeader.module.css';

export default function AdminHeader({ title, subtitle, children }) {
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <header className={styles.header}>
      <div className={styles.titleArea}>
        <button
          type="button"
          className={styles.desktopToggleHeaderBtn}
          onClick={toggleSidebarCollapsed}
          title={sidebarCollapsed ? "Tampilkan Sidebar" : "Sembunyikan Sidebar"}
          aria-label="Toggle Sidebar"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}

import { useState, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Modal from '@/components/common/Modal';
import { AdminPageSkeleton } from '@/components/common/SkeletonLoading';
import { useUIStore } from '@/stores/uiStore';
import styles from './AdminLayout.module.css';
import { Menu } from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sidebarCollapsed } = useUIStore();
  const { pathname } = useLocation();

  // Page Builder mode: sembunyikan sidebar sepenuhnya
  const isPageBuilder = /\/admin\/desain\/halaman\//.test(pathname);

  return (
    <div className={styles.layout}>
      {/* Mobile top bar with hamburger */}
      {!isPageBuilder && (
        <div className={styles.mobileTopBar}>
          <button
            className={styles.hamburgerBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={22} />
          </button>
          <span className={styles.mobileTitle}>PIK-R Admin</span>
        </div>
      )}

      {/* Overlay (closes sidebar on click) */}
      {!isPageBuilder && (
        <div
          className={`${styles.overlay} ${sidebarOpen ? styles.visible : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {!isPageBuilder && (
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <main className={`${styles.main} ${isPageBuilder || sidebarCollapsed ? styles.mainExpanded : ''}`}
        style={isPageBuilder ? { padding: 0 } : undefined}>
        <Suspense fallback={<AdminPageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      <Modal />
    </div>
  );
}

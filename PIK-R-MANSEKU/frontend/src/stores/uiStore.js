import { create } from 'zustand';

/* ──────────────────────────────────────
   UI Store — global modal, confirm, & sidebar state
────────────────────────────────────── */
export const useUIStore = create((set) => ({
  // Desktop Sidebar Collapse State
  sidebarCollapsed: localStorage.getItem('pikr_admin_sidebar_collapsed') === 'true',
  toggleSidebarCollapsed: () => set((state) => {
    const next = !state.sidebarCollapsed;
    localStorage.setItem('pikr_admin_sidebar_collapsed', String(next));
    return { sidebarCollapsed: next };
  }),

  // Confirm modal
  confirmModal: null, // { title, message, onConfirm, danger }

  openConfirm: ({ title, message, onConfirm, danger = false }) =>
    set({ confirmModal: { title, message, onConfirm, danger } }),

  closeConfirm: () => set({ confirmModal: null }),
}));

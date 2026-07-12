import { create } from 'zustand';

/* ──────────────────────────────────────
   Auth Store — manages both admin and
   candidate JWT tokens + user data
────────────────────────────────────── */
export const useAuthStore = create((set) => ({
  // Admin state
  adminToken: localStorage.getItem('admin_token') || null,
  isAdminAuthenticated: !!localStorage.getItem('admin_token'),

  // Candidate state
  candidateToken: localStorage.getItem('candidate_token') || null,
  candidateUser: (() => {
    try {
      return JSON.parse(localStorage.getItem('candidate_user') || 'null');
    } catch {
      return null;
    }
  })(),
  isCandidateAuthenticated: !!localStorage.getItem('candidate_token'),

  // Admin actions
  setAdminToken: (token) => {
    localStorage.setItem('admin_token', token);
    set({ adminToken: token, isAdminAuthenticated: true });
  },

  logoutAdmin: () => {
    localStorage.removeItem('admin_token');
    set({ adminToken: null, isAdminAuthenticated: false });
  },

  // Candidate actions
  setCandidateAuth: (token, user) => {
    localStorage.setItem('candidate_token', token);
    localStorage.setItem('candidate_user', JSON.stringify(user));
    set({
      candidateToken: token,
      candidateUser: user,
      isCandidateAuthenticated: true,
    });
  },

  updateCandidateUser: (user) => {
    localStorage.setItem('candidate_user', JSON.stringify(user));
    set({ candidateUser: user });
  },

  logoutCandidate: () => {
    localStorage.removeItem('candidate_token');
    localStorage.removeItem('candidate_user');
    set({
      candidateToken: null,
      candidateUser: null,
      isCandidateAuthenticated: false,
    });
  },
}));

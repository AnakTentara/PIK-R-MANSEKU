import api from './axios';

// Auth
export const loginAdmin = (data) =>
  api.post('/admin/login', data);

export const getDashboardStats = () =>
  api.get('/admin/dashboard-stats');

// Candidates
export const getCandidates = (params) =>
  api.get('/admin/candidates', { params });

export const getCandidateById = (id) =>
  api.get(`/admin/candidates/${id}`);

export const createCandidate = (data) =>
  api.post('/admin/candidates', data);

export const updateCandidate = (id, data) =>
  api.put(`/admin/candidates/${id}`, data);

export const deleteCandidate = (id) =>
  api.delete(`/admin/candidates/${id}`);

export const promoteCandidateToMember = (id) =>
  api.post(`/admin/candidates/${id}/promote-to-member`);

export const generatePasswords = () =>
  api.post('/admin/candidates/generate-passwords');

export const sendNotifications = () =>
  api.post('/admin/candidates/send-notifications');

export const exportExcel = () =>
  api.get('/admin/candidates/export-excel', { responseType: 'blob' });

export const exportSelectionExcel = () =>
  api.get('/admin/candidates/export-selection-excel', { responseType: 'blob' });

export const exportJSON = () =>
  api.get('/admin/candidates/export-json', { responseType: 'blob' });

export const randomizeSelectionDays = (data) =>
  api.post('/admin/candidates/randomize-selection', data);

export const sendSelectionNotifications = (data) => {
  if (data instanceof FormData) {
    return api.post('/admin/candidates/send-selection-notifications', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000
    });
  }
  return api.post('/admin/candidates/send-selection-notifications', data, { timeout: 180000 });
};

export const batchUpdateAttendance = (data) =>
  api.post('/admin/candidates/batch-attendance', data);

export const exportAttendanceExcel = () =>
  api.get('/admin/candidates/export-attendance-excel', { responseType: 'blob' });

// Selection POS & Evaluation
export const getSelectionEvaluators = () =>
  api.get('/admin/selection/evaluators');

export const getSelectionScores = () =>
  api.get('/admin/selection/scores');

export const updateSelectionScore = (candidateId, data) =>
  api.put(`/admin/selection/scores/${candidateId}`, data);

export const toggleSelectionLock = (candidateId, data) =>
  api.post(`/admin/selection/scores/${candidateId}/toggle-lock`, data);

export const exportPOSScoreExcel = (pos) =>
  api.get(`/admin/selection/export-pos-excel`, { params: { pos }, responseType: 'blob' });

// Blog / Comments
export const deleteComment = (id) =>
  api.delete(`/admin/comments/${id}`);

// Settings
export const getSettings = () =>
  api.get('/admin/settings');

export const saveSettings = (data) =>
  api.put('/admin/settings', data);

// Session Lifecycle
export const closeSession = () =>
  api.post('/admin/session/close');

export const openSession = () =>
  api.post('/admin/session/open');

// Members (permanent registry)
export const getMembers = (params) =>
  api.get('/admin/members', { params });

export const createMember = (data) =>
  api.post('/admin/members', data);

export const updateMember = (id, data, config = {}) =>
  api.put(`/admin/members/${id}`, data, config);

export const deleteMember = (id) =>
  api.delete(`/admin/members/${id}`);

// Org Members
export const getOrgMembers = () =>
  api.get('/admin/org');

export const createOrgMember = (formData) =>
  api.post('/admin/org', formData);

export const updateOrgMember = (id, formData) =>
  api.put(`/admin/org/${id}`, formData);

export const deleteOrgMember = (id) =>
  api.delete(`/admin/org/${id}`);

// Testimonials
export const getTestimonials = () =>
  api.get('/admin/testimonials');

export const createTestimonial = (formData) =>
  api.post('/admin/testimonials', formData);

export const updateTestimonial = (id, formData) =>
  api.put(`/admin/testimonials/${id}`, formData);

export const deleteTestimonial = (id) =>
  api.delete(`/admin/testimonials/${id}`);

// Blog Image Upload
export const uploadBlogImage = (formData) =>
  api.post('/admin/blog/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Web Editor Logo Upload
export const uploadWebLogo = (formData) =>
  api.post('/admin/web-editor/upload-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Admin Users CRUD
export const getAdminUsers = () =>
  api.get('/admin/users');

export const createAdminUser = (data) =>
  api.post('/admin/users', data);

export const updateAdminUser = (id, data) =>
  api.put(`/admin/users/${id}`, data);

export const deleteAdminUser = (id) =>
  api.delete(`/admin/users/${id}`);

// File Manager
export const getUploadedFiles = () =>
  api.get('/admin/files');

export const deleteUploadedFile = (filePath) =>
  api.delete('/admin/files', { data: { filePath } });

export const downloadBackupDb = () =>
  api.get('/admin/settings/backup-db', { responseType: 'blob' });


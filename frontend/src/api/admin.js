import api from './axios';

// Auth
export const loginAdmin = (data) =>
  api.post('/admin/login', data);

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

export const generatePasswords = () =>
  api.post('/admin/candidates/generate-passwords');

export const sendNotifications = () =>
  api.post('/admin/candidates/send-notifications');

export const exportExcel = () =>
  api.get('/admin/candidates/export-excel', { responseType: 'blob' });

export const exportJSON = () =>
  api.get('/admin/candidates/export-json', { responseType: 'blob' });

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

export const updateMember = (id, data) =>
  api.put(`/admin/members/${id}`, data);

export const deleteMember = (id) =>
  api.delete(`/admin/members/${id}`);

// Org Members
export const getOrgMembers = () =>
  api.get('/admin/org');

export const createOrgMember = (formData) =>
  api.post('/admin/org', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const updateOrgMember = (id, formData) =>
  api.put(`/admin/org/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteOrgMember = (id) =>
  api.delete(`/admin/org/${id}`);

// Testimonials
export const getTestimonials = () =>
  api.get('/admin/testimonials');

export const createTestimonial = (formData) =>
  api.post('/admin/testimonials', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const updateTestimonial = (id, formData) =>
  api.put(`/admin/testimonials/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteTestimonial = (id) =>
  api.delete(`/admin/testimonials/${id}`);

// Blog Image Upload
export const uploadBlogImage = (formData) =>
  api.post('/admin/blog/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });


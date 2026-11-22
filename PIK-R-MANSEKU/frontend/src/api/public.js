import api from './axios';

export const getPublicMembers = () =>
  api.get('/public/members');

export const getPublicAlumni = () =>
  api.get('/public/alumni');

export const getPublicOrg = () =>
  api.get('/public/org');

export const getPublicTestimonials = () =>
  api.get('/public/testimonials');

// Profil anggota dari QR ID Card: /@slug
export const getMemberProfile = (slug) =>
  api.get(`/public/profile/${encodeURIComponent(slug)}`);

export const getOrgStructure = () =>
  api.get('/public/org-structure');

// Sosial: ikuti, teman dekat, bisukan, blokir, laporkan
export const followMember = (slug) => api.post(`/social/follow/${encodeURIComponent(slug)}`);
export const unfollowMember = (slug) => api.delete(`/social/follow/${encodeURIComponent(slug)}`);
export const setMemberRelation = (slug, type, on) => api.put(`/social/relation/${encodeURIComponent(slug)}`, { type, on });
export const reportContent = (data) => api.post('/social/report', data);
export const getFollowList = (slug, kind) => api.get(`/social/list/${encodeURIComponent(slug)}/${kind}`);

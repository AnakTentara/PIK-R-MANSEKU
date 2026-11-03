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

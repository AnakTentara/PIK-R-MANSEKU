import api from './axios';

/**
 * API Helper untuk Ekosistem Sosial & Stories "Ruang Cerita PIK-R"
 */

// Stories
export const getStories = () => api.get('/social/stories');

export const createStory = (formData) =>
  api.post('/social/stories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  });

export const deleteStory = (id) => api.delete(`/social/stories/${id}`);

export const viewStory = (id) => api.post(`/social/stories/${id}/view`);

// Relasi Sosial & Follow
export const getFollowList = (slug, kind) =>
  api.get(`/social/list/${encodeURIComponent(slug)}/${kind}`);

export const followMember = (slug) =>
  api.post(`/social/follow/${encodeURIComponent(slug)}`);

export const unfollowMember = (slug) =>
  api.delete(`/social/follow/${encodeURIComponent(slug)}`);

export const setMemberRelation = (slug, type, on = true) =>
  api.put(`/social/relation/${encodeURIComponent(slug)}`, { type, on });

export const reportTarget = (payload) =>
  api.post('/social/report', payload);

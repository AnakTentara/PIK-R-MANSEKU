import axios from 'axios';
import { useSession } from './session.js';

/** Klien API Ruang Cerita (/api/rc) dan login anggota (/api/candidates). */
const api = axios.create({ baseURL: '/api', timeout: 30000 });

api.interceptors.request.use((cfg) => {
  const token = useSession.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  if (cfg.data instanceof FormData) delete cfg.headers['Content-Type'];
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Deteksi timeout atau ketiadaan jaringan
    if (!err.response && (err.code === 'ECONNABORTED' || err.message?.includes('Network Error') || !navigator.onLine)) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pikr:network-timeout'));
      }
    }
    // Token kedaluwarsa: keluar otomatis
    if (err.response?.status === 401 && useSession.getState().token && !err.config?.url?.includes('/candidates/login')) {
      useSession.getState().logout();
    }
    return Promise.reject(err);
  }
);

export const errMsg = (err, fallback = 'Terjadi kesalahan') =>
  err?.response?.data?.message || (err?.response ? fallback : 'Tidak ada koneksi ke server');

/** URL media: path /uploads/... atau /api/... dipakai apa adanya (proxy yang sama). */
export const mediaUrl = (u) => (!u ? null : /^(https?:|blob:|data:)/.test(u) ? u : u);

export const rc = {
  me: () => api.get('/rc/me'),
  settings: (data) => api.put('/rc/me/settings', data),
  relations: () => api.get('/rc/me/relations'),
  closeFriends: () => api.get('/rc/me/close-friends'),
  saved: () => api.get('/rc/me/saved'),
  archive: () => api.get('/rc/me/archive'),
  badges: () => api.get('/rc/badges'),
  search: (q) => api.get('/rc/search', { params: { q } }),
  suggestions: () => api.get('/rc/suggestions'),
  followRequests: () => api.get('/rc/follow-requests'),
  answerRequest: (id, accept) => api.post(`/rc/follow-requests/${id}`, { accept }),
  profile: (u) => api.get(`/rc/users/${encodeURIComponent(u)}`),
  userPosts: (u, tab) => api.get(`/rc/users/${encodeURIComponent(u)}/posts`, { params: { tab } }),
  userStories: (u) => api.get(`/rc/users/${encodeURIComponent(u)}/stories`),
  connections: (u, kind, q) => api.get(`/rc/users/${encodeURIComponent(u)}/${kind}`, { params: { q } }),
  follow: (u) => api.post(`/rc/users/${encodeURIComponent(u)}/follow`),
  unfollow: (u) => api.delete(`/rc/users/${encodeURIComponent(u)}/follow`),
  removeFollower: (u) => api.delete(`/rc/users/${encodeURIComponent(u)}/follower`),
  relation: (u, type, on) => api.put(`/rc/users/${encodeURIComponent(u)}/relation`, { type, on }),

  feed: (cursor, mode) => api.get('/rc/feed', { params: { cursor, mode } }),
  explore: () => api.get('/rc/explore'),
  createPost: (fd, onUploadProgress) => api.post('/rc/posts', fd, { onUploadProgress, timeout: 180000 }),
  post: (id) => api.get(`/rc/posts/${id}`),
  updatePost: (id, data) => api.patch(`/rc/posts/${id}`, data),
  deletePost: (id) => api.delete(`/rc/posts/${id}`),
  like: (id, like) => api.post(`/rc/posts/${id}/like`, { like }),
  likers: (id) => api.get(`/rc/posts/${id}/likes`),
  save: (id, save) => api.post(`/rc/posts/${id}/save`, { save }),
  comments: (id, parent) => api.get(`/rc/posts/${id}/comments`, { params: { parent } }),
  addComment: (id, content, parentId) => api.post(`/rc/posts/${id}/comments`, { content, parentId }),
  deleteComment: (id) => api.delete(`/rc/comments/${id}`),
  likeComment: (id, like) => api.post(`/rc/comments/${id}/like`, { like }),
  pinComment: (id, pin) => api.post(`/rc/comments/${id}/pin`, { pin }),

  stories: () => api.get('/rc/stories'),
  createStory: (fd, onUploadProgress) => api.post('/rc/stories', fd, { onUploadProgress, timeout: 180000 }),
  deleteStory: (id) => api.delete(`/rc/stories/${id}`),
  viewStory: (id, answer) => api.post(`/rc/stories/${id}/view`, answer !== undefined ? { answer } : {}),
  storyViewers: (id) => api.get(`/rc/stories/${id}/viewers`),
  likeStory: (id, like) => api.post(`/rc/stories/${id}/like`, { like }),
  reactStory: (id, emoji) => api.post(`/rc/stories/${id}/react`, { emoji }),
  replyStory: (id, text) => api.post(`/rc/stories/${id}/reply`, { text }),
  highlight: (id) => api.get(`/rc/highlights/${id}`),
  saveHighlight: (data, id) => (id ? api.put(`/rc/highlights/${id}`, data) : api.post('/rc/highlights', data)),
  deleteHighlight: (id) => api.delete(`/rc/highlights/${id}`),

  inbox: (box) => api.get('/rc/inbox', { params: { box } }),
  openThread: (data) => api.post('/rc/threads', data),
  thread: (id, before) => api.get(`/rc/threads/${id}`, { params: { before } }),
  send: (id, fd) => api.post(`/rc/threads/${id}/messages`, fd),
  read: (id) => api.post(`/rc/threads/${id}/read`),
  typing: (id) => api.post(`/rc/threads/${id}/typing`),
  answerThread: (id, accept) => api.post(`/rc/threads/${id}/request`, { accept }),
  muteThread: (id, muted) => api.post(`/rc/threads/${id}/mute`, { muted }),
  leaveThread: (id) => api.post(`/rc/threads/${id}/leave`),
  editMessage: (id, text) => api.patch(`/rc/messages/${id}`, { text }),
  unsend: (id) => api.delete(`/rc/messages/${id}`),
  reactMessage: (id, emoji) => api.post(`/rc/messages/${id}/react`, { emoji }),
  openOnce: (id) => api.post(`/rc/messages/${id}/open`),
  share: (postId, usernames, text) => api.post('/rc/share', { postId, usernames, text }),
  notes: () => api.get('/rc/notes'),
  setNote: (note) => api.put('/rc/notes', { note }),

  counsel: () => api.get('/rc/counsel'),
  openCounsel: (data) => api.post('/rc/counsel', data),
  counselSession: (id) => api.get(`/rc/counsel/${id}`),
  counselSend: (id, text) => api.post(`/rc/counsel/${id}/messages`, { text }),
  counselClaim: (id) => api.post(`/rc/counsel/${id}/claim`),
  counselClose: (id, rating) => api.post(`/rc/counsel/${id}/close`, { rating }),
  counselEscalate: (id) => api.post(`/rc/counsel/${id}/escalate`),
  counselToggleAi: (id, aiActive) => api.post(`/rc/counsel/${id}/toggle-ai`, { aiActive }),
  counselSummary: (id) => api.post(`/rc/counsel/${id}/summary`),
  counselRequestHuman: (id) => api.post(`/rc/counsel/${id}/request-human`),

  aiLimit: () => api.get('/rc/ai/limit'),
  aiSessions: () => api.get('/rc/ai/sessions'),
  aiCreateSession: (tone) => api.post('/rc/ai/sessions', { tone }),
  aiSession: (id) => api.get(`/rc/ai/sessions/${id}`),
  aiChat: (id, text, tone) => api.post(`/rc/ai/sessions/${id}/chat`, { text, tone }),
  aiTone: (id, tone) => api.post(`/rc/ai/sessions/${id}/tone`, { tone }),
  aiDeleteSession: (id) => api.delete(`/rc/ai/sessions/${id}`),

  notifications: () => api.get('/rc/notifications'),
  readNotifications: () => api.post('/rc/notifications/read'),
  report: (data) => api.post('/rc/report', data)
};

export const login = (nisn, password) => api.post('/candidates/login', { nisn, password });
export default api;

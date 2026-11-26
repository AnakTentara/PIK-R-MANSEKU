import api from './axios';

// Public endpoints
export const getPublicNotification = (id) =>
  api.get(`/push/public/${encodeURIComponent(id)}`);

export const getPublicPertemuan = () =>
  api.get('/push/public/pertemuan');

export const getVapidPublicKey = () =>
  api.get('/push/public-key');

export const subscribePush = (data) =>
  api.post('/push/subscribe', data);

export const unsubscribePush = (data) =>
  api.post('/push/unsubscribe', data);

// Admin endpoints
export const getAdminPushStats = () =>
  api.get('/push/admin/stats');

export const getAdminPushHistory = () =>
  api.get('/push/admin/history');

export const deletePushHistory = (id) =>
  api.delete(`/push/admin/history/${id}`);

export const sendPushBroadcast = (data) =>
  api.post('/push/admin/broadcast', data);

export const sendPushTest = (data) =>
  api.post('/push/admin/test', data);

export const sendAppPushTest = (data) =>
  api.post('/push/admin/test-app', data);

export const uploadPushImage = (file) => {
  const fd = new FormData();
  fd.append('image', file);
  return api.post('/push/admin/upload-image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getAdminPertemuan = () =>
  api.get('/push/admin/pertemuan');

export const saveAdminPertemuan = (data) =>
  api.put('/push/admin/pertemuan', data);

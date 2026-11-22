import api from './axios';

/**
 * API absensi untuk menu Absensi di dashboard admin.
 * Endpoint yang sama dipakai web absen (absen.pikr-manseku.my.id);
 * backend menerima token admin dashboard (MEDINFO hanya baca).
 */

export const getAbsenOverview = () => api.get('/absen/overview');

// Kegiatan
export const getAbsenSessions = (limit = 100) => api.get('/absen/sessions', { params: { limit } });
export const createAbsenSession = (data) => api.post('/absen/sessions', data);
export const updateAbsenSession = (id, data) => api.patch(`/absen/sessions/${id}`, data);
export const deleteAbsenSession = (id) => api.delete(`/absen/sessions/${id}`);

// Rekap & data absen
export const getAbsenRecap = (from, to) => api.get('/absen/recap', { params: { from, to } });
export const exportAbsenExcel = (from, to) =>
  api.get('/absen/recap/excel', { params: { from, to }, responseType: 'blob', timeout: 60000 });
export const saveAbsenRecord = (data) => api.post('/absen/records', data);
export const deleteAbsenRecord = (id) => api.delete(`/absen/records/${id}`);
export const getMemberAttendance = (memberId) => api.get(`/absen/members/${memberId}/history`);

// Pengaturan
export const getAbsenSettings = () => api.get('/absen/settings');
export const updateAbsenSettings = (data) => api.put('/absen/settings', data);
export const resetAbsenPassword = (newPassword) => api.put('/absen/account/reset', { newPassword });

// ID Card
export const getIdCards = () => api.get('/absen/idcards');
export const exportIdCardRoster = () => api.get('/absen/idcards/export', { responseType: 'blob', timeout: 60000 });
export const importIdCardRoster = (file, dryRun) => {
  const body = new FormData();
  body.append('file', file);
  return api.post('/absen/idcards/import', body, { params: dryRun ? { dryRun: 1 } : undefined, timeout: 60000 });
};
export const resetIdCardCodes = () => api.delete('/absen/idcards/codes', { data: { confirm: 'HAPUS' } });

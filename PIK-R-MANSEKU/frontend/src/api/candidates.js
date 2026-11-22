import api from './axios';

export const registerCandidate = (data) =>
  api.post('/candidates/register', data);

export const checkStatus = (nisn) =>
  api.get('/candidates/check', { params: { nisn } });

export const loginCandidate = (data) =>
  api.post('/candidates/login', data);

export const getProfile = () =>
  api.get('/candidates/me');

export const updateProfile = (data) => {
  if (data instanceof FormData) {
    return api.put('/candidates/me', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return api.put('/candidates/me', data);
};

export const getPublicSettings = () =>
  api.get('/candidates/settings/public');

export const verifyResetOtp = (data) =>
  api.post('/candidates/reset-sandi/verify-otp', data);

// Kartu biodata milik anggota (/@slug)
export const getMyCard = () => api.get('/candidates/me/card');
export const saveMyCard = (formData) => api.put('/candidates/me/card', formData);

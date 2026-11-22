import express from 'express';
import { uploadExcel } from '../utils/multerConfig.js';
import { loginLimiter } from '../middlewares/rateLimit.js';
import { authAbsen, requireManager, requireWriter } from '../middlewares/authAbsen.js';
import {
  login,
  getMe,
  changePassword,
  resetSharedPassword,
  getTodaySession,
  createSession,
  updateSession,
  deleteSession,
  listSessions,
  listMembers,
  getMemberHistory,
  scanCard,
  recordAttendance,
  editRecordTime,
  deleteRecord,
  getRecordLogs,
  getRecap,
  exportRecapExcel,
  getOverview,
  getSettings,
  updateSettings,
  listIdCards,
  exportIdCardRoster,
  importIdCardRoster,
  resetIdCardCodes
} from '../controllers/absen.js';

/**
 * API absensi, dipakai oleh:
 * - web absen (absen.pikr-manseku.my.id): akun bersama pikrmanseku01
 * - menu Absensi di dashboard admin: token admin (MEDINFO hanya baca)
 */
const router = express.Router();

// Auth web absen
router.post('/login', loginLimiter, login);
router.get('/me', authAbsen, getMe);
router.put('/account', authAbsen, changePassword);
router.put('/account/reset', authAbsen, requireManager, resetSharedPassword);

// Kegiatan (sesi)
router.get('/session/today', authAbsen, getTodaySession);
router.get('/sessions', authAbsen, listSessions);
router.post('/sessions', authAbsen, requireWriter, createSession);
router.patch('/sessions/:id', authAbsen, requireWriter, updateSession);
router.delete('/sessions/:id', authAbsen, requireManager, deleteSession);

// Anggota & absensi
router.get('/members', authAbsen, listMembers);
router.get('/members/:id/history', authAbsen, getMemberHistory);
router.post('/scan', authAbsen, requireWriter, scanCard);
router.post('/records', authAbsen, requireWriter, recordAttendance);
router.patch('/records/:id', authAbsen, requireWriter, editRecordTime);
router.delete('/records/:id', authAbsen, requireWriter, deleteRecord);
router.get('/records/:id/logs', authAbsen, getRecordLogs);

// Rekap
router.get('/overview', authAbsen, getOverview);
router.get('/recap', authAbsen, getRecap);
router.get('/recap/excel', authAbsen, exportRecapExcel);

// Pengaturan
router.get('/settings', authAbsen, getSettings);
router.put('/settings', authAbsen, requireWriter, updateSettings);

// ID Card
router.get('/idcards', authAbsen, listIdCards);
router.get('/idcards/export', authAbsen, exportIdCardRoster);
router.post('/idcards/import', authAbsen, requireManager, uploadExcel.single('file'), importIdCardRoster);
router.delete('/idcards/codes', authAbsen, requireManager, express.json(), resetIdCardCodes);

export default router;

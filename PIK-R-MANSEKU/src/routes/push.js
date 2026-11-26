import express from 'express';
import {
  getPublicKey,
  subscribe,
  unsubscribe,
  getStats,
  getHistory,
  deleteHistory,
  sendBroadcast,
  sendTest,
  sendTestApp,
  getPublicNotification,
  getPublicPertemuan,
  getAdminPertemuan,
  saveAdminPertemuan,
  registerApp,
  streamApp,
  getPendingApp
} from '../controllers/push.js';
import { authAdmin, requireRole } from '../middlewares/auth.js';
import { uploadPhoto as upload } from '../utils/multerConfig.js';

const router = express.Router();

// Public endpoints (digunakan oleh browser client web PIK-R dan Ruang Cerita)
router.get('/public-key', getPublicKey);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.get('/public/pertemuan', getPublicPertemuan);
router.get('/public/:id', getPublicNotification);

// Native Mobile App endpoints (Ruang Cerita Android/iOS APK)
router.post('/app/register', registerApp);
router.get('/app/stream', streamApp);
router.get('/app/pending', getPendingApp);

// Admin endpoints (Notifikasi Massal oleh Pengurus)
const adminAuth = [authAdmin, requireRole(['DEVELOPER', 'KABINET_UMUM', 'MEDINFO'])];

router.get('/admin/stats', adminAuth, getStats);
router.get('/admin/history', adminAuth, getHistory);
router.delete('/admin/history/:id', adminAuth, deleteHistory);
router.post('/admin/broadcast', adminAuth, sendBroadcast);
router.post('/admin/test', adminAuth, sendTest);
router.post('/admin/test-app', adminAuth, sendTestApp);
router.get('/admin/pertemuan', adminAuth, getAdminPertemuan);
router.put('/admin/pertemuan', adminAuth, saveAdminPertemuan);
router.post('/admin/upload-image', adminAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file gambar yang diunggah' });
  }
  return res.json({ url: `/uploads/photos/${req.file.filename}` });
});

export default router;

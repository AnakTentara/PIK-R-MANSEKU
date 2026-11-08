import express from 'express';
import {
  registerCandidate,
  checkStatus,
  loginCandidate,
  getProfile,
  updateProfile,
  verifyResetOtp
} from '../controllers/candidates.js';
import { authCandidate } from '../middlewares/auth.js';
import { loginLimiter, otpLimiter, registerLimiter } from '../middlewares/rateLimit.js';
import prisma from '../config/db.js';
import { uploadPhoto as upload } from '../utils/multerConfig.js';
import { getMyCard, updateMyCard } from '../controllers/design.js';

const router = express.Router();

// In-memory cache untuk pengaturan publik (TTL 60 detik) agar tidak membebani database di traffic tinggi
let publicSettingsCache = null;
let publicSettingsCachedAt = 0;
const SETTINGS_CACHE_TTL = 60 * 1000;

export function clearPublicSettingsCache() {
  publicSettingsCache = null;
  publicSettingsCachedAt = 0;
}

// Public Settings for Landing page & registration status
router.get('/settings/public', async (req, res) => {
  try {
    const now = Date.now();
    if (publicSettingsCache && now - publicSettingsCachedAt < SETTINGS_CACHE_TTL) {
      return res.json(publicSettingsCache);
    }

    const sessionSetting = await prisma.setting.findUnique({ where: { key: 'REGISTRATION_SESSION' } });
    const landingSetting = await prisma.setting.findUnique({ where: { key: 'LANDING_PAGE_CONTENT' } });
    const webEditorSetting = await prisma.setting.findUnique({ where: { key: 'WEB_EDITOR_CONFIG' } });

    const payload = {
      registrationSession: sessionSetting ? JSON.parse(sessionSetting.value) : { status: 'open' },
      landingPageContent: landingSetting ? JSON.parse(landingSetting.value) : null,
      webEditorConfig: webEditorSetting ? JSON.parse(webEditorSetting.value) : null
    };

    publicSettingsCache = payload;
    publicSettingsCachedAt = now;

    return res.json(payload);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return res.status(500).json({ message: 'Gagal memuat pengaturan publik' });
  }
});

// Public Candidate Routes
router.post('/register', registerLimiter, registerCandidate);
router.get('/check', checkStatus);
router.post('/login', loginLimiter, loginCandidate);
router.post('/reset-sandi/verify-otp', otpLimiter, verifyResetOtp);

// Protected Candidate Routes
router.get('/me', authCandidate, getProfile);
router.put('/me', authCandidate, upload.single('photo'), updateProfile);
router.get('/me/card', authCandidate, getMyCard);
router.put('/me/card', authCandidate, upload.fields([{ name: 'cardPhoto', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), updateMyCard);

export default router;


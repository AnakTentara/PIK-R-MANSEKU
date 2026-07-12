import express from 'express';
import {
  registerCandidate,
  checkStatus,
  loginCandidate,
  getProfile,
  updateProfile
} from '../controllers/candidates.js';
import { authCandidate } from '../middlewares/auth.js';

import prisma from '../config/db.js';

const router = express.Router();

// Public Settings for Landing page & registration status
router.get('/settings/public', async (req, res) => {
  try {
    const sessionSetting = await prisma.setting.findUnique({ where: { key: 'REGISTRATION_SESSION' } });
    const landingSetting = await prisma.setting.findUnique({ where: { key: 'LANDING_PAGE_CONTENT' } });

    return res.json({
      registrationSession: sessionSetting ? JSON.parse(sessionSetting.value) : { status: 'open' },
      landingPageContent: landingSetting ? JSON.parse(landingSetting.value) : null
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return res.status(500).json({ message: 'Gagal memuat pengaturan publik' });
  }
});

// Public Candidate Routes
router.post('/register', registerCandidate);
router.get('/check', checkStatus);
router.post('/login', loginCandidate);

// Protected Candidate Routes
router.get('/me', authCandidate, getProfile);
router.put('/me', authCandidate, updateProfile);

export default router;

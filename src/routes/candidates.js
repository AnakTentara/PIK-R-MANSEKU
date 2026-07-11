import express from 'express';
import {
  registerCandidate,
  checkStatus,
  loginCandidate,
  getProfile,
  updateProfile
} from '../controllers/candidates.js';
import { authCandidate } from '../middlewares/auth.js';

const router = express.Router();

// Public Candidate Routes
router.post('/register', registerCandidate);
router.get('/check', checkStatus);
router.post('/login', loginCandidate);

// Protected Candidate Routes
router.get('/me', authCandidate, getProfile);
router.put('/me', authCandidate, updateProfile);

export default router;

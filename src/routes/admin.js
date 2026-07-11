import express from 'express';
import {
  loginAdmin,
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  generatePasswords,
  exportJSON,
  exportExcel,
  triggerNotifications,
  getSettings,
  saveSettings
} from '../controllers/admin.js';
import { deleteComment } from '../controllers/blog.js';
import { authAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public Admin Login
router.post('/login', loginAdmin);

// Protected Admin Routes (Requires authAdmin)
router.get('/candidates', authAdmin, getCandidates);
router.post('/candidates', authAdmin, createCandidate);
router.get('/candidates/export-json', authAdmin, exportJSON);
router.get('/candidates/export-excel', authAdmin, exportExcel);
router.post('/candidates/generate-passwords', authAdmin, generatePasswords);
router.post('/candidates/send-notifications', authAdmin, triggerNotifications);

// Candidate CRUD by ID
router.get('/candidates/:id', authAdmin, getCandidateById);
router.put('/candidates/:id', authAdmin, updateCandidate);
router.delete('/candidates/:id', authAdmin, deleteCandidate);

// Comments Management
router.delete('/comments/:id', authAdmin, deleteComment);

// Settings Management
router.get('/settings', authAdmin, getSettings);
router.put('/settings', authAdmin, saveSettings);

export default router;

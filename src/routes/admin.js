import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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
  saveSettings,
  // Session
  closeSession,
  openSession,
  // Members
  getMembers,
  updateMember,
  deleteMember,
  // Org
  getOrgMembers,
  createOrgMember,
  updateOrgMember,
  deleteOrgMember,
  // Testimonials
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/admin.js';
import { deleteComment } from '../controllers/blog.js';
import { authAdmin } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads/photos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Multer config for blog images
const blogImagesDir = path.join(__dirname, '../../public/uploads/blog');
if (!fs.existsSync(blogImagesDir)) {
  fs.mkdirSync(blogImagesDir, { recursive: true });
}

const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, blogImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `blog-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const uploadBlog = multer({
  storage: blogStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});


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

// Session Lifecycle
router.post('/session/close', authAdmin, closeSession);
router.post('/session/open', authAdmin, openSession);

// Member CRUD (permanent registry)
router.get('/members', authAdmin, getMembers);
router.put('/members/:id', authAdmin, updateMember);
router.delete('/members/:id', authAdmin, deleteMember);

// Org Member CRUD
router.get('/org', authAdmin, getOrgMembers);
router.post('/org', authAdmin, upload.single('photo'), createOrgMember);
router.put('/org/:id', authAdmin, upload.single('photo'), updateOrgMember);
router.delete('/org/:id', authAdmin, deleteOrgMember);

// Testimonials CRUD
router.get('/testimonials', authAdmin, getTestimonials);
router.post('/testimonials', authAdmin, upload.single('photo'), createTestimonial);
router.put('/testimonials/:id', authAdmin, upload.single('photo'), updateTestimonial);
router.delete('/testimonials/:id', authAdmin, deleteTestimonial);

// Blog Image Upload Endpoint
router.post('/blog/upload-image', authAdmin, uploadBlog.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Tidak ada file gambar yang diupload' });
  }
  const imageUrl = `/uploads/blog/${req.file.filename}`;
  return res.json({ imageUrl });
});

export default router;

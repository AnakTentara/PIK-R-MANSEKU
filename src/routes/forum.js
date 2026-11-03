import express from 'express';
import {
  getBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  toggleLikeBlogPost,
  approveBlogPost,
  createBlogComment,
  updateBlogComment,
  deleteBlogComment
} from '../controllers/blogForum.js';
import { authAdmin, authAny, authRequiredAny } from '../middlewares/auth.js';
import { uploadForum as upload } from '../utils/multerConfig.js';

const router = express.Router();

// Public forum endpoints
router.get('/posts', getBlogPosts);
router.get('/posts/:slug', getBlogPostBySlug);
router.post('/posts/:id/comments', authAny, createBlogComment); // optional auth to bind comment to candidate

// Protected forum endpoints (Login either as Member/Admin required)
router.post('/posts', authRequiredAny, upload.single('featuredImg'), createBlogPost);
router.put('/posts/:id', authRequiredAny, upload.single('featuredImg'), updateBlogPost);
router.delete('/posts/:id', authRequiredAny, deleteBlogPost);
router.post('/posts/:id/like', authAny, toggleLikeBlogPost); // supports guestId in req.body, otherwise candidate token
router.put('/comments/:id', authRequiredAny, updateBlogComment);
router.delete('/comments/:id', authRequiredAny, deleteBlogComment);

// Admin-only endpoints
router.put('/posts/:id/approve', authAdmin, approveBlogPost);

export default router;

import express from 'express';
import {
  getPosts,
  getPostBySlug,
  createComment,
  createPost,
  updatePost,
  deletePost
} from '../controllers/blog.js';
import { authAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public Blog Routes
router.get('/posts', getPosts);
router.get('/posts/:slug', getPostBySlug);
router.post('/posts/:postId/comments', createComment);

// Protected Blog Routes (Admin only)
router.post('/posts', authAdmin, createPost);
router.put('/posts/:id', authAdmin, updatePost);
router.delete('/posts/:id', authAdmin, deletePost);

export default router;

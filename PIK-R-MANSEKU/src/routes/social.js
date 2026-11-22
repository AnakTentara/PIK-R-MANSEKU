import express from 'express';
import { authCandidate, authAny } from '../middlewares/auth.js';
import {
  follow,
  unfollow,
  setRelation,
  report,
  list,
  getStories,
  createStory,
  deleteStory,
  viewStory
} from '../controllers/social.js';
import { uploadPhoto } from '../utils/multerConfig.js';

const router = express.Router();

// Stories (Ruang Cerita 24 Jam)
router.get('/stories', authAny, getStories);
router.post('/stories', authCandidate, uploadPhoto.single('media'), createStory);
router.delete('/stories/:id', authCandidate, deleteStory);
router.post('/stories/:id/view', viewStory);

// Hubungan sosial & daftar
router.get('/list/:slug/:kind', list);
router.post('/follow/:slug', authCandidate, follow);
router.delete('/follow/:slug', authCandidate, unfollow);
router.put('/relation/:slug', authCandidate, setRelation);
router.post('/report', authCandidate, report);

export default router;

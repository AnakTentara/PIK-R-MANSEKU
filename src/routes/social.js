import express from 'express';
import { authCandidate } from '../middlewares/auth.js';
import { follow, unfollow, setRelation, report, list } from '../controllers/social.js';

const router = express.Router();

router.get('/list/:slug/:kind', list);
router.post('/follow/:slug', authCandidate, follow);
router.delete('/follow/:slug', authCandidate, unfollow);
router.put('/relation/:slug', authCandidate, setRelation);
router.post('/report', authCandidate, report);

export default router;

/**
 * Router API Ruang Cerita: /api/rc/*
 * Semua respons diberi X-Robots-Tag: noindex (konten anggota di bawah umur tidak boleh diindeks).
 */
import express from 'express';
import multer from 'multer';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authAny } from '../middlewares/auth.js';
import * as A from './accounts.js';
import * as P from './posts.js';
import * as S from './stories.js';
import * as M from './messages.js';
import * as C from './counsel.js';
import * as N from './notifications.js';

const router = express.Router();

const memory = (sizeMB, maxFiles = 1) => multer({ storage: multer.memoryStorage(), limits: { fileSize: sizeMB * 1024 * 1024, files: maxFiles } });
const postUpload = memory(60, 10);   // foto/video postingan (video maks. 60 MB)
const storyUpload = memory(60, 1);
const dmUpload = memory(15, 1);

// Batas laju per anggota: mencegah spam komentar/pesan/unggahan
const keyByUser = (req) => (req.candidate?.id ? `m:${req.candidate.id}` : ipKeyGenerator(req.ip));
const writeLimiter = rateLimit({ windowMs: 60 * 1000, limit: 40, keyGenerator: keyByUser, standardHeaders: true, legacyHeaders: false, message: { message: 'Terlalu cepat. Tunggu sebentar, ya.' } });
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, keyGenerator: keyByUser, standardHeaders: true, legacyHeaders: false, message: { message: 'Batas unggahan per jam tercapai. Coba lagi nanti.' } });

router.use((req, res, next) => { res.set('X-Robots-Tag', 'noindex, nofollow'); next(); });
router.get('/stream', N.stream);
router.use(authAny);
router.use((req, res, next) => (req.method === 'GET' ? next() : writeLimiter(req, res, next)));

// Akun
router.get('/me', A.me);
router.put('/me/settings', A.updateSettings);
router.get('/me/relations', A.myRelations);
router.get('/me/close-friends', A.closeFriends);
router.get('/me/saved', P.savedPosts);
router.get('/me/archive', S.archive);
router.get('/badges', N.badges);
router.get('/search', A.search);
router.get('/suggestions', A.suggestions);
router.get('/follow-requests', A.followRequests);
router.post('/follow-requests/:id', A.answerRequest);
router.get('/users/:username', A.profile);
router.get('/users/:username/posts', P.userPosts);
router.get('/users/:username/stories', S.userStories);
router.get('/users/:username/followers', (req, res) => { req.params.kind = 'followers'; return A.connections(req, res); });
router.get('/users/:username/following', (req, res) => { req.params.kind = 'following'; return A.connections(req, res); });
router.post('/users/:username/follow', A.follow);
router.delete('/users/:username/follow', A.unfollow);
router.delete('/users/:username/follower', A.removeFollower);
router.put('/users/:username/relation', A.setRelation);

// Postingan
router.get('/feed', P.feed);
router.get('/explore', P.explore);
router.post('/posts', uploadLimiter, postUpload.array('media', 10), P.createPost);
router.get('/posts/:id', P.getPost);
router.patch('/posts/:id', P.updatePost);
router.delete('/posts/:id', P.deletePost);
router.post('/posts/:id/like', P.like);
router.get('/posts/:id/likes', P.likers);
router.post('/posts/:id/save', P.save);
router.get('/posts/:id/comments', P.comments);
router.post('/posts/:id/comments', P.addComment);
router.delete('/comments/:id', P.deleteComment);
router.post('/comments/:id/like', P.likeComment);
router.post('/comments/:id/pin', P.pinComment);

// Cerita & sorotan
router.get('/stories', S.tray);
router.post('/stories', uploadLimiter, storyUpload.single('media'), S.createStory);
router.delete('/stories/:id', S.deleteStory);
router.post('/stories/:id/view', S.viewStory);
router.get('/stories/:id/viewers', S.viewers);
router.post('/stories/:id/react', S.reactStory);
router.post('/stories/:id/reply', S.replyStory);
router.get('/highlights/:id', S.highlight);
router.post('/highlights', S.saveHighlight);
router.put('/highlights/:id', S.saveHighlight);
router.delete('/highlights/:id', S.deleteHighlight);

// Pesan
router.get('/inbox', M.inbox);
router.post('/threads', M.openThread);
router.get('/threads/:id', M.thread);
router.post('/threads/:id/messages', dmUpload.single('image'), M.send);
router.post('/threads/:id/read', M.markRead);
router.post('/threads/:id/typing', M.typing);
router.post('/threads/:id/request', M.answerThreadRequest);
router.post('/threads/:id/mute', M.muteThread);
router.post('/threads/:id/leave', M.leaveThread);
router.patch('/messages/:id', M.editMessage);
router.delete('/messages/:id', M.unsend);
router.post('/messages/:id/react', M.reactMessage);
router.post('/messages/:id/open', M.openViewOnce);
router.get('/messages/:id/media', M.media);
router.post('/share', M.sharePost);
router.get('/notes', M.notes);
router.put('/notes', M.setNote);

// Bilik Konseling
router.get('/counsel', C.overview);
router.post('/counsel', C.open_);
router.get('/counsel/:id', C.session);
router.post('/counsel/:id/messages', C.send);
router.post('/counsel/:id/claim', C.claim);
router.post('/counsel/:id/close', C.close);
router.post('/counsel/:id/escalate', C.escalate);

// Aktivitas & laporan
router.get('/notifications', N.list);
router.post('/notifications/read', N.markAllRead);
router.post('/report', N.report);

// Galat multer (ukuran/jumlah file)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File terlalu besar (foto maks. 15 MB, video maks. 60 MB).' : err.code === 'LIMIT_FILE_COUNT' ? 'Terlalu banyak file.' : 'Unggahan gagal.';
    return res.status(413).json({ message: msg });
  }
  return next(err);
});

export default router;

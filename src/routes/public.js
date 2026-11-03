import express from 'express';
import prisma from '../config/db.js';
import { INTI_ROLES, ORG_TITLE_SELECT, alumniLabel } from '../utils/memberUtils.js';
import { getCatalog, DEFAULT_POSITIONS } from '../utils/orgCatalog.js';
import { getPublicDesign } from '../controllers/design.js';

const router = express.Router();

// GET /api/public/members — Active members (for public page)
router.get('/members', async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { joinYear: 'asc' },
      select: { id: true, name: true, className: true, gender: true, joinYear: true, role: true, photoPath: true }
    });
    return res.json(members);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil data anggota' });
  }
});

// GET /api/public/alumni — Alumni members.
// Alumni tidak punya jabatan; hanya yang pernah tim inti (ketua, wakil, kabinet) diberi label,
// mis. 'ALUMNI KETUA UMUM 2025/2026'.
router.get('/alumni', async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      where: { status: 'ALUMNI' },
      orderBy: [{ joinYear: 'desc' }, { name: 'asc' }],
      select: {
        id: true, name: true, className: true, gender: true, joinYear: true, photoPath: true, slug: true, status: true,
        orgMember: { select: ORG_TITLE_SELECT }
      }
    });
    return res.json(members.map(({ orgMember, ...m }) => ({
      ...m,
      name: m.name.trim(),
      alumniLabel: alumniLabel(orgMember),
      isInti: !!alumniLabel(orgMember)
    })));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil data alumni' });
  }
});

// GET /api/public/org — Struktur organisasi.
// Hanya pengurus AKTIF (isCurrent) yang tampil di bagan. Arsip kepengurusan lama hanya berisi
// tim inti; anggota bidang yang sudah alumni tidak lagi dimunculkan.
router.get('/org', async (req, res) => {
  try {
    const org = await prisma.orgMember.findMany({
      orderBy: [{ yearStart: 'desc' }, { role: 'asc' }],
      include: {
        member: {
          // NISN sengaja tidak dikirim ke publik
          select: { id: true, name: true, photoPath: true, className: true, status: true, role: true }
        }
      }
    });

    // Also fetch active members for fallback name matching if memberId is not linked
    const activeMembers = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, photoPath: true }
    });
    const memberByName = new Map(activeMembers.map(m => [m.name.toLowerCase().trim(), m.photoPath]));

    const visible = org.filter(m => m.isCurrent || INTI_ROLES.includes(m.role));
    const normalized = visible.map((m) => {
      const linkedPhoto = m.member?.photoPath;
      const matchedPhoto = memberByName.get((m.name || '').toLowerCase().trim());
      const effectivePhoto = linkedPhoto || matchedPhoto || m.photoPath || null;
      return {
        ...m,
        effectivePhoto,
        photoPath: effectivePhoto // ensure both properties hold the resolved photo URL
      };
    });

    return res.json(normalized);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil data struktur organisasi' });
  }
});

router.get('/design', getPublicDesign);

// GET /api/public/org-structure — susunan hierarki jabatan (baris, urutan, induk).
// customized=false -> hierarki bawaan, halaman publik memakai bagan klasik.
router.get('/org-structure', async (req, res) => {
  try {
    const catalog = await getCatalog();
    return res.json({ customized: JSON.stringify(catalog) !== JSON.stringify(DEFAULT_POSITIONS), catalog });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil susunan jabatan' });
  }
});

// GET /api/public/testimonials — Alumni testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await prisma.alumniTestimonial.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(testimonials);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil data testimoni' });
  }
});

export default router;

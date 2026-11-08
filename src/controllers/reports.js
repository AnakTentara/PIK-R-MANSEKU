import prisma from '../config/db.js';

/**
 * Controller Moderasi Laporan untuk Admin Dashboard.
 * Menangani laporan pengguna terhadap Akun (MEMBER), Postingan (POST), atau Komentar (COMMENT).
 */

// GET /api/admin/reports
export async function getReports(req, res) {
  const { status = 'ALL', type = 'ALL', page = 1, limit = 20 } = req.query;
  const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, Math.max(1, parseInt(limit)));
  const take = Math.min(50, Math.max(1, parseInt(limit)));

  const where = {};
  if (status !== 'ALL') where.status = status;
  if (type !== 'ALL') where.targetType = type;

  try {
    const [reports, total, openCount] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          reporter: {
            select: { id: true, name: true, slug: true, photoPath: true, className: true }
          }
        }
      }),
      prisma.report.count({ where }),
      prisma.report.count({ where: { status: 'OPEN' } })
    ]);

    // Ambil detail konten yang dilaporkan secara efisien
    const populated = await Promise.all(
      reports.map(async (r) => {
        let targetData = null;
        try {
          if (r.targetType === 'MEMBER') {
            targetData = await prisma.member.findUnique({
              where: { id: r.targetId },
              select: { id: true, name: true, slug: true, photoPath: true, className: true, status: true }
            });
          } else if (r.targetType === 'POST') {
            targetData = await prisma.blogPost.findUnique({
              where: { id: r.targetId },
              select: { id: true, title: true, slug: true, content: true, status: true, memberAuthor: { select: { name: true, slug: true } } }
            });
            if (targetData) {
              targetData.contentSnippet = (targetData.content || '').replace(/<[^>]+>/g, ' ').slice(0, 150);
            }
          } else if (r.targetType === 'COMMENT') {
            targetData = await prisma.blogComment.findUnique({
              where: { id: r.targetId },
              select: { id: true, content: true, username: true, post: { select: { id: true, title: true, slug: true } } }
            });
          } else if (r.targetType === 'RC_POST') {
            const p = await prisma.rcPost.findUnique({ where: { id: r.targetId }, include: { author: { select: { name: true, slug: true } }, media: { take: 1, orderBy: { order: 'asc' } } } });
            if (p) targetData = { id: p.id, title: 'Postingan Ruang Cerita', contentSnippet: p.caption.slice(0, 150), status: p.removedAt ? 'DIHAPUS' : 'TAYANG', memberAuthor: p.author, thumb: p.media[0]?.thumbUrl || p.media[0]?.url || null };
          } else if (r.targetType === 'RC_STORY') {
            const st = await prisma.rcStory.findUnique({ where: { id: r.targetId }, include: { author: { select: { name: true, slug: true } } } });
            if (st) targetData = { id: st.id, title: 'Cerita Ruang Cerita', contentSnippet: st.text || '(foto/video)', status: st.removedAt ? 'DIHAPUS' : 'TAYANG', memberAuthor: st.author, thumb: st.kind === 'IMAGE' ? st.url : null };
          } else if (r.targetType === 'RC_COMMENT') {
            const c = await prisma.rcComment.findUnique({ where: { id: r.targetId }, include: { author: { select: { name: true, slug: true } } } });
            if (c) targetData = { id: c.id, content: c.content, username: c.author.name, memberAuthor: c.author };
          } else if (r.targetType === 'RC_MESSAGE') {
            // Pesan pribadi: admin hanya melihat pesan yang dilaporkan, bukan seluruh percakapan
            const { open } = await import('../rc/crypto.js');
            const m = await prisma.rcMessage.findUnique({ where: { id: r.targetId }, include: { sender: { select: { name: true, slug: true } } } });
            if (m) targetData = { id: m.id, content: m.unsentAt ? '(pesan sudah ditarik)' : (open(m.text) || '(foto)'), username: m.sender.name, memberAuthor: m.sender };
          }
        } catch (e) {
          // target mungkin sudah dihapus sebelumnya
        }

        return {
          ...r,
          targetData
        };
      })
    );

    return res.json({
      reports: populated,
      total,
      openCount,
      page: parseInt(page),
      totalPages: Math.ceil(total / take)
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    return res.status(500).json({ message: 'Gagal memuat laporan konten' });
  }
}

// PATCH /api/admin/reports/:id/status { status: 'OPEN' | 'REVIEWED' | 'DISMISSED' }
export async function updateReportStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!['OPEN', 'REVIEWED', 'DISMISSED'].includes(status)) {
    return res.status(400).json({ message: 'Status laporan tidak valid.' });
  }

  try {
    const updated = await prisma.report.update({
      where: { id },
      data: { status }
    });
    return res.json({ message: 'Status laporan berhasil diperbarui.', report: updated });
  } catch (error) {
    console.error('Error updating report status:', error);
    return res.status(500).json({ message: 'Gagal memperbarui status laporan' });
  }
}

/** Pemilik konten yang dilaporkan (anggota). */
async function reportedMemberId(report) {
  const t = report.targetType;
  if (t === 'MEMBER') return report.targetId;
  const pick = {
    POST: () => prisma.blogPost.findUnique({ where: { id: report.targetId }, select: { memberId: true } }).then((x) => x?.memberId),
    COMMENT: () => prisma.blogComment.findUnique({ where: { id: report.targetId }, select: { memberId: true } }).then((x) => x?.memberId),
    RC_POST: () => prisma.rcPost.findUnique({ where: { id: report.targetId }, select: { authorId: true } }).then((x) => x?.authorId),
    RC_STORY: () => prisma.rcStory.findUnique({ where: { id: report.targetId }, select: { authorId: true } }).then((x) => x?.authorId),
    RC_COMMENT: () => prisma.rcComment.findUnique({ where: { id: report.targetId }, select: { authorId: true } }).then((x) => x?.authorId),
    RC_MESSAGE: () => prisma.rcMessage.findUnique({ where: { id: report.targetId }, select: { senderId: true } }).then((x) => x?.senderId)
  }[t];
  return pick ? pick() : null;
}

// POST /api/admin/reports/:id/action { action: 'DELETE_CONTENT' | 'DEACTIVATE_USER' }
export async function takeReportAction(req, res) {
  const { id } = req.params;
  const { action } = req.body;

  try {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });

    if (action === 'DELETE_CONTENT') {
      if (report.targetType === 'POST') {
        await prisma.blogPost.delete({ where: { id: report.targetId } }).catch(() => null);
      } else if (report.targetType === 'COMMENT') {
        await prisma.blogComment.delete({ where: { id: report.targetId } }).catch(() => null);
      } else if (report.targetType === 'RC_POST') {
        await prisma.rcPost.update({ where: { id: report.targetId }, data: { removedAt: new Date() } }).catch(() => null);
      } else if (report.targetType === 'RC_STORY') {
        await prisma.rcStory.update({ where: { id: report.targetId }, data: { removedAt: new Date() } }).catch(() => null);
      } else if (report.targetType === 'RC_COMMENT') {
        await prisma.rcComment.delete({ where: { id: report.targetId } }).catch(() => null);
      } else if (report.targetType === 'RC_MESSAGE') {
        await prisma.rcMessage.update({ where: { id: report.targetId }, data: { unsentAt: new Date(), text: null, url: null } }).catch(() => null);
      }
    } else if (action === 'DEACTIVATE_USER' || action === 'FREEZE_USER') {
      // Bekukan akun SOSIAL saja (Ruang Cerita & blog) selama N hari. Status anggota, absensi, dan ID Card tidak disentuh.
      const memberId = await reportedMemberId(report);
      if (!memberId) return res.status(400).json({ message: 'Pemilik konten tidak ditemukan.' });
      const days = [1, 3, 7, 30].includes(Number(req.body.days)) ? Number(req.body.days) : 7;
      await prisma.rcProfile.upsert({
        where: { memberId },
        update: { frozenUntil: new Date(Date.now() + days * 864e5), frozenReason: String(req.body.reason || 'Melanggar pedoman komunitas').slice(0, 200) },
        create: { memberId, frozenUntil: new Date(Date.now() + days * 864e5), frozenReason: String(req.body.reason || 'Melanggar pedoman komunitas').slice(0, 200) }
      });
    } else {
      return res.status(400).json({ message: 'Tindakan moderasi tidak dikenal.' });
    }

    // Tandai laporan selesai ditinjau
    const updated = await prisma.report.update({
      where: { id },
      data: { status: 'REVIEWED' }
    });

    return res.json({ message: 'Tindakan berhasil diterapkan dan laporan ditandai selesai.', report: updated });
  } catch (error) {
    console.error('Error executing report action:', error);
    return res.status(500).json({ message: 'Gagal mengeksekusi tindakan moderasi' });
  }
}

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
      }
    } else if (action === 'DEACTIVATE_USER') {
      let memberId = report.targetId;
      if (report.targetType === 'POST') {
        const p = await prisma.blogPost.findUnique({ where: { id: report.targetId }, select: { memberId: true } });
        if (p?.memberId) memberId = p.memberId;
      } else if (report.targetType === 'COMMENT') {
        const c = await prisma.blogComment.findUnique({ where: { id: report.targetId }, select: { memberId: true } });
        if (c?.memberId) memberId = c.memberId;
      }
      if (memberId) {
        await prisma.member.update({ where: { id: memberId }, data: { status: 'INACTIVE' } }).catch(() => null);
      }
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

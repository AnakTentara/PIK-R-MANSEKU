import prisma from '../config/db.js';
import {
  getDesign, saveDesign, toCssVars, catalogForClient, sanitizeCardConfig, DEFAULT_DESIGN
} from '../utils/designConfig.js';

// GET /api/public/design — tema situs (dimuat semua halaman publik)
export async function getPublicDesign(req, res) {
  try {
    const design = await getDesign();
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json({ design, vars: toCssVars(design) });
  } catch (error) {
    console.error('Error getPublicDesign:', error);
    return res.status(500).json({ message: 'Gagal memuat desain' });
  }
}

// GET /api/admin/design — desain + katalog pilihan (untuk halaman Desain)
export async function getAdminDesign(req, res) {
  try {
    const design = await getDesign();
    return res.json({ design, vars: toCssVars(design), catalog: catalogForClient(), defaults: DEFAULT_DESIGN });
  } catch (error) {
    console.error('Error getAdminDesign:', error);
    return res.status(500).json({ message: 'Gagal memuat desain' });
  }
}

// PUT /api/admin/design
export async function saveAdminDesign(req, res) {
  try {
    const design = await saveDesign(req.body?.design || req.body);
    return res.json({ message: 'Desain disimpan', design, vars: toCssVars(design) });
  } catch (error) {
    console.error('Error saveAdminDesign:', error);
    return res.status(500).json({ message: 'Gagal menyimpan desain' });
  }
}

// POST /api/admin/design/upload — foto bawaan kartu (thumbnail default); mengembalikan path /uploads/...
export function uploadDesignImage(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Pilih gambar dulu' });
  return res.json({ path: `/uploads/photos/${req.file.filename}` });
}

// ─── Kartu biodata milik anggota (login anggota) ────────────────────────────

async function currentMember(req) {
  // token anggota berisi id Member bila akun anggota; kandidat (belum lulus) tidak punya kartu
  return prisma.member.findUnique({
    where: { id: req.candidate.id },
    select: { id: true, name: true, slug: true, bio: true, cardConfig: true, photoPath: true, status: true }
  });
}

const parseCard = (raw) => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };

// GET /api/candidates/me/card
export async function getMyCard(req, res) {
  try {
    const m = await currentMember(req);
    if (!m) return res.status(404).json({ message: 'Kartu hanya tersedia untuk anggota' });
    const design = await getDesign();
    return res.json({
      slug: m.slug, bio: m.bio, photoPath: m.photoPath,
      card: sanitizeCardConfig(parseCard(m.cardConfig)),
      allowEdit: design.card.allowMemberEdit,
      siteHidden: design.card.hidden,
      catalog: catalogForClient()
    });
  } catch (error) {
    console.error('Error getMyCard:', error);
    return res.status(500).json({ message: 'Gagal memuat kartu' });
  }
}

// PUT /api/candidates/me/card  { cover, accent, hidden, info[], cardPhoto?, coverPhoto?, resetCardPhoto?, resetCoverPhoto? }
// Foto dikirim sebagai multipart: cardPhoto / coverPhoto
export async function updateMyCard(req, res) {
  try {
    const m = await currentMember(req);
    if (!m) return res.status(404).json({ message: 'Kartu hanya tersedia untuk anggota' });
    const design = await getDesign();
    if (!design.card.allowMemberEdit) return res.status(403).json({ message: 'Pengaturan kartu sedang dikunci oleh admin' });

    const body = { ...req.body };
    if (typeof body.info === 'string') { try { body.info = JSON.parse(body.info); } catch { body.info = []; } }
    if (typeof body.hidden === 'string') { try { body.hidden = JSON.parse(body.hidden); } catch { body.hidden = []; } }

    const current = sanitizeCardConfig(parseCard(m.cardConfig));
    const files = req.files || {};
    const next = sanitizeCardConfig({
      ...current,
      ...body,
      cardPhoto: files.cardPhoto?.[0] ? `/uploads/photos/${files.cardPhoto[0].filename}` : (body.resetCardPhoto === 'true' ? null : current.cardPhoto),
      coverPhoto: files.coverPhoto?.[0] ? `/uploads/photos/${files.coverPhoto[0].filename}` : (body.resetCoverPhoto === 'true' ? null : current.coverPhoto)
    });
    // cover "foto" hanya sah bila ada fotonya
    if (next.cover === 'foto' && !next.coverPhoto) next.cover = null;

    const data = { cardConfig: JSON.stringify(next) };
    if (body.bio !== undefined) data.bio = String(body.bio).trim().slice(0, 300) || null;
    await prisma.member.update({ where: { id: m.id }, data });
    return res.json({ message: 'Kartu disimpan', card: next, slug: m.slug });
  } catch (error) {
    console.error('Error updateMyCard:', error);
    return res.status(500).json({ message: 'Gagal menyimpan kartu' });
  }
}

// PUT /api/admin/members/:id/card — admin mengatur kartu anggota (mis. mereset kartu yang tidak pantas)
export async function adminUpdateMemberCard(req, res) {
  try {
    const m = await prisma.member.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!m) return res.status(404).json({ message: 'Anggota tidak ditemukan' });
    const next = req.body?.reset ? {} : sanitizeCardConfig(req.body?.card || {});
    await prisma.member.update({ where: { id: m.id }, data: { cardConfig: req.body?.reset ? null : JSON.stringify(next) } });
    return res.json({ message: req.body?.reset ? 'Kartu dikembalikan ke bawaan' : 'Kartu disimpan', card: next });
  } catch (error) {
    console.error('Error adminUpdateMemberCard:', error);
    return res.status(500).json({ message: 'Gagal menyimpan kartu' });
  }
}

import prisma from '../config/db.js';

// Helper to generate unique slug
async function generateUniqueSlug(title) {
  let baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
    .replace(/\s+/g, '-')         // replace spaces with -
    .replace(/-+/g, '-');         // remove duplicate -

  if (!baseSlug) {
    baseSlug = 'post-' + Math.random().toString(36).substring(2, 8);
  }

  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// ==================== PUBLIC CONTROLLERS ====================

// 1. Get All Blog Posts (with search and pagination)
export async function getPosts(req, res) {
  const { search, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } }
          ]
        }
      : {};

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        author: {
          select: { username: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    const total = await prisma.post.count({ where });

    return res.json({
      posts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ message: 'Gagal mengambil postingan blog' });
  }
}

// 2. Get Single Blog Post by Slug with comments
export async function getPostBySlug(req, res) {
  const { slug } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: { username: true }
        },
        comments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    return res.json(post);
  } catch (error) {
    console.error('Error fetching single post:', error);
    return res.status(500).json({ message: 'Gagal mengambil detail postingan' });
  }
}

// 3. Create Public Comment (No Auth required)
export async function createComment(req, res) {
  const { postId } = req.params;
  const { username, content } = req.body;

  if (!username || !content) {
    return res.status(400).json({ message: 'Username dan isi komentar wajib diisi' });
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        username,
        content
      }
    });

    return res.status(201).json({ message: 'Komentar berhasil ditambahkan', comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ message: 'Gagal menambahkan komentar' });
  }
}

// ==================== ADMIN CONTROLLERS ====================

// 4. Create Blog Post (Admin only)
export async function createPost(req, res) {
  const { title, content, slug } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Judul dan konten wajib diisi' });
  }

  try {
    // Generate unique slug
    const finalSlug = slug ? slug.toLowerCase().replace(/\s+/g, '-') : await generateUniqueSlug(title);

    // Double check unique slug
    if (slug) {
      const existing = await prisma.post.findUnique({ where: { slug: finalSlug } });
      if (existing) {
        return res.status(400).json({ message: 'Slug sudah digunakan, pilih judul atau slug lain' });
      }
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        slug: finalSlug,
        authorId: req.admin.id // From authAdmin middleware
      }
    });

    return res.status(201).json({ message: 'Postingan blog berhasil dipublikasikan', post });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ message: 'Gagal membuat postingan blog' });
  }
}

// 5. Update Blog Post (Admin only)
export async function updatePost(req, res) {
  const { id } = req.params;
  const { title, content, slug } = req.body;

  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    let finalSlug = post.slug;
    if (slug && slug !== post.slug) {
      finalSlug = slug.toLowerCase().replace(/\s+/g, '-');
      const existing = await prisma.post.findUnique({ where: { slug: finalSlug } });
      if (existing) {
        return res.status(400).json({ message: 'Slug baru sudah digunakan' });
      }
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: title ?? post.title,
        content: content ?? post.content,
        slug: finalSlug
      }
    });

    return res.json({ message: 'Postingan blog berhasil diperbarui', post: updated });
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ message: 'Gagal memperbarui postingan blog' });
  }
}

// 6. Delete Blog Post (Admin only)
export async function deletePost(req, res) {
  const { id } = req.params;
  try {
    await prisma.post.delete({ where: { id } });
    return res.json({ message: 'Postingan blog berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ message: 'Gagal menghapus postingan blog' });
  }
}

// 7. Delete Comment (Admin only)
export async function deleteComment(req, res) {
  const { id } = req.params;
  try {
    await prisma.comment.delete({ where: { id } });
    return res.json({ message: 'Komentar berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ message: 'Gagal menghapus komentar' });
  }
}

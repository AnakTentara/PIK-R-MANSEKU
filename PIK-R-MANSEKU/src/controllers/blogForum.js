import prisma from '../config/db.js';
import { cleanBlogHtml, plainText } from '../utils/blogHtml.js';

const COMMENT_MAX = 1000;
const memberAuthorSelect = { name: true, photoPath: true, role: true, slug: true, status: true };

/** Anggota yang diblokir oleh / memblokir penonton: postingan dan komentarnya disembunyikan. */
async function hiddenMemberIds(viewerId) {
  if (!viewerId) return [];
  const rels = await prisma.memberRelation.findMany({
    where: { OR: [{ ownerId: viewerId, type: { in: ['BLOCK', 'MUTE'] } }, { targetId: viewerId, type: 'BLOCK' }] },
    select: { ownerId: true, targetId: true }
  });
  return [...new Set(rels.map((r) => (r.ownerId === viewerId ? r.targetId : r.ownerId)))];
}
const viewerMemberId = (req) => (req.candidate?.isMember ? req.candidate.id : null);

// Helper: build threaded comments tree up to 10 levels deep
function buildCommentTree(commentsList, maxDepth = 10) {
  const map = {};
  const roots = [];
  
  // Initialize map with replies array and clean structure
  commentsList.forEach(c => {
    map[c.id] = { 
      ...c, 
      replies: [] 
    };
  });

  // Helper to trace parent hierarchy and count depth
  function getDepth(commentId) {
    let depth = 0;
    let curr = map[commentId];
    while (curr && curr.parentId) {
      depth++;
      curr = map[curr.parentId];
    }
    return depth;
  }

  commentsList.forEach(c => {
    const depth = getDepth(c.id);
    if (c.parentId && map[c.parentId] && depth <= maxDepth) {
      map[c.parentId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

// 1. Get Blog Posts (Public / Admin)
export async function getBlogPosts(req, res) {
  const { category, tag, sort, search, status, author, mine, feed } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const take = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9));
  const skip = (page - 1) * take;

  // Status selain PUBLISHED (draf) hanya untuk admin, atau penulis sendiri lewat ?mine=1.
  // Dulu ?status=DRAFT/ALL bisa dipakai siapa pun untuk membaca draf orang lain.
  const where = {};
  if (req.admin && status) {
    if (status !== 'ALL') where.status = status;
  } else if (mine && req.candidate) {
    where.memberId = req.candidate.id;
  } else {
    where.status = 'PUBLISHED';
  }

  // Feed "Mengikuti": hanya tampilkan postingan dari teman yang diikuti oleh anggota
  if (feed === 'following') {
    const vid = viewerMemberId(req);
    if (!vid) {
      return res.json({ posts: [], total: 0, needLogin: true });
    }
    const followRows = await prisma.follow.findMany({
      where: { followerId: vid },
      select: { followingId: true }
    });
    const followingIds = followRows.map((f) => f.followingId);
    where.memberId = { in: followingIds };
  }
  // Postingan satu penulis (halaman profil /@slug)
  if (author) {
    const a = await prisma.member.findUnique({ where: { slug: String(author) }, select: { id: true } });
    where.memberId = a ? a.id : '__none__';
  }
  const hidden = await hiddenMemberIds(viewerMemberId(req));
  if (hidden.length) where.NOT = { memberId: { in: hidden } };

  if (category && category !== 'Semua') {
    where.category = category;
  }

  if (tag) {
    where.tags = {
      contains: tag
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } }
    ];
  }

  // Sorting
  let orderBy = { createdAt: 'desc' };
  if (sort === 'popular') {
    orderBy = { views: 'desc' };
  } else if (sort === 'likes') {
    orderBy = { likes: { _count: 'desc' } };
  } else if (sort === 'comments') {
    orderBy = { comments: { _count: 'desc' } };
  }

  try {
    const [posts, total] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          author: {
            select: { username: true, role: true }
          },
          memberAuthor: {
            select: memberAuthorSelect
          },
          _count: {
            select: { comments: true, likes: true }
          }
        }
      }),
      prisma.blogPost.count({ where })
    ]);
    const vid = viewerMemberId(req);
    const likedSet = new Set(vid && posts.length
      ? (await prisma.blogLike.findMany({ where: { memberId: vid, postId: { in: posts.map((p) => p.id) } }, select: { postId: true } })).map((l) => l.postId)
      : []);

    return res.json({
      posts: posts.map(p => ({
        ...p,
        // Daftar tidak perlu isi lengkap: ringkasan teks saja (lebih ringan)
        content: undefined,
        excerpt: plainText(p.content, 220),
        authorSlug: p.memberAuthor?.slug || null,
        liked: likedSet.has(p.id),
        authorName: p.author ? p.author.username : (p.memberAuthor ? p.memberAuthor.name : 'Anggota'),
        authorPhoto: p.memberAuthor ? p.memberAuthor.photoPath : null,
        authorRole: p.author ? p.author.role : (p.memberAuthor ? p.memberAuthor.role : 'member'),
        commentCount: p._count.comments,
        likeCount: p._count.likes
      })),
      total,
      page,
      totalPages: Math.ceil(total / take)
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({ message: 'Gagal mengambil data postingan blog' });
  }
}

// 2. Get Single Blog Post by Slug
export async function getBlogPostBySlug(req, res) {
  const { slug } = req.params;
  const vid = viewerMemberId(req);
  const include = {
    author: { select: { username: true, role: true } },
    memberAuthor: { select: memberAuthorSelect },
    comments: {
      include: { member: { select: memberAuthorSelect } },
      orderBy: { createdAt: 'asc' }
    },
    _count: { select: { likes: true } }
  };

  try {
    const post = await prisma.blogPost.findUnique({ where: { slug }, include });
    const isOwner = !!(req.candidate && post?.memberId === req.candidate.id);
    // Draf tidak boleh dibuka publik (dulu siapa pun yang tahu slug-nya bisa membaca)
    if (!post || (post.status !== 'PUBLISHED' && !req.admin && !isOwner)) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }
    const hidden = await hiddenMemberIds(vid);
    if (post.memberId && hidden.includes(post.memberId)) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }
    if (!isOwner && post.status === 'PUBLISHED') {
      await prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
      post.views += 1;
    }
    const liked = vid ? !!(await prisma.blogLike.findFirst({ where: { postId: post.id, memberId: vid }, select: { id: true } })) : false;
    const comments = post.comments.filter((c) => !c.memberId || !hidden.includes(c.memberId));

    return res.json({
      post: {
        ...post,
        authorName: post.author ? post.author.username : (post.memberAuthor ? post.memberAuthor.name : 'Anggota'),
        authorPhoto: post.memberAuthor ? post.memberAuthor.photoPath : null,
        authorRole: post.author ? post.author.role : (post.memberAuthor ? post.memberAuthor.role : 'member'),
        authorSlug: post.memberAuthor?.slug || null,
        comments: buildCommentTree(comments),
        commentCount: comments.length,
        likeCount: post._count.likes,
        liked,
        isOwner
      }
    });
  } catch (error) {
    console.error('Error getting single blog post:', error);
    return res.status(500).json({ message: 'Gagal memuat postingan blog' });
  }
}

// Helper: Generate unique slug
async function generateUniqueSlug(title) {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
    
  let slug = baseSlug;
  let count = 1;
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
}

// 3. Create Blog Post
export async function createBlogPost(req, res) {
  const title = plainText(req.body.title, 160);
  const content = cleanBlogHtml(req.body.content);
  const category = plainText(req.body.category, 40);
  const tags = plainText(req.body.tags, 200);
  const featuredImg = req.file ? `/uploads/photos/${req.file.filename}` : null;

  if (!title || !plainText(content)) {
    return res.status(400).json({ message: 'Judul dan konten wajib diisi' });
  }

  try {
    const slug = await generateUniqueSlug(title);
    
    let authorId = null;
    let memberId = null;
    let status = 'DRAFT'; // default for members

    if (req.admin) {
      authorId = req.admin.id;
      status = 'PUBLISHED'; // Admins auto-publish
    } else if (req.candidate) {
      memberId = req.candidate.id;
      
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (member && (member.role === 'PEMBINA' || member.role === 'KETUA')) {
        status = 'PUBLISHED';
      }
    } else {
      return res.status(401).json({ message: 'Tidak diizinkan membuat postingan' });
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        category: category || 'Umum',
        tags: tags || '',
        status,
        featuredImg,
        authorId,
        memberId
      }
    });

    return res.status(201).json({
      message: status === 'PUBLISHED' ? 'Postingan berhasil dipublikasikan' : 'Postingan berhasil dikirim untuk ditinjau admin',
      post
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({ message: 'Gagal membuat postingan blog' });
  }
}

// 4. Update Blog Post
export async function updateBlogPost(req, res) {
  const { id } = req.params;
  const title = req.body.title !== undefined ? plainText(req.body.title, 160) : undefined;
  const content = req.body.content !== undefined ? cleanBlogHtml(req.body.content) : undefined;
  const category = req.body.category !== undefined ? plainText(req.body.category, 40) : undefined;
  const tags = req.body.tags !== undefined ? plainText(req.body.tags, 200) : undefined;
  const { status } = req.body;
  const featuredImg = req.file ? `/uploads/photos/${req.file.filename}` : undefined;

  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    if (req.admin) {
      // Admin can edit
    } else if (req.candidate && post.memberId === req.candidate.id) {
      // Member can edit own
    } else {
      return res.status(403).json({ message: 'Anda tidak memiliki hak untuk mengedit postingan ini' });
    }

    const newStatus = req.admin && ['DRAFT', 'PUBLISHED'].includes(status) ? status : post.status;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title || post.title,
        content: content || post.content,
        category: category || post.category,
        tags: tags !== undefined ? tags : post.tags,
        status: newStatus,
        featuredImg: featuredImg !== undefined ? featuredImg : post.featuredImg
      }
    });

    return res.json({
      message: 'Postingan berhasil diperbarui',
      post: updated
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(500).json({ message: 'Gagal memperbarui postingan blog' });
  }
}

// 5. Delete Blog Post
export async function deleteBlogPost(req, res) {
  const { id } = req.params;

  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    if (req.admin) {
      // Admin can delete
    } else if (req.candidate && post.memberId === req.candidate.id) {
      // Member can delete own
    } else {
      return res.status(403).json({ message: 'Anda tidak memiliki hak untuk menghapus postingan ini' });
    }

    await prisma.blogPost.delete({ where: { id } });
    return res.json({ message: 'Postingan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({ message: 'Gagal menghapus postingan blog' });
  }
}

// 6. Toggle Like on Blog Post
export async function toggleLikeBlogPost(req, res) {
  const { id } = req.params;
  const memberId = viewerMemberId(req);
  // Dulu tamu bisa menyukai tanpa batas dengan guestId acak; kini wajib akun anggota
  if (!memberId) {
    return res.status(401).json({ message: 'Masuk dulu untuk menyukai postingan.', needLogin: true });
  }

  try {
    const post = await prisma.blogPost.findUnique({ where: { id }, select: { id: true, status: true, memberId: true } });
    if (!post || post.status !== 'PUBLISHED') {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }
    if (post.memberId && (await hiddenMemberIds(memberId)).includes(post.memberId)) {
      return res.status(403).json({ message: 'Tidak bisa berinteraksi dengan postingan ini.' });
    }
    const existing = await prisma.blogLike.findFirst({ where: { postId: id, memberId }, select: { id: true } });
    // Bisa diminta eksplisit (like: true/false) supaya ketukan ganda tidak saling membatalkan
    const want = typeof req.body?.like === 'boolean' ? req.body.like : !existing;
    if (want && !existing) await prisma.blogLike.create({ data: { postId: id, memberId } });
    if (!want && existing) await prisma.blogLike.deleteMany({ where: { postId: id, memberId } });
    const likeCount = await prisma.blogLike.count({ where: { postId: id } });
    return res.json({ liked: want, likeCount });
  } catch (error) {
    console.error('Error toggling like:', error);
    return res.status(500).json({ message: 'Gagal menyukai postingan' });
  }
}

// 7. Approve Blog Post Draft (Admin only)
export async function approveBlogPost(req, res) {
  const { id } = req.params;

  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    return res.json({ message: 'Postingan berhasil disetujui dan dipublikasikan', post: updated });
  } catch (error) {
    console.error('Error approving post:', error);
    return res.status(500).json({ message: 'Gagal menyetujui postingan' });
  }
}

// 8. Create Blog Comment (Public / Threaded)
export async function createBlogComment(req, res) {
  const { id: postId } = req.params;
  const content = plainText(req.body.content, COMMENT_MAX);
  const parentId = req.body.parentId || null;

  if (!req.candidate?.isMember && !req.admin) {
    return res.status(401).json({ message: 'Masuk dulu untuk berkomentar.', needLogin: true });
  }
  if (!content) {
    return res.status(400).json({ message: 'Komentar tidak boleh kosong' });
  }

  try {
    const post = await prisma.blogPost.findUnique({ where: { id: postId }, select: { id: true, status: true, memberId: true } });
    if (!post || post.status !== 'PUBLISHED') {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }
    if (parentId) {
      const parent = await prisma.blogComment.findUnique({ where: { id: parentId }, select: { postId: true } });
      if (!parent || parent.postId !== postId) return res.status(400).json({ message: 'Komentar yang dibalas tidak ditemukan' });
    }
    let memberId = null;
    let username = 'Admin';
    if (req.candidate?.isMember) {
      memberId = req.candidate.id;
      if (post.memberId && (await hiddenMemberIds(memberId)).includes(post.memberId)) {
        return res.status(403).json({ message: 'Tidak bisa berkomentar di postingan ini.' });
      }
      const member = await prisma.member.findUnique({ where: { id: memberId }, select: { name: true } });
      username = member?.name?.trim() || 'Anggota';
    } else if (req.admin) {
      const admin = await prisma.admin.findUnique({ where: { id: req.admin.id }, select: { username: true } });
      username = admin?.username || 'Admin';
    }

    const comment = await prisma.blogComment.create({
      data: { postId, content, parentId, memberId, username },
      include: { member: { select: memberAuthorSelect } }
    });
    return res.status(201).json({ message: 'Komentar berhasil ditambahkan', comment: { ...comment, replies: [] } });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ message: 'Gagal menambahkan komentar' });
  }
}

// 9. Update Comment
export async function updateBlogComment(req, res) {
  const { id } = req.params;
  const content = plainText(req.body.content, COMMENT_MAX);
  if (!content) return res.status(400).json({ message: 'Komentar tidak boleh kosong' });

  try {
    const comment = await prisma.blogComment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    if (req.admin) {
      // Admin can update
    } else if (req.candidate && comment.memberId === req.candidate.id) {
      // Member can update own
    } else {
      return res.status(403).json({ message: 'Anda tidak diizinkan mengedit komentar ini' });
    }

    const updated = await prisma.blogComment.update({
      where: { id },
      data: { content },
      include: {
        member: {
          select: memberAuthorSelect
        }
      }
    });

    return res.json({ message: 'Komentar berhasil diperbarui', comment: updated });
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ message: 'Gagal memperbarui komentar' });
  }
}

// 10. Delete Comment
export async function deleteBlogComment(req, res) {
  const { id } = req.params;

  try {
    const comment = await prisma.blogComment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    if (req.admin) {
      // Admin can delete
    } else if (req.candidate && comment.memberId === req.candidate.id) {
      // Member can delete own
    } else {
      return res.status(403).json({ message: 'Anda tidak diizinkan menghapus komentar ini' });
    }

    await prisma.blogComment.delete({ where: { id } });
    return res.json({ message: 'Komentar berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ message: 'Gagal menghapus komentar' });
  }
}

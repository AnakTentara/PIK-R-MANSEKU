import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPosts, deletePost } from '@/api/blog';
import { deleteComment } from '@/api/admin';
import { useUIStore } from '@/stores/uiStore';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import { formatDateShort, timeAgo } from '@/utils/formatDate';
import { truncate, stripHtml } from '@/utils/truncate';
import { Edit2, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminBlogPage.module.css';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openConfirm } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await getPosts({ limit: 100 });
      const data = res.data;
      setPosts(data.data || data.posts || data || []);
    } catch {
      toast.error('Gagal memuat data blog.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (id, title) => {
    openConfirm({
      title: 'Hapus Post',
      message: `Hapus post "${title}"? Semua komentar pada post ini juga akan terhapus.`,
      danger: true,
      onConfirm: async () => {
        try {
          await deletePost(id);
          setPosts((prev) => prev.filter((p) => p.id !== id));
          toast.success('Post berhasil dihapus.');
        } catch {
          toast.error('Gagal menghapus post.');
        }
      },
    });
  };

  const handleDeleteComment = (id) => {
    openConfirm({
      title: 'Hapus Komentar',
      message: 'Hapus komentar ini? Tindakan tidak dapat dibatalkan.',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteComment(id);
          // Refresh posts to update comment counts
          fetchPosts();
          toast.success('Komentar dihapus.');
        } catch {
          toast.error('Gagal menghapus komentar.');
        }
      },
    });
  };

  // Flatten all comments from posts
  const allComments = posts.flatMap((p) =>
    (p.comments || []).map((c) => ({ ...c, postTitle: p.title }))
  );

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Manajemen Blog"
        subtitle={`${posts.length} post dipublikasikan`}
      >
        <Link to="/admin/blog/new" className="btn btn-primary btn-sm">
          <Plus size={15} />
          Post Baru
        </Link>
      </AdminHeader>

      <div className={styles.body}>
        {/* Posts Table */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Daftar Post</h2>
          <div className={styles.tableWrap}>
            {loading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : posts.length === 0 ? (
              <div className={styles.empty}>Belum ada post blog.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Judul</th>
                    <th>Slug</th>
                    <th>Tanggal</th>
                    <th>Komentar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, i) => (
                    <tr key={post.id} className={i % 2 === 1 ? styles.rowAlt : ''}>
                      <td className={styles.tdNum}>{i + 1}</td>
                      <td className={styles.tdTitle}>{post.title}</td>
                      <td className={styles.tdSlug}>{post.slug}</td>
                      <td>{formatDateShort(post.createdAt)}</td>
                      <td>
                        {post._count?.comments ?? post.comments?.length ?? 0}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Link
                            to={`/admin/blog/edit/${post.id}`}
                            className="btn btn-secondary btn-sm"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeletePost(post.id, post.title)}
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Komentar Terbaru
            <span className={styles.sectionCount}>{allComments.length}</span>
          </h2>
          {allComments.length === 0 ? (
            <div className={styles.empty}>Belum ada komentar.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Post</th>
                    <th>Nama</th>
                    <th>Komentar</th>
                    <th>Waktu</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {allComments.slice(0, 30).map((c, i) => (
                    <tr key={c.id} className={i % 2 === 1 ? styles.rowAlt : ''}>
                      <td className={styles.tdPost}>{c.postTitle}</td>
                      <td className={styles.tdUser}>{c.username}</td>
                      <td className={styles.tdComment}>
                        {truncate(c.content, 80)}
                      </td>
                      <td className={styles.tdDate}>{timeAgo(c.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteComment(c.id)}
                          title="Hapus Komentar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

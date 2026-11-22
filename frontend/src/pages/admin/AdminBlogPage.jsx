import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, deletePost } from '@/api/blog';
import { getBlogPosts, deleteBlogPost, approveBlogPostApi } from '@/api/forum';
import { useUIStore } from '@/stores/uiStore';
import AdminHeader from '@/components/admin/AdminHeader';
import { formatDateShort } from '@/utils/formatDate';
import {
  Edit2, Trash2, Plus, Check, FileText, MessageSquare, Rss,
  Eye, Search, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminBlogPage.module.css';

/* ── Category color map ───────────────────────────────────────── */
const CATEGORY_COLORS = {
  Kesehatan:   { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  Lingkungan:  { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  Sosial:      { bg: '#fdf4ff', text: '#9333ea', border: '#e9d5ff' },
  Budaya:      { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  Pendidikan:  { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
  Olahraga:    { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  default:     { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

function getCategoryStyle(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
}

/* ── Thumbnail placeholder / image ───────────────────────────── */
function CardThumbnail({ src, alt }) {
  if (src) {
    return <img src={src} alt={alt} className={styles.cardImg} loading="lazy" />;
  }
  return <div className={styles.cardImgPlaceholder} aria-hidden="true" />;
}

/* ── News Card ───────────────────────────────────────────────── */
function NewsCard({ item, onDelete }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardThumb}>
        <CardThumbnail src={item.featuredImg} alt={item.title} />
        <div className={styles.cardOverlay}>
          <Link to={`/admin/blog/edit/${item.id}`} className={styles.overlayBtn} title="Edit">
            <Edit2 size={15} />
          </Link>
          <button
            className={`${styles.overlayBtn} ${styles.overlayBtnDanger}`}
            onClick={() => onDelete(item.id, item.title)}
            title="Hapus"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        {item.category && (
          <span
            className={styles.categoryPill}
            style={{
              background: getCategoryStyle(item.category).bg,
              color: getCategoryStyle(item.category).text,
              borderColor: getCategoryStyle(item.category).border,
            }}
          >
            {item.category}
          </span>
        )}
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <div className={styles.cardMeta}>
          <span>{formatDateShort(item.createdAt)}</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.viewCount}><Eye size={12} /> {item.views || 0}</span>
        </div>
      </div>
    </article>
  );
}

/* ── Blog Card (community) ───────────────────────────────────── */
function BlogCard({ item, onDelete, onApprove }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardThumb}>
        <CardThumbnail src={item.featuredImg} alt={item.title} />
        {item.status === 'DRAFT' && (
          <span className={styles.draftBadge}>DRAF</span>
        )}
        <div className={styles.cardOverlay}>
          {item.status === 'DRAFT' && (
            <button
              className={`${styles.overlayBtn} ${styles.overlayBtnSuccess}`}
              onClick={() => onApprove(item.id, item.title)}
              title="Approve & Publish"
            >
              <Check size={15} />
            </button>
          )}
          <Link
            to={`/blog/${item.slug}`}
            className={styles.overlayBtn}
            title="Lihat"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Rss size={15} />
          </Link>
          <button
            className={`${styles.overlayBtn} ${styles.overlayBtnDanger}`}
            onClick={() => onDelete(item.id, item.title)}
            title="Hapus"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        {item.category && (
          <span
            className={styles.categoryPill}
            style={{
              background: getCategoryStyle(item.category).bg,
              color: getCategoryStyle(item.category).text,
              borderColor: getCategoryStyle(item.category).border,
            }}
          >
            {item.category}
          </span>
        )}
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardAuthor}>{item.authorName}</p>
        <div className={styles.cardMeta}>
          <span>{formatDateShort(item.createdAt)}</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.viewCount}><Eye size={12} /> {item.views || 0}</span>
          <span className={styles.metaDot}>·</span>
          <span>❤️ {item.likeCount || 0}</span>
        </div>
      </div>
    </article>
  );
}

/* ── Skeleton Card ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={`skeleton ${styles.skelThumb}`} />
      <div className={styles.cardBody}>
        <div className={`skeleton ${styles.skelPill}`} />
        <div className={`skeleton ${styles.skelTitleLine}`} />
        <div className={`skeleton ${styles.skelTitleLineShort}`} />
        <div className={`skeleton ${styles.skelMeta}`} />
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function AdminBlogPage() {
  const [activeTab, setActiveTab] = useState('berita');

  // Berita state
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsSearch, setNewsSearch] = useState('');
  const [newsStatus, setNewsStatus] = useState('ALL');

  // Blog state
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogStatus, setBlogStatus] = useState('ALL');

  const { openConfirm } = useUIStore();

  useEffect(() => {
    fetchNews();
    fetchBlogs();
  }, []);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const res = await getPosts({ limit: 100 });
      setNews(res.data?.data || res.data?.posts || res.data || []);
    } catch {
      toast.error('Gagal memuat berita.');
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const res = await getBlogPosts({ limit: 100, status: 'ALL' });
      setBlogs(res.data?.posts || []);
    } catch {
      toast.error('Gagal memuat postingan blog komunitas.');
    } finally {
      setLoadingBlogs(false);
    }
  };

  const handleDeleteNews = (id, title) => {
    openConfirm({
      title: 'Hapus Berita',
      message: `Hapus berita resmi "${title}"? Tindakan tidak dapat dibatalkan.`,
      danger: true,
      onConfirm: async () => {
        try {
          await deletePost(id);
          setNews((prev) => prev.filter((n) => n.id !== id));
          toast.success('Berita berhasil dihapus.');
        } catch {
          toast.error('Gagal menghapus berita.');
        }
      },
    });
  };

  const handleDeleteBlog = (id, title) => {
    openConfirm({
      title: 'Hapus Postingan Blog',
      message: `Hapus postingan blog "${title}" dari komunitas? Semua komentar dan suka juga akan terhapus.`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteBlogPost(id);
          setBlogs((prev) => prev.filter((b) => b.id !== id));
          toast.success('Postingan blog berhasil dihapus.');
        } catch {
          toast.error('Gagal menghapus postingan blog.');
        }
      },
    });
  };

  const handleApproveBlog = async (id, title) => {
    try {
      await approveBlogPostApi(id);
      toast.success(`Postingan "${title}" berhasil disetujui!`);
      fetchBlogs();
    } catch {
      toast.error('Gagal menyetujui postingan blog.');
    }
  };

  /* Filtered lists */
  const filteredNews = news.filter((n) => {
    const matchSearch = !newsSearch || n.title?.toLowerCase().includes(newsSearch.toLowerCase());
    return matchSearch;
  });

  const filteredBlogs = blogs.filter((b) => {
    const matchStatus = blogStatus === 'ALL' || b.status === blogStatus;
    const matchSearch = !blogSearch || b.title?.toLowerCase().includes(blogSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const draftCount = blogs.filter((b) => b.status === 'DRAFT').length;

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Manajemen Konten"
        subtitle="Kelola rilis berita resmi dan postingan blog forum komunitas"
      >
        {activeTab === 'berita' ? (
          <Link to="/admin/blog/new" className={styles.writeBtn}>
            <Plus size={16} />
            + Tulis Berita
          </Link>
        ) : (
          <Link to="/blog/tulis" className={styles.writeBtn} target="_blank" rel="noopener noreferrer">
            <Plus size={16} />
            + Tulis Blog
          </Link>
        )}
      </AdminHeader>

      <div className={styles.body}>
        {/* Tabs */}
        <div className={styles.tabHeader}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'berita' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('berita')}
          >
            <FileText size={16} />
            Berita Resmi
            <span className={styles.tabCount}>{news.length}</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'blog' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            <MessageSquare size={16} />
            Blog Komunitas
            <span className={styles.tabCount}>{blogs.length}</span>
            {draftCount > 0 && (
              <span className={styles.badgeOrange}>{draftCount} Draf</span>
            )}
          </button>
        </div>

        {/* ── BERITA TAB ── */}
        {activeTab === 'berita' && (
          <div className={styles.section}>
            {/* Filter Bar */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrap}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Cari judul berita..."
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Card Grid */}
            {loadingNews ? (
              <div className={styles.grid}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredNews.length === 0 ? (
              <div className={styles.empty}>
                <FileText size={40} className={styles.emptyIcon} />
                <p>Belum ada berita resmi yang dipublikasikan.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredNews.map((n) => (
                  <NewsCard key={n.id} item={n} onDelete={handleDeleteNews} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BLOG TAB ── */}
        {activeTab === 'blog' && (
          <div className={styles.section}>
            {/* Filter Bar */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrap}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Cari judul blog..."
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                />
              </div>
              <div className={styles.selectWrap}>
                <select
                  className={styles.statusSelect}
                  value={blogStatus}
                  onChange={(e) => setBlogStatus(e.target.value)}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>
            </div>

            {/* Card Grid */}
            {loadingBlogs ? (
              <div className={styles.grid}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className={styles.empty}>
                <MessageSquare size={40} className={styles.emptyIcon} />
                <p>Tidak ada postingan blog yang cocok dengan filter.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredBlogs.map((b) => (
                  <BlogCard
                    key={b.id}
                    item={b}
                    onDelete={handleDeleteBlog}
                    onApprove={handleApproveBlog}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

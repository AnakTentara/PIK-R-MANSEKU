import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPosts } from '@/api/blog';
import { timeAgo } from '@/utils/formatDate';
import { truncate, stripHtml } from '@/utils/truncate';
import { MessageSquare, Search as SearchIcon } from 'lucide-react';
import SkeletonCard from '@/components/skeletons/SkeletonCard';
import SEO from '@/components/common/SEO';
import styles from './BlogListPage.module.css';

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await getPosts({ page, limit });
      const data = res.data;
      setPosts(data.data || data.posts || data);
      setTotal(data.total || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search.trim()
    ? posts.filter(
        (p) =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.content?.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="page-wrapper" style={{ backgroundColor: '#faf6ee', minHeight: '100vh', paddingTop: 'calc(var(--navbar-height) + 12px)' }}>
      <SEO 
        title="Blog & Artikel" 
        description="Temukan kumpulan artikel edukasi remaja, info kesehatan reproduksi, tips life skills, kegiatan konseling sebaya, dan berita seputar PIK-R MANSEKU MAN 1 Muara Enim." 
      />
      <section className="section" style={{ paddingBlock: 'var(--space-xl)' }}>
        <div className={`container ${styles.newspaperContainer}`}>
          {/* Newspaper Header */}
          <div className={styles.newspaperHeader}>
            <div className={styles.newspaperName}>WARTA MANSEKU</div>
            <div className={styles.newspaperSubheader}>
              <span>Volume IV • Edisi Terkini</span>
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>Edukasi & Konseling Remaja</span>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <SearchIcon size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cari berita warta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>Belum ada artikel.</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {filtered.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className={styles.card}
                  >
                    <h3 className={styles.cardTitle}>{post.title}</h3>
                    <p className={styles.cardBody}>
                      {truncate(stripHtml(post.content), 120)}
                    </p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardDate}>
                        {timeAgo(post.createdAt)}
                      </span>
                      <span className={styles.cardComments}>
                        <MessageSquare size={13} />
                        {post._count?.comments ?? post.comments?.length ?? 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    ← Prev
                  </button>
                  <span className={styles.pageInfo}>
                    Halaman {page} dari {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

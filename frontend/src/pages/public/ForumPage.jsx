import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBlogPosts, toggleLikeBlogPost } from '@/api/forum';
import { timeAgo } from '@/utils/formatDate';
import { truncate, stripHtml } from '@/utils/truncate';
import { getUploadUrl } from '@/api/axios';
import {
  Search as SearchIcon,
  Heart,
  MessageSquare,
  Eye,
  Edit2,
  Bookmark,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';
import SkeletonCard from '@/components/skeletons/SkeletonCard';
import SEO from '@/components/common/SEO';
import { useAuthStore } from '@/stores/authStore';
import { requireLogin } from '@/stores/quickLoginStore';
import StoriesTray from '@/components/common/StoriesTray';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import ScrollReveal from '@/components/common/ScrollReveal';
import toast from 'react-hot-toast';
import styles from './ForumPage.module.css';

const CATEGORIES = [
  { value: 'Semua', label: 'Semua', color: 'var(--color-text-secondary)' },
  { value: 'Umum', label: 'Umum', color: '#6b7280' },
  { value: 'Edukasi', label: 'Edukasi', color: '#3b82f6' },
  { value: 'Kegiatan', label: 'Kegiatan', color: 'var(--color-accent)' },
  { value: 'Konseling', label: 'Konseling', color: '#8b5cf6' },
  { value: 'Pengumuman', label: 'Pengumuman', color: '#ef4444' },
  { value: 'Curhat', label: 'Curhat', color: '#ec4899' },
];

export default function ForumPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  const feedMode = searchParams.get('feed') || 'all';
  const activeCategory = searchParams.get('category') || 'Semua';
  const activeSort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const [total, setTotal] = useState(0);
  const limit = 9;

  const { isCandidateAuthenticated, candidateUser, isAdminAuthenticated } = useAuthStore();
  const isLogged = isCandidateAuthenticated || isAdminAuthenticated;

  useEffect(() => {
    fetchPosts();
  }, [activeCategory, activeSort, page, searchParams, feedMode]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        category: activeCategory !== 'Semua' ? activeCategory : undefined,
        sort: activeSort,
        search: searchParams.get('search') || undefined,
        feed: feedMode === 'following' ? 'following' : undefined
      };
      const res = await getBlogPosts(params);
      setPosts(res.data?.posts || []);
      setTotal(res.data?.total || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedChange = (mode) => {
    if (mode === 'following' && !isLogged) {
      requireLogin(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('feed', 'following');
        newParams.set('page', '1');
        setSearchParams(newParams);
      }, 'Masuk akun anggota untuk melihat postingan sahabat yang kamu ikuti.');
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    if (mode === 'following') {
      newParams.set('feed', 'following');
    } else {
      newParams.delete('feed');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleLikePost = async (e, postId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLogged) {
      requireLogin(() => handleLikePost(e, postId), 'Masuk akun anggota untuk menyukai postingan.');
      return;
    }

    // Optimistic UI update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const willLike = !p.liked;
      return {
        ...p,
        liked: willLike,
        likeCount: willLike ? (p.likeCount || 0) + 1 : Math.max(0, (p.likeCount || 0) - 1)
      };
    }));

    try {
      const res = await toggleLikeBlogPost(postId);
      if (res.data?.liked !== undefined) {
        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p;
          return {
            ...p,
            liked: res.data.liked,
            likeCount: res.data.likeCount
          };
        }));
      }
    } catch {
      fetchPosts();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('category', cat);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (sortVal) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortVal);
    setSearchParams(newParams);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="page-wrapper">
      <SEO 
        title="Forum Blog Komunitas PIK-R" 
        description="Ruang diskusi, sharing cerita, curhat konseling, edukasi remaja, dan interaksi komunitas anggota PIK-R MANSEKU MAN 1 Muara Enim." 
      />
      <section className="section">
        <div className="container" style={{ maxWidth: '1040px' }}>
          
          {/* Header Section */}
          <ScrollReveal>
            <div className={styles.forumHeader}>
              <div>
                <span className={styles.kicker}>RUANG BERBAGI & DISKUSI</span>
                <h1 className={styles.title}>Blog Komunitas Remaja</h1>
                <p className={styles.subtitle}>Tulis ceritamu, bagikan tips edukasi, dan mulailah berdiskusi secara sehat bersama konselor PIK-R.</p>
              </div>
              
              {isLogged && (
                <Link to="/blog/tulis" className="btn btn-primary" style={{ gap: '8px' }}>
                  <Edit2 size={16} />
                  Buat Postingan Baru
                </Link>
              )}
            </div>
          </ScrollReveal>

          {/* Ruang Cerita Highlight Promo */}
          <ScrollReveal delay={50}>
            <div className={styles.ruangCeritaPromo}>
              <div className={styles.promoText}>
                <span className={styles.promoBadge}>🌟 SOSIAL MEDIA PIK-R</span>
                <h4>Ingin berbagi momen, cuplikan 24 jam & curhat sebaya?</h4>
                <p>Buka <strong>Ruang Cerita</strong> untuk melihat update stories sahabat, feed visual Instagram-style, dan bilik konseling.</p>
              </div>
              <a
                href="https://ruang-cerita.pikr-manseku.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.promoBtn}
              >
                Buka Ruang Cerita
                <ArrowRight size={16} />
              </a>
            </div>
          </ScrollReveal>

          {/* Navigation Category Tabs */}
          <ScrollReveal delay={100}>
            <div className={styles.categoryScroller}>
              <div className={styles.categoryTabs}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={`${styles.categoryTab} ${activeCategory === cat.value ? styles.categoryTabActive : ''}`}
                  >
                    {cat.value !== 'Semua' && (
                      <span className={styles.dotIndicator} style={{ backgroundColor: cat.color }} />
                    )}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Search and Sort Toolbar */}
          <ScrollReveal delay={150}>
            <div className={styles.toolbar}>
              <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
                <SearchIcon size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Cari thread diskus atau artikel blog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <div className={styles.sortSelector}>
                <span className={styles.sortLabel}>Urutkan:</span>
                <select
                  className={styles.sortSelect}
                  value={activeSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="newest">Terbaru</option>
                  <option value="popular">Terpopuler (Views)</option>
                  <option value="likes">Paling Disukai</option>
                  <option value="comments">Banyak Komentar</option>
                </select>
              </div>
            </div>
          </ScrollReveal>

          {/* Content Listing */}
          <ScrollReveal delay={200}>
          {loading ? (
            <div className={styles.threadsList}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={styles.skeletonThreadItem}>
                  <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '40%', height: '14px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className={styles.emptyState}>
              <FolderOpen size={48} className={styles.emptyIcon} />
              <h3>{feedMode === 'following' ? 'Belum Ada Cerita Sahabat' : 'Belum Ada Postingan'}</h3>
              <p>
                {feedMode === 'following'
                  ? 'Belum ada postingan dari akun yang kamu ikuti. Temukan dan ikuti teman seangkatan atau kakak alumni!'
                  : 'Tidak ada artikel blog atau thread diskusi yang ditemukan pada kategori ini.'}
              </p>
              {feedMode === 'following' ? (
                <Link to="/anggota" className="btn btn-primary" style={{ marginTop: '16px' }}>
                  Jelajahi Anggota PIK-R
                </Link>
              ) : isLogged && (
                <Link to="/blog/tulis" className="btn btn-primary" style={{ marginTop: '16px' }}>
                  Tulis Thread Pertama
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className={styles.threadsList}>
                {posts.map((post) => {
                  const initials = post.authorName ? post.authorName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : '?';
                  const catInfo = CATEGORIES.find(c => c.value === post.category) || { color: '#6b7280' };
                  
                  return (
                    <article key={post.id} className={styles.threadItem}>
                      {/* Left: Author Avatar */}
                      <div className={styles.threadAvatarWrap}>
                        {post.authorSlug ? (
                          <Link to={`/@${post.authorSlug}`} title={`Profil ${post.authorName}`}>
                            <PhotoAvatar
                              src={post.authorPhoto ? getUploadUrl(post.authorPhoto) : null}
                              name={post.authorName}
                              className={styles.threadAvatar}
                              placeholderClassName={styles.threadAvatarText}
                            />
                          </Link>
                        ) : (
                          <PhotoAvatar
                            src={post.authorPhoto ? getUploadUrl(post.authorPhoto) : null}
                            name={post.authorName}
                            className={styles.threadAvatar}
                            placeholderClassName={styles.threadAvatarText}
                          />
                        )}
                      </div>

                      {/* Center: Thread Info */}
                      <div className={styles.threadContent}>
                        <div className={styles.threadMetaTop}>
                          <span 
                            className={styles.threadCategory} 
                            style={{ 
                              color: catInfo.color, 
                              borderColor: catInfo.color + '30',
                              backgroundColor: catInfo.color + '10'
                            }}
                          >
                            {post.category}
                          </span>
                          <span className={styles.threadMetaDivider}>•</span>
                          {post.authorSlug ? (
                            <Link to={`/@${post.authorSlug}`} className={styles.authorProfileLink}>
                              {post.authorName}
                            </Link>
                          ) : (
                            <span className={styles.threadAuthor}>{post.authorName}</span>
                          )}
                          <span className={styles.roleBadge}>{post.authorRole.toUpperCase()}</span>
                          <span className={styles.threadMetaDivider}>•</span>
                          <span className={styles.threadTime}>{timeAgo(post.createdAt)}</span>
                        </div>

                        <Link to={`/blog/${post.slug}`} className={styles.threadTitleLink}>
                          <h2 className={styles.threadTitle}>
                            {post.title}
                            {post.status === 'DRAFT' && <span className={styles.draftBadge}>DRAF</span>}
                          </h2>
                        </Link>

                        {post.tags && (
                          <div className={styles.threadTags}>
                            {post.tags.split(',').map((tag) => (
                              <span key={tag} className={styles.threadTag}>#{tag.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Stats and Arrow */}
                      <div className={styles.threadRight}>
                        <div className={styles.threadStats}>
                          <button
                            type="button"
                            onClick={(e) => handleLikePost(e, post.id)}
                            className={`${styles.likeBtnInteractive} ${post.liked ? styles.likeBtnActive : ''}`}
                            title={post.liked ? 'Batal menyukai' : 'Suka postingan ini'}
                          >
                            <Heart size={15} fill={post.liked ? '#ef4444' : 'none'} color={post.liked ? '#ef4444' : 'currentColor'} />
                            <span>{post.likeCount || 0}</span>
                          </button>
                          <div className={styles.statItem} title="Komentar">
                            <MessageSquare size={14} />
                            <span>{post.commentCount || 0}</span>
                          </div>
                          <div className={styles.statItem} title="Dilihat">
                            <Eye size={14} />
                            <span>{post.views || 0}</span>
                          </div>
                        </div>

                        <Link to={`/blog/${post.slug}`} className={styles.goBtn}>
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', String(Math.max(1, page - 1)));
                      setSearchParams(newParams);
                    }}
                    disabled={page <= 1}
                  >
                    ← Prev
                  </button>
                  <span className={styles.pageInfo}>
                    Halaman {page} dari {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', String(Math.min(totalPages, page + 1)));
                      setSearchParams(newParams);
                    }}
                    disabled={page >= totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
          </ScrollReveal>

          {/* Floating Action Button for Mobile */}
          {isLogged && (
            <Link to="/blog/tulis" className={styles.mobileFab} title="Tulis Artikel Baru">
              <Edit2 size={20} />
            </Link>
          )}

        </div>
      </section>
    </div>
  );
}

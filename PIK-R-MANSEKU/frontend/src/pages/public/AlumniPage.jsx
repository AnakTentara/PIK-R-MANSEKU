import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPublicAlumni } from '@/api/public';
import SEO from '@/components/common/SEO';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import ScrollReveal from '@/components/common/ScrollReveal';
import { getUploadUrl } from '@/api/axios';
import { Search, GraduationCap, Award, ExternalLink, Users } from 'lucide-react';
import styles from './AlumniPage.module.css';

export default function AlumniPage() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPublicAlumni();
        setAlumni(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Unique join years
  const years = useMemo(() => {
    return Array.from(new Set(alumni.map((a) => a.joinYear).filter(Boolean))).sort((a, b) => b - a);
  }, [alumni]);

  // Filter & Search
  const filteredAlumni = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alumni
      .filter((a) => {
        const matchesYear = selectedYear === 'ALL' || a.joinYear === parseInt(selectedYear);
        if (!matchesYear) return false;
        if (!q) return true;
        const nameMatch = a.name?.toLowerCase().includes(q);
        const classMatch = a.className?.toLowerCase().includes(q);
        const labelMatch = a.alumniLabel?.toLowerCase().includes(q);
        return nameMatch || classMatch || labelMatch;
      })
      .sort((a, b) => (b.isInti - a.isInti) || a.name.localeCompare(b.name, 'id'));
  }, [alumni, selectedYear, search]);

  return (
    <div className="page-wrapper">
      <SEO 
        title="Alumni & Demisioner" 
        description="Ruang silaturahmi dan apresiasi bagi seluruh demisioner serta alumni PIK-R MAN 1 Muara Enim (PIK-R MANSEKU) dari berbagai angkatan." 
      />

      {/* Header Banner */}
      <section className={styles.header}>
        <div className="container">
          <div className={styles.badgeRow}>
            <span className={styles.countBadge}>
              <GraduationCap size={15} /> {alumni.length} Total Alumni
            </span>
          </div>
          <h1 className={styles.title}>Alumni &amp; Demisioner PIK-R</h1>
          <p className={styles.subtitle}>
            Apresiasi dan ruang silaturahmi bagi seluruh keluarga besar alumni serta demisioner PIK-R MAN 1 Muara Enim.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <ScrollReveal>
        <section className={`section ${styles.contentSection}`}>
          <div className="container">
          
          {/* Controls Bar: Search & Year Filter */}
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Cari nama, kelas, atau jabatan alumni..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setSearch('')}
                  title="Reset pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {years.length > 0 && (
              <div className={styles.filterBtns}>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${selectedYear === 'ALL' ? styles.active : ''}`}
                  onClick={() => setSelectedYear('ALL')}
                >
                  Semua Angkatan
                </button>
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    className={`${styles.filterBtn} ${selectedYear === String(y) ? styles.active : ''}`}
                    onClick={() => setSelectedYear(String(y))}
                  >
                    Angkatan {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid or Skeleton */}
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className={`${styles.card} ${styles.cardSkeleton}`}>
                  <div className={`skeleton ${styles.skelAvatar}`} />
                  <div className={styles.skelContent}>
                    <div className={`skeleton ${styles.skelLine}`} style={{ width: '70%' }} />
                    <div className={`skeleton ${styles.skelLine}`} style={{ width: '45%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div className={styles.empty}>
              <Users size={40} className={styles.emptyIcon} />
              <p>Tidak ada data alumni yang cocok dengan pencarian / filter.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredAlumni.map((a) => {
                const CardWrapper = a.slug ? Link : 'div';
                const wrapperProps = a.slug
                  ? {
                      to: `/@${a.slug}`,
                      className: `${styles.card} ${a.isInti ? styles.cardInti : ''} ${styles.cardLink}`,
                      title: `Buka profil @${a.slug}`
                    }
                  : {
                      className: `${styles.card} ${a.isInti ? styles.cardInti : ''}`
                    };

                return (
                  <CardWrapper key={a.id} {...wrapperProps}>
                    <div className={styles.avatarWrap}>
                      <PhotoAvatar
                        src={a.photoPath ? getUploadUrl(a.photoPath) : ''}
                        name={a.name}
                        className={styles.avatar}
                        placeholderClassName={styles.avatarPlaceholder}
                        size={56}
                      />
                      {a.isInti && (
                        <span className={styles.intiStar} title="Demisioner Tim Inti">
                          <Award size={14} />
                        </span>
                      )}
                    </div>

                    <div className={styles.info}>
                      <div className={styles.nameRow}>
                        <h4 className={styles.alumniName}>{a.name}</h4>
                        {a.slug && <ExternalLink size={13} className={styles.linkIcon} />}
                      </div>

                      <p className={styles.classText}>
                        Kelas saat aktif: <strong>{a.className || '—'}</strong>
                      </p>

                      <div className={styles.badgeRow}>
                        {a.alumniLabel && (
                          <span className={styles.intiBadge}>{a.alumniLabel}</span>
                        )}
                        <span className={styles.yearBadge}>
                          Angkatan {a.joinYear}
                        </span>
                      </div>
                    </div>
                  </CardWrapper>
                );
              })}
            </div>
          )}

        </div>
      </section>
      </ScrollReveal>
    </div>
  );
}

import styles from './SkeletonLoading.module.css';

/**
 * Skeleton shimmer loading umum untuk halaman publik (Berita, Blog, Kami, Anggota).
 */
export function PageSkeleton() {
  return (
    <div className={styles.wrapper} aria-busy="true" aria-label="Memuat konten...">
      <div className={styles.header}>
        <div className={`${styles.bar} ${styles.title}`} />
        <div className={`${styles.bar} ${styles.subtitle}`} />
      </div>

      <div className={styles.cardGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <div className={`${styles.bar} ${styles.cardThumb}`} />
            <div className={`${styles.bar} ${styles.cardLine}`} />
            <div className={`${styles.bar} ${styles.cardLineShort}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton shimmer khusus halaman Admin (Dashboard, Anggota, Absensi, Pengumuman, dll).
 */
export function AdminPageSkeleton() {
  return (
    <div className={styles.adminWrapper} aria-busy="true" aria-label="Memuat dashboard...">
      <div className={styles.header}>
        <div className={`${styles.bar} ${styles.title}`} style={{ width: 240 }} />
        <div className={`${styles.bar} ${styles.subtitle}`} style={{ width: 380 }} />
      </div>

      <div className={styles.statRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.bar} ${styles.statIcon}`} />
            <div className={`${styles.bar} ${styles.statVal}`} />
            <div className={`${styles.bar} ${styles.statLbl}`} />
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <div className={`${styles.bar} ${styles.searchBox}`} />
          <div className={`${styles.bar} ${styles.btnBox}`} />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.tableRow}>
            <div className={`${styles.bar} ${styles.avatarCircle}`} />
            <div className={`${styles.bar} ${styles.cellFlex}`} />
            <div className={`${styles.bar} ${styles.cellSm}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageSkeleton;

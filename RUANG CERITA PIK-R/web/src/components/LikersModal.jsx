import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { rc } from '@/lib/api.js';
import { Avatar, Sheet, Spinner, Empty } from './ui.jsx';
import styles from './LikersModal.module.css';

/**
 * Popup daftar penyuka postingan:
 * - Maksimal 10 orang teratas.
 * - Prioritas: Akun yang diikuti (A-Z), lalu dilanjutkan akun yang tidak diikuti (A-Z).
 * - Desktop: modal popup di tengah dengan tombol X.
 * - Mobile: sheet yang meluncur dari bawah ke atas.
 */
export function LikersModal({ postId, open, onClose }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!open || !postId) return;
    setItems(null);
    rc.likers(postId)
      .then((r) => setItems(r.data.items || []))
      .catch(() => setItems([]));
  }, [open, postId]);

  if (!open) return null;

  // Filter & Urutan:
  // 1. Yang diikuti (A-Z)
  // 2. Yang tidak diikuti (A-Z)
  // 3. Batas total tepat 10 orang
  const followed = (items || [])
    .filter((u) => u.following)
    .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

  const notFollowed = (items || [])
    .filter((u) => !u.following)
    .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

  const topFollowed = followed.slice(0, 10);
  const remaining = 10 - topFollowed.length;
  const topNotFollowed = notFollowed.slice(0, remaining);

  const displayList = [...topFollowed, ...topNotFollowed];

  const content = (
    <>
      <div className={styles.list}>
        {items === null ? (
          <Spinner />
        ) : displayList.length === 0 ? (
          <Empty title="Belum ada suka">Belum ada yang menyukai postingan ini.</Empty>
        ) : (
          displayList.map((u) => (
            <Link
              key={u.username}
              to={`/${u.username}`}
              className={styles.item}
              onClick={onClose}
            >
              <Avatar user={u} size={42} />
              <div className={styles.itemInfo}>
                <b>{u.username}</b>
                <small>{u.name}</small>
              </div>
              {u.following && (
                <span className={`${styles.badge} ${styles.badgeFollow}`}>Mengikuti</span>
              )}
            </Link>
          ))
        )}
      </div>
      {displayList.length > 0 && (
        <div className={styles.footerNote}>Hanya Menampilkan 10 Teratas</div>
      )}
    </>
  );

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 900;

  if (isDesktop) {
    return createPortal(
      <div
        className={styles.backdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
          <header className={styles.header}>
            <span>Suka</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </header>
          {content}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="Suka" size="md">
      {content}
    </Sheet>
  );
}

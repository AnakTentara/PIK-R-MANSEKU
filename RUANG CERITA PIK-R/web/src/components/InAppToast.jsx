import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { ago } from '@/lib/format.js';
import styles from './InAppToast.module.css';

/**
 * InAppToast — Kartu notifikasi in-app untuk DM & follow.
 * Dipakai bersama react-hot-toast via toast.custom().
 *
 * Props:
 *  - type: 'DM' | 'FOLLOW' | 'FOLLOW_REQUEST' | 'COUNSEL' | 'LIKE' | 'COMMENT'
 *  - actor: { name, avatar, username }
 *  - text: potongan teks (maks. 80 char)
 *  - href: path navigasi saat di-klik
 *  - t: objek toast dari react-hot-toast (untuk dismiss)
 *  - createdAt: ISO string opsional
 */
export default function InAppToast({ type = 'DM', actor = {}, text = '', href = '/', t, createdAt }) {
  const navigate = useNavigate();

  const badgeEmoji = {
    DM: '💬',
    FOLLOW: '👥',
    FOLLOW_REQUEST: '🔔',
    COUNSEL: '🤝',
    LIKE: '❤️',
    COMMENT: '💬',
  }[type] ?? '🔔';

  const badgeClass = {
    DM: styles.badgeDm,
    FOLLOW: styles.badgeFollow,
    FOLLOW_REQUEST: styles.badgeFollow,
    COUNSEL: styles.badgeDm,
  }[type] ?? '';

  const handleClick = () => {
    if (t?.id) window.dispatchEvent(new CustomEvent('toast-dismiss', { detail: t.id }));
    navigate(href);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    if (t?.id) window.dispatchEvent(new CustomEvent('toast-dismiss', { detail: t.id }));
  };

  const initials = (actor.name || '?').charAt(0).toUpperCase();

  return (
    <div className={styles.toastCard} onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}>

      {/* Avatar + badge */}
      <div className={styles.avatarWrap}>
        {actor.avatar ? (
          <img className={styles.avatarImg} src={actor.avatar} alt={actor.name} />
        ) : (
          <div className={styles.avatarFallback}>{initials}</div>
        )}
        <span className={`${styles.badgeIcon} ${badgeClass}`}>{badgeEmoji}</span>
      </div>

      {/* Konten */}
      <div className={styles.contentWrap}>
        <div className={styles.titleRow}>
          <span className={styles.senderName}>{actor.name || actor.username || 'Seseorang'}</span>
          {createdAt && <span className={styles.timeTag}>{ago(createdAt)}</span>}
        </div>
        {text && <p className={styles.messageSnippet}>{text}</p>}
      </div>

      {/* Tombol tutup */}
      <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Tutup notifikasi">
        <X size={13} />
      </button>
    </div>
  );
}

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Avatar, Username } from './ui.jsx';
import { Media, DesktopActions, useLike } from './PostCard.jsx';
import { CommentPanel } from './Comments.jsx';
import styles from './PostModal.module.css';

/** Tampilan desktop postingan: media di kiri, panel komentar & aksi di kanan. */
export function PostDesktopView({ post, onShare, onChange, onCount, autoFocusComment = false }) {
  if (!post) return null;
  const [, toggleLike] = useLike(post, onChange);
  const first = post.media?.[0];
  const rawRatio = first?.width && first?.height ? first.width / first.height : (16 / 9);
  const ratio = Math.min(16 / 9, Math.max(9 / 16, rawRatio));
  const isLandscape = ratio >= 1.25;

  return (
    <div
      className={`${styles.postDesktop} ${isLandscape ? styles.landscape : styles.portrait}`}
      style={{
        '--post-ratio': `${ratio}`,
      }}
    >
      <div className={styles.postMedia}>
        <Media media={post.media} ratio={ratio} onDoubleTap={() => toggleLike(true)} />
      </div>
      <div className={styles.postSide}>
        <header className={styles.postHead}>
          <Avatar user={post.author} size={36} />
          <Username user={post.author} />
        </header>
        <div className={styles.postComments}>
          <CommentPanel
            post={post}
            onCount={onCount}
            autoFocus={autoFocusComment}
            aboveComposer={
              <DesktopActions post={post} onShare={onShare} onChange={onChange} />
            }
          />
        </div>
      </div>
    </div>
  );
}

/** Popup modal preview postingan di atas feed beranda dengan latar blur 50% dan sidebar dikecualikan. */
export function PostModal({ post, open, onClose, onChange, onShare, onCount }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !post) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Tutup"
        title="Tutup"
      >
        <X size={24} />
      </button>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <PostDesktopView
          post={post}
          onShare={onShare}
          onChange={onChange}
          onCount={onCount}
          autoFocusComment
        />
      </div>
    </div>
  );
}

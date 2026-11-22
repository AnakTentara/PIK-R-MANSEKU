import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Eye, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { timeAgo } from '@/utils/formatDate';
import { getUploadUrl } from '@/api/axios';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import { viewStory, deleteStory } from '@/api/social';
import toast from 'react-hot-toast';
import styles from './StoryViewerModal.module.css';

const STORY_DURATION = 5000; // 5 detik per story slide

export default function StoryViewerModal({
  items = [], // [{ member: {...}, stories: [...] }]
  initialMemberIndex = 0,
  currentMemberId,
  isAdmin,
  onClose,
  onStoryDeleted
}) {
  const [memberIdx, setMemberIdx] = useState(initialMemberIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const elapsedBeforePauseRef = useRef(0);

  const currentGroup = items[memberIdx] || null;
  const currentStories = currentGroup?.stories || [];
  const currentStory = currentStories[storyIdx] || null;
  const member = currentGroup?.member || null;

  const isOwner = member?.id === currentMemberId || isAdmin;

  // View count increment
  useEffect(() => {
    if (currentStory?.id) {
      viewStory(currentStory.id).catch(() => {});
    }
  }, [currentStory?.id]);

  // Navigate to next story or next member
  const handleNext = useCallback(() => {
    if (storyIdx < currentStories.length - 1) {
      setStoryIdx(prev => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else if (memberIdx < items.length - 1) {
      setMemberIdx(prev => prev + 1);
      setStoryIdx(0);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      onClose();
    }
  }, [storyIdx, currentStories.length, memberIdx, items.length, onClose]);

  // Navigate to prev story or prev member
  const handlePrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(prev => prev - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else if (memberIdx > 0) {
      setMemberIdx(prev => prev - 1);
      const prevStories = items[memberIdx - 1]?.stories || [];
      setStoryIdx(Math.max(0, prevStories.length - 1));
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    }
  }, [storyIdx, memberIdx, items]);

  // Timer progression loop
  useEffect(() => {
    if (!currentStory || isPaused) return;

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / STORY_DURATION) * 100);
      setProgress(pct);

      if (elapsed >= STORY_DURATION) {
        clearInterval(interval);
        handleNext();
      }
    }, 40);

    timerRef.current = interval;

    return () => clearInterval(interval);
  }, [currentStory, isPaused, handleNext]);

  // Pause / Resume handlers
  const handleHoldStart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    elapsedBeforePauseRef.current = Date.now() - startTimeRef.current;
    setIsPaused(true);
  };

  const handleHoldEnd = () => {
    setIsPaused(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === ' ') setIsPaused(p => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  // Delete current story
  const handleDelete = async () => {
    if (!currentStory || !window.confirm('Hapus cerita ini?')) return;
    try {
      await deleteStory(currentStory.id);
      toast.success('Cerita dihapus');
      if (onStoryDeleted) onStoryDeleted(currentStory.id);
      handleNext();
    } catch {
      toast.error('Gagal menghapus cerita');
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
      >
        {/* Progress Bar Tray */}
        <div className={styles.progressBarTray}>
          {currentStories.map((s, idx) => {
            let width = '0%';
            if (idx < storyIdx) width = '100%';
            else if (idx === storyIdx) width = `${progress}%`;
            return (
              <div key={s.id || idx} className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width }} />
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className={styles.header}>
          <Link
            to={member?.slug ? `/@${member.slug}` : '#'}
            className={styles.authorLink}
            onClick={onClose}
          >
            <PhotoAvatar
              src={member?.photoPath ? getUploadUrl(member.photoPath) : null}
              name={member?.name}
              className={styles.avatar}
              placeholderClassName={styles.avatarPlaceholder}
            />
            <div className={styles.authorMeta}>
              <span className={styles.authorName}>{member?.name}</span>
              <span className={styles.timeAgo}>{timeAgo(currentStory.createdAt)}</span>
            </div>
          </Link>

          <div className={styles.headerActions}>
            {isOwner && (
              <button
                type="button"
                className={styles.iconBtn}
                onClick={handleDelete}
                title="Hapus cerita ini"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onClose}
              title="Tutup (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Left / Right touch navigation */}
        <div
          className={styles.touchAreaLeft}
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          title="Sebelumnya"
        />
        <div
          className={styles.touchAreaRight}
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          title="Berikutnya"
        />

        {/* Content Area */}
        <div className={styles.contentArea}>
          {currentStory.mediaUrl ? (
            <>
              {/* Blurred background — tone warna foto, seperti Instagram */}
              <div
                className={styles.storyBgBlur}
                style={{ backgroundImage: `url(${getUploadUrl(currentStory.mediaUrl)})` }}
              />
              {/* Foto utama centered */}
              <img
                src={getUploadUrl(currentStory.mediaUrl)}
                alt="Story"
                className={styles.storyImageCentered}
              />
            </>
          ) : (
            <div
              className={styles.storyTextCard}
              style={{
                background: currentStory.bgColor
                  ? currentStory.bgGradient
                    ? `linear-gradient(135deg, ${currentStory.bgColor}, ${currentStory.bgGradient})`
                    : currentStory.bgColor
                  : 'linear-gradient(135deg, #EA580C, #9333EA)'
              }}            >
              <div className={styles.storyTextContent}>
                {currentStory.caption}
              </div>
            </div>
          )}
        </div>

        {/* Caption Overlay (if media has text) */}
        {currentStory.mediaUrl && currentStory.caption && (
          <div className={styles.captionOverlay}>
            {currentStory.caption}
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          {isOwner ? (
            <div className={styles.viewCount}>
              <Eye size={14} />
              <span>{currentStory.views || 0} tayangan</span>
            </div>
          ) : (
            <div />
          )}

          {member?.slug && (
            <Link
              to={`/@${member.slug}`}
              className={styles.profilePill}
              onClick={onClose}
            >
              <User size={13} />
              <span>Lihat Profil</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getStories } from '@/api/social';
import { getUploadUrl } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import { requireLogin } from '@/stores/quickLoginStore';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import StoryViewerModal from './StoryViewerModal';
import CreateStoryModal from './CreateStoryModal';
import styles from './StoriesTray.module.css';

export default function StoriesTray() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeViewerIdx, setActiveViewerIdx] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { isCandidateAuthenticated, candidateUser, isAdminAuthenticated } = useAuthStore();
  const currentMemberId = candidateUser?.id || null;

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await getStories();
      setItems(res.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if current logged-in user already has active stories
  const myGroupIndex = items.findIndex((g) => g.member?.id === currentMemberId);
  const hasMyStories = myGroupIndex !== -1;

  const handleSelfClick = () => {
    if (!isCandidateAuthenticated && !isAdminAuthenticated) {
      requireLogin(() => setShowCreateModal(true), 'Masuk akun anggota untuk membagikan cerita 24 jam.');
      return;
    }

    if (hasMyStories) {
      // User has existing stories -> open viewer or let them create another
      setActiveViewerIdx(myGroupIndex);
    } else {
      setShowCreateModal(true);
    }
  };

  const handleItemClick = (idx) => {
    setActiveViewerIdx(idx);
  };

  const handleStoryDeleted = () => {
    fetchStories();
  };

  const handleStoryCreated = () => {
    fetchStories();
  };

  return (
    <div className={styles.trayContainer}>
      <div className={styles.scroller}>
        {/* Item 1: Cerita Kamu */}
        <button
          type="button"
          className={styles.storyItem}
          onClick={handleSelfClick}
          title={hasMyStories ? 'Lihat ceritamu' : 'Tambah cerita 24 jam'}
        >
          <div
            className={`${styles.ringWrapper} ${
              hasMyStories ? styles.ringActive : styles.ringCreate
            }`}
          >
            <div className={styles.avatarInner}>
              <PhotoAvatar
                src={candidateUser?.photoPath ? getUploadUrl(candidateUser.photoPath) : null}
                name={candidateUser?.name || 'Kamu'}
                className={styles.avatarImg}
                placeholderClassName={styles.avatarPlaceholder}
              />
            </div>
            {!hasMyStories && (
              <div className={styles.plusBadge}>
                <Plus size={13} strokeWidth={3} />
              </div>
            )}
          </div>
          <span className={`${styles.label} ${styles.labelSelf}`}>
            {hasMyStories ? 'Ceritamu' : '+ Cerita'}
          </span>
        </button>

        {/* Skeleton items while loading */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.storyItem}>
              <div className={`skeleton ${styles.skeletonCircle}`} />
              <div className="skeleton" style={{ width: '48px', height: '10px', marginTop: '4px' }} />
            </div>
          ))
        ) : (
          /* List of member stories */
          items.map((group, idx) => {
            // If it's already shown as "Cerita Kamu" first, don't duplicate
            if (group.member?.id === currentMemberId) return null;

            const m = group.member;
            const firstName = (m.name || 'Sobat').split(' ')[0];

            return (
              <button
                key={m.id || idx}
                type="button"
                className={styles.storyItem}
                onClick={() => handleItemClick(idx)}
              >
                <div className={`${styles.ringWrapper} ${styles.ringActive}`}>
                  <div className={styles.avatarInner}>
                    <PhotoAvatar
                      src={m.photoPath ? getUploadUrl(m.photoPath) : null}
                      name={m.name}
                      className={styles.avatarImg}
                      placeholderClassName={styles.avatarPlaceholder}
                    />
                  </div>
                </div>
                <span className={styles.label}>{firstName}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Story Viewer Modal */}
      {activeViewerIdx !== null && (
        <StoryViewerModal
          items={items}
          initialMemberIndex={activeViewerIdx}
          currentMemberId={currentMemberId}
          isAdmin={isAdminAuthenticated}
          onClose={() => setActiveViewerIdx(null)}
          onStoryDeleted={handleStoryDeleted}
        />
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleStoryCreated}
        />
      )}
    </div>
  );
}

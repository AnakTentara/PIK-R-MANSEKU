import { useState, useRef } from 'react';
import { X, Camera, Type, Loader2, UploadCloud, Sparkles } from 'lucide-react';
import { createStory } from '@/api/social';
import toast from 'react-hot-toast';
import styles from './CreateStoryModal.module.css';

const PRESET_COLORS = [
  '#EA580C', // Sunset Orange PIK-R
  '#EC4899', // Pink Magenta
  '#8B5CF6', // Purple Lavender
  '#2563EB', // Ocean Blue
  '#059669', // Emerald
  '#0F172A', // Midnight Slate
];

export default function CreateStoryModal({ onClose, onCreated }) {
  const [mode, setMode] = useState('photo'); // 'photo' | 'text'
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState(PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Hanya format gambar yang didukung (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 10MB.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'photo' && !photoFile) {
      toast.error('Pilih foto terlebih dahulu.');
      return;
    }

    if (mode === 'text' && !caption.trim()) {
      toast.error('Tulis kata-kata atau cerita singkatmu.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (mode === 'photo' && photoFile) {
        fd.append('media', photoFile);
        if (caption.trim()) fd.append('caption', caption.trim());
      } else {
        fd.append('caption', caption.trim());
        fd.append('bgColor', bgColor);
      }

      const res = await createStory(fd);
      toast.success(res.data?.message || 'Cerita 24 jam berhasil dibagikan! 🎉');
      if (onCreated) onCreated(res.data?.story);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal membagikan cerita.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--color-primary, #EA580C)" />
            <h3 className={styles.title}>Bagikan Cerita 24 Jam</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeTab} ${mode === 'photo' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('photo')}
          >
            <Camera size={16} />
            Foto
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${mode === 'text' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('text')}
          >
            <Type size={16} />
            Teks Warna
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {mode === 'photo' ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <div
                  className={styles.uploadDropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className={styles.previewImage} />
                      <div className={styles.changePhotoBadge}>Ganti Foto</div>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={38} color="#94a3b8" />
                      <span className={styles.dropzoneText}>Ketuk untuk memilih foto</span>
                      <span className={styles.dropzoneHint}>Format JPG, PNG, atau WebP (maks. 10MB)</span>
                    </>
                  )}
                </div>

                <div className={styles.captionGroup}>
                  <textarea
                    rows={2}
                    className={styles.captionInput}
                    placeholder="Tulis keterangan foto (opsional)..."
                    value={caption}
                    maxLength={300}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div
                  className={styles.textPreviewCard}
                  style={{ background: `linear-gradient(135deg, ${bgColor}, #0F172A)` }}
                >
                  <p className={styles.quoteText}>
                    {caption.trim() || 'Ketik ceritamu di bawah... ✨'}
                  </p>
                </div>

                {/* Color bubbles */}
                <div className={styles.colorPickerTray}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.colorBubble} ${bgColor === c ? styles.colorBubbleActive : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setBgColor(c)}
                      title={c}
                    />
                  ))}
                </div>

                <div className={styles.captionGroup}>
                  <textarea
                    rows={3}
                    className={styles.captionInput}
                    placeholder="Apa yang sedang kamu pikirkan hari ini? Bagikan bersama sahabat PIK-R..."
                    value={caption}
                    maxLength={300}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || (mode === 'photo' && !photoFile) || (mode === 'text' && !caption.trim())}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mengunggah...
                </>
              ) : (
                'Bagikan Sekarang'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

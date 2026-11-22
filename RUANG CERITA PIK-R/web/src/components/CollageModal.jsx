import { useState, useRef, useEffect } from 'react';
import { X, Check, LayoutGrid, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './CollageModal.module.css';

/**
 * Layout kolase foto:
 * - 2-split-v: 2 kolom berdampingan
 * - 2-split-h: 2 baris atas-bawah
 * - 3-left: 1 foto besar kiri, 2 foto kecil kanan
 * - 3-top: 1 foto besar atas, 2 foto kecil bawah
 * - 4-grid: 2x2 kotak sama besar
 * - 4-left: 1 foto besar kiri, 3 foto kecil kanan
 */
const COLLAGE_LAYOUTS = [
  {
    id: '2-split-v',
    name: '2 Kolom',
    count: 2,
    slots: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: '2-split-h',
    name: '2 Baris',
    count: 2,
    slots: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: '3-left',
    name: '3 Kiri Besar',
    count: 3,
    slots: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: '3-top',
    name: '3 Atas Besar',
    count: 3,
    slots: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: '4-grid',
    name: '2x2 Kotak',
    count: 4,
    slots: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: '4-left',
    name: '4 Kiri Besar',
    count: 4,
    slots: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 0.3333 },
      { x: 0.5, y: 0.3333, w: 0.5, h: 0.3333 },
      { x: 0.5, y: 0.6666, w: 0.5, h: 0.3334 },
    ],
  },
];

export default function CollageModal({ availablePhotos = [], onDone, onClose }) {
  const [selectedLayout, setSelectedLayout] = useState(COLLAGE_LAYOUTS[0]);
  const [slotPhotos, setSlotPhotos] = useState(() => {
    // Isi slot awal dari availablePhotos yang ada
    const init = {};
    availablePhotos.slice(0, 4).forEach((p, i) => {
      init[i] = p;
    });
    return init;
  });
  const [activeSlot, setActiveSlot] = useState(0);
  const [gapColor, setGapColor] = useState('#ffffff');
  const [compositing, setCompositing] = useState(false);
  const fileInputRef = useRef(null);

  const neededCount = selectedLayout.count;

  // Ubah layout
  const handleSelectLayout = (layout) => {
    setSelectedLayout(layout);
    if (activeSlot >= layout.count) setActiveSlot(0);
  };

  // Pilih foto untuk slot aktif
  const assignPhotoToSlot = (photo, slotIdx) => {
    setSlotPhotos((prev) => ({ ...prev, [slotIdx]: photo }));
  };

  // Upload foto baru langsung ke slot
  const handleUploadPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const item = { file, url: URL.createObjectURL(file), video: false };
    assignPhotoToSlot(item, activeSlot);
    e.target.value = '';
  };

  // Render kolase ke canvas dan export file
  const handleGenerateCollage = async () => {
    // Validasi apakah semua slot sudah terisi
    for (let i = 0; i < neededCount; i++) {
      if (!slotPhotos[i]) {
        toast.error(`Slot ${i + 1} belum ada foto.`);
        return;
      }
    }

    setCompositing(true);
    try {
      const W = 1440;
      const H = 1440; // 1:1 persegi standar kolase
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';

      // Latar belakang gap / border
      ctx.fillStyle = gapColor;
      ctx.fillRect(0, 0, W, H);

      const GAP = 12; // Gap antar foto (piksel)

      // Muat dan gambar setiap foto ke slotnya
      for (let i = 0; i < neededCount; i++) {
        const slot = selectedLayout.slots[i];
        const photoItem = slotPhotos[i];
        const img = new Image();
        img.src = photoItem.url;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });

        // Koordinat slot dengan padding gap
        const sx = slot.x * W + GAP / 2;
        const sy = slot.y * H + GAP / 2;
        const sw = slot.w * W - GAP;
        const sh = slot.h * H - GAP;

        // object-fit: cover ke dalam slot
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const slotAspect = sw / sh;
        let dw, dh, dx, dy;

        if (imgAspect > slotAspect) {
          dh = sh;
          dw = sh * imgAspect;
          dy = sy;
          dx = sx + (sw - dw) / 2;
        } else {
          dw = sw;
          dh = sw / imgAspect;
          dx = sx;
          dy = sy + (sh - dh) / 2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(sx, sy, sw, sh);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      }

      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
      if (!blob) throw new Error('Gagal membuat kolase');

      const file = new File([blob], `kolase-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const collageItem = { file, url: URL.createObjectURL(file), video: false, w: W, h: H };
      onDone(collageItem);
      toast.success('Kolase foto berhasil dibuat!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat kolase.');
    } finally {
      setCompositing(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUploadPhoto}
        />

        {/* Header */}
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LayoutGrid size={20} color="var(--accent, #f97316)" />
            <b style={{ fontSize: 16 }}>Buat Kolase Foto</b>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Pratinjau Kolase */}
          <div className={styles.previewContainer}>
            <div className={styles.collageBox} style={{ background: gapColor }}>
              {selectedLayout.slots.map((slot, i) => {
                const photo = slotPhotos[i];
                const isActive = activeSlot === i;
                return (
                  <div
                    key={i}
                    className={`${styles.slot} ${isActive ? styles.slotActive : ''}`}
                    style={{
                      left: `${slot.x * 100}%`,
                      top: `${slot.y * 100}%`,
                      width: `${slot.w * 100}%`,
                      height: `${slot.h * 100}%`,
                    }}
                    onClick={() => setActiveSlot(i)}
                  >
                    {photo ? (
                      <img src={photo.url} alt="" className={styles.slotImg} />
                    ) : (
                      <div className={styles.slotEmpty}>
                        <ImagePlus size={24} />
                        <span>Pilih Foto {i + 1}</span>
                      </div>
                    )}
                    <span className={styles.slotBadge}>{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pemilih Layout */}
          <div className={styles.sectionLabel}>Pilih Tata Letak Kolase</div>
          <div className={styles.layoutPicker}>
            {COLLAGE_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                type="button"
                className={`${styles.layoutBtn} ${selectedLayout.id === layout.id ? styles.layoutBtnActive : ''}`}
                onClick={() => handleSelectLayout(layout)}
              >
                <div className={styles.layoutIconMini}>
                  {layout.slots.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: `${s.x * 100}%`,
                        top: `${s.y * 100}%`,
                        width: `${s.w * 100}%`,
                        height: `${s.h * 100}%`,
                        border: '1px solid rgba(255,255,255,0.7)',
                        background: 'rgba(255,255,255,0.2)',
                      }}
                    />
                  ))}
                </div>
                <span>{layout.name}</span>
              </button>
            ))}
          </div>

          {/* Galeri Foto Tersedia untuk Slot Aktif */}
          <div className={styles.sectionLabel}>
            Pilih Foto untuk <b>Slot #{activeSlot + 1}</b>
          </div>
          <div className={styles.photoTray}>
            <button
              type="button"
              className={styles.uploadTile}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={22} />
              <span>Unggah</span>
            </button>
            {availablePhotos.map((p, idx) => (
              <button
                key={p.url || idx}
                type="button"
                className={`${styles.photoTile} ${slotPhotos[activeSlot]?.url === p.url ? styles.photoTileSelected : ''}`}
                onClick={() => assignPhotoToSlot(p, activeSlot)}
              >
                <img src={p.url} alt="" />
              </button>
            ))}
          </div>

          {/* Warna Garis Batas */}
          <div className={styles.gapColorRow}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Warna Bingkai:</span>
            {['#ffffff', '#000000', '#f97316', '#3b82f6', '#10b981', '#f3f4f6'].map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.colorDot} ${gapColor === color ? styles.colorDotActive : ''}`}
                style={{ background: color, border: color === '#ffffff' ? '1px solid #cbd5e1' : 'none' }}
                onClick={() => setGapColor(color)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className="btn btn-soft" onClick={onClose} disabled={compositing}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateCollage}
            disabled={compositing}
          >
            {compositing ? 'Menyusun Kolase...' : 'Gunakan Kolase Ini'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import styles from './ImageCropModal.module.css';

export default function ImageCropModal({ imageSrc, onCropComplete, onClose }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState(null);

  const canvasRef = useRef(null);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Handle Drag / Pan
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRotateLeft = () => {
    setRotation((r) => (r - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((r) => (r + 90) % 360);
  };

  // Perform final crop export on canvas
  const handleSave = () => {
    if (!imgElement) return;

    const exportSize = 400; // Output size 400x400
    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext('2d');

    ctx.save();
    // Move origin to center of export canvas
    ctx.translate(exportSize / 2, exportSize / 2);
    // Rotate canvas
    ctx.rotate((rotation * Math.PI) / 180);
    // Scale canvas
    ctx.scale(scale, scale);

    // Calculate source draw dimensions maintaining aspect ratio
    const aspect = imgElement.width / imgElement.height;
    let drawW = exportSize;
    let drawH = exportSize;
    if (aspect > 1) {
      drawW = exportSize * aspect;
    } else {
      drawH = exportSize / aspect;
    }

    // Draw image centered with offset pan position
    ctx.drawImage(
      imgElement,
      -drawW / 2 + position.x / (exportSize / 280), // normalize position for export size vs viewport
      -drawH / 2 + position.y / (exportSize / 280),
      drawW,
      drawH
    );

    ctx.restore();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `profile_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCropComplete(file, URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className={styles.overlay} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Potong &amp; Atur Foto Profil</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Crop Viewport */}
          <div
            className={styles.cropViewport}
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {imgElement && (
              <div
                className={styles.imageWrap}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                }}
              >
                <img src={imageSrc} alt="Crop preview" draggable={false} />
              </div>
            )}
            <div className={styles.cropOverlayCircle} />
          </div>

          {/* Controls: Zoom & Rotate */}
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <ZoomOut size={18} />
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className={styles.slider}
              />
              <ZoomIn size={18} />
              <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
            </div>

            <div className={styles.rotateGroup}>
              <button type="button" className={styles.controlBtn} onClick={handleRotateLeft} title="Putar Kiri">
                <RotateCcw size={18} /> Putar Kiri
              </button>
              <button type="button" className={styles.controlBtn} onClick={handleRotateRight} title="Putar Kanan">
                <RotateCw size={18} /> Putar Kanan
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <Check size={18} /> Gunakan Foto Ini
          </button>
        </div>
      </div>
    </div>
  );
}

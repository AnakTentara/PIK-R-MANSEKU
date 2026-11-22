import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, RotateCcw, Check, X, ZoomIn, RefreshCw } from 'lucide-react';
import styles from './ImageCropModal.module.css';

// Default values
const DEFAULT_SCALE = 1;
const DEFAULT_ROTATION = 0;
const DEFAULT_POSITION = { x: 0, y: 0 };

// Camera-lens style zoom ruler
function LensRuler({ value, min, max, step, onChange }) {
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startVal = useRef(value);

  const range = max - min;
  const pct = (value - min) / range;

  const TICKS = 25;
  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const tickVal = min + (i / (TICKS - 1)) * range;
    const isMajor = i % 6 === 0;
    return { tickVal, isMajor };
  });

  const clamp = (v) => Math.min(max, Math.max(min, v));
  const snap = (v) => Math.round(v / step) * step;

  const posToValue = useCallback((deltaX) => {
    if (!trackRef.current) return startVal.current;
    return clamp(snap(startVal.current + (deltaX / trackRef.current.offsetWidth) * range));
  }, [range]); // eslint-disable-line

  const onDown = (e) => {
    isDragging.current = true;
    startX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startVal.current = value;
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const cx = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      onChange(posToValue(cx - startX.current));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [posToValue]);

  return (
    <div className={styles.lensWrap}>
      <div className={styles.lensCurrentVal}>{value.toFixed(2)}×</div>
      <div
        ref={trackRef}
        className={styles.lensTrack}
        onMouseDown={onDown}
        onTouchStart={onDown}
        style={{ touchAction: 'none', cursor: 'ew-resize' }}
      >
        {/* Moving ruler strip — shifts so current value stays centered */}
        <div
          className={styles.lensRuler}
          style={{ transform: `translateX(calc(50% - ${pct * 100}%))` }}
        >
          {ticks.map(({ tickVal, isMajor }, i) => (
            <div key={i} className={`${styles.lensTick} ${isMajor ? styles.lensTickMajor : ''}`}>
              <div className={styles.lensTickLine} />
              {isMajor && <span className={styles.lensTickLabel}>{tickVal.toFixed(1)}</span>}
            </div>
          ))}
        </div>
        {/* Fixed center indicator */}
        <div className={styles.lensCenterPin} />
      </div>
      <div className={styles.lensMinMax}>
        <span>{min.toFixed(1)}×</span>
        <span>{max.toFixed(1)}×</span>
      </div>
    </div>
  );
}

export default function ImageCropModal({ imageSrc, onCropComplete, onClose }) {
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState(null);

  // Active control panel: null | 'zoom' | 'rotate'
  const [activePanel, setActivePanel] = useState(null);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
      setScale(DEFAULT_SCALE);
      setRotation(DEFAULT_ROTATION);
      setPosition(DEFAULT_POSITION);
    };
  }, [imageSrc]);

  // Mouse drag / pan
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);
  const handleMouseUp = () => setIsDragging(false);

  // Touch pan
  const touchRef = useRef(null);
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchRef.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
  };
  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    setPosition({ x: e.touches[0].clientX - touchRef.current.x, y: e.touches[0].clientY - touchRef.current.y });
  }, []);
  const handleTouchEnd = () => { touchRef.current = null; };

  // Toggle panel: klik saat aktif → reset nilai lalu tutup
  const togglePanel = (name) => {
    if (activePanel === name) {
      // Reset nilai kontrol tersebut
      if (name === 'zoom') { setScale(DEFAULT_SCALE); setPosition(DEFAULT_POSITION); }
      if (name === 'rotate') { setRotation(DEFAULT_ROTATION); }
      setActivePanel(null);
    } else {
      setActivePanel(name);
    }
  };

  // Export canvas
  const handleSave = () => {
    if (!imgElement) return;
    const exportSize = 400;
    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(exportSize / 2, exportSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    const aspect = imgElement.width / imgElement.height;
    let drawW = exportSize, drawH = exportSize;
    if (aspect > 1) drawW = exportSize * aspect;
    else drawH = exportSize / aspect;
    ctx.drawImage(imgElement, -drawW / 2 + position.x / (exportSize / 280), -drawH / 2 + position.y / (exportSize / 280), drawW, drawH);
    ctx.restore();
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `profile_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCropComplete(file, URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.92);
  };

  const isModified = scale !== DEFAULT_SCALE || rotation !== DEFAULT_ROTATION || position.x !== 0 || position.y !== 0;

  return (
    <div className={styles.overlay} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className={`${styles.modal} modal-shell`}>

        {/* Header */}
        <div className={styles.header}>
          <h3>Potong &amp; Atur Foto Profil</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>

        <div className={`${styles.body} modal-scroll`}>
          {/* Viewport */}
          <div
            className={styles.cropViewport}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
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

          {/* Hint */}
          <p className={styles.hint}>Geser foto untuk memposisikan • Gunakan tombol di bawah untuk zoom &amp; putar</p>

          {/* Control bubbles */}
          <div className={styles.bubbles}>
            {/* Zoom bubble */}
            <button
              type="button"
              className={`${styles.bubble} ${activePanel === 'zoom' ? styles.bubbleActive : ''}`}
              onClick={() => togglePanel('zoom')}
              title={activePanel === 'zoom' ? 'Ketuk lagi untuk reset zoom' : 'Zoom'}
            >
              <ZoomIn size={20} />
              <span>Zoom</span>
              {scale !== DEFAULT_SCALE && <span className={styles.bubbleBadge}>{scale.toFixed(1)}×</span>}
            </button>

            {/* Rotate bubble */}
            <button
              type="button"
              className={`${styles.bubble} ${activePanel === 'rotate' ? styles.bubbleActive : ''}`}
              onClick={() => togglePanel('rotate')}
              title={activePanel === 'rotate' ? 'Ketuk lagi untuk reset rotasi' : 'Putar'}
            >
              <RefreshCw size={20} />
              <span>Putar</span>
              {rotation !== DEFAULT_ROTATION && <span className={styles.bubbleBadge}>{rotation}°</span>}
            </button>

            {/* Reset all — only shown if anything is modified */}
            {isModified && (
              <button
                type="button"
                className={`${styles.bubble} ${styles.bubbleReset}`}
                onClick={() => { setScale(DEFAULT_SCALE); setRotation(DEFAULT_ROTATION); setPosition(DEFAULT_POSITION); setActivePanel(null); }}
                title="Reset semua"
              >
                <RefreshCw size={18} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Sliding panel */}
          <div className={`${styles.slidePanel} ${activePanel ? styles.slidePanelOpen : ''}`}>
            {activePanel === 'zoom' && (
              <div className={styles.panelInner}>
                <LensRuler
                  value={scale}
                  min={0.5}
                  max={3}
                  step={0.05}
                  onChange={setScale}
                />
              </div>
            )}
            {activePanel === 'rotate' && (
              <div className={styles.panelInner}>
                <div className={styles.rotateGroup}>
                  <button type="button" className={styles.rotateBtn} onClick={() => setRotation((r) => (r - 90 + 360) % 360)}>
                    <RotateCcw size={20} /> −90°
                  </button>
                  <span className={styles.rotateVal}>{rotation}°</span>
                  <button type="button" className={styles.rotateBtn} onClick={() => setRotation((r) => (r + 90) % 360)}>
                    <RotateCw size={20} /> +90°
                  </button>
                </div>
                {/* Fine rotation slider */}
                <div className={styles.fineRotateWrap}>
                  <span className={styles.fineLabel}>Miring halus</span>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="1"
                    value={rotation > 180 ? rotation - 360 : rotation}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setRotation(v < 0 ? v + 360 : v);
                    }}
                    className={styles.fineSlider}
                  />
                  <span className={styles.fineLabel}>{rotation > 180 ? rotation - 360 : rotation}°</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`${styles.footer} modal-bar`}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <Check size={18} /> Gunakan Foto Ini
          </button>
        </div>
      </div>
    </div>
  );
}

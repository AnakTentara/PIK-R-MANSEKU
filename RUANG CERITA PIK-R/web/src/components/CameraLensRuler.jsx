import { useRef, useCallback } from 'react';
import styles from './CameraLensRuler.module.css';

/**
 * CameraLensRuler:
 * Penggeser berbentuk penggaris lensa kamera profesional:
 *   | | | <bold>|</bold> | | |
 * - Nilai angka besar di tengah atas
 * - Garis jarum penanda di tengah
 * - Angka-angka kecil per interval di bawah garis
 * - Dapat digeser halus dengan sentuhan (touch) maupun mouse drag
 */
export default function CameraLensRuler({
  min = -100,
  max = 100,
  step = 1,
  majorStep = 20,
  value = 0,
  onChange,
  unit = '',
  formatValue,
}) {
  const rulerRef = useRef(null);
  const dragRef = useRef(null);

  const clampVal = useCallback(
    (v) => Math.min(max, Math.max(min, Math.round(v / step) * step)),
    [min, max, step]
  );

  // Drag interaction
  const onStart = (e) => {
    e.preventDefault();
    const startX = e.touches ? e.touches[0].clientX : e.clientX;
    dragRef.current = { startX, initialVal: value };

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const dx = clientX - dragRef.current.startX;
      // Sensitivitas: 1 unit nilai per ~2.5px geseran
      const valDelta = -(dx / 2.5) * step;
      const nextVal = clampVal(dragRef.current.initialVal + valDelta);
      onChange(nextVal);
    };

    const onEnd = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  // Generate tick marks
  const ticks = [];
  const totalRange = max - min;
  const tickStep = totalRange > 100 ? 5 : totalRange > 20 ? 2 : 1;

  for (let val = min; val <= max; val += tickStep) {
    const isMajor = val % majorStep === 0 || val === min || val === max;
    const isCenter = val === 0;
    ticks.push({ val, isMajor, isCenter });
  }

  // Offset pergeseran ruler berdasarkan value saat ini
  // Jarak antar tick ~10px
  const tickSpacing = 10;
  const currentRatio = (value - min) / (max - min);
  const trackWidth = (ticks.length - 1) * tickSpacing;
  const shiftX = -currentRatio * trackWidth;

  const displayVal = formatValue
    ? formatValue(value)
    : unit === 'x'
    ? `${(value / 100).toFixed(1)}x`
    : value > 0
    ? `+${value}${unit}`
    : `${value}${unit}`;

  return (
    <div className={styles.wrapper}>
      {/* Nilai utama di tengah atas */}
      <div className={styles.valueRow}>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => onChange(clampVal(value - (totalRange > 100 ? 5 : 1)))}
          aria-label="Kurangi"
        >
          −
        </button>
        <span
          className={styles.valueBadge}
          onDoubleClick={() => onChange(min < 0 ? 0 : min)}
          title="Klik ganda untuk reset"
        >
          {displayVal}
        </span>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => onChange(clampVal(value + (totalRange > 100 ? 5 : 1)))}
          aria-label="Tambah"
        >
          +
        </button>
      </div>

      {/* Penggaris Kamera */}
      <div
        ref={rulerRef}
        className={styles.rulerContainer}
        onMouseDown={onStart}
        onTouchStart={onStart}
      >
        {/* Jarum penanda tengah (merah/oranye) */}
        <div className={styles.centerNeedle} />

        {/* Jalur garis-garis tick */}
        <div
          className={styles.ticksTrack}
          style={{
            transform: `translateX(calc(50% + ${shiftX}px))`,
          }}
        >
          {ticks.map(({ val, isMajor, isCenter }) => (
            <div
              key={val}
              className={`${styles.tick} ${isMajor ? styles.tickMajor : ''} ${
                isCenter ? styles.tickCenter : ''
              }`}
              style={{ width: `${tickSpacing}px` }}
            >
              <div className={styles.tickLine} />
              {isMajor && <span className={styles.tickLabel}>{val}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

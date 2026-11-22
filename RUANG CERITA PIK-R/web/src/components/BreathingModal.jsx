import { useEffect, useRef, useState } from 'react';
import { X, Wind } from 'lucide-react';
import s from './BreathingModal.module.css';

/*
 * Napas Tenang — Teknik 4-7-8
 * Visual: 3 ring konsentris yang scale secara independen.
 * Teks center TIDAK ikut scale (posisi absolute terpisah).
 * Countdown: fade-out → update → fade-in (smooth, tidak kasar).
 */

const PHASES = [
  { id: 'inhale',  label: 'Tarik Napas', hint: 'Hirup perlahan lewat hidung…',  dur: 4, color: '#f97316' },
  { id: 'hold',    label: 'Tahan',       hint: 'Tahan dengan tenang…',           dur: 7, color: '#10b981' },
  { id: 'exhale',  label: 'Hembuskan',   hint: 'Lepaskan perlahan lewat mulut…', dur: 8, color: '#6366f1' },
];

export default function BreathingModal({ open, onClose }) {
  const [phaseIdx, setPhaseIdx]       = useState(0);
  const [count, setCount]             = useState(PHASES[0].dur);
  const [countVisible, setCountVisible] = useState(true); // untuk fade angka
  const intervalRef = useRef(null);
  const phase = PHASES[phaseIdx];

  /* Reset saat modal tutup */
  useEffect(() => {
    if (!open) {
      clearInterval(intervalRef.current);
      setPhaseIdx(0);
      setCount(PHASES[0].dur);
      setCountVisible(true);
    }
  }, [open]);

  /* Tick per detik */
  useEffect(() => {
    if (!open) return;
    intervalRef.current = setInterval(() => {
      setCount(prev => {
        if (prev > 1) {
          // Fade angka keluar → masuk
          setCountVisible(false);
          setTimeout(() => {
            setCount(c => c - 1);
            setCountVisible(true);
          }, 180);
          return prev; // nilai sementara, akan diupdate di timeout
        }
        // Pindah fase
        setPhaseIdx(pi => {
          const next = (pi + 1) % PHASES.length;
          setCountVisible(false);
          setTimeout(() => {
            setCount(PHASES[next].dur);
            setCountVisible(true);
          }, 220);
          return next;
        });
        return prev;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [open]);

  if (!open) return null;

  return (
    <div className={s.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Latihan Napas Tenang">
      <div className={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={s.head}>
          <div className={s.headLeft}>
            <Wind size={16} className={s.headIcon} />
            <span className={s.headTitle}>Napas Tenang</span>
          </div>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Visual area — rings + teks center terpisah */}
        <div className={s.visual}>
          {/* Ring luar — paling transparan, paling melebar */}
          <div className={`${s.ring} ${s.ringOuter} ${s[phase.id]}`}
               style={{ '--c': phase.color }} />
          {/* Ring tengah */}
          <div className={`${s.ring} ${s.ringMid} ${s[phase.id]}`}
               style={{ '--c': phase.color }} />
          {/* Ring dalam */}
          <div className={`${s.ring} ${s.ringCore} ${s[phase.id]}`}
               style={{ '--c': phase.color }} />

          {/* Center — TIDAK ikut scale ring */}
          <div className={s.center}>
            <span
              className={s.countNum}
              style={{
                opacity: countVisible ? 1 : 0,
                transform: countVisible ? 'translateY(0)' : 'translateY(4px)',
                color: phase.color,
              }}
            >
              {count}
            </span>
            <span className={s.phaseLabel}>{phase.label}</span>
          </div>
        </div>

        {/* Hint teks */}
        <p className={s.hint} key={phase.id}>{phase.hint}</p>

        {/* Progress dots */}
        <div className={s.dots}>
          {PHASES.map((p, i) => (
            <span
              key={p.id}
              className={`${s.dot} ${i === phaseIdx ? s.dotOn : ''}`}
              style={i === phaseIdx ? { background: phase.color } : {}}
            />
          ))}
        </div>

        <button type="button" className={s.doneBtn} onClick={onClose}>Selesai</button>
      </div>
    </div>
  );
}

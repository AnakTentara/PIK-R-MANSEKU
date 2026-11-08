import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Sheet.module.css';

/**
 * Popup responsif untuk situs publik:
 * - HP (≤ 640 px): lembar naik dari bawah, ada pegangan, bisa ditutup dengan menggeser ke bawah.
 * - Desktop: kartu di tengah layar.
 * Escape / ketuk latar menutup. Fokus dikembalikan ke elemen pemicu saat ditutup.
 */
export default function Sheet({ open, onClose, title, children, labelledBy, size = 'sm' }) {
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);
  const panel = useRef(null);
  const lastFocus = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    if (open) { setRender(true); setClosing(false); lastFocus.current = document.activeElement; }
    else if (render) {
      setClosing(true);
      const t = setTimeout(() => { setRender(false); setClosing(false); lastFocus.current?.focus?.(); }, 220);
      return () => clearTimeout(t);
    }
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => panel.current?.querySelector('[data-autofocus], button, input, a')?.focus({ preventScroll: true }));
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!render) return null;

  // Geser ke bawah untuk menutup (HP)
  const onPointerDown = (e) => {
    if (window.innerWidth > 640 || e.target.closest('input, textarea, button, a, select')) return;
    drag.current = { y: e.clientY, dy: 0 };
    panel.current.style.transition = 'none';
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    panel.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const { dy } = drag.current;
    drag.current = null;
    panel.current.style.transition = '';
    panel.current.style.transform = '';
    if (dy > 90) onClose?.();
  };

  return createPortal(
    <div className={`${styles.overlay} ${closing ? styles.closing : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={panel}
        className={`${styles.panel} ${styles['size_' + size]}`}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={styles.grab} aria-hidden="true" />
        {title && (
          <div className={styles.head}>
            <h2>{title}</h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Tutup"><X size={18} /></button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

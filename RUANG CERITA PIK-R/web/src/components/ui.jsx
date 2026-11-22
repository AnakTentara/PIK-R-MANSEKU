import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, BadgeCheck, GraduationCap } from 'lucide-react';
import { mediaUrl } from '@/lib/api.js';
import { useBackClose } from '@/lib/back.js';
import styles from './ui.module.css';

/** Foto profil (inisial bila tidak ada / gagal dimuat). ring: 'story' | 'seen' | 'cf' | null */
export const Avatar = memo(function Avatar({ user, size = 40, ring = null, className = '' }) {
  const [failed, setFailed] = useState(false);
  const name = user?.name || user?.username || '?';
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const src = user?.photo && !failed ? mediaUrl(user.photo) : null;
  const inner = src
    ? <img className="avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} loading="lazy" decoding="async" onError={() => setFailed(true)} />
    : <span className="avatar avatar-initials" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">{initials}</span>;
  if (!ring) return <span className={className} style={{ display: 'inline-flex' }}>{inner}</span>;
  return (
    <span className={`${styles.ring} ${styles['ring_' + ring]} ${className}`} style={{ '--sz': `${size}px` }}>
      <span className={styles.ringGap}>{inner}</span>
    </span>
  );
});

/** Nama pengguna + lencana (alumni). */
export function Username({ user, link = true, className = '' }) {
  if (!user) return null;
  const body = (
    <>
      <b>{user.username}</b>
      {user.isAlumni && <GraduationCap size={14} className={styles.alumni} aria-label="Alumni" />}
      {user.verified && <BadgeCheck size={14} className={styles.verified} aria-label="Akun resmi" />}
    </>
  );
  return link
    ? <Link to={`/${user.username}`} className={`${styles.username} ${className}`}>{body}</Link>
    : <span className={`${styles.username} ${className}`}>{body}</span>;
}

/**
 * Popup responsif: lembar dari bawah di HP (geser turun untuk menutup), kartu tengah di desktop.
 * Tombol Kembali di HP menutupnya. Fokus kembali ke pemicu saat ditutup.
 */
export function Sheet({ open, onClose, title, children, size = 'md', bare = false, footer = null }) {
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);
  const panel = useRef(null);
  const drag = useRef(null);
  const lastFocus = useRef(null);
  useBackClose(open, onClose);

  useEffect(() => {
    if (open) { setRender(true); setClosing(false); lastFocus.current = document.activeElement; return undefined; }
    if (!render) return undefined;
    setClosing(true);
    const t = setTimeout(() => { setRender(false); setClosing(false); lastFocus.current?.focus?.({ preventScroll: true }); }, 220);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!render) return null;

  const down = (e) => {
    if (window.innerWidth > 720 || e.target.closest('input, textarea, button, a, select, [data-noswipe]')) return;
    if (panel.current.scrollTop > 0) return;
    drag.current = { y: e.clientY, dy: 0 };
    panel.current.style.transition = 'none';
  };
  const move = (e) => {
    if (!drag.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    panel.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const up = () => {
    if (!drag.current) return;
    const { dy } = drag.current;
    drag.current = null;
    panel.current.style.transition = '';
    panel.current.style.transform = '';
    if (dy > 100) onClose?.();
  };

  return createPortal(
    <div className={`${styles.overlay} ${closing ? styles.closing : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={panel} className={`${styles.sheet} ${styles['sheet_' + size]} ${bare ? styles.bare : ''}`} role="dialog" aria-modal="true" aria-label={title || 'Dialog'}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className={styles.grab} aria-hidden="true" />
        {title && (
          <div className={styles.sheetHead}>
            <h2>{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
          </div>
        )}
        <div className={styles.sheetBody}>{children}</div>
        {footer && <div className={styles.sheetFoot}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Daftar pilihan bergaya menu Instagram (dipakai di dalam Sheet). */
export function MenuList({ items }) {
  return (
    <div className={styles.menu}>
      {items.filter(Boolean).map((it, i) => (it === '-' ? <hr key={i} /> : (
        <button key={it.label} type="button" className={`${styles.menuItem} ${it.danger ? styles.danger : ''}`} onClick={it.onClick} disabled={it.disabled}>
          {it.icon && <span className={styles.menuIcon}>{it.icon}</span>}
          <span className={styles.menuText}><b>{it.label}</b>{it.hint && <small>{it.hint}</small>}</span>
        </button>
      )))}
    </div>
  );
}

export function Empty({ icon, title, children, action }) {
  return (
    <div className={styles.empty}>
      {icon && <span className={styles.emptyIcon}>{icon}</span>}
      {title && <b>{title}</b>}
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Spinner({ size = 28 }) {
  return <div className={styles.spinWrap}><span className={styles.spinner} style={{ width: size, height: size }} /></div>;
}

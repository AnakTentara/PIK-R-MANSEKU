import { useEffect, useState } from 'react';

/**
 * Foto bulat dengan cadangan inisial. Dipakai di mana pun foto anggota ditampilkan,
 * karena file foto bisa tidak ada di server (mis. setelah restore database tanpa folder uploads).
 */
export default function PhotoAvatar({ src, name = '', className = '', placeholderClassName, size, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const style = size ? { width: size, height: size, fontSize: Math.round(size * 0.38) } : undefined;
  if (src && !failed) {
    return <img src={src} alt={alt ?? name} className={className} style={style} loading="lazy" onError={() => setFailed(true)} />;
  }
  const initials = String(name).trim().split(/s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return <div className={placeholderClassName || className} style={style} aria-hidden="true">{initials}</div>;
}

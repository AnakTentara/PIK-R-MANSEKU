import { useEffect, useState } from 'react';
import { GraduationCap, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import styles from './AlumniBanner.module.css';

const KEY = 'pikr_alumni_banner_hidden';

/**
 * Pita tipis di paling atas untuk akun yang sudah alumni. Akun tetap bisa dipakai penuh
 * (edit profil, menulis blog); pita ini hanya pengingat dan bisa ditutup untuk sesi ini.
 */
export default function AlumniBanner() {
  const user = useAuthStore((s) => s.candidateUser);
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } });
  const show = !!user?.isAlumni && !hidden;
  // Navbar dan halaman membaca --alumni-bar supaya tidak tertutup pita
  useEffect(() => {
    document.documentElement.toggleAttribute('data-alumni-bar', show);
    return () => document.documentElement.removeAttribute('data-alumni-bar');
  }, [show]);
  if (!show) return null;
  return (
    <div className={styles.bar} role="status">
      <GraduationCap size={14} aria-hidden="true" />
      <span>Anda telah menjadi alumni PIK-R MANSEKU. Terima kasih atas pengabdiannya! 🎓</span>
      <button type="button" aria-label="Tutup pemberitahuan" onClick={() => { setHidden(true); try { sessionStorage.setItem(KEY, '1'); } catch { /* abaikan */ } }}>
        <X size={13} />
      </button>
    </div>
  );
}

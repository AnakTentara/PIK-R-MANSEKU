import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './OfflineIndicator.module.css';

/**
 * Komponen deteksi offline & batas waktu loading timeout.
 * Memunculkan pemberitahuan bersahabat "Silahkan cek Internet-mu." saat offline
 * atau saat request mengalami timeout.
 */
export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
      toast.success('Koneksi terhubung kembali! 🌐', { id: 'online-toast', duration: 3000 });
    };

    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener custom event dari interceptor axios jika request timeout / network error
    const handleNetworkTimeout = () => {
      setIsOffline(true);
      setDismissed(false);
    };
    window.addEventListener('pikr:network-timeout', handleNetworkTimeout);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pikr:network-timeout', handleNetworkTimeout);
    };
  }, []);

  const testConnection = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/rc/badges', { method: 'HEAD', cache: 'no-store' });
      if (res.ok || res.status < 500) {
        setIsOffline(false);
        setDismissed(false);
        toast.success('Koneksi terhubung kembali! ✨');
      } else {
        toast.error('Masih belum terhubung ke server.');
      }
    } catch {
      toast.error('Koneksi internet masih belum stabil.');
    } finally {
      setChecking(false);
    }
  };

  if (!isOffline || dismissed) return null;

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <WifiOff size={22} className={styles.icon} />
        </div>
        <div className={styles.textWrap}>
          <h4 className={styles.title}>Silahkan cek Internet-mu.</h4>
          <p className={styles.desc}>
            Koneksi internet terputus atau lambat. Konten yang sudah tersimpan di cache tetap dapat kamu buka.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={testConnection}
            disabled={checking}
          >
            <RefreshCw size={14} className={checking ? styles.spin : ''} />
            <span>{checking ? 'Memeriksa...' : 'Coba Lagi'}</span>
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setDismissed(true)}
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Bell, 
  Calendar, 
  Clock, 
  User, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicNotification } from '@/api/push';
import styles from './PushDetailViewPage.module.css';

export default function PushDetailViewPage() {
  const { id } = useParams();
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getPublicNotification(id)
      .then((res) => {
        if (isMounted) {
          setNotif(res.data.notification);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || 'Pengumuman / notifikasi tidak ditemukan');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Tautan pengumuman berhasil disalin!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWa = () => {
    if (!notif) return;
    const text = `*📢 ${notif.title}*\n\n${notif.body}\n\nSelengkapnya: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <div className={styles.stateBox}>
            <Bell size={40} className={styles.stateIcon} style={{ animation: 'pulse 1.5s infinite' }} />
            <h2 className={styles.stateTitle}>Memuat Pengumuman...</h2>
            <p className={styles.stateDesc}>Menyiapkan detail pengumuman resmi PIK-R MANSEKU</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !notif) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <div className={styles.stateBox}>
            <AlertCircle size={44} style={{ color: '#dc2626', marginBottom: 16 }} />
            <h2 className={styles.stateTitle}>Pengumuman Tidak Ditemukan</h2>
            <p className={styles.stateDesc}>{error || 'Tautan pengumuman mungkin sudah usang atau salah.'}</p>
            <Link to="/" className={styles.actionBtn}>
              <ArrowLeft size={16} /> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(notif.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = new Date(notif.createdAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={styles.pageContainer}>
      <article className={styles.card}>
        <div className={styles.headerMeta}>
          <span className={styles.categoryBadge}>
            <Bell size={13} /> {notif.category || 'PENGUMUMAN'}
          </span>
          {notif.code && (
            <span className={styles.codeBadge}>
              #{notif.code}
            </span>
          )}
        </div>

        <h1 className={styles.title}>{notif.title}</h1>

        <div className={styles.infoRow}>
          <div className={styles.infoItem}>
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
          <div className={styles.infoItem}>
            <Clock size={14} />
            <span>{formattedTime} WIB</span>
          </div>
          <div className={styles.infoItem}>
            <User size={14} />
            <span>{notif.sentBy || 'Admin PIK-R'}</span>
          </div>
        </div>

        {notif.image && (
          <div className={styles.bannerWrapper}>
            <img 
              src={notif.image} 
              alt={notif.title} 
              className={styles.bannerImg}
              onClick={() => window.open(notif.image, '_blank')}
            />
          </div>
        )}

        <div className={styles.bodyContent}>
          {notif.body}
        </div>

        {Array.isArray(notif.actions) && notif.actions.length > 0 && (
          <div className={styles.actionButtons}>
            {notif.actions.map((act, idx) => (
              <a
                key={idx}
                href={act.url || '#'}
                className={styles.actionBtn}
                target={act.url?.startsWith('http') ? '_blank' : '_self'}
                rel="noreferrer"
              >
                <span>{act.title}</span>
                <ExternalLink size={15} />
              </a>
            ))}
          </div>
        )}

        <div className={styles.footerBar}>
          <div className={styles.shareGroup}>
            <button type="button" className={styles.shareBtn} onClick={handleCopyLink}>
              {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin' : 'Salin Tautan'}</span>
            </button>
            <button type="button" className={styles.shareBtn} onClick={handleShareWa}>
              <Share2 size={14} />
              <span>Bagikan</span>
            </button>
          </div>

          <Link to="/" className={styles.backHomeLink}>
            <ArrowLeft size={14} /> Beranda PIK-R
          </Link>
        </div>
      </article>
    </div>
  );
}

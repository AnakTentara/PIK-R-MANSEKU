import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Shirt, 
  FileText, 
  Share2, 
  Copy, 
  Check, 
  ArrowLeft,
  CalendarPlus,
  Hourglass,
  Sparkles,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicPertemuan } from '@/api/push';
import styles from './PushPertemuanPage.module.css';

export default function PushPertemuanPage() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: false });

  useEffect(() => {
    let isMounted = true;
    getPublicPertemuan()
      .then((res) => {
        if (isMounted) {
          setSchedule(res.data.schedule);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat jadwal pertemuan:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Update countdown timer setiap detik
  useEffect(() => {
    if (!schedule?.datetime) return;

    const targetDate = new Date(schedule.datetime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPassed: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [schedule?.datetime]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Tautan jadwal berhasil disalin!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWa = () => {
    if (!schedule) return;
    const formattedDate = schedule.datetime 
      ? new Date(schedule.datetime).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Segera Diumumkan';

    const text = `*📅 JADWAL PERTEMUAN PIK-R MANSEKU*\n\n📌 *Agenda:* ${schedule.title}\n🗓️ *Waktu:* ${formattedDate} WIB\n📍 *Lokasi:* ${schedule.location || '-'}\n👔 *Pakaian:* ${schedule.dresscode || '-'}\n\nSelengkapnya & hitung mundur: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddToGoogleCalendar = () => {
    if (!schedule?.datetime) return;
    const start = new Date(schedule.datetime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // estimasi 2 jam

    const formatCalDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(schedule.title)}&dates=${formatCalDate(start)}/${formatCalDate(end)}&details=${encodeURIComponent(schedule.agenda || schedule.notes || '')}&location=${encodeURIComponent(schedule.location || '')}`;
    window.open(gCalUrl, '_blank');
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Hourglass size={42} color="#ea580c" style={{ animation: 'spin 2s linear infinite' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 16 }}>Memuat Jadwal Pertemuan...</h2>
        </div>
      </div>
    );
  }

  const dateObj = schedule?.datetime ? new Date(schedule.datetime) : null;
  const formattedDate = dateObj 
    ? dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Segera Diumumkan';
  const formattedTime = dateObj 
    ? `${dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
    : '-';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className={styles.badgesWrapper}>
          <div className={styles.topBadge}>
            <Sparkles size={14} /> Jadwal Resmi Organisasi
          </div>
          {schedule?.source === 'DATABASE_ABSENSI' && (
            <div className={styles.sourceBadge}>
              <Check size={13} color="#059669" />
              <span>Sinkron Otomatis dari Presensi Absensi</span>
            </div>
          )}
        </div>

        <h1 className={styles.meetingTitle}>{schedule?.title || 'Pertemuan Rutin PIK-R MANSEKU'}</h1>

        {/* Countdown Timer */}
        {dateObj && (
          <div className={styles.countdownContainer}>
            <div className={styles.countdownLabel}>
              <Hourglass size={15} />
              {timeLeft.isPassed ? 'Waktu Pertemuan Telah Tiba' : 'Hitung Mundur Waktu Pertemuan'}
            </div>

            {timeLeft.isPassed ? (
              <div className={styles.ongoingBadge}>
                🎉 Pertemuan Sedang / Telah Berlangsung
              </div>
            ) : (
              <div className={styles.timerGrid}>
                <div className={styles.timerBlock}>
                  <div className={styles.timerNum}>{timeLeft.days}</div>
                  <div className={styles.timerUnit}>Hari</div>
                </div>
                <div className={styles.timerBlock}>
                  <div className={styles.timerNum}>{String(timeLeft.hours).padStart(2, '0')}</div>
                  <div className={styles.timerUnit}>Jam</div>
                </div>
                <div className={styles.timerBlock}>
                  <div className={styles.timerNum}>{String(timeLeft.minutes).padStart(2, '0')}</div>
                  <div className={styles.timerUnit}>Menit</div>
                </div>
                <div className={styles.timerBlock}>
                  <div className={styles.timerNum}>{String(timeLeft.seconds).padStart(2, '0')}</div>
                  <div className={styles.timerUnit}>Detik</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Pertemuan */}
        <div className={styles.detailGrid}>
          <div className={styles.detailCard}>
            <div className={styles.detailIconBox}>
              <Calendar size={20} />
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailLabel}>Hari & Tanggal</div>
              <div className={styles.detailValue}>{formattedDate}</div>
            </div>
          </div>

          <div className={styles.detailCard}>
            <div className={styles.detailIconBox}>
              <Clock size={20} />
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailLabel}>Waktu / Jam</div>
              <div className={styles.detailValue}>{formattedTime}</div>
            </div>
          </div>

          <div className={styles.detailCard}>
            <div className={styles.detailIconBox}>
              <MapPin size={20} />
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailLabel}>Lokasi / Tempat</div>
              <div className={styles.detailValue}>{schedule?.location || 'Ruang Sekretariat PIK-R MANSEKU'}</div>
            </div>
          </div>

          <div className={styles.detailCard}>
            <div className={styles.detailIconBox}>
              <Shirt size={20} />
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailLabel}>Dresscode / Pakaian</div>
              <div className={styles.detailValue}>{schedule?.dresscode || 'Seragam PDH PIK-R / Rapih'}</div>
            </div>
          </div>
        </div>

        {/* Agenda & Catatan */}
        {(schedule?.agenda || schedule?.notes) && (
          <div className={styles.notesSection}>
            <div className={styles.notesHeader}>
              <FileText size={18} color="#ea580c" />
              <span>Agenda & Catatan Pengurus</span>
            </div>
            {schedule.agenda && (
              <div className={styles.notesBody} style={{ marginBottom: schedule.notes ? 12 : 0 }}>
                <strong>Agenda Utama:</strong><br />
                {schedule.agenda}
              </div>
            )}
            {schedule.notes && (
              <div className={styles.notesBody}>
                <strong>Catatan Penting:</strong><br />
                {schedule.notes}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actionGroup}>
          {dateObj && (
            <button type="button" className={styles.calendarBtn} onClick={handleAddToGoogleCalendar}>
              <CalendarPlus size={16} />
              <span>Tambah ke Kalender</span>
            </button>
          )}

          <button type="button" className={styles.shareWaBtn} onClick={handleShareWa}>
            <Share2 size={16} />
            <span>Bagikan ke WhatsApp</span>
          </button>

          <button type="button" className={styles.copyBtn} onClick={handleCopyLink}>
            {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
            <span>{copied ? 'Tersalin' : 'Salin Tautan'}</span>
          </button>
        </div>

        <div className={styles.footerBar}>
          <Link to="/" className={styles.backHomeLink}>
            <ArrowLeft size={14} /> Beranda PIK-R MANSEKU
          </Link>
          <div style={{ fontSize: '0.8rem', color: '#8a7a6b' }}>
            PIK-R MAN 1 Pasuruan Official
          </div>
        </div>
      </div>
    </div>
  );
}

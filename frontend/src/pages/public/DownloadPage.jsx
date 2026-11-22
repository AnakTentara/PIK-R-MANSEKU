import { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Apple, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '@/components/common/SEO';
import ScrollReveal from '@/components/common/ScrollReveal';
import styles from './DownloadPage.module.css';

export default function DownloadPage() {
  const [openGuide, setOpenGuide] = useState(null); // 'android' | 'ios' | null

  const handleDownloadApk = (e) => {
    // Pastikan file terdownload atau tampilkan feedback
    toast.success('Memulai pengunduhan APK Ruang Cerita...', { duration: 3000 });
  };

  return (
    <div className={styles.pageContainer}>
      <SEO
        title="Unduh Aplikasi Ruang Cerita | PIK-R MANSEKU"
        description="Pusat unduhan resmi aplikasi Ruang Cerita PIK-R MAN 1 Muara Enim. Unduh file APK Android resmi atau panduan instalasi di iOS iPhone."
        keywords="Unduh Ruang Cerita, Download APK Ruang Cerita, PIK-R MANSEKU APK, Aplikasi Konseling Siswa"
      />

      <div className={styles.contentWrapper}>
        {/* Header */}
        <ScrollReveal>
          <header className={styles.header}>
            <p className={styles.subtleCategory}>Aplikasi Mobile Resmi PIK-R MANSEKU</p>
            <h1 className={styles.title}>
              Unduh <span className={styles.titleHighlight}>Ruang Cerita</span>
            </h1>
            <p className={styles.subtitle}>
              Akses platform media sosial dan konseling sebaya siswa MAN 1 Muara Enim lebih cepat, stabil, dan selalu terhubung dengan notifikasi langsung di ponselmu.
            </p>
          </header>
        </ScrollReveal>

        {/* Download Cards Grid */}
        <ScrollReveal delay={100}>
        <div className={styles.cardsGrid}>
          {/* Card Android */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.platformIconBoxAndroid}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1147-.1989.0467-.4538-.1521-.5685-.1988-.1148-.4537-.0468-.5685.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.1346.8258L4.8431 5.4478c-.1148-.1989-.3697-.2669-.5685-.1521-.1989.1147-.2668.3696-.1521.5685l1.996 3.4572C2.6889 11.1867.3432 14.6589 0 18.75h24c-.3432-4.0911-2.6889-7.5633-6.1185-9.4286"/>
                </svg>
              </div>
              <div>
                <span className={styles.platformBadge}>Android APK</span>
                <h2 className={styles.cardTitle}>Untuk Android</h2>
              </div>
            </div>

            <p className={styles.cardDesc}>
              Instalasi paket APK langsung di ponsel Android kamu dengan performa native WebView dan dukungan push notifikasi.
            </p>

            <div className={styles.metaRow}>
              <span className={styles.metaPill}>v1.0.0</span>
              <span className={styles.metaPill}>Android 8.0+</span>
              <span className={styles.metaPill}>~18 MB</span>
            </div>

            <div className={styles.cardActions}>
              <a
                href="/downloads/ruang-cerita.apk"
                download="ruang-cerita.apk"
                className={styles.btnDownloadAndroid}
                onClick={handleDownloadApk}
              >
                <Download size={18} />
                <span>Unduh File APK (.apk)</span>
              </a>

              <button
                type="button"
                className={styles.guideToggleBtn}
                onClick={() => setOpenGuide(openGuide === 'android' ? null : 'android')}
              >
                <HelpCircle size={15} />
                <span>Panduan Cara Pasang</span>
                {openGuide === 'android' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            {openGuide === 'android' && (
              <div className={styles.guideBox}>
                <h4 className={styles.guideTitle}>Cara Memasang APK di Android:</h4>
                <ol className={styles.guideList}>
                  <li>Tekan tombol <strong>Unduh File APK</strong> di atas.</li>
                  <li>Setelah selesai mengunduh, buka notifikasi atau folder <em>Downloads</em> di HP kamu.</li>
                  <li>Buka file <code>ruang-cerita.apk</code>.</li>
                  <li>Jika muncul peringatan keamanan, pilih <strong>Setelan</strong> lalu aktifkan <em>"Izinkan dari sumber ini"</em>.</li>
                  <li>Tekan <strong>Instal</strong> dan tunggu proses selesai. Buka aplikasi dan login!</li>
                </ol>
              </div>
            )}
          </div>

          {/* Card iOS */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.platformIconBoxIos}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.64 1.34-.56.65-1.06 1.72-.92 2.74 1 .08 2.02-.48 2.64-1.23"/>
                </svg>
              </div>
              <div>
                <span className={styles.platformBadgeIos}>Apple iOS</span>
                <h2 className={styles.cardTitle}>Untuk iPhone / iPad</h2>
              </div>
            </div>

            <p className={styles.cardDesc}>
              Pengguna iPhone dapat langsung menambahkan Ruang Cerita ke Layar Utama melalui Safari tanpa perlu unduh file.
            </p>

            <div className={styles.metaRow}>
              <span className={styles.metaPill}>iOS 14+</span>
              <span className={styles.metaPill}>Safari / Web App</span>
              <span className={styles.metaPill}>Bebas Kuota Unduh</span>
            </div>

            <div className={styles.cardActions}>
              <a
                href="https://ruang-cerita.pikr-manseku.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnOpenIos}
              >
                <span>Buka Versi Web di Safari</span>
                <ExternalLink size={17} />
              </a>

              <button
                type="button"
                className={styles.guideToggleBtn}
                onClick={() => setOpenGuide(openGuide === 'ios' ? null : 'ios')}
              >
                <HelpCircle size={15} />
                <span>Panduan Pasang di iPhone</span>
                {openGuide === 'ios' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            {openGuide === 'ios' && (
              <div className={styles.guideBox}>
                <h4 className={styles.guideTitle}>Cara Pasang di Layar Utama iPhone:</h4>
                <ol className={styles.guideList}>
                  <li>Buka <code>ruang-cerita.pikr-manseku.my.id</code> menggunakan browser <strong>Safari</strong> di iPhone kamu.</li>
                  <li>Tekan tombol <strong>Bagikan (Share)</strong> yang berlogo kotak dengan panah ke atas di bilah bawah.</li>
                  <li>Gulir ke bawah dan ketuk opsi <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
                  <li>Tekan <strong>Tambah (Add)</strong> di pojok kanan atas. Ikon Ruang Cerita akan langsung tampil di beranda iPhone kamu.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
        </ScrollReveal>

        {/* Muted Footer Notice (No AI Slop) */}
        <ScrollReveal delay={150}>
          <div className={styles.footerNoticeArea}>
            <p className={styles.subtleNotice}>
              Tunggu Kami di Google PlayStore dan Apple AppStore!
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, ShieldCheck, HeartHandshake, Sparkles, Lock,
  Users, Smartphone, ArrowRight, ExternalLink, HelpCircle, Download,
  ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '@/components/common/SEO';
import ScrollReveal from '@/components/common/ScrollReveal';
import styles from './RuangCeritaPage.module.css';

export default function RuangCeritaPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOS, setMobileOS] = useState('android');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent || '';
      const isIos = /iPhone|iPad|iPod/i.test(ua);
      const isAndroid = /Android/i.test(ua);
      const isNarrow = window.innerWidth <= 768;
      setIsMobile(isIos || isAndroid || isNarrow);
      setMobileOS(isIos ? 'ios' : 'android');
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const faqs = [
    {
      q: 'Apa itu Ruang Cerita PIK-R MANSEKU?',
      a: 'Ruang Cerita adalah ekosistem media sosial dan layanan konseling sebaya yang aman bagi siswa MAN 1 Muara Enim. Siswa dapat berbagi cerita 24 jam (Stories), berdiskusi di feed positif, dan berkonsultasi secara privat dengan konselor sebaya PIK-R.'
    },
    {
      q: 'Apakah curhat di Ruang Cerita benar-benar aman dan rahasia?',
      a: 'Sangat aman. Ruang Cerita menyediakan fitur Curhat Anonim dan enkripsi pesan. Konselor sebaya PIK-R memegang teguh asas kerahasiaan konseling (judgement-free zone).'
    },
    {
      q: 'Siapa yang melayani konseling di Ruang Cerita?',
      a: 'Konseling sebaya dilakukan oleh Konselor Sebaya dan Pendidik Sebaya PIK-R MAN 1 Muara Enim yang telah mendapatkan pelatihan resmi dari Pembina Madrasah dan BKKBN.'
    },
    {
      q: 'Bagaimana cara mengakses Ruang Cerita?',
      a: 'Siswa dapat mengakses langsung melalui web resmi di ruang-cerita.pikr-manseku.my.id atau melalui aplikasi mobile Ruang Cerita PIK-R menggunakan NISN terdaftar.'
    }
  ];

  return (
    <div className={styles.pageWrapper}>
      <SEO
        title="Ruang Cerita PIK-R"
        description="Ruang Cerita PIK-R MAN 1 Muara Enim. Media sosial siswa dan wadah konseling sebaya yang aman di Muara Enim. Cerita 24 jam, curhat anonim terenkripsi, dan pendampingan konselor sebaya."
        keywords="Ruang Cerita, Ruang Cerita PIK-R, Konseling Remaja Muara Enim, Konselor Sebaya, Cerita 24 Jam Siswa, PIK-R MANSEKU"
      />

      {/* ── Hero Section ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.subtleCategory}>
            Platform Media Sosial &amp; Konseling Sebaya Remaja
          </p>

          <h1 className={styles.title}>
            Ruang Cerita <span className={styles.titleHighlight}>PIK-R</span>
          </h1>

          <p className={styles.subtitle}>
            Tempat aman bagi siswa MAN 1 Muara Enim untuk saling berbagi cerita, berekspresi positif,
            dan berkonsultasi dengan konselor sebaya tanpa rasa canggung atau takut dihakimi.
          </p>

          {/* Action Call-to-Action (Adaptive Desktop vs Mobile) */}
          <div className={styles.heroCtaWrapper}>
            {!isMobile ? (
              <>
                <a
                  href="https://ruang-cerita.pikr-manseku.my.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnPrimary}
                >
                  <MessageCircle size={18} />
                  Buka Ruang Cerita
                  <ExternalLink size={16} />
                </a>
                <a
                  href="#download-app"
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.lenis) {
                      window.lenis.scrollTo('#download-app');
                    } else {
                      document.getElementById('download-app')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={styles.subtleLink}
                >
                  Unduh Ruang Cerita di Ponsel Kamu!
                </a>
              </>
            ) : (
              <>
                {mobileOS === 'ios' ? (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => {
                      toast('Versi iOS sedang dipersiapkan untuk Apple TestFlight & AppStore! Buka versi web untuk akses instan.', { icon: '🍎', duration: 4000 });
                    }}
                  >
                    <Download size={18} />
                    Unduh Ruang Cerita (iOS)
                  </button>
                ) : (
                  <a
                    href="/downloads/ruang-cerita.apk"
                    className={styles.btnPrimary}
                    onClick={(e) => {
                      fetch('/downloads/ruang-cerita.apk', { method: 'HEAD' })
                        .then((res) => {
                          if (!res.ok) {
                            e.preventDefault();
                            if (window.lenis) {
                              window.lenis.scrollTo('#download-app');
                            } else {
                              document.getElementById('download-app')?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }
                        })
                        .catch(() => {
                          e.preventDefault();
                          if (window.lenis) {
                            window.lenis.scrollTo('#download-app');
                          } else {
                            document.getElementById('download-app')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        });
                    }}
                  >
                    <Download size={18} />
                    Unduh Ruang Cerita (Android)
                  </a>
                )}
                <a
                  href="https://ruang-cerita.pikr-manseku.my.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.subtleLink}
                >
                  atau buka versi web →
                </a>
                <p className={styles.subtleNotice}>
                  Tunggu Kami di Google PlayStore dan Apple AppStore!
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 4 Fitur Unggulan ── */}
      <ScrollReveal>
        <section className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Lock size={24} />
            </div>
            <h2 className={styles.featureTitle}>Curhat Anonim &amp; Aman</h2>
            <p className={styles.featureDesc}>
              Privasi 100% terlindungi. Kamu bebas menceritakan kegelisahan, masalah pertemanan, maupun
              kesehatan tanpa khawatir identitasmu terungkap.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <HeartHandshake size={24} />
            </div>
            <h2 className={styles.featureTitle}>Konseling Sebaya 1-on-1</h2>
            <p className={styles.featureDesc}>
              Didampingi langsung oleh konselor sebaya PIK-R MAN 1 Muara Enim yang terlatih, sabar,
              dan siap mendengarkan sepenuh hati.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Sparkles size={24} />
            </div>
            <h2 className={styles.featureTitle}>Cerita 24 Jam (Stories)</h2>
            <p className={styles.featureDesc}>
              Bagikan momen harian, kutipan motivasi, dan tips kesehatan reproduksi remaja dengan durasi 24 jam layaknya media sosial modern.
            </p>
          </div>

          {/* Card ke-4: Full width, horizontal/tipis */}
          <div className={`${styles.featureCard} ${styles.featureCardWide}`}>
            <div className={styles.featureIcon}>
              <ShieldCheck size={24} />
            </div>
            <div className={styles.featureCardWideContent}>
              <h2 className={styles.featureTitle}>Terverifikasi &amp; Khusus Siswa</h2>
              <p className={styles.featureDesc}>
                Terhubung langsung dengan data anggota dan ID Card siswa MANSEKU, menjaga lingkungan komunitas tetap bersih, positif, dan terhindar dari perundungan online.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Showcase Box ── */}
      <ScrollReveal>
        <div className={styles.showcaseSection}>
          <div className={styles.showcaseCard}>
            <h2 className={styles.showcaseTitle}>Mulai Bercerita Sekarang</h2>
            <p className={styles.showcaseDesc}>
              Jangan simpan masalahmu sendirian. Bersama sahabat sebaya di PIK-R MANSEKU,
              setiap cerita dihargai dan setiap suara didengarkan.
            </p>
            {!isMobile ? (
              <a
                href="https://ruang-cerita.pikr-manseku.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnPrimary}
                style={{ margin: '0 auto' }}
              >
                Buka Ruang Cerita Sekarang
                <ArrowRight size={18} />
              </a>
            ) : (
              <a
                href="#download-app"
                className={styles.btnPrimary}
                style={{ margin: '0 auto' }}
                onClick={(e) => {
                  e.preventDefault();
                  if (window.lenis) {
                    window.lenis.scrollTo('#download-app');
                  } else {
                    document.getElementById('download-app')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Download size={18} />
                Unduh Ruang Cerita
                <ArrowRight size={18} />
              </a>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* ── App Download Section ── */}
      <ScrollReveal>
        <section id="download-app" className={styles.downloadSection}>
          <div className={styles.downloadCard}>
            <p className={styles.subtleCategory} style={{ marginBottom: '0.5rem' }}>
              Aplikasi Mobile Resmi
            </p>

            <h2 className={styles.downloadTitle}>
              Unduh Aplikasi Ruang Cerita
            </h2>
            <p className={styles.downloadDesc}>
              Dapatkan pengalaman terbaik dengan notifikasi langsung di ponselmu saat ada pesan baru, like, komentar, dan pembaruan cerita dari teman sebaya.
            </p>

            <div className={styles.downloadButtonsGrid}>
              {/* Tombol Android */}
              <a
                href="/downloads/ruang-cerita.apk"
                className={styles.downloadBtnAndroid}
                onClick={(e) => {
                  fetch('/downloads/ruang-cerita.apk', { method: 'HEAD' })
                    .then((res) => {
                      if (!res.ok) {
                        e.preventDefault();
                        toast('Paket APK Android siap diunduh segera! Pantau info terbaru dari pengurus PIK-R.', { icon: '🚀' });
                      }
                    })
                    .catch(() => {
                      e.preventDefault();
                      toast('Paket APK Android sedang disiapkan pengurus.', { icon: '🚀' });
                    });
                }}
              >
                <div className={styles.downloadBtnIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1147-.1989.0467-.4538-.1521-.5685-.1988-.1148-.4537-.0468-.5685.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.1346.8258L4.8431 5.4478c-.1148-.1989-.3697-.2669-.5685-.1521-.1989.1147-.2668.3696-.1521.5685l1.996 3.4572C2.6889 11.1867.3432 14.6589 0 18.75h24c-.3432-4.0911-2.6889-7.5633-6.1185-9.4286"/>
                  </svg>
                </div>
                <div className={styles.downloadBtnText}>
                  <span className={styles.downloadBtnSmall}>Unduh File APK</span>
                  <span className={styles.downloadBtnLarge}>Untuk Android</span>
                </div>
              </a>

              {/* Tombol iOS */}
              <button
                type="button"
                className={styles.downloadBtnIos}
                onClick={() => {
                  toast('Versi iOS (iPhone) sedang dipersiapkan untuk Apple TestFlight & AppStore! Gunakan browser Safari untuk akses langsung.', { icon: '🍎', duration: 4500 });
                }}
              >
                <div className={styles.downloadBtnIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.64 1.34-.56.65-1.06 1.72-.92 2.74 1 .08 2.02-.48 2.64-1.23"/>
                  </svg>
                </div>
                <div className={styles.downloadBtnText}>
                  <span className={styles.downloadBtnSmall}>Tersedia via TestFlight</span>
                  <span className={styles.downloadBtnLarge}>Untuk iOS / iPhone</span>
                </div>
              </button>
            </div>

            <p className={styles.subtleNotice}>
              Tunggu Kami di Google PlayStore dan Apple AppStore!
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* ── FAQ Section (Butter-Smooth Collapsible) ── */}
      <ScrollReveal>
        <section className={styles.faqSection}>
          <div className={styles.sectionHeading}>
            <h2 className={styles.sectionTitle}>Pertanyaan Seputar Ruang Cerita</h2>
            <p className={styles.sectionSubtitle}>Informasi penting tentang privasi dan layanan konseling sebaya</p>
          </div>

          <div className={styles.faqList}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className={`${styles.faqItem} ${isOpen ? styles.faqItemActive : ''}`}>
                  <button
                    type="button"
                    className={styles.faqQuestion}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <div className={styles.faqHeaderContent}>
                      <span className={styles.faqQuestionText}>{faq.q}</span>
                      <span className={`${styles.faqSingleLinePreview} ${isOpen ? styles.faqPreviewHidden : ''}`}>
                        {faq.a}
                      </span>
                    </div>
                    <span className={styles.faqIconCircle}>
                      {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                    </span>
                  </button>
                  <div className={`${styles.faqCollapse} ${isOpen ? styles.faqCollapseOpen : ''}`}>
                    <div className={styles.faqCollapseInner}>
                      <p className={styles.faqAnswerBody}>{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}

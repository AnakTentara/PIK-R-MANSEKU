import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Calendar, BookOpen, MessageCircle, Sparkles } from 'lucide-react';
import { getPublicSettings } from '@/api/candidates';
import { getPublicTestimonials } from '@/api/public';
import SEO from '@/components/common/SEO';
import { getUploadUrl } from '@/api/axios';
import styles from './LandingPage.module.css';

const HERO_SLIDES = [
  { src: '/media/heros/hero1.jpeg', alt: 'Kegiatan PIK-R MANSEKU 1' },
  { src: '/media/heros/hero2.jpeg', alt: 'Kegiatan PIK-R MANSEKU 2' },
];

const DEFAULT_MISI = [
  'Memberikan edukasi kesehatan reproduksi dan life skills kepada remaja MAN 1 Muara Enim.',
  'Menyelenggarakan konseling sebaya yang aman, terpercaya, dan bersahabat.',
  'Mengembangkan keterampilan kepemimpinan dan soft skills remaja melalui berbagai kegiatan.',
  'Membangun jejaring kerjasama antar PIK-R se-Sumatera Selatan.',
];

function ScrollReveal({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { 
        threshold: 0.1,
        rootMargin: "-40px 0px -40px 0px"
      }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`${styles.revealFade} ${isVisible ? styles.revealFadeActive : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSessionOpen, setIsSessionOpen] = useState(true);
  const [content, setContent] = useState(null);
  const [webEditorConfig, setWebEditorConfig] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      // Jeda rotasi slide jika tab sedang di latar belakang (hemat baterai & CPU HP)
      if (!document.hidden) {
        setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadSettings();
    loadTestimonials();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getPublicSettings();
      if (res.data) {
        setIsSessionOpen(res.data.registrationSession?.status === 'open');
        if (res.data.landingPageContent) {
          setContent(res.data.landingPageContent);
        }
        if (res.data.webEditorConfig) {
          setWebEditorConfig(res.data.webEditorConfig);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadTestimonials = async () => {
    try {
      const res = await getPublicTestimonials();
      setTestimonials(res.data || []);
    } catch (err) {
      console.error('Failed to load testimonials:', err);
    }
  };

  // Resolve config variables
  const webTitle = webEditorConfig?.hero?.webTitle || 'PIK-R MANSEKU';
  const heroDesc = webEditorConfig?.hero?.heroDesc || 'Pusat Informasi & Konseling Remaja MAN 1 Muara Enim — wadah konseling, edukasi, dan pengembangan diri untuk remaja.';

  const tahunBerdiri = webEditorConfig?.tentangKami?.yearFounded || content?.tahunBerdiri || '2023';
  const aktifType = webEditorConfig?.tentangKami?.activeMembersType || 'Real';
  const aktifFake = webEditorConfig?.tentangKami?.activeMembersFakeValue || '';
  const anggotaAktif = (aktifType === 'Fake' || aktifType === 'Real+Fake') ? aktifFake : '50+'; // ideally this should also combine real if Real+Fake, but keeping simple for UI display
  const kegiatan = webEditorConfig?.tentangKami?.activitiesCount || content?.kegiatan || '10+ Program';
  
  const aboutText1 = webEditorConfig?.tentangKami?.aboutText1 || content?.aboutText1 || 'PIK-R MANSEKU adalah organisasi Pusat Informasi dan Konseling Remaja yang bernaung di bawah MAN 1 Muara Enim, Kementerian Agama Republik Indonesia. Kami hadir sebagai wadah bagi remaja untuk mendapatkan informasi yang tepat, konseling sebaya yang aman, dan pengembangan diri yang menyeluruh.';
  const aboutText2 = webEditorConfig?.tentangKami?.aboutText2 || content?.aboutText2 || 'Melalui pendekatan yang bersahabat dan berbasis ilmu pengetahuan, PIK-R MANSEKU berkomitmen untuk membentuk generasi muda yang sehat secara fisik, mental, dan sosial — serta siap menjadi pemimpin masa depan.';
  
  const visi = webEditorConfig?.visiMisi?.visi || content?.visi || 'Menjadi wadah pembinaan dan pengembangan diri remaja yang beriman, berkarakter, dan berwawasan luas melalui pendekatan konseling sebaya.';
  
  const rawMisi = webEditorConfig?.visiMisi?.misi || content?.misi;
  const misiList = rawMisi 
    ? (typeof rawMisi === 'string' ? rawMisi.split('\n').filter(Boolean) : rawMisi)
    : DEFAULT_MISI;

  return (
    <div className="page-wrapper">
      <SEO />

      {/* ── Hero ── */}
      <section className={styles.hero} id="beranda">
        {/* Full-width slideshow background */}
        <div className={styles.slideshowContainer}>
          <div className={styles.slideshow}>
            {HERO_SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`${styles.slide} ${i === activeSlide ? styles.active : ''}`}
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className={styles.slideImg}
                />
              </div>
            ))}
          </div>
          {/* Transition overlay: smooth vertical and horizontal fade to white */}
          <div className={styles.heroOverlay} />
        </div>

        {/* Foreground Content */}
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            {/* Mobile Badges (Visible on mobile only) */}
            <div className={styles.mobileBadges}>
              <div className={styles.slideBadge}>
                <div className={styles.slideBadgeIcon}>
                  <Users size={16} />
                </div>
                <div className={styles.slideBadgeText}>
                  <span className={styles.slideBadgeNum}>Konseling Sebaya</span>
                  <span className={styles.slideBadgeLabel}>PIK-R MANSEKU</span>
                </div>
              </div>
              <div className={styles.slideBadge}>
                <div className={styles.slideBadgeIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  <BookOpen size={16} />
                </div>
                <div className={styles.slideBadgeText}>
                  <span className={styles.slideBadgeNum}>Pendidik Sebaya</span>
                  <span className={styles.slideBadgeLabel}>Remaja Sehat</span>
                </div>
              </div>
            </div>

            <p className={styles.heroEyebrow}>
              <span />
              Selamat Datang di
            </p>
            <h1 className={styles.heroTitle}>
              {webTitle.includes(' ') ? (
                <>
                  {webTitle.split(' ')[0]} <strong>{webTitle.substring(webTitle.indexOf(' ') + 1)}</strong>
                </>
              ) : (
                <strong>{webTitle}</strong>
              )}
            </h1>
            <p className={styles.heroDesc}>
              {heroDesc}
            </p>
            <div className={styles.heroBtns}>
              <Link to="/daftar" className={styles.heroBtnPrimary}>
                {isSessionOpen ? 'Daftar Sekarang' : 'Pendaftaran Ditutup'}
                <ArrowRight size={16} />
              </Link>
              <Link to="/cek-kelulusan" className={styles.heroBtnOutline}>
                Cek Kelulusan
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{anggotaAktif}</span>
                <span className={styles.heroStatLabel}>Anggota Aktif</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{kegiatan}</span>
                <span className={styles.heroStatLabel}>Program Kegiatan</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{tahunBerdiri}</span>
                <span className={styles.heroStatLabel}>Tahun Berdiri</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Badge Left */}
        <div className={styles.badgeLeft}>
          <div className={styles.slideBadge}>
            <div className={styles.slideBadgeIcon}>
              <Users size={18} />
            </div>
            <div className={styles.slideBadgeText}>
              <span className={styles.slideBadgeNum}>Konseling Sebaya</span>
              <span className={styles.slideBadgeLabel}>PIK-R MANSEKU</span>
            </div>
          </div>
        </div>

        {/* Floating Badge Right */}
        <div className={styles.badgeRight}>
          <div className={styles.slideBadge} style={{ animationDelay: '0.3s' }}>
            <div className={styles.slideBadgeIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <BookOpen size={18} />
            </div>
            <div className={styles.slideBadgeText}>
              <span className={styles.slideBadgeNum}>Pendidik Sebaya</span>
              <span className={styles.slideBadgeLabel}>Remaja Sehat &amp; Kreatif</span>
            </div>
          </div>
        </div>

        {/* Dot navigation */}
        <div className={styles.slideDots}>
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.slideDot} ${i === activeSlide ? styles.activeDot : ''}`}
              onClick={() => setActiveSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Tentang ── */}
      <section className="section" id="tentang">
        <div className={`container ${styles.aboutGrid}`}>
          <ScrollReveal>
            <div className={styles.aboutText}>
              <h2 className={styles.sectionTitle}>
                Tentang PIK-R
                <span className={styles.titleBar} />
              </h2>
              <p className={styles.aboutDesc}>{aboutText1}</p>
              <p className={styles.aboutDesc}>{aboutText2}</p>
              <Link to="/kami" className={styles.learnMoreLink}>
                Pelajari Lebih Lanjut <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>

          <div className={styles.aboutStats}>
            <ScrollReveal delay={0}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Calendar size={20} />
                </div>
                <div>
                  <div className={styles.statValue}>{tahunBerdiri}</div>
                  <div className={styles.statLabel}>Tahun Berdiri</div>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Users size={20} />
                </div>
                <div>
                  <div className={styles.statValue}>{anggotaAktif}</div>
                  <div className={styles.statLabel}>Anggota Aktif</div>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <div className={styles.statValue}>{kegiatan}</div>
                  <div className={styles.statLabel}>Kegiatan</div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Visi Misi ── */}
      <section className={`section ${styles.visiMisiSection}`} id="visi-misi">
        <div className="container">
          <ScrollReveal>
            <h2 className={styles.sectionTitle}>
              Visi &amp; Misi
              <span className={styles.titleBar} />
            </h2>
          </ScrollReveal>

          <div className={styles.visiMisiGrid}>
            <ScrollReveal delay={100}>
              <div className={styles.visiCard}>
                <span className={styles.visiLabel}>Visi</span>
                <blockquote className={styles.visiQuote}>{visi}</blockquote>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className={styles.misiCard}>
                <span className={styles.misiLabel}>Misi</span>
                <ol className={styles.misiList}>
                  {misiList.map((item, i) => (
                    <li key={i} className={styles.misiItem}>
                      <span className={styles.misiNum}>{i + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Ruang Cerita PIK-R ── */}
      <section className="section" style={{ background: '#ffffff', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <ScrollReveal>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', padding: '1rem 0' }}>
              <div style={{ maxWidth: '580px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  <Sparkles size={14} /> Ruang Konseling Sebaya &amp; Media Sosial Siswa
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
                  Ruang Cerita PIK-R
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '1.05rem' }}>
                  Wadah konseling sebaya yang aman dan bebas penghakiman bagi siswa MAN 1 Muara Enim. Bagikan cerita 24 jam, curhat anonim dengan konselor sebaya terpercaya, dan temukan sahabat seangkatan.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Link to="/ruang-cerita" className="btn btn-primary">
                    <MessageCircle size={17} />
                    Jelajahi Ruang Cerita
                  </Link>
                  <a href="https://ruang-cerita.pikr-manseku.my.id" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                    Buka Aplikasi Web
                  </a>
                </div>
              </div>
              <div style={{ flex: '1', minWidth: '280px', maxWidth: '420px', background: 'var(--color-bg)', padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
                  Kenapa Ruang Cerita?
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: '#ea580c', fontWeight: 700 }}>✓</span>
                    <span><strong>100% Rahasia:</strong> Mode curhat anonim terlindungi.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: '#ea580c', fontWeight: 700 }}>✓</span>
                    <span><strong>Konselor Sebaya:</strong> Didampingi teman sebaya terlatih.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: '#ea580c', fontWeight: 700 }}>✓</span>
                    <span><strong>Stories 24 Jam:</strong> Bagikan inspirasi dan momen harian.</span>
                  </li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Testimonials (Apa Kata Alumni?) ── */}
      {testimonials.length > 0 && (
        <section className={`section ${styles.testimonialsSection}`} id="apa-kata-alumni">
          <div className={styles.testimonialsHeaderWrap}>
            <div className="container">
              <ScrollReveal>
                <h2 className={styles.sectionTitle}>
                  Apa Kata Alumni?
                  <span className={styles.titleBar} />
                </h2>
              </ScrollReveal>
            </div>
          </div>

          <div className={styles.marqueeContainer}>
            <div className={styles.marqueeTrack}>
              {/* Set 1 */}
              {testimonials.map((t) => (
                <div key={`${t.id}-1`} className={styles.testimonialCard} onClick={() => setSelectedTestimonial(t)}>
                  <div className={styles.testimonialPhotoWrap}>
                    {t.photoPath ? (
                      <img src={getUploadUrl(t.photoPath)} alt={t.name} className={styles.testimonialPhoto} />
                    ) : (
                      <div className={styles.testimonialPhotoPlaceholder}>{t.name[0]}</div>
                    )}
                    <div className={styles.testimonialMetaOverlay}>
                      <h4 className={styles.testimonialName}>{t.name}</h4>
                      <span className={styles.testimonialBadge}>Angkatan {t.angkatan}</span>
                    </div>
                  </div>
                  <div className={styles.testimonialContent}>
                    <p className={styles.testimonialText}>"{t.content}"</p>
                  </div>
                </div>
              ))}
              {/* Set 2 (Duplikasi untuk Seamless Infinite Scroll) */}
              {testimonials.map((t) => (
                <div key={`${t.id}-2`} className={styles.testimonialCard} onClick={() => setSelectedTestimonial(t)}>
                  <div className={styles.testimonialPhotoWrap}>
                    {t.photoPath ? (
                      <img src={getUploadUrl(t.photoPath)} alt={t.name} className={styles.testimonialPhoto} />
                    ) : (
                      <div className={styles.testimonialPhotoPlaceholder}>{t.name[0]}</div>
                    )}
                    <div className={styles.testimonialMetaOverlay}>
                      <h4 className={styles.testimonialName}>{t.name}</h4>
                      <span className={styles.testimonialBadge}>Angkatan {t.angkatan}</span>
                    </div>
                  </div>
                  <div className={styles.testimonialContent}>
                    <p className={styles.testimonialText}>"{t.content}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Bottom ── */}
      <section className={styles.ctaSection}>
        <div className={`container ${styles.ctaInner}`}>
          <ScrollReveal>
            <div>
              <h2 className={styles.ctaTitle}>
                {isSessionOpen ? 'Tertarik bergabung dengan PIK-R MANSEKU?' : 'Pendaftaran Saat Ini Ditutup'}
              </h2>
              <p className={styles.ctaSub}>
                {isSessionOpen 
                  ? 'Daftarkan dirimu sekarang and jadilah bagian dari komunitas remaja terbaik MAN 1 Muara Enim.'
                  : 'Nantikan pembukaan pendaftaran sesi berikutnya. Terus pantau media sosial kami!'
                }
              </p>
            </div>
          </ScrollReveal>
          {isSessionOpen && (
            <ScrollReveal delay={150}>
              <Link to="/daftar" className="btn btn-primary btn-lg">
                Daftar Sekarang
                <ArrowRight size={18} />
              </Link>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Testimonial Popup Modal */}
      {selectedTestimonial && (
        <div className={styles.testimonialModalOverlay} onClick={() => setSelectedTestimonial(null)}>
          <div className={styles.testimonialModalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setSelectedTestimonial(null)}>×</button>
            <div className={styles.modalPhotoWrap}>
              {selectedTestimonial.photoPath ? (
                <img src={getUploadUrl(selectedTestimonial.photoPath)} alt={selectedTestimonial.name} className={styles.modalPhoto} />
              ) : (
                <div className={styles.modalPhotoPlaceholder}>{selectedTestimonial.name[0]}</div>
              )}
            </div>
            <h3 className={styles.modalName}>{selectedTestimonial.name}</h3>
            <span className={styles.modalBadge}>Angkatan {selectedTestimonial.angkatan}</span>
            <p className={styles.modalText}>"{selectedTestimonial.content}"</p>
          </div>
        </div>
      )}

    </div>
  );
}


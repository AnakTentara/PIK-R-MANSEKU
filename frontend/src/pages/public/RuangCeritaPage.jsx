import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, ShieldCheck, HeartHandshake, Sparkles, Lock,
  Users, Smartphone, ArrowRight, ExternalLink, HelpCircle
} from 'lucide-react';
import SEO from '@/components/common/SEO';
import StoriesTray from '@/components/common/StoriesTray';
import styles from './RuangCeritaPage.module.css';

export default function RuangCeritaPage() {
  const [faqs] = useState([
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
  ]);

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
          <div className={styles.pillBadge}>
            <Sparkles size={16} />
            <span>Platform Media Sosial & Konseling Sebaya Remaja</span>
          </div>
          <h1 className={styles.title}>
            Ruang Cerita <span className={styles.titleHighlight}>PIK-R</span>
          </h1>
          <p className={styles.subtitle}>
            Tempat aman bagi siswa MAN 1 Muara Enim untuk saling berbagi cerita, berekspresi positif,
            dan berkonsultasi dengan konselor sebaya tanpa rasa canggung atau takut dihakimi.
          </p>
          <div className={styles.heroActions}>
            <a
              href="https://ruang-cerita.pikr-manseku.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnPrimary}
            >
              <MessageCircle size={18} />
              Buka Web Ruang Cerita
              <ExternalLink size={16} />
            </a>
            <Link to="/daftar" className={styles.btnSecondary}>
              <Users size={18} />
              Daftar Konselor Sebaya
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live Stories Preview Bar ── */}
      <div className={styles.storiesSection}>
        <div className={styles.storiesHeader}>
          <div className={styles.storiesTitle}>
            <span className={styles.pulseDot} />
            Cerita 24 Jam Terkini
          </div>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Klik avatar untuk melihat</span>
        </div>
        <StoriesTray />
      </div>

      {/* ── 4 Fitur Unggulan ── */}
      <section className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Lock size={24} />
          </div>
          <h2 className={styles.featureTitle}>Curhat Anonim & Aman</h2>
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

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <ShieldCheck size={24} />
          </div>
          <h2 className={styles.featureTitle}>Terverifikasi & Khusus Siswa</h2>
          <p className={styles.featureDesc}>
            Terhubung langsung dengan data anggota dan ID Card siswa MANSEKU, menjaga lingkungan
            komunitas tetap bersih, positif, dan terhindar dari perundungan online.
          </p>
        </div>
      </section>

      {/* ── Showcase Box ── */}
      <div className={styles.showcaseSection}>
        <div className={styles.showcaseCard}>
          <h2 className={styles.showcaseTitle}>Mulai Bercerita Sekarang</h2>
          <p className={styles.showcaseDesc}>
            Jangan simpan masalahmu sendirian. Bersama sahabat sebaya di PIK-R MANSEKU,
            setiap cerita dihargai dan setiap suara didengarkan.
          </p>
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
        </div>
      </div>

      {/* ── FAQ Section ── */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>Pertanyaan Seputar Ruang Cerita</h2>
          <p className={styles.sectionSubtitle}>Informasi penting tentang privasi dan layanan konseling sebaya</p>
        </div>

        {faqs.map((faq, index) => (
          <div key={index} className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>{faq.q}</h3>
            <p className={styles.faqAnswer}>{faq.a}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

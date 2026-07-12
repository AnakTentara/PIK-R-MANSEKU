import { useState, useEffect } from 'react';
import { getPublicOrg } from '@/api/public';
import { ChevronDown, ChevronUp, Users, Calendar, MapPin, Award } from 'lucide-react';
import styles from './KamiPage.module.css';

export default function KamiPage() {
  const [orgData, setOrgData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPublicOrg();
        setOrgData(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter current active leadership
  const pembinaCurrent = orgData.find(m => m.role === 'PEMBINA' && m.isCurrent);
  const ketuaCurrent = orgData.find(m => m.role === 'KETUA' && m.isCurrent);
  const wakilCurrent = orgData.find(m => m.role === 'WAKIL' && m.isCurrent);
  const kabinetCurrent = orgData.filter(m => m.role === 'KABINET' && m.isCurrent);

  const ROLE_ORDER = { KETUA: 1, WAKIL: 2, KABINET: 3, PEMBINA: 4 };

  // Group historic archives by start year
  const archivesGrouped = orgData.reduce((acc, m) => {
    if (m.isCurrent) return acc;
    const year = m.yearStart;
    if (!acc[year]) acc[year] = [];
    acc[year].push(m);
    return acc;
  }, {});

  // Sort archive members for each year
  Object.keys(archivesGrouped).forEach(year => {
    archivesGrouped[year].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));
  });

  const archiveYears = Object.keys(archivesGrouped).sort((a, b) => b - a);

  const toggleYear = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  return (
    <div className="page-wrapper">
      {/* 1. Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <img src="/media/logos/logo_pik-r.png" alt="Logo PIK-R" className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>Tentang PIK-R MANSEKU</h1>
          <p className={styles.heroSubtitle}>
            Pusat Informasi & Konseling Remaja MAN 1 Muara Enim. Wadah pengembangan karakter, kepemimpinan, dan kesehatan remaja sebaya.
          </p>
        </div>
      </section>

      {/* 2. Biodata & Profil */}
      <section className={`section ${styles.biodataSection}`}>
        <div className={`container ${styles.biodataGrid}`}>
          <div className={styles.biodataLeft}>
            <h2>Wadah Konseling &amp; Edukasi Remaja</h2>
            <p>
              PIK-R (Pusat Informasi dan Konseling Remaja) MANSEKU merupakan organisasi di bawah naungan BKKBN dan MAN 1 Muara Enim yang berfokus pada pemberian informasi tentang Penyiapan Kehidupan Berkeluarga bagi Remaja (PKBR), Pendewasaan Usia Perkawinan (PUP), keterampilan hidup (life skills), pelayanan konseling, dan rujukan.
            </p>
            <p>
              Melalui program konselor sebaya (peer counselor) dan pendidik sebaya (peer educator), kami membangun ruang aman bagi siswa-siswi MAN 1 Muara Enim untuk saling bercerita, berkonsultasi, dan memecahkan problematika remaja tanpa ada rasa canggung.
            </p>
          </div>
          <div className={styles.biodataRight}>
            <div className={styles.infoBox}>
              <Calendar className={styles.infoIcon} />
              <div>
                <h4>Tahun Berdiri</h4>
                <p>Resmi didirikan pada tahun 2023</p>
              </div>
            </div>
            <div className={styles.infoBox}>
              <MapPin className={styles.infoIcon} />
              <div>
                <h4>Instansi Induk</h4>
                <p>MAN 1 Muara Enim, Sumatera Selatan</p>
              </div>
            </div>
            <div className={styles.infoBox}>
              <Award className={styles.infoIcon} />
              <div>
                <h4>Sekretariat</h4>
                <p>Jl. Jend. Ahmad Yani No.1, Muara Enim, Kec. Muara Enim, Kab. Muara Enim</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pimpinan Saat Ini */}
      <section className={`section ${styles.leadershipSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Pimpinan &amp; Pengurus Aktif</h2>
          
          {loading ? (
            <div className="spinner" style={{ margin: '40px auto' }} />
          ) : (
            <>
              {/* Pembina Card */}
              {pembinaCurrent && (
                <div className={styles.pembinaCard}>
                  <div className={styles.pembinaImgWrap}>
                    {pembinaCurrent.photoPath ? (
                      <img src={`http://localhost:25552${pembinaCurrent.photoPath}`} alt={pembinaCurrent.name} />
                    ) : (
                      <div className={styles.initialsBig}>{pembinaCurrent.name[0]}</div>
                    )}
                  </div>
                  <div className={styles.pembinaInfo}>
                    <span className={styles.roleLabel}>PEMBINA PIK-R</span>
                    <h3>{pembinaCurrent.name}</h3>
                    <p className={styles.duration}>Menjabat sejak {pembinaCurrent.yearStart}</p>
                    {pembinaCurrent.quote && (
                      <blockquote className={styles.quote}>
                        "{pembinaCurrent.quote}"
                      </blockquote>
                    )}
                  </div>
                </div>
              )}

              {/* Ketua & Wakil */}
              <div className={styles.coreGrid}>
                {ketuaCurrent && (
                  <div className={styles.coreCard}>
                    <div className={styles.coreImgWrap}>
                      {ketuaCurrent.photoPath ? (
                        <img src={`http://localhost:25552${ketuaCurrent.photoPath}`} alt={ketuaCurrent.name} />
                      ) : (
                        <div className={styles.initials}>{ketuaCurrent.name[0]}</div>
                      )}
                    </div>
                    <span className={styles.roleLabel}>KETUA UMUM</span>
                    <h4>{ketuaCurrent.name}</h4>
                    {ketuaCurrent.quote && <p className={styles.quoteSmall}>"{ketuaCurrent.quote}"</p>}
                  </div>
                )}

                {wakilCurrent && (
                  <div className={styles.coreCard}>
                    <div className={styles.coreImgWrap}>
                      {wakilCurrent.photoPath ? (
                        <img src={`http://localhost:25552${wakilCurrent.photoPath}`} alt={wakilCurrent.name} />
                      ) : (
                        <div className={styles.initials}>{wakilCurrent.name[0]}</div>
                      )}
                    </div>
                    <span className={styles.roleLabel}>WAKIL KETUA</span>
                    <h4>{wakilCurrent.name}</h4>
                    {wakilCurrent.quote && <p className={styles.quoteSmall}>"{wakilCurrent.quote}"</p>}
                  </div>
                )}
              </div>

              {/* Kabinet/PH */}
              {kabinetCurrent.length > 0 && (
                <div className={styles.kabinetSection}>
                  <h3>Badan Pengurus Harian (Kabinet)</h3>
                  <div className={styles.kabinetGrid}>
                    {kabinetCurrent.map(k => (
                      <div key={k.id} className={styles.kabinetCard}>
                        <div className={styles.kabinetImgWrap}>
                          {k.photoPath ? (
                            <img src={`http://localhost:25552${k.photoPath}`} alt={k.name} />
                          ) : (
                            <div className={styles.initialsMini}>{k.name[0]}</div>
                          )}
                        </div>
                        <h5>{k.name}</h5>
                        <p>{k.jabatan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 4. Arsip Kepemimpinan */}
      {!loading && archiveYears.length > 0 && (
        <section className={`section ${styles.archiveSection}`}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Arsip Kepengurusan (Masa Jabatan)</h2>
            <div className={styles.accordionList}>
              {archiveYears.map(year => (
                <div key={year} className={styles.accordionItem}>
                  <button className={styles.accordionHeader} onClick={() => toggleYear(year)}>
                    <span>Kepengurusan Tahun {year}</span>
                    {expandedYear === year ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedYear === year && (
                    <div className={styles.accordionContent}>
                      <div className={styles.archiveGrid}>
                        {archivesGrouped[year].map(m => (
                          <div key={m.id} className={styles.archiveMemberCard}>
                            <div className={styles.archiveMemberAvatar}>
                              {m.photoPath ? (
                                <img src={`http://localhost:25552${m.photoPath}`} alt={m.name} />
                              ) : (
                                <div className={styles.initialsMini}>{m.name[0]}</div>
                              )}
                            </div>
                            <div>
                              <h5>{m.name}</h5>
                              <p>{m.jabatan} ({m.role})</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. CTA Ajakan Bergabung */}
      <section className={styles.cta}>
        <div className={`container ${styles.ctaInner}`}>
          <h2>Ingin Menjadi Bagian Dari Kami?</h2>
          <p>Daftarkan dirimu sekarang untuk bergabung sebagai konselor sebaya PIK-R MANSEKU generasi selanjutnya.</p>
          <a href="/daftar" className="btn btn-primary btn-lg">Daftar Sekarang</a>
        </div>
      </section>
    </div>
  );
}

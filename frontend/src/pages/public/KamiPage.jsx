import { useState, useEffect } from 'react';
import { getPublicOrg } from '@/api/public';
import { getPublicSettings } from '@/api/candidates';
import { ChevronDown, ChevronUp, Users, Calendar, MapPin, Award } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { getUploadUrl } from '@/api/axios';
import styles from './KamiPage.module.css';

export default function KamiPage() {
  const [orgData, setOrgData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState(null);
  const [webEditorConfig, setWebEditorConfig] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, settingsRes] = await Promise.all([
          getPublicOrg(),
          getPublicSettings()
        ]);
        setOrgData(orgRes.data || []);
        if (settingsRes.data?.webEditorConfig) {
          setWebEditorConfig(settingsRes.data.webEditorConfig);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter active leadership
  const pembinaCurrent = orgData.find(m => m.role === 'PEMBINA' || m.jabatan === 'Pembina');
  const ketuaCurrent = orgData.find(m => m.jabatan === 'Ketua Umum');
  const wakilCurrent = orgData.find(m => m.jabatan === 'Wakil Ketua Umum');
  
  // Sekretaris & Bendahara (Pengurus Harian Inti)
  const sekretarisCurrent = orgData.find(m => m.jabatan === 'Sekretaris Umum');
  const bendaharaCurrent = orgData.find(m => m.jabatan === 'Bendahara Umum');

  // List of Divisions
  const DIVISIONS = [
    { name: 'MedInfo', ketuaTitle: 'Ketua MedInfo', anggotaTitle: 'Anggota MedInfo' },
    { name: 'Konselor Sebaya', ketuaTitle: 'Ketua Konselor Sebaya', anggotaTitle: 'Anggota Konselor Sebaya' },
    { name: 'Pendidik Sebaya', ketuaTitle: 'Ketua Pendidik Sebaya', anggotaTitle: 'Anggota Pendidik Sebaya' },
    { name: 'Humas', ketuaTitle: 'Ketua Humas', anggotaTitle: 'Anggota Humas' },
    { name: 'Informasi', ketuaTitle: 'Ketua Informasi', anggotaTitle: 'Anggota Informasi' },
    { name: 'Konseling dan Pendamping', ketuaTitle: 'Ketua Konseling dan Pendamping', anggotaTitle: 'Anggota Konseling dan Pendamping' },
    { name: 'Kegiatan dan Kreativitas', ketuaTitle: 'Ketua Kegiatan dan Kreativitas', anggotaTitle: 'Anggota Kegiatan dan Kreativitas' }
  ];

  // Map division data
  const activeDivisions = DIVISIONS.map(div => {
    const ketua = orgData.find(m => m.jabatan === div.ketuaTitle);
    const anggota = orgData.filter(m => m.jabatan === div.anggotaTitle);
    return {
      ...div,
      ketua,
      anggota
    };
  }).filter(d => d.ketua || d.anggota.length > 0);

  const ROLE_ORDER = { PEMBINA: 1, KETUA: 2, WAKIL: 3, KABINET: 4, ANGGOTA: 5 };

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

  const tentangKami = webEditorConfig?.tentangKami || {};
  const tahunBerdiri = tentangKami.yearFounded || '2023';
  const aboutText1 = tentangKami.aboutText1 || 'PIK-R (Pusat Informasi dan Konseling Remaja) MANSEKU merupakan organisasi di bawah naungan BKKBN dan MAN 1 Muara Enim yang berfokus pada pemberian informasi tentang Penyiapan Kehidupan Berkeluarga bagi Remaja (PKBR), Pendewasaan Usia Perkawinan (PUP), keterampilan hidup (life skills), pelayanan konseling, dan rujukan.';
  const aboutText2 = tentangKami.aboutText2 || 'Melalui program konselor sebaya (peer counselor) dan pendidik sebaya (peer educator), kami membangun ruang aman bagi siswa-siswi MAN 1 Muara Enim untuk saling bercerita, berkonsultasi, dan memecahkan problematika remaja tanpa ada rasa canggung.';

  return (
    <div className="page-wrapper">
      <SEO 
        title="Tentang Kami" 
        description="Profil lengkap PIK-R MANSEKU MAN 1 Muara Enim. Ketahui visi, misi, struktur pimpinan aktif, badan pengurus harian (kabinet), dan arsip sejarah organisasi kami." 
      />
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
            <p>{aboutText1}</p>
            <p>{aboutText2}</p>
          </div>
          <div className={styles.biodataRight}>
            <div className={styles.infoBox}>
              <Calendar className={styles.infoIcon} />
              <div>
                <h4>Tahun Berdiri</h4>
                <p>Resmi didirikan pada tahun {tahunBerdiri}</p>
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
                      <img src={getUploadUrl(pembinaCurrent.photoPath)} alt={pembinaCurrent.name} />
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
                        <img src={getUploadUrl(ketuaCurrent.photoPath)} alt={ketuaCurrent.name} />
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
                        <img src={getUploadUrl(wakilCurrent.photoPath)} alt={wakilCurrent.name} />
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

               {/* Sekretaris & Bendahara */}
               <div className={styles.coreGrid}>
                 {sekretarisCurrent && (
                   <div className={styles.coreCard}>
                     <div className={styles.coreImgWrap}>
                       {sekretarisCurrent.photoPath ? (
                         <img src={getUploadUrl(sekretarisCurrent.photoPath)} alt={sekretarisCurrent.name} />
                       ) : (
                         <div className={styles.initials}>{sekretarisCurrent.name[0]}</div>
                       )}
                     </div>
                     <span className={styles.roleLabel}>SEKRETARIS UMUM</span>
                     <h4>{sekretarisCurrent.name}</h4>
                     {sekretarisCurrent.quote && <p className={styles.quoteSmall}>"{sekretarisCurrent.quote}"</p>}
                   </div>
                 )}

                 {bendaharaCurrent && (
                   <div className={styles.coreCard}>
                     <div className={styles.coreImgWrap}>
                       {bendaharaCurrent.photoPath ? (
                         <img src={getUploadUrl(bendaharaCurrent.photoPath)} alt={bendaharaCurrent.name} />
                       ) : (
                         <div className={styles.initials}>{bendaharaCurrent.name[0]}</div>
                       )}
                     </div>
                     <span className={styles.roleLabel}>BENDAHARA UMUM</span>
                     <h4>{bendaharaCurrent.name}</h4>
                     {bendaharaCurrent.quote && <p className={styles.quoteSmall}>"{bendaharaCurrent.quote}"</p>}
                   </div>
                 )}
               </div>

               {/* Divisi & Anggota */}
               {activeDivisions.length > 0 && (
                 <div className={styles.kabinetSection}>
                   <h3 style={{ textAlign: 'center', marginBottom: '24px' }}>Divisi Kepengurusan</h3>
                   <div className={styles.divisiGrid}>
                     {activeDivisions.map(d => (
                       <div key={d.name} className={styles.divisiCard}>
                         <h4 className={styles.divisiTitle}>Divisi {d.name}</h4>
                         
                         {/* Ketua Divisi */}
                         {d.ketua ? (
                           <div className={styles.divisiKetuaCard}>
                             <div className={styles.divisiKetuaImgWrap}>
                               {d.ketua.photoPath ? (
                                 <img src={getUploadUrl(d.ketua.photoPath)} alt={d.ketua.name} className={styles.divisiKetuaImg} />
                               ) : (
                                 <div className={styles.initialsMini}>{d.ketua.name[0]}</div>
                               )}
                             </div>
                             <div className={styles.divisiKetuaInfo}>
                               <span className={styles.divisiRoleLabel}>Ketua Divisi</span>
                               <h5>{d.ketua.name}</h5>
                             </div>
                           </div>
                         ) : (
                           <p className={styles.noKetua}>Tidak ada ketua aktif</p>
                         )}

                         {/* Anggota Divisi */}
                         <div className={styles.divisiAnggotaWrap}>
                           <span className={styles.divisiRoleLabel}>Anggota Divisi:</span>
                           {d.anggota.length > 0 ? (
                             <ul className={styles.divisiAnggotaList}>
                               {d.anggota.map(a => (
                                 <li key={a.id} className={styles.divisiAnggotaItem}>
                                   {a.name}
                                 </li>
                               ))}
                             </ul>
                           ) : (
                             <p className={styles.noAnggota}>Belum ada anggota</p>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </>
          )}
        </div>
      </section>

      {/* 4. CTA Ajakan Bergabung */}
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

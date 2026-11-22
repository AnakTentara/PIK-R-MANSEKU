import { useState, useEffect, useMemo } from 'react';
import { getPublicOrg } from '@/api/public';
import { getPublicSettings } from '@/api/candidates';
import { ChevronDown, ChevronUp, Users, Calendar, MapPin, Award, Archive } from 'lucide-react';
import SEO from '@/components/common/SEO';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import ScrollReveal from '@/components/common/ScrollReveal';
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

  // 1. Filter pengurus AKTIF saat ini
  const activeOrg = useMemo(() => orgData.filter((m) => m.isCurrent), [orgData]);

  // 2. Pimpinan Inti Aktif
  const pembinaCurrent = useMemo(() => {
    return activeOrg.find(
      (m) => m.role === 'PEMBINA' || (m.jabatan && m.jabatan.toLowerCase().includes('pembina'))
    );
  }, [activeOrg]);

  const ketuaCurrent = useMemo(() => {
    return activeOrg.find(
      (m) => m.role === 'KETUA' || (m.jabatan && m.jabatan.toLowerCase().includes('ketua') && !m.jabatan.toLowerCase().includes('wakil'))
    );
  }, [activeOrg]);

  const wakilCurrentList = useMemo(() => {
    return activeOrg.filter(
      (m) => m.id !== ketuaCurrent?.id && (m.role === 'WAKIL' || (m.jabatan && m.jabatan.toLowerCase().includes('wakil')))
    );
  }, [activeOrg, ketuaCurrent]);

  // 3. Badan Pengurus Harian Inti (Sekretaris & Bendahara)
  const sekretarisList = useMemo(() => {
    return activeOrg.filter(
      (m) => m.jabatan && m.jabatan.toLowerCase().includes('sekretaris')
    );
  }, [activeOrg]);

  const bendaharaList = useMemo(() => {
    return activeOrg.filter(
      (m) => m.jabatan && m.jabatan.toLowerCase().includes('bendahara')
    );
  }, [activeOrg]);

  // 4. Divisi Kepengurusan Aktif (Dinamis dari database)
  const activeDivisions = useMemo(() => {
    const excludeIds = new Set([
      pembinaCurrent?.id,
      ketuaCurrent?.id,
      ...wakilCurrentList.map((w) => w.id),
      ...sekretarisList.map((s) => s.id),
      ...bendaharaList.map((b) => b.id),
    ]);

    const coordinators = activeOrg.filter(
      (m) => !excludeIds.has(m.id) && (m.role === 'KABINET' || (m.jabatan && (m.jabatan.toLowerCase().includes('koordinator') || m.jabatan.toLowerCase().includes('ketua'))))
    );

    const anggotaList = activeOrg.filter((m) => m.role === 'ANGGOTA');

    return coordinators.map((k) => {
      let clean = k.jabatan.replace(/^(Koordinator|Ketua|Ketua Divisi)\s+/i, '').trim().toLowerCase();
      let keywords = clean.split(/\s+/).filter((w) => w.length > 2 && !['dan', '&'].includes(w));
      if (clean.includes('pdd') || clean.includes('medinfo')) keywords.push('pdd', 'medinfo');
      if (clean.includes('edukasi') || clean.includes('pendidik')) keywords.push('edukasi', 'pendidik');

      const matchingMembers = anggotaList.filter((a) => {
        const aJab = (a.jabatan || '').toLowerCase();
        return keywords.some((kw) => aJab.includes(kw));
      });

      // Tampilkan nama divisi yang rapi
      const divName = k.jabatan.replace(/^(Koordinator|Ketua|Ketua Divisi)\s+/i, 'Divisi ');

      return {
        name: divName,
        ketua: k,
        anggota: matchingMembers,
      };
    });
  }, [activeOrg, pembinaCurrent, ketuaCurrent, wakilCurrentList, sekretarisList, bendaharaList]);

  // 5. Arsip Kepengurusan Masa Lalu (Demisioner)
  const ROLE_ORDER = { PEMBINA: 1, KETUA: 2, WAKIL: 3, KABINET: 4, ANGGOTA: 5 };

  const archivesGrouped = useMemo(() => {
    const map = {};
    orgData.forEach((m) => {
      if (m.isCurrent) return;
      const start = m.yearStart || 2024;
      const end = m.yearEnd && m.yearEnd > start ? m.yearEnd : start + 1;
      const key = `${start}/${end}`;
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });

    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) || a.name.localeCompare(b.name, 'id'));
    });
    return map;
  }, [orgData]);

  const archiveYears = useMemo(() => {
    return Object.keys(archivesGrouped).sort((a, b) => b.localeCompare(a));
  }, [archivesGrouped]);

  const toggleYear = (year) => {
    setExpandedYear((prev) => (prev === year ? null : year));
  };

  const tentangKami = webEditorConfig?.tentangKami || {};
  const tahunBerdiri = tentangKami.yearFounded || '2023';
  const aboutText1 = tentangKami.aboutText1 || 'PIK-R (Pusat Informasi dan Konseling Remaja) MANSEKU merupakan organisasi di bawah naungan BKKBN dan MAN 1 Muara Enim yang berfokus pada pemberian informasi tentang Penyiapan Kehidupan Berkeluarga bagi Remaja (PKBR), Pendewasaan Usia Perkawinan (PUP), keterampilan hidup (life skills), pelayanan konseling, dan rujukan.';
  const aboutText2 = tentangKami.aboutText2 || 'Melalui program konselor sebaya (peer counselor) dan pendidik sebaya (peer educator), kami membangun ruang aman bagi siswa-siswi MAN 1 Muara Enim untuk saling bercerita, berkonsultasi, dan memecahkan problematika remaja tanpa ada rasa canggung.';

  return (
    <div className="page-wrapper">
      <SEO 
        title="Tentang PIK-R" 
        description="Profil lengkap PIK-R MANSEKU (Pusat Informasi & Konseling Remaja) MAN 1 Muara Enim. Ketahui visi, misi, struktur pimpinan aktif, badan pengurus harian (kabinet), dan arsip sejarah organisasi kami." 
        keywords="Tentang PIK-R, Profil PIK-R MANSEKU, PIK Remaja MAN 1 Muara Enim, Visi Misi PIK-R, BKKBN Muara Enim"
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
      <ScrollReveal>
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
      </ScrollReveal>

      {/* 3. Pimpinan & Pengurus Aktif */}
      <ScrollReveal>
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
                      <PhotoAvatar
                        src={pembinaCurrent.photoPath ? getUploadUrl(pembinaCurrent.photoPath) : ''}
                        name={pembinaCurrent.name}
                        placeholderClassName={styles.initialsBig}
                      />
                    </div>
                    <div className={styles.pembinaInfo}>
                      <span className={styles.roleLabel}>{pembinaCurrent.jabatan.toUpperCase()}</span>
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

                {/* Ketua & Jajaran Wakil Ketua */}
                <div className={styles.coreGrid}>
                  {ketuaCurrent && (
                    <div className={styles.coreCard}>
                      <div className={styles.coreImgWrap}>
                        <PhotoAvatar
                          src={ketuaCurrent.photoPath ? getUploadUrl(ketuaCurrent.photoPath) : ''}
                          name={ketuaCurrent.name}
                          placeholderClassName={styles.initials}
                        />
                      </div>
                      <div className={styles.coreCardContent}>
                        <span className={styles.roleLabel}>{ketuaCurrent.jabatan.toUpperCase()}</span>
                        <h4>{ketuaCurrent.name}</h4>
                        {ketuaCurrent.quote && <p className={styles.quoteSmall}>"{ketuaCurrent.quote}"</p>}
                      </div>
                    </div>
                  )}

                  {wakilCurrentList.map((wakil) => (
                    <div key={wakil.id} className={styles.coreCard}>
                      <div className={styles.coreImgWrap}>
                        <PhotoAvatar
                          src={wakil.photoPath ? getUploadUrl(wakil.photoPath) : ''}
                          name={wakil.name}
                          placeholderClassName={styles.initials}
                        />
                      </div>
                      <div className={styles.coreCardContent}>
                        <span className={styles.roleLabel}>{wakil.jabatan.toUpperCase()}</span>
                        <h4>{wakil.name}</h4>
                        {wakil.quote && <p className={styles.quoteSmall}>"{wakil.quote}"</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sekretaris & Bendahara (Pengurus Harian Inti) */}
                {(sekretarisList.length > 0 || bendaharaList.length > 0) && (
                  <div className={styles.coreGrid}>
                    {sekretarisList.map((sekre) => (
                      <div key={sekre.id} className={styles.coreCard}>
                        <div className={styles.coreImgWrap}>
                          <PhotoAvatar
                            src={sekre.photoPath ? getUploadUrl(sekre.photoPath) : ''}
                            name={sekre.name}
                            placeholderClassName={styles.initials}
                          />
                        </div>
                        <div className={styles.coreCardContent}>
                          <span className={styles.roleLabel}>{sekre.jabatan.toUpperCase()}</span>
                          <h4>{sekre.name}</h4>
                          {sekre.quote && <p className={styles.quoteSmall}>"{sekre.quote}"</p>}
                        </div>
                      </div>
                    ))}

                    {bendaharaList.map((benda) => (
                      <div key={benda.id} className={styles.coreCard}>
                        <div className={styles.coreImgWrap}>
                          <PhotoAvatar
                            src={benda.photoPath ? getUploadUrl(benda.photoPath) : ''}
                            name={benda.name}
                            placeholderClassName={styles.initials}
                          />
                        </div>
                        <div className={styles.coreCardContent}>
                          <span className={styles.roleLabel}>{benda.jabatan.toUpperCase()}</span>
                          <h4>{benda.name}</h4>
                          {benda.quote && <p className={styles.quoteSmall}>"{benda.quote}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Divisi & Anggota Bidang */}
              {activeDivisions.length > 0 && (
                <div className={styles.kabinetSection}>
                  <h3 style={{ textAlign: 'center', marginBottom: '24px' }}>Divisi Kepengurusan</h3>
                  <div className={styles.divisiGrid}>
                    {activeDivisions.map((d) => (
                      <div key={d.name} className={styles.divisiCard}>
                        <h4 className={styles.divisiTitle}>{d.name}</h4>
                        
                        {/* Koordinator / Ketua Divisi */}
                        {d.ketua ? (
                          <div className={styles.divisiKetuaCard}>
                            <div className={styles.divisiKetuaImgWrap}>
                              <PhotoAvatar
                                src={d.ketua.photoPath ? getUploadUrl(d.ketua.photoPath) : ''}
                                name={d.ketua.name}
                                placeholderClassName={styles.initialsMini}
                                size={44}
                              />
                            </div>
                            <div className={styles.divisiKetuaInfo}>
                              <span className={styles.divisiRoleLabel}>{d.ketua.jabatan}</span>
                              <h5>{d.ketua.name}</h5>
                            </div>
                          </div>
                        ) : (
                          <p className={styles.noKetua}>Tidak ada koordinator aktif</p>
                        )}

                        {/* Anggota Divisi */}
                        <div className={styles.divisiAnggotaWrap}>
                          <span className={styles.divisiRoleLabel}>Anggota Divisi ({d.anggota.length}):</span>
                          {d.anggota.length > 0 ? (
                            <ul className={styles.divisiAnggotaList}>
                              {d.anggota.map((a) => (
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
      </ScrollReveal>

      {/* 4. Sejarah & Arsip Kepengurusan Demisioner */}
      {archiveYears.length > 0 && (
        <ScrollReveal>
          <section className={`section ${styles.archiveSection}`}>
            <div className="container">
              <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '8px' }}>
                Arsip Kepengurusan Demisioner
              </h2>
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                Dokumentasi sejarah susunan pimpinan &amp; pengurus PIK-R MANSEKU dari periode sebelumnya.
              </p>

              <div className={styles.accordionList}>
                {archiveYears.map((yearKey) => {
                  const isOpen = expandedYear === yearKey;
                  const members = archivesGrouped[yearKey] || [];

                  return (
                    <div key={yearKey} className={styles.accordionItem}>
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => toggleYear(yearKey)}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <Archive size={16} /> Kepengurusan Periode {yearKey} ({members.length} Pengurus)
                        </span>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {isOpen && (
                        <div className={styles.accordionContent}>
                          <div className={styles.archiveGrid}>
                            {members.map((m) => (
                              <div key={m.id} className={styles.archiveMemberCard}>
                                <div className={styles.archiveMemberAvatar}>
                                  <PhotoAvatar
                                    src={m.photoPath ? getUploadUrl(m.photoPath) : ''}
                                    name={m.name}
                                    size={44}
                                  />
                                </div>
                                <div>
                                  <h5>{m.name}</h5>
                                  <p>{m.jabatan}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* 5. CTA Ajakan Bergabung */}
      <ScrollReveal>
        <section className={styles.cta}>
          <div className={`container ${styles.ctaInner}`}>
            <h2>Ingin Menjadi Bagian Dari Kami?</h2>
            <p>Daftarkan dirimu sekarang untuk bergabung sebagai konselor sebaya PIK-R MANSEKU generasi selanjutnya.</p>
            <a href="/daftar" className="btn btn-primary btn-lg">Daftar Sekarang</a>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}

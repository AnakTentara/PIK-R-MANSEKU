import { useState, useEffect } from 'react';
import { getPublicOrg, getPublicMembers } from '@/api/public';
import SEO from '@/components/common/SEO';
import { getUploadUrl } from '@/api/axios';
import styles from './AnggotaPublikPage.module.css';

export default function AnggotaPublikPage() {
  const [orgData, setOrgData] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDivisionStaff = (leaderJabatan) => {
    if (!leaderJabatan) return [];
    const normalizedLeader = leaderJabatan.replace(/^(Ketua|Koordinator Bidang)\s+/i, '').trim().toLowerCase();
    
    return orgData.filter(m => {
      const jab = (m.jabatan || '').toLowerCase();
      return m.role === 'ANGGOTA' && jab.includes('anggota') && jab.includes(normalizedLeader);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, memRes] = await Promise.all([getPublicOrg(), getPublicMembers()]);
        setOrgData(orgRes.data || []);
        setMembers(memRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter active leadership
  const pembina = orgData.find(m => m.role === 'PEMBINA' || m.jabatan === 'Pembina');
  const ketua = orgData.find(m => m.jabatan === 'Ketua Umum');
  const wakil = orgData.find(m => m.jabatan === 'Wakil Ketua Umum');
  
  // Level 3: Sekretaris & Bendahara (Pengurus Harian Inti / Pengurus Umum)
  const sekretaris = orgData.find(m => m.jabatan === 'Sekretaris Umum');
  const bendahara = orgData.find(m => m.jabatan === 'Bendahara Umum');

  // Level 4: Ketua Divisi (selain Sekrum & Bendum)
  const ketuaDivisiList = orgData.filter(m => 
    m.role === 'KABINET' && 
    m.jabatan !== 'Sekretaris Umum' && 
    m.jabatan !== 'Bendahara Umum'
  );

  const getMemberJabatan = (memberName) => {
    const found = orgData.find(o => o.name === memberName);
    return found ? found.jabatan : 'Anggota Biasa';
  };

  return (
    <div className="page-wrapper">
      <SEO 
        title="Daftar Anggota & Pengurus" 
        description="Bagan organisasi, jajaran pengurus aktif (BPH), pembina, serta daftar lengkap anggota aktif PIK-R MANSEKU MAN 1 Muara Enim." 
      />
      {/* Header */}
      <section className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Anggota PIK-R MANSEKU</h1>
          <p className={styles.subtitle}>
            Struktur kepengurusan aktif dan seluruh anggota resmi PIK-R MAN 1 Muara Enim.
          </p>
          <span className={styles.countBadge}>{members.length} Anggota Aktif</span>
        </div>
      </section>

      {/* 2. Org Tree (Pengurus) */}
      <section className={`section ${styles.treeSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Bagan Kepengurusan Tahun Ini</h2>
          
          {loading ? (
            <div className="spinner" style={{ margin: '40px auto' }} />
          ) : (
            <div className={styles.treeContainer}>
              {/* Level 1: Pembina */}
              {pembina && (
                <div className={styles.treeLevel}>
                  <div className={`${styles.treeNode} ${styles.nodePembina}`}>
                    <div className={styles.nodeAvatar}>
                      {(pembina.effectivePhoto || pembina.photoPath) ? (
                        <img src={getUploadUrl(pembina.effectivePhoto || pembina.photoPath)} alt={pembina.name} />
                      ) : (
                        <div className={styles.initials}>{pembina.name[0]}</div>
                      )}
                    </div>
                    <h5>{pembina.name}</h5>
                    <p>{pembina.jabatan}</p>
                  </div>
                </div>
              )}

              {/* Vertical Line Connector */}
              {(pembina && (ketua || wakil)) && <div className={styles.connectorLine} />}

              {/* Level 2: Ketua & Wakil */}
              {(ketua || wakil) && (
                <div className={styles.treeLevelRow}>
                  {ketua && (
                    <div className={`${styles.treeNode} ${styles.nodeKetua}`}>
                      <div className={styles.nodeAvatar}>
                        {(ketua.effectivePhoto || ketua.photoPath) ? (
                          <img src={getUploadUrl(ketua.effectivePhoto || ketua.photoPath)} alt={ketua.name} />
                        ) : (
                          <div className={styles.initials}>{ketua.name[0]}</div>
                        )}
                      </div>
                      <h5>{ketua.name}</h5>
                      <p>{ketua.jabatan}</p>
                    </div>
                  )}

                  {wakil && (
                    <div className={`${styles.treeNode} ${styles.nodeWakil}`}>
                      <div className={styles.nodeAvatar}>
                        {(wakil.effectivePhoto || wakil.photoPath) ? (
                          <img src={getUploadUrl(wakil.effectivePhoto || wakil.photoPath)} alt={wakil.name} />
                        ) : (
                          <div className={styles.initials}>{wakil.name[0]}</div>
                        )}
                      </div>
                      <h5>{wakil.name}</h5>
                      <p>{wakil.jabatan}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Line Connector to Pengurus Umum */}
              {(sekretaris || bendahara) && <div className={styles.connectorLine} />}

              {/* Level 3: Pengurus Umum (Sekretaris & Bendahara) */}
              {(sekretaris || bendahara) && (
                <div className={styles.treeLevelRow}>
                  {sekretaris && (
                    <div className={`${styles.treeNode} ${styles.nodeKabinet}`}>
                      <div className={styles.nodeAvatarSmall}>
                        {(sekretaris.effectivePhoto || sekretaris.photoPath) ? (
                          <img src={getUploadUrl(sekretaris.effectivePhoto || sekretaris.photoPath)} alt={sekretaris.name} />
                        ) : (
                          <div className={styles.initialsSmall}>{sekretaris.name[0]}</div>
                        )}
                      </div>
                      <h6>{sekretaris.name}</h6>
                      <p>{sekretaris.jabatan}</p>
                    </div>
                  )}

                  {bendahara && (
                    <div className={`${styles.treeNode} ${styles.nodeKabinet}`}>
                      <div className={styles.nodeAvatarSmall}>
                        {(bendahara.effectivePhoto || bendahara.photoPath) ? (
                          <img src={getUploadUrl(bendahara.effectivePhoto || bendahara.photoPath)} alt={bendahara.name} />
                        ) : (
                          <div className={styles.initialsSmall}>{bendahara.name[0]}</div>
                        )}
                      </div>
                      <h6>{bendahara.name}</h6>
                      <p>{bendahara.jabatan}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Line Connector to Ketua Divisi */}
              {ketuaDivisiList.length > 0 && <div className={styles.connectorLine} />}

              {/* Level 4: Ketua Divisi & Level 5: Anggota Divisi */}
              {ketuaDivisiList.length > 0 && (
                <div className={styles.kabinetGrid}>
                  {ketuaDivisiList.map(k => {
                    const staff = getDivisionStaff(k.jabatan);
                    const hasStaff = staff.length > 0;

                    return (
                      <div key={k.id} className={styles.kabinetContainer}>
                        <div className={`${styles.treeNode} ${styles.nodeKabinet}`}>
                          <div className={styles.nodeAvatarSmall}>
                            {(k.effectivePhoto || k.photoPath) ? (
                              <img src={getUploadUrl(k.effectivePhoto || k.photoPath)} alt={k.name} />
                            ) : (
                              <div className={styles.initialsSmall}>{k.name[0]}</div>
                            )}
                          </div>
                          <h6>{k.name}</h6>
                          <p>{k.jabatan}</p>
                        </div>

                        {/* Level 5: Staf/Anggota Divisi */}
                        {hasStaff && (
                          <div className={styles.staffDropdown}>
                            <div className={styles.staffList}>
                              {staff.map(s => (
                                <div key={s.id} className={styles.staffNode}>
                                  <div className={styles.staffAvatar}>
                                    {(s.effectivePhoto || s.photoPath) ? (
                                      <img src={getUploadUrl(s.effectivePhoto || s.photoPath)} alt={s.name} />
                                    ) : (
                                      <div className={styles.staffInitials}>{s.name[0]}</div>
                                    )}
                                  </div>
                                  <div className={styles.staffInfo}>
                                    <strong>{s.name}</strong>
                                    <span>{s.jabatan}</span>
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
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Daftar Anggota Aktif */}
      <section className={`section ${styles.membersSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Daftar Anggota Aktif</h2>
          
          {loading ? (
            <div className={styles.membersGridSkeleton}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className={`${styles.memberCard} skeleton`} style={{ height: 100 }} />
              ))}
            </div>
          ) : (() => {
            const ordinaryMembers = members.filter(m => !orgData.some(o => o.name === m.name && o.isCurrent));
            
            if (ordinaryMembers.length === 0) {
              return <p className={styles.emptyText}>Belum ada anggota aktif biasa terdaftar.</p>;
            }

            return (
              <div className={styles.membersGrid}>
                {ordinaryMembers.map(m => {
                  const jabatan = getMemberJabatan(m.name);
                  return (
                    <div key={m.id} className={styles.memberCard}>
                      <div className={styles.memberAvatar}>
                        {m.photoPath ? (
                          <img src={getUploadUrl(m.photoPath)} alt={m.name} className={styles.memberAvatarImg} />
                        ) : (
                          <div className={styles.avatarInitials}>
                            {m.name[0]}
                          </div>
                        )}
                      </div>
                      <div className={styles.memberInfo}>
                        <h4>{m.name}</h4>
                        <p>Kelas {m.className} • <span className={styles.memberJabatan}>{jabatan}</span></p>
                        <span className={styles.joinYear}>Angkatan {m.joinYear}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}

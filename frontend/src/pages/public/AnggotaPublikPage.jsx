import { useState, useEffect } from 'react';
import { getPublicOrg, getPublicMembers } from '@/api/public';
import styles from './AnggotaPublikPage.module.css';

export default function AnggotaPublikPage() {
  const [orgData, setOrgData] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Filter current active leadership
  const pembina = orgData.find(m => m.role === 'PEMBINA' && m.isCurrent);
  const ketua = orgData.find(m => m.role === 'KETUA' && m.isCurrent);
  const wakil = orgData.find(m => m.role === 'WAKIL' && m.isCurrent);
  const kabinet = orgData.filter(m => m.role === 'KABINET' && m.isCurrent);

  return (
    <div className="page-wrapper">
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
                      {pembina.photoPath ? (
                        <img src={`http://localhost:25552${pembina.photoPath}`} alt={pembina.name} />
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
                        {ketua.photoPath ? (
                          <img src={`http://localhost:25552${ketua.photoPath}`} alt={ketua.name} />
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
                        {wakil.photoPath ? (
                          <img src={`http://localhost:25552${wakil.photoPath}`} alt={wakil.name} />
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

              {/* Line Connector to Kabinet */}
              {kabinet.length > 0 && <div className={styles.connectorLine} />}

              {/* Level 3: Kabinet */}
              {kabinet.length > 0 && (
                <div className={styles.kabinetGrid}>
                  {kabinet.map(k => (
                    <div key={k.id} className={`${styles.treeNode} ${styles.nodeKabinet}`}>
                      <div className={styles.nodeAvatarSmall}>
                        {k.photoPath ? (
                          <img src={`http://localhost:25552${k.photoPath}`} alt={k.name} />
                        ) : (
                          <div className={styles.initialsSmall}>{k.name[0]}</div>
                        )}
                      </div>
                      <h6>{k.name}</h6>
                      <p>{k.jabatan}</p>
                    </div>
                  ))}
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
          ) : members.length === 0 ? (
            <p className={styles.emptyText}>Belum ada anggota aktif terdaftar.</p>
          ) : (
            <div className={styles.membersGrid}>
              {members.map(m => (
                <div key={m.id} className={styles.memberCard}>
                  <div className={styles.memberAvatar}>
                    <div className={styles.avatarInitials}>
                      {m.name[0]}
                    </div>
                  </div>
                  <div className={styles.memberInfo}>
                    <h4>{m.name}</h4>
                    <p>Kelas {m.className}</p>
                    <span className={styles.joinYear}>Angkatan {m.joinYear}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

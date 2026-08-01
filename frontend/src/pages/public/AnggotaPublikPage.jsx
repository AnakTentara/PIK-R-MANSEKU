import { useState, useEffect } from 'react';
import { getPublicOrg, getPublicMembers } from '@/api/public';
import SEO from '@/components/common/SEO';
import { getUploadUrl } from '@/api/axios';
import { ChevronDown } from 'lucide-react';
import styles from './AnggotaPublikPage.module.css';

// Utility helper to format names: Title Case, space after dot (e.g. M. Vanholen, Haikal Mabrur)
const formatName = (name) => {
  if (!name) return '';
  // Insert space after dot if followed by a letter (e.g. M.VANHOLEN -> M. VANHOLEN)
  let formatted = String(name).replace(/\.([a-zA-Z])/g, '. $1');
  // Separate camelCase if any (e.g. DedeAnugrah -> Dede Anugrah)
  formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  return formatted
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word
        .split('-')
        .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
        .join('-');
    })
    .join(' ');
};

// Normalize name string for case-insensitive and punctuation-agnostic comparison
const normalizeName = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

// Robust check whether a member is already part of the organizational tree structure
const isMemberInOrgTree = (member, orgList) => {
  const normMemName = normalizeName(member.name);
  if (!normMemName) return false;

  return orgList.some(o => {
    // Check ID link first if present
    if (o.memberId && member.id && o.memberId === member.id) return true;
    if (o.member?.id && member.id && o.member.id === member.id) return true;

    // Check normalized name matching
    const normOrgName = normalizeName(o.name || o.member?.name);
    if (!normOrgName) return false;

    return normOrgName === normMemName || 
           normOrgName.includes(normMemName) || 
           normMemName.includes(normOrgName);
  });
};

export default function AnggotaPublikPage() {
  const [orgData, setOrgData] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDivisions, setExpandedDivisions] = useState({});

  const toggleDivision = (divId) => {
    setExpandedDivisions(prev => ({
      ...prev,
      [divId]: !prev[divId]
    }));
  };

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

  // Sort division list ascending by number of staff members (least to most)
  const sortedKetuaDivisiList = [...ketuaDivisiList].sort((a, b) => {
    const countA = getDivisionStaff(a.jabatan).length;
    const countB = getDivisionStaff(b.jabatan).length;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.name.localeCompare(b.name);
  });

  // Chunk sortedKetuaDivisiList into rows of 4 cards max for clean multi-row tree connectors
  const divisionRows = [];
  const cardsPerRow = 4;
  for (let i = 0; i < sortedKetuaDivisiList.length; i += cardsPerRow) {
    divisionRows.push(sortedKetuaDivisiList.slice(i, i + cardsPerRow));
  }

  const getMemberJabatan = (memberName) => {
    const normName = normalizeName(memberName);
    const found = orgData.find(o => normalizeName(o.name) === normName);
    return found ? found.jabatan : 'Anggota Aktif';
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
                    <h5>{formatName(pembina.name)}</h5>
                    <p>{pembina.jabatan}</p>
                  </div>
                </div>
              )}

              {/* Stem from Pembina down */}
              {pembina && (ketua || wakil) && <div className={styles.stemLine} />}

              {/* Branch line above Level 2 */}
              {(ketua && wakil) && <div className={styles.level2BranchLine} />}

              {/* Level 2: Ketua & Wakil */}
              {(ketua || wakil) && (
                <div className={styles.treeLevelRow}>
                  {ketua && (
                    <div className={styles.nodeWithStem}>
                      {(ketua && wakil) && <div className={styles.stemTop} />}
                      <div className={`${styles.treeNode} ${styles.nodeKetua}`}>
                        <div className={styles.nodeAvatar}>
                          {(ketua.effectivePhoto || ketua.photoPath) ? (
                            <img src={getUploadUrl(ketua.effectivePhoto || ketua.photoPath)} alt={ketua.name} />
                          ) : (
                            <div className={styles.initials}>{ketua.name[0]}</div>
                          )}
                        </div>
                        <h5>{formatName(ketua.name)}</h5>
                        <p>{ketua.jabatan}</p>
                      </div>
                    </div>
                  )}

                  {wakil && (
                    <div className={styles.nodeWithStem}>
                      {(ketua && wakil) && <div className={styles.stemTop} />}
                      <div className={`${styles.treeNode} ${styles.nodeWakil}`}>
                        <div className={styles.nodeAvatar}>
                          {(wakil.effectivePhoto || wakil.photoPath) ? (
                            <img src={getUploadUrl(wakil.effectivePhoto || wakil.photoPath)} alt={wakil.name} />
                          ) : (
                            <div className={styles.initials}>{wakil.name[0]}</div>
                          )}
                        </div>
                        <h5>{formatName(wakil.name)}</h5>
                        <p>{wakil.jabatan}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Join Branch from Level 2 to Level 3 */}
              {(ketua || wakil) && (sekretaris || bendahara) && (
                <div className={styles.level2BottomJoin}>
                  {(ketua && wakil) && <div className={styles.level2JoinBranch} />}
                  <div className={styles.stemLine} />
                  {(sekretaris && bendahara) && <div className={styles.level3BranchLine} />}
                </div>
              )}

              {/* Level 3: Pengurus Umum (Sekretaris & Bendahara) */}
              {(sekretaris || bendahara) && (
                <div className={styles.treeLevelRow}>
                  {sekretaris && (
                    <div className={styles.nodeWithStem}>
                      {(sekretaris && bendahara) && <div className={styles.stemTop} />}
                      <div className={`${styles.treeNode} ${styles.nodeKabinet}`}>
                        <div className={styles.nodeAvatarSmall}>
                          {(sekretaris.effectivePhoto || sekretaris.photoPath) ? (
                            <img src={getUploadUrl(sekretaris.effectivePhoto || sekretaris.photoPath)} alt={sekretaris.name} />
                          ) : (
                            <div className={styles.initialsSmall}>{sekretaris.name[0]}</div>
                          )}
                        </div>
                        <h6>{formatName(sekretaris.name)}</h6>
                        <p>{sekretaris.jabatan}</p>
                      </div>
                    </div>
                  )}

                  {bendahara && (
                    <div className={styles.nodeWithStem}>
                      {(bendahara && sekretaris) && <div className={styles.stemTop} />}
                      <div className={`${styles.treeNode} ${styles.nodeKabinet}`}>
                        <div className={styles.nodeAvatarSmall}>
                          {(bendahara.effectivePhoto || bendahara.photoPath) ? (
                            <img src={getUploadUrl(bendahara.effectivePhoto || bendahara.photoPath)} alt={bendahara.name} />
                          ) : (
                            <div className={styles.initialsSmall}>{bendahara.name[0]}</div>
                          )}
                        </div>
                        <h6>{formatName(bendahara.name)}</h6>
                        <p>{bendahara.jabatan}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Join Branch from Level 3 to Division Section */}
              {(sekretaris || bendahara) && sortedKetuaDivisiList.length > 0 && (
                <div className={styles.level3BottomJoin}>
                  {(sekretaris && bendahara) && <div className={styles.level3JoinBranch} />}
                  <div className={styles.stemLine} />
                </div>
              )}

              {/* Level 4: Ketua Divisi & Level 5: Anggota Divisi (Multi-Row Connected Tree) */}
              {divisionRows.length > 0 && (
                <div className={styles.divisionTreeContainer}>
                  {divisionRows.map((rowItems, rowIndex) => {
                    const count = rowItems.length;
                    const offsetPercent = count > 1 ? `${(100 / (count * 2)).toFixed(2)}%` : '50%';

                    return (
                      <div key={rowIndex} className={styles.divisionRowBlock}>
                        {/* Central Trunk line from previous row */}
                        {rowIndex > 0 && <div className={styles.interRowTrunk} />}

                        {/* Horizontal Branch Line for this specific row */}
                        {count > 1 && (
                          <div 
                            className={styles.rowBranchLine} 
                            style={{ left: offsetPercent, right: offsetPercent }} 
                          />
                        )}

                        {/* Grid of Division Cards for this row */}
                        <div className={styles.kabinetRowGrid}>
                          {rowItems.map(k => {
                            const staff = getDivisionStaff(k.jabatan);
                            const hasStaff = staff.length > 0;
                            const isExpanded = !!expandedDivisions[k.id];

                            return (
                              <div key={k.id} className={styles.kabinetContainer}>
                                {/* Card Ketua Divisi */}
                                <div className={styles.divisionCardWrapper}>
                                  <div className={`${styles.treeNode} ${styles.nodeKabinetCard}`}>
                                    <div className={styles.nodeAvatarSmall}>
                                      {(k.effectivePhoto || k.photoPath) ? (
                                        <img src={getUploadUrl(k.effectivePhoto || k.photoPath)} alt={k.name} />
                                      ) : (
                                        <div className={styles.initialsSmall}>{k.name[0]}</div>
                                      )}
                                    </div>
                                    <h6>{formatName(k.name)}</h6>
                                    <p>{k.jabatan}</p>
                                  </div>

                                  {/* Orange Toggle Button */}
                                  {hasStaff ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleDivision(k.id)}
                                      className={`${styles.toggleStaffBtn} ${isExpanded ? styles.toggleStaffBtnActive : ''}`}
                                      aria-expanded={isExpanded}
                                      title={isExpanded ? 'Sembunyikan anggota' : 'Tampilkan anggota'}
                                    >
                                      <span>{isExpanded ? 'Sembunyikan' : `Lihat (${staff.length}) Anggota`}</span>
                                      <ChevronDown 
                                        size={16} 
                                        className={`${styles.toggleIcon} ${isExpanded ? styles.toggleIconRotated : ''}`} 
                                      />
                                    </button>
                                  ) : (
                                    <div className={styles.noStaffBadge}>
                                      <span>Tidak ada anggota</span>
                                    </div>
                                  )}
                                </div>

                                {/* Level 5: Staf/Anggota Divisi */}
                                {hasStaff && (
                                  <div className={`${styles.staffCollapsible} ${isExpanded ? styles.staffCollapsibleExpanded : ''}`}>
                                    <div className={styles.staffCollapsibleInner}>
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
                                                <strong>{formatName(s.name)}</strong>
                                                <span>{s.jabatan}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Daftar Anggota Aktif (Hanya anggota biasa yang tidak ada di struktur organisasi) */}
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
            // Filter out members who are already present anywhere in the organizational tree above
            const ordinaryMembers = members.filter(m => !isMemberInOrgTree(m, orgData));
            
            if (ordinaryMembers.length === 0) {
              return <p className={styles.emptyText}>Semua anggota aktif telah terdaftar dalam struktur organisasi di atas.</p>;
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
                        <h4>{formatName(m.name)}</h4>
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




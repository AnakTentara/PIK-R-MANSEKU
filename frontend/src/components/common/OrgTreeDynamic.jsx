import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import { getUploadUrl } from '@/api/axios';
import styles from './OrgTreeDynamic.module.css';

/**
 * Bagan kepengurusan dinamis: mengikuti hierarki yang diatur admin (baris = level, kiri-kanan = urutan).
 * Dipakai bila hierarki sudah diubah; bila masih bawaan, halaman memakai bagan klasik.
 *
 * catalog : [{ label, role, level, order, parent? }]
 * people  : OrgMember aktif ({ id, name, jabatan, role, effectivePhoto/photoPath })
 */
const toneOf = (role) => ({ PEMBINA: 'pembina', KETUA: 'ketua', WAKIL: 'wakil', KABINET: 'kabinet', ANGGOTA: 'anggota' }[role] || 'kabinet');

export default function OrgTreeDynamic({ catalog, people, formatName = (n) => n }) {
  const [open, setOpen] = useState({});
  const tops = catalog.filter((p) => !p.parent);
  const levels = [...new Set(tops.map((p) => p.level))].sort((a, b) => a - b);
  const holdersOf = (label) => people.filter((m) => m.isCurrent !== false && m.jabatan === label);

  const rows = levels
    .map((lv) => ({
      level: lv,
      slots: tops
        .filter((p) => p.level === lv)
        .sort((a, b) => a.order - b.order)
        .flatMap((p) => holdersOf(p.label).map((m) => ({ pos: p, person: m })))
    }))
    .filter((r) => r.slots.length);

  // jabatan aktif yang tidak ada di katalog (data lama) tetap ditampilkan di baris terakhir
  const known = new Set(catalog.map((p) => p.label));
  const stray = people.filter((m) => m.isCurrent !== false && !known.has(m.jabatan));

  if (!rows.length && !stray.length) return <p className={styles.empty}>Belum ada pengurus aktif.</p>;

  return (
    <div className={styles.tree}>
      {rows.map((r, i) => (
        <div key={r.level} className={styles.levelWrap}>
          {i > 0 && <div className={styles.trunk} aria-hidden="true" />}
          <div className={styles.row}>
            {r.slots.map(({ pos, person }) => {
              const kids = catalog.filter((c) => c.parent === pos.label).flatMap((c) => holdersOf(c.label));
              const key = `${pos.label}-${person.id}`;
              const expanded = !!open[key];
              return (
                <div key={key} className={styles.cell}>
                  <div className={`${styles.node} ${styles[toneOf(pos.role)]}`}>
                    <PhotoAvatar src={person.effectivePhoto || person.photoPath ? getUploadUrl(person.effectivePhoto || person.photoPath) : ''}
                      name={person.name} className={styles.avatar} placeholderClassName={`${styles.avatar} ${styles.initials}`} />
                    <b className={styles.name}>{formatName(person.name)}</b>
                    <span className={styles.role}>{pos.label}</span>
                  </div>
                  {kids.length > 0 && (
                    <>
                      <button type="button" className={styles.toggle} aria-expanded={expanded} onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}>
                        {expanded ? 'Sembunyikan' : `Lihat (${kids.length}) Anggota`}
                        <ChevronDown size={14} className={expanded ? styles.rot : ''} />
                      </button>
                      {expanded && (
                        <ul className={styles.kids}>
                          {kids.map((k) => (
                            <li key={k.id}>
                              <PhotoAvatar src={k.effectivePhoto || k.photoPath ? getUploadUrl(k.effectivePhoto || k.photoPath) : ''}
                                name={k.name} className={styles.kidAvatar} placeholderClassName={`${styles.kidAvatar} ${styles.initials}`} />
                              <span><strong>{formatName(k.name)}</strong><em>{k.jabatan}</em></span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {stray.length > 0 && (
        <div className={styles.levelWrap}>
          <div className={styles.trunk} aria-hidden="true" />
          <div className={styles.row}>
            {stray.map((m) => (
              <div key={m.id} className={styles.cell}>
                <div className={`${styles.node} ${styles.kabinet}`}>
                  <PhotoAvatar src={m.effectivePhoto || m.photoPath ? getUploadUrl(m.effectivePhoto || m.photoPath) : ''} name={m.name} className={styles.avatar} placeholderClassName={`${styles.avatar} ${styles.initials}`} />
                  <b className={styles.name}>{formatName(m.name)}</b>
                  <span className={styles.role}>{m.jabatan}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

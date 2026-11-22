import { useState } from 'react';
import {
  GraduationCap, School, CalendarDays, User, Quote, BadgeCheck, Share2, Check,
  Star, Heart, BookOpen, Music, Camera, Trophy, Code2, Gamepad2, Dumbbell, Utensils, Plane, MessageSquareQuote
} from 'lucide-react';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import { getUploadUrl } from '@/api/axios';
import styles from './BioCard.module.css';

const ICONS = {
  star: Star, heart: Heart, book: BookOpen, music: Music, camera: Camera, trophy: Trophy,
  code: Code2, game: Gamepad2, sport: Dumbbell, food: Utensils, travel: Plane, quote: MessageSquareQuote
};

/**
 * Kartu biodata anggota. Dipakai di /@slug (publik), pratinjau halaman Desain admin, dan editor kartu anggota.
 *
 * profile : { name, className, gender, asalSekolah, joinYear, memberCode, jabatan, bio, status, isAlumni, alumniLabel, photoPath }
 * card    : kustomisasi anggota { cover, coverPhoto, cardPhoto, accent, hidden[], info[] }
 * design  : desain kartu situs { style, cover, defaultThumb, showMemberCode, hidden[] }
 * preview : true -> tombol bagikan nonaktif, tidak ada tautan keluar
 */
export default function BioCard({ profile: d, card = {}, design = {}, preview = false, onShare, copied = false }) {
  const [failed, setFailed] = useState({});
  const style = design.style || 'portofolio';
  const hidden = new Set([...(design.hidden || []), ...(card.hidden || [])]);
  const coverKind = card.cover || design.cover || 'gradasi';
  const accent = card.accent || null;

  // Foto: foto khusus kartu > foto profil > foto bawaan situs > inisial
  const photoSrc = [card.cardPhoto, d.photoPath, design.defaultThumb]
    .filter(Boolean).map(getUploadUrl).find((u) => !failed[u]) || '';
  const coverPhoto = coverKind === 'foto' && card.coverPhoto && !failed[card.coverPhoto] ? getUploadUrl(card.coverPhoto) : null;

  const isAlumni = d.isAlumni || d.status === 'ALUMNI';
  const facts = [
    { key: 'kelas', icon: GraduationCap, label: 'Kelas', value: d.className },
    { key: 'gender', icon: User, label: 'Jenis Kelamin', value: d.gender },
    { key: 'asalSekolah', icon: School, label: 'Asal Sekolah', value: d.asalSekolah },
    { key: 'angkatan', icon: CalendarDays, label: 'Bergabung', value: d.joinYear ? `Angkatan ${d.joinYear}` : null },
    { key: 'idAnggota', icon: BadgeCheck, label: 'ID Anggota', value: design.showMemberCode === false ? null : d.memberCode, mono: true }
  ].filter((f) => f.value && !hidden.has(f.key));

  const info = (card.info || []).filter((i) => i.label && i.value);

  return (
    <article className={`${styles.frame} ${styles['style_' + style]}`} style={accent ? { '--card-accent': accent } : undefined}>
      <header className={`${styles.cover} ${styles['cover_' + coverKind]}`} style={coverPhoto ? { backgroundImage: `url("${coverPhoto}")` } : undefined}>
        {!coverPhoto && <div className={styles.coverArt} aria-hidden="true" />}
        <span className={styles.org}>PIK-R MANSEKU<span className={styles.orgSchool}> · MAN 1 Muara Enim</span></span>
        {!preview && (
          <button type="button" className={styles.share} onClick={onShare} aria-label="Bagikan profil">
            {copied ? <Check size={18} /> : <Share2 size={18} />}
          </button>
        )}
      </header>

      <div className={styles.identity}>
        <div className={styles.photoRing}>
          {photoSrc ? (
            <img className={styles.photo} src={photoSrc} alt={`Foto ${d.name}`} onError={() => setFailed((f) => ({ ...f, [photoSrc.replace(/^.*\/uploads/, '/uploads')]: true, [photoSrc]: true }))} />
          ) : (
            <PhotoAvatar src="" name={d.name} className={styles.photo} placeholderClassName={`${styles.photo} ${styles.initials}`} />
          )}
        </div>
        <h1 className={styles.name}>{d.name}</h1>
        <span className={`${styles.role} ${isAlumni ? (d.alumniLabel ? styles.roleAlumni : styles.roleAlumniPlain) : ''}`}>{d.jabatan}</span>
      </div>

      {!hidden.has('bio') && (
        <section className={styles.section}>
          <p className={styles.sectionTitle} role="heading" aria-level="2">Tentang Saya</p>
          {d.bio ? (
            <blockquote className={styles.bio}>
              <Quote size={22} className={styles.quoteIcon} aria-hidden="true" />
              <p>{d.bio}</p>
            </blockquote>
          ) : (
            <p className={styles.bioEmpty}>Belum menulis bio. Bio bisa diisi dari halaman Profil setelah login.</p>
          )}
        </section>
      )}

      {facts.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionTitle} role="heading" aria-level="2">Biodata</p>
          <dl className={styles.facts}>
            {facts.map(({ icon: Icon, label, value, mono, key }) => (
              <div key={key} className={styles.fact}>
                <span className={styles.factIcon}><Icon size={18} /></span>
                <dt>{label}</dt>
                <dd className={mono ? styles.mono : undefined}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {info.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionTitle} role="heading" aria-level="2">Lebih Lanjut</p>
          <div className={styles.infoGrid}>
            {info.map((i, n) => {
              const Icon = ICONS[i.icon] || Star;
              return (
                <div key={n} className={styles.infoCard}>
                  <span className={styles.infoIcon}><Icon size={18} /></span>
                  <div><span>{i.label}</span><b>{i.value}</b></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <span>Pusat Informasi &amp; Konseling Remaja</span>
        <em>Beriman · Bertanggung Jawab · Berencana</em>
        {!preview && <a href="/anggota" className={styles.link}>Lihat anggota lain →</a>}
      </footer>
    </article>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Home, Loader2, UserX } from 'lucide-react';
import SEO from '@/components/common/SEO';
import BioCard from '@/components/common/BioCard';
import { getMemberProfile } from '@/api/public';
import { getUploadUrl } from '@/api/axios';
import styles from './MemberProfilePage.module.css';

/**
 * Biodata publik anggota: /@slug (tujuan QR di belakang ID Card).
 * Tampilan diatur dari halaman Desain (gaya kartu, sampul, bagian yang disembunyikan)
 * dan dari kartu milik anggota itu sendiri. Data pribadi (NISN, WA, email) tidak pernah dikirim API.
 */
export default function MemberProfilePage() {
  const { handle } = useParams();
  const slug = (handle || '').replace(/^@/, '');
  const [state, setState] = useState({ loading: true, data: null });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setState({ loading: true, data: null });
    getMemberProfile(slug)
      .then((res) => alive && setState({ loading: false, data: res.data }))
      .catch(() => alive && setState({ loading: false, data: null }));
    return () => { alive = false; };
  }, [slug]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: state.data?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch { /* dibatalkan pengguna */ }
  };

  if (state.loading) {
    return <div className={styles.page}><div className={styles.center}><Loader2 className={styles.spin} size={36} /></div></div>;
  }

  const d = state.data;
  if (!d) {
    return (
      <div className={styles.page}>
        <SEO title="Profil tidak ditemukan" description="Tautan ID Card ini tidak terdaftar." />
        <div className={`${styles.frame} ${styles.notFound}`}>
          <UserX size={48} />
          <h1>Profil tidak ditemukan</h1>
          <p>Tautan ID Card ini tidak terdaftar atau sudah tidak berlaku.</p>
          <Link to="/" className="btn btn-primary"><Home size={16} /> Ke Beranda</Link>
        </div>
      </div>
    );
  }

  const photo = d.card?.cardPhoto || d.photoPath;
  return (
    <div className={styles.page}>
      <SEO
        title={`${d.name} — ${d.jabatan} PIK-R MANSEKU`}
        description={d.bio || `${d.name}, ${d.jabatan} PIK-R MAN 1 Muara Enim, kelas ${d.className}.`}
        image={photo ? getUploadUrl(photo) : undefined}
        type="profile"
      />
      <BioCard profile={d} card={d.card} design={d.cardDesign} onShare={share} copied={copied} />
    </div>
  );
}

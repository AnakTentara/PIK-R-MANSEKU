import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Home, Loader2, UserX } from 'lucide-react';
import SEO from '@/components/common/SEO';
import SocialProfile from '@/components/common/SocialProfile';
import { getMemberProfile } from '@/api/public';
import { getUploadUrl } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import styles from './MemberProfilePage.module.css';

/**
 * Profil anggota: /@slug (juga tujuan QR di belakang ID Card).
 * Bergaya media sosial: foto, angka postingan/pengikut/mengikuti, bio, tombol Ikuti, grid postingan.
 * Data pribadi (NISN, WA, email) tidak pernah dikirim API.
 */
export default function MemberProfilePage() {
  const { handle } = useParams();
  const slug = (handle || '').replace(/^@/, '');
  const loggedIn = useAuthStore((s) => s.isCandidateAuthenticated);
  const [state, setState] = useState({ loading: true, data: null });

  // Dimuat ulang saat login/keluar supaya status Ikuti, teman dekat, dll. ikut berganti
  useEffect(() => {
    let alive = true;
    setState((s) => ({ loading: !s.data || s.data.slug !== slug, data: s.data?.slug === slug ? s.data : null }));
    getMemberProfile(slug)
      .then((res) => alive && setState({ loading: false, data: res.data }))
      .catch(() => alive && setState({ loading: false, data: null }));
    return () => { alive = false; };
  }, [slug, loggedIn]);

  if (state.loading) {
    return <div className={styles.page}><div className={styles.center}><Loader2 className={styles.spin} size={36} /></div></div>;
  }

  const d = state.data;
  if (!d) {
    return (
      <div className={styles.page}>
        <SEO title="Profil tidak tersedia" description="Profil ini tidak ditemukan." />
        <div className={`${styles.frame} ${styles.notFound}`}>
          <UserX size={48} />
          <h1>Profil tidak tersedia</h1>
          <p>Tautan ini tidak terdaftar, sudah tidak berlaku, atau akun ini tidak bisa kamu lihat.</p>
          <Link to="/" className="btn btn-primary"><Home size={16} /> Ke Beranda</Link>
        </div>
      </div>
    );
  }

  const photo = d.card?.cardPhoto || d.photoPath;
  return (
    <div className={styles.page}>
      <SEO
        title={`${d.name} (@${d.slug}) — PIK-R MANSEKU`}
        description={d.bio || `${d.name}, ${d.jabatan} PIK-R MAN 1 Muara Enim, kelas ${d.className}.`}
        image={photo ? getUploadUrl(photo) : undefined}
        type="profile"
      />
      <SocialProfile data={d} onChange={(next) => setState({ loading: false, data: next })} />
    </div>
  );
}

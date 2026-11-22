import { useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, HeartHandshake } from 'lucide-react';
import { login, errMsg } from '@/lib/api.js';
import { useSession } from '@/lib/session.js';
import styles from './Login.module.css';

/** Masuk dengan akun anggota PIK-R (NISN + sandi yang sama dengan situs utama). */
export default function Login() {
  const setToken = useSession((s) => s.login);
  const [form, setForm] = useState({ nisn: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await login(form.nisn.trim(), form.password);
      if (r.data.candidate?.status === 'PENDING' || r.data.candidate?.status === 'LULUS' || r.data.candidate?.status === 'TIDAK_LULUS') {
        toast.error('Ruang Cerita khusus anggota PIK-R. Akun pendaftar belum bisa masuk.');
        return;
      }
      setToken(r.data.token);
    } catch (err) {
      setShake(false); requestAnimationFrame(() => setShake(true));
      toast.error(errMsg(err, 'NISN atau sandi salah'));
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.orbs} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.wrap}>
        <section className={styles.hero}>
          <img src="/logo-192.png" alt="Logo PIK-R MANSEKU" width="96" height="96" className={styles.logo} />
          <h1><span>Ruang Cerita</span></h1>
          <p className={styles.tag}>Ruang berbagi cerita & konseling sebaya anggota PIK-R MAN 1 Muara Enim.</p>
          <ul className={styles.points}>
            <li><Lock size={17} /> Khusus anggota PIK-R, bisa dijadikan privat kapan saja</li>
            <li><HeartHandshake size={17} /> Bilik Konseling sebaya, boleh anonim</li>
            <li><ShieldCheck size={17} /> Dijaga pengurus PIK-R, ada tombol lapor</li>
          </ul>
        </section>
        <form className={`${styles.card} ${shake ? styles.shake : ''}`} onSubmit={submit} onAnimationEnd={() => setShake(false)}>
          <h2>Masuk</h2>
          <label className={styles.field}>
            <span>NISN</span>
            <input className="field" inputMode="numeric" autoComplete="username" value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} required autoFocus />
          </label>
          <label className={styles.field}>
            <span>Kata sandi</span>
            <div className={styles.pw}>
              <input className="field" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Sembunyikan sandi' : 'Tampilkan sandi'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? <Loader2 size={18} className="spin" /> : 'Masuk'}</button>
          <p className={styles.help}>Akun sama dengan situs PIK-R. Lupa sandi? Kirim <b>/sandi</b> ke bot WhatsApp PIK-R.</p>
          <a className={styles.back} href="https://pikr-manseku.my.id">← Situs PIK-R MANSEKU</a>
        </form>
      </div>
    </div>
  );
}

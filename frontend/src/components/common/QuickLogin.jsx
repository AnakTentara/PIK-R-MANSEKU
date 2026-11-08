import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { loginCandidate } from '@/api/candidates';
import { useAuthStore } from '@/stores/authStore';
import { useQuickLogin } from '@/stores/quickLoginStore';
import Sheet from './Sheet';
import styles from './QuickLogin.module.css';

/**
 * Popup login cepat (dipasang sekali di App). Setelah berhasil, aksi yang tertunda langsung dijalankan
 * dan halaman yang sedang dilihat tidak berganti.
 */
export default function QuickLogin() {
  const { open, reason, close, done } = useQuickLogin();
  const setCandidateAuth = useAuthStore((s) => s.setCandidateAuth);
  const [form, setForm] = useState({ nisn: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await loginCandidate({ nisn: form.nisn.trim(), password: form.password });
      setCandidateAuth(res.data.token, res.data.candidate);
      toast.success(`Halo, ${res.data.candidate.name.split(' ')[0]}!`);
      setForm({ nisn: '', password: '' });
      done();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal masuk. Periksa koneksi lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title="Masuk dulu, ya">
      <p className={styles.reason}>{reason || 'Masuk dengan akun anggota PIK-R untuk melanjutkan.'}</p>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>
          <span>NISN</span>
          <input data-autofocus className="form-input" inputMode="numeric" autoComplete="username" value={form.nisn}
            onChange={(e) => setForm({ ...form, nisn: e.target.value })} required />
        </label>
        <label className={styles.field}>
          <span>Kata sandi</span>
          <div className={styles.pw}>
            <input className="form-input" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Sembunyikan sandi' : 'Tampilkan sandi'}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={busy}>
          {busy ? <Loader2 size={17} className={styles.spin} /> : <LogIn size={17} />} Masuk
        </button>
      </form>
      <p className={styles.foot}>
        Lupa sandi? Kirim <b>/sandi</b> ke bot WhatsApp PIK-R. Belum anggota? <Link to="/daftar" onClick={close}>Daftar</Link>
      </p>
    </Sheet>
  );
}

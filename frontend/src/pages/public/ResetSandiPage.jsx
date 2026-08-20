import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyResetOtp } from '@/api/candidates';
import SEO from '@/components/common/SEO';
import { KeyRound, ShieldCheck, ArrowLeft, Lock, User, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './ResetSandiPage.module.css';

export default function ResetSandiPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(searchParams.get('nisn') || searchParams.get('wa') || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      return toast.error('NISN atau Nomor WhatsApp wajib diisi.');
    }
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      return toast.error('Masukkan 6 digit kode OTP yang diterima via WhatsApp.');
    }
    if (!newPassword || newPassword.length < 6) {
      return toast.error('Kata sandi baru minimal 6 karakter.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Konfirmasi kata sandi tidak cocok.');
    }

    setLoading(true);
    try {
      const res = await verifyResetOtp({
        identifier: identifier.trim(),
        otpCode: otpCode.trim(),
        newPassword
      });
      toast.success(res.data.message || 'Kata sandi berhasil diperbarui!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mereset kata sandi. Periksa kembali kode OTP Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`page-wrapper ${styles.wrapper}`}>
      <SEO
        title="Reset Kata Sandi"
        description="Formulir verifikasi OTP WhatsApp dan pembuatan kata sandi baru untuk akun anggota PIK-R MANSEKU."
      />
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.iconCircle}>
            <KeyRound size={28} />
          </div>
          <h1 className={styles.title}>Atur Kata Sandi Baru</h1>
          <p className={styles.subtitle}>
            Masukkan NISN/No WA, Kode OTP 6-Digit dari WhatsApp Bot, dan kata sandi baru Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-id">NISN / Nomor WhatsApp *</label>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input
                id="reset-id"
                type="text"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Contoh: 3102603365 atau 08123456789"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-otp">Kode OTP 6-Digit (WhatsApp) *</label>
            <div className={styles.inputWrap}>
              <Hash size={16} className={styles.inputIcon} />
              <input
                id="reset-otp"
                type="text"
                className="form-input"
                style={{ paddingLeft: 38, letterSpacing: '2px', fontWeight: 'bold' }}
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            <span className={styles.fieldTip}>
              Kode OTP dikirimkan saat Anda mengirim <code>/sandi ganti</code> ke WhatsApp Bot.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-pass">Kata Sandi Baru *</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="reset-pass"
                type="password"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm">Konfirmasi Kata Sandi Baru *</label>
            <div className={styles.inputWrap}>
              <ShieldCheck size={16} className={styles.inputIcon} />
              <input
                id="reset-confirm"
                type="password"
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
            {loading && <span className="spinner" />}
            {loading ? 'Memverifikasi...' : 'Simpan Kata Sandi Baru'}
          </button>
        </form>

        <div className={styles.cardFooter}>
          <Link to="/login" className={styles.backLink}>
            <ArrowLeft size={14} /> Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}

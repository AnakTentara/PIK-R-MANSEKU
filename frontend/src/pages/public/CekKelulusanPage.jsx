import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { checkStatus } from '@/api/candidates';
import { Search } from 'lucide-react';
import styles from './CekKelulusanPage.module.css';

const STAGES = { SEARCH: 'search', LOADING: 'loading', RESULT: 'result' };

export default function CekKelulusanPage() {
  const [searchParams] = useSearchParams();
  const [nisn, setNisn] = useState(searchParams.get('nisn') || '');
  const [stage, setStage] = useState(STAGES.SEARCH);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const doCheck = useCallback(async (value) => {
    if (!value.trim()) return;
    setError('');
    setStage(STAGES.LOADING);
    setResult(null);

    // Artificial 2s delay for dramatic SNBP-like reveal
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const res = await checkStatus(value.trim());
      setResult(res.data);
      setStage(STAGES.RESULT);
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ notFound: true });
        setStage(STAGES.RESULT);
      } else {
        setError(err.response?.data?.message || 'Terjadi kesalahan.');
        setStage(STAGES.SEARCH);
      }
    }
  }, []);

  // Auto-fetch if nisn query param is present
  useEffect(() => {
    const paramNisn = searchParams.get('nisn');
    if (paramNisn) {
      setNisn(paramNisn);
      doCheck(paramNisn);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault();
    doCheck(nisn);
  };

  const handleReset = () => {
    setStage(STAGES.SEARCH);
    setResult(null);
    setNisn('');
    setError('');
  };

  // ── Search Stage ──
  if (stage === STAGES.SEARCH) {
    return (
      <div className={`page-wrapper ${styles.searchWrapper}`}>
        <div className={styles.searchCenter}>
          <img
            src="/media/logos/logo_pik-r.png"
            alt="PIK-R MANSEKU"
            className={styles.searchLogo}
          />
          <h1 className={styles.searchTitle}>Pengumuman Kelulusan</h1>
          <p className={styles.searchSub}>
            Masukkan NISN untuk melihat hasil seleksi anggota PIK-R MANSEKU
          </p>

          <form onSubmit={handleSubmit} className={styles.searchForm}>
            <div className={styles.searchInputWrap}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Masukkan NISN..."
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                maxLength={10}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={!nisn.trim()}>
              Cek Hasil
            </button>
          </form>

          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── Loading Stage ──
  if (stage === STAGES.LOADING) {
    return (
      <div className={styles.loadingScreen}>
        <img
          src="/media/logos/logo_pik-r.png"
          alt="Loading..."
          className={styles.loadingLogo}
        />
        <p className={styles.loadingText}>Memuat data...</p>
      </div>
    );
  }

  // ── Result Stage ──
  if (result?.notFound) {
    return (
      <div className={`${styles.resultScreen} ${styles.resultNotFound}`}>
        <div className={styles.resultCard}>
          <h2 className={styles.resultHeading}>NISN Tidak Ditemukan</h2>
          <p className={styles.resultMsg}>
            NISN <strong>{nisn}</strong> tidak ditemukan dalam sistem.
            Pastikan NISN yang dimasukkan sudah benar.
          </p>
          <button onClick={handleReset} className="btn btn-secondary btn-lg">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const status = result?.status || result?.candidate?.status;
  const name = result?.name || result?.candidate?.name || '—';
  const candidateNisn = result?.nisn || result?.candidate?.nisn || nisn;

  if (status === 'LULUS') {
    return (
      <div className={`${styles.resultScreen} ${styles.resultLulus}`}>
        <div className={styles.resultInner}>
          <img
            src="/media/logos/logo_pik-r.png"
            alt="PIK-R"
            className={styles.resultLogo}
          />
          <h1 className={styles.congratsTitle}>SELAMAT!</h1>
          <div className={styles.resultInfo}>
            <p className={styles.resultName}>{name}</p>
            <p className={styles.resultNisn}>NISN: {candidateNisn}</p>
          </div>
          <div className={`${styles.statusBadge} ${styles.badgeLulus}`}>
            DINYATAKAN LULUS
          </div>
          <p className={styles.resultMsg}>
            Anda dinyatakan <strong>LULUS</strong> seleksi sebagai anggota PIK-R MANSEKU.
            Silakan login untuk melihat profil dan informasi selanjutnya.
          </p>
          <Link to="/login" className={`btn btn-lg ${styles.btnWhite}`}>
            Login Anggota →
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'TIDAK_LULUS') {
    return (
      <div className={`${styles.resultScreen} ${styles.resultTidakLulus}`}>
        <div className={styles.resultInner}>
          <img
            src="/media/logos/logo_pik-r.png"
            alt="PIK-R"
            className={styles.resultLogo}
          />
          <h1 className={styles.resultTitle}>Hasil Seleksi</h1>
          <div className={styles.resultInfo}>
            <p className={styles.resultName}>{name}</p>
            <p className={styles.resultNisn}>NISN: {candidateNisn}</p>
          </div>
          <div className={`${styles.statusBadge} ${styles.badgeTidakLulus}`}>
            TIDAK LULUS
          </div>
          <p className={styles.resultMsg}>
            Mohon maaf, Anda belum dinyatakan lulus pada seleksi kali ini.
            Jangan berkecil hati — terus semangat dan coba lagi di kesempatan berikutnya!
          </p>
          <button onClick={handleReset} className={`btn btn-lg ${styles.btnWhite}`}>
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // PENDING
  return (
    <div className={`${styles.resultScreen} ${styles.resultPending}`}>
      <div className={styles.resultInner}>
        <img
          src="/media/logos/logo_pik-r.png"
          alt="PIK-R"
          className={styles.resultLogo}
        />
        <h1 className={styles.resultTitle}>Status Masih Pending</h1>
        <div className={styles.resultInfo}>
          <p className={styles.resultName}>{name}</p>
          <p className={styles.resultNisn}>NISN: {candidateNisn}</p>
        </div>
        <div className={`${styles.statusBadge} ${styles.badgePending}`}>
          MENUNGGU SELEKSI
        </div>
        <p className={styles.resultMsg}>
          Data Anda masih dalam proses seleksi. Silakan cek kembali nanti.
        </p>
        <button onClick={handleReset} className={`btn btn-lg ${styles.btnWhite}`}>
          Cek Ulang
        </button>
      </div>
    </div>
  );
}

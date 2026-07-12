import { useState, useEffect } from 'react';
import { getCandidates, getSettings, saveSettings } from '@/api/admin';
import AdminHeader from '@/components/admin/AdminHeader';
import { ClipboardList, Users, CheckCircle, XCircle, Settings, Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSessionOpen, setIsSessionOpen] = useState(true);
  const [savingContent, setSavingContent] = useState(false);

  // Editor states
  const [aboutText1, setAboutText1] = useState('');
  const [aboutText2, setAboutText2] = useState('');
  const [tahunBerdiri, setTahunBerdiri] = useState('2023');
  const [anggotaAktifAuto, setAnggotaAktifAuto] = useState(true);
  const [anggotaAktifManual, setAnggotaAktifManual] = useState('50+');
  const [kegiatan, setKegiatan] = useState('10+ Program');
  const [visi, setVisi] = useState('');
  const [misi, setMisi] = useState([]); // Array of strings now

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Settings for session and content
      const settingsRes = await getSettings();
      const settingsList = settingsRes.data?.settings || [];
      
      const sessionSetting = settingsList.find((s) => s.key === 'REGISTRATION_SESSION');
      if (sessionSetting?.value) {
        setIsSessionOpen(JSON.parse(sessionSetting.value).status === 'open');
      } else {
        setIsSessionOpen(true);
      }

      const contentSetting = settingsList.find((s) => s.key === 'LANDING_PAGE_CONTENT');
      if (contentSetting?.value) {
        const c = JSON.parse(contentSetting.value);
        setAboutText1(c.aboutText1 || '');
        setAboutText2(c.aboutText2 || '');
        setTahunBerdiri(c.tahunBerdiri || '2023');
        setAnggotaAktifAuto(c.anggotaAktifAuto !== false);
        setAnggotaAktifManual(c.anggotaAktifManual || '50+');
        setKegiatan(c.kegiatan || '10+ Program');
        setVisi(c.visi || '');
        setMisi(Array.isArray(c.misi) ? c.misi : []);
      } else {
        // Set defaults
        setAboutText1('PIK-R MANSEKU adalah organisasi Pusat Informasi dan Konseling Remaja yang bernaung di bawah MAN 1 Muara Enim, Kementerian Agama Republik Indonesia. Kami hadir sebagai wadah bagi remaja untuk mendapatkan informasi yang tepat, konseling sebaya yang aman, dan pengembangan diri yang menyeluruh.');
        setAboutText2('Melalui pendekatan yang bersahabat dan berbasis ilmu pengetahuan, PIK-R MANSEKU berkomitmen untuk membentuk generasi muda yang sehat secara fisik, mental, dan sosial — serta siap menjadi pemimpin masa depan.');
        setTahunBerdiri('2023');
        setAnggotaAktifAuto(true);
        setAnggotaAktifManual('50+');
        setKegiatan('10+ Program');
        setVisi('Menjadi wadah pembinaan dan pengembangan diri remaja yang beriman, berkarakter, dan berwawasan luas melalui pendekatan konseling sebaya.');
        setMisi([
          'Memberikan edukasi kesehatan reproduksi dan life skills kepada remaja MAN 1 Muara Enim.',
          'Menyelenggarakan konseling sebaya yang aman, terpercaya, dan bersahabat.',
          'Mengembangkan keterampilan kepemimpinan dan soft skills remaja melalui berbagai kegiatan.',
          'Membangun jejaring kerjasama antar PIK-R se-Sumatera Selatan.'
        ]);
      }

      // 2. Fetch candidates
      const candRes = await getCandidates();
      setCandidates(candRes.data || []);
    } catch {
      toast.error('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleMisiChange = (index, val) => {
    const next = [...misi];
    next[index] = val;
    setMisi(next);
  };

  const handleAddMisi = () => {
    setMisi([...misi, '']);
  };

  const handleRemoveMisi = (index) => {
    setMisi(misi.filter((_, idx) => idx !== index));
  };

  const handleMoveMisi = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === misi.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...misi];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setMisi(next);
  };

  const handleSaveLandingContent = async (e) => {
    e.preventDefault();
    setSavingContent(true);

    // Calculate final anggotaAktif string to show on landing page
    const lulusCount = candidates.filter(c => c.status === 'LULUS').length;
    const finalAnggotaAktif = anggotaAktifAuto 
      ? `${lulusCount} Anggota`
      : anggotaAktifManual;

    // Filter out empty mission statements
    const cleanMisi = misi.map(m => m.trim()).filter(Boolean);

    const newContent = {
      aboutText1,
      aboutText2,
      tahunBerdiri,
      anggotaAktifAuto,
      anggotaAktifManual,
      anggotaAktif: finalAnggotaAktif,
      kegiatan,
      visi,
      misi: cleanMisi,
    };

    try {
      await saveSettings({
        key: 'LANDING_PAGE_CONTENT',
        value: JSON.stringify(newContent),
      });
      setMisi(cleanMisi); // Sync back clean list
      toast.success('Konten landing page berhasil disimpan!');
    } catch {
      toast.error('Gagal menyimpan konten landing page.');
    } finally {
      setSavingContent(false);
    }
  };

  // Calculate statistics
  const totalCalon = candidates.length;
  const totalLulus = candidates.filter((c) => c.status === 'LULUS').length;
  const totalTidakLulus = candidates.filter((c) => c.status === 'TIDAK_LULUS').length;

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Dashboard Utama"
        subtitle="Analisis data organisasi dan konten landing page"
      />

      <div className={styles.body}>
        {/* Statistics Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
              <ClipboardList size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Calon Pendaftar</span>
              <span className={styles.statValue}>{loading ? '...' : totalCalon}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
              <Users size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Anggota PIK-R</span>
              <span className={styles.statValue}>
                {loading ? '...' : !isSessionOpen ? totalLulus : '0 (Sesi Terbuka)'}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreenLight}`}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Peserta Lolos (Sesi Ini)</span>
              <span className={styles.statValue}>{loading ? '...' : totalLulus}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconRed}`}>
              <XCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Peserta Tidak Lolos</span>
              <span className={styles.statValue}>{loading ? '...' : totalTidakLulus}</span>
            </div>
          </div>
        </div>

        {/* Dynamic content editor */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Settings size={20} className={styles.headerIcon} />
            <div>
              <h3>Edit Konten Landing Page</h3>
              <p>Sesuaikan informasi utama yang ditampilkan pada website publik PIK-R MANSEKU</p>
            </div>
          </div>

          <form onSubmit={handleSaveLandingContent} className={styles.editorForm}>
            <div className={styles.formGrid}>
              {/* Left column */}
              <div className={styles.formCol}>
                <h4 className={styles.colTitle}>1. Informasi Tentang Kami</h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="about-text-1">Paragraf 1 (Tentang Kami)</label>
                  <textarea
                    id="about-text-1"
                    rows={4}
                    className="form-textarea"
                    placeholder="Mulai menulis paragraf pertama..."
                    value={aboutText1}
                    onChange={(e) => setAboutText1(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="about-text-2">Paragraf 2 (Komitmen &amp; Visi Remaja)</label>
                  <textarea
                    id="about-text-2"
                    rows={4}
                    className="form-textarea"
                    placeholder="Mulai menulis paragraf kedua..."
                    value={aboutText2}
                    onChange={(e) => setAboutText2(e.target.value)}
                  />
                </div>

                <h4 className={styles.colTitle} style={{ marginTop: '24px' }}>2. Statistik Ringkas (Hero &amp; Tentang)</h4>
                <div className={styles.rowInputs}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="year-built">Tahun Berdiri</label>
                    <input
                      id="year-built"
                      type="text"
                      className="form-input"
                      placeholder="Contoh: 2023"
                      value={tahunBerdiri}
                      onChange={(e) => setTahunBerdiri(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="total-activities">Jumlah Kegiatan</label>
                    <input
                      id="total-activities"
                      type="text"
                      className="form-input"
                      placeholder="Contoh: 10+ Program"
                      value={kegiatan}
                      onChange={(e) => setKegiatan(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.autoStatGroup}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={anggotaAktifAuto}
                        onChange={(e) => setAnggotaAktifAuto(e.target.checked)}
                      />
                      <span>Ambil Jumlah Anggota Aktif Otomatis ({candidates.filter(c => c.status === 'LULUS').length} Anggota)</span>
                    </label>
                  </div>

                  {!anggotaAktifAuto && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="total-members-manual">Jumlah Anggota Aktif (Manual)</label>
                      <input
                        id="total-members-manual"
                        type="text"
                        className="form-input"
                        placeholder="Contoh: 50+ Anggota"
                        value={anggotaAktifManual}
                        onChange={(e) => setAnggotaAktifManual(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className={styles.formCol}>
                <h4 className={styles.colTitle}>3. Visi &amp; Misi Organisasi</h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="visi-text">Visi PIK-R</label>
                  <textarea
                    id="visi-text"
                    rows={3}
                    className="form-textarea"
                    placeholder="Tulis visi organisasi..."
                    value={visi}
                    onChange={(e) => setVisi(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <div className={styles.misiHeaderRow}>
                    <label className="form-label">Misi PIK-R</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddMisi}>
                      <Plus size={14} /> Tambah Butir
                    </button>
                  </div>

                  {misi.length === 0 ? (
                    <p className={styles.emptyMisiText}>Belum ada butir misi. Klik "Tambah Butir" untuk mengisi.</p>
                  ) : (
                    <div className={styles.misiListEditor}>
                      {misi.map((m, idx) => (
                        <div key={idx} className={styles.misiItemRow}>
                          <span className={styles.misiRowIdx}>{idx + 1}.</span>
                          <input
                            type="text"
                            className="form-input"
                            value={m}
                            onChange={(e) => handleMisiChange(idx, e.target.value)}
                            placeholder={`Butir misi ke-${idx + 1}`}
                          />
                          <div className={styles.misiRowActions}>
                            <button
                              type="button"
                              className={styles.misiActionBtn}
                              disabled={idx === 0}
                              onClick={() => handleMoveMisi(idx, 'up')}
                              title="Pindahkan ke atas"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              className={styles.misiActionBtn}
                              disabled={idx === misi.length - 1}
                              onClick={() => handleMoveMisi(idx, 'down')}
                              title="Pindahkan ke bawah"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.misiActionBtn} ${styles.misiActionBtnDanger}`}
                              onClick={() => handleRemoveMisi(idx)}
                              title="Hapus butir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className="btn btn-primary" disabled={savingContent}>
                {savingContent ? <span className="spinner" /> : <Save size={15} />}
                {savingContent ? 'Menyimpan...' : 'Simpan Konten Landing Page'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


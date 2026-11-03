import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { X, Upload, FileSpreadsheet, Download, Loader2, AlertTriangle, CheckCircle2, UserPlus, RefreshCw, Ban } from 'lucide-react';
import { importMembersExcel, downloadMembersTemplate } from '@/api/admin';
import styles from './MemberExcelModal.module.css';

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ACTION = {
  CREATE: { label: 'Baru', icon: UserPlus, cls: 'create' },
  UPDATE: { label: 'Perbarui', icon: RefreshCw, cls: 'update' },
  ERROR: { label: 'Dilewati', icon: Ban, cls: 'error' }
};

/**
 * Impor anggota dari Excel dengan pratinjau: pilih file -> lihat rencana per baris
 * (baru / perbarui / dilewati + alasan) -> konfirmasi. Tidak ada yang tersimpan sebelum dikonfirmasi.
 */
export default function MemberExcelModal({ open, onClose, onDone }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState('archive');
  const [filter, setFilter] = useState('ALL');
  const [done, setDone] = useState(null);

  if (!open) return null;

  const reset = () => { setFile(null); setPreview(null); setDone(null); setFilter('ALL'); };
  const close = () => { reset(); onClose(); };

  const choose = async (f) => {
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) return toast.error('Pakai file .xlsx (Excel)');
    setFile(f); setBusy(true); setDone(null);
    try {
      const res = await importMembersExcel(f, { dryRun: true });
      setPreview(res.data);
      setFilter(res.data.summary.error ? 'ERROR' : 'ALL');
    } catch (err) {
      setPreview(null); setFile(null);
      toast.error(err.response?.data?.message || 'File tidak bisa dibaca');
    } finally { setBusy(false); }
  };

  const apply = async () => {
    setBusy(true);
    try {
      const res = await importMembersExcel(file, { dryRun: false, displaceMode: mode });
      setDone(res.data.result);
      onDone?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengimpor');
    } finally { setBusy(false); }
  };

  const getTemplate = async () => {
    try { saveBlob((await downloadMembersTemplate()).data, 'Templat_Impor_Anggota_PIKR.xlsx'); }
    catch { toast.error('Gagal mengunduh templat'); }
  };

  const s = preview?.summary;
  const rows = (preview?.plan || []).filter((p) => filter === 'ALL' || p.action === filter);
  const replacing = (preview?.plan || []).filter((p) => p.replaces.length);

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && !busy && close()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Impor anggota dari Excel">
        <div className={styles.head}>
          <h3><FileSpreadsheet size={18} /> Impor Anggota dari Excel</h3>
          <button className={styles.close} onClick={close} aria-label="Tutup"><X size={18} /></button>
        </div>

        {done ? (
          <div className={styles.done}>
            <CheckCircle2 size={44} />
            <h4>Impor selesai</h4>
            <p><b>{done.created}</b> anggota baru · <b>{done.updated}</b> diperbarui · <b>{done.skipped}</b> dilewati</p>
            {done.failed.length > 0 && (
              <ul className={styles.failed}>{done.failed.map((f) => <li key={f.line}>Baris {f.line} ({f.name}): {f.message}</li>)}</ul>
            )}
            <button className={styles.primary} onClick={close}>Tutup</button>
          </div>
        ) : !preview ? (
          <div className={styles.body}>
            <div
              className={styles.drop}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); choose(e.dataTransfer.files?.[0]); }}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Loader2 className={styles.spin} size={30} /> : <Upload size={30} />}
              <b>{busy ? 'Membaca file…' : 'Tarik file Excel ke sini, atau klik untuk memilih'}</b>
              <span>Format .xlsx, maksimal 500 baris. Tidak ada yang tersimpan sebelum Anda konfirmasi.</span>
              <input ref={inputRef} type="file" accept=".xlsx" hidden onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
            </div>
            <p className={styles.hint}>
              Belum punya file? <button type="button" className={styles.link} onClick={getTemplate}><Download size={13} /> Unduh templat</button>{' '}
              atau ekspor daftar anggota saat ini, ubah, lalu impor lagi. NISN yang sudah ada akan <b>diperbarui</b>, NISN baru <b>ditambahkan</b>.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.summary}>
              <span className={styles.chipCreate}><UserPlus size={14} /> {s.create} baru</span>
              <span className={styles.chipUpdate}><RefreshCw size={14} /> {s.update} diperbarui</span>
              <span className={styles.chipError}><Ban size={14} /> {s.error} dilewati</span>
              <span className={styles.fileName}>{file?.name}</span>
            </div>

            <div className={styles.tabs}>
              {[['ALL', `Semua (${s.total})`], ['CREATE', `Baru (${s.create})`], ['UPDATE', `Perbarui (${s.update})`], ['ERROR', `Dilewati (${s.error})`]].map(([k, l]) => (
                <button key={k} className={filter === k ? styles.tabOn : ''} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>

            <div className={styles.table}>
              {rows.length === 0 ? <p className={styles.empty}>Tidak ada baris di kategori ini.</p> : rows.map((p) => {
                const A = ACTION[p.action];
                return (
                  <div key={p.line} className={`${styles.row} ${styles['row_' + A.cls]}`}>
                    <span className={styles.line}>#{p.line}</span>
                    <A.icon size={15} className={styles['ic_' + A.cls]} />
                    <div className={styles.cell}>
                      <b>{p.data.name || '(tanpa nama)'}</b>
                      <span>{p.data.className} · {p.data.nisn || '—'}{p.jabatan ? ` · ${p.jabatan}` : ''}{p.existingName && p.existingName !== p.data.name ? ` · sebelumnya "${p.existingName}"` : ''}</span>
                      {p.errors.map((e, i) => <em key={i} className={styles.err}>{e}</em>)}
                      {p.warnings.map((e, i) => <em key={i} className={styles.warn}>{e}</em>)}
                      {p.replaces.length > 0 && <em className={styles.warn}>Menggantikan {p.replaces.join(', ')} di jabatan {p.jabatan}</em>}
                    </div>
                  </div>
                );
              })}
            </div>

            {replacing.length > 0 && (
              <div className={styles.mode}>
                <AlertTriangle size={16} />
                <div>
                  <b>{replacing.length} jabatan akan berganti pemegang.</b> Pejabat lama:
                  <label><input type="radio" checked={mode === 'archive'} onChange={() => setMode('archive')} /> masuk Arsip Kepengurusan</label>
                  <label><input type="radio" checked={mode === 'remove'} onChange={() => setMode('remove')} /> hanya diganti (tanpa arsip)</label>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.ghost} onClick={reset} disabled={busy}>Pilih file lain</button>
              <button className={styles.primary} onClick={apply} disabled={busy || s.create + s.update === 0}>
                {busy ? <Loader2 className={styles.spin} size={16} /> : null} Impor {s.create + s.update} baris
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

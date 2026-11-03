import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Archive } from 'lucide-react';
import PhotoAvatar from '@/components/common/PhotoAvatar';
import { getUploadUrl } from '@/api/axios';
import styles from './ReplaceFlow.module.css';

/**
 * Alur penggantian pejabat (dua popup berurutan):
 *   1) "Yakin mengganti?"       kartu pejabat lama  →  kartu pejabat baru      [Batal] [Ganti]
 *   2) "Arsipkan jabatan lama?" kartu pejabat lama                              [Batal] [Tidak] [Arsipkan]
 * Batal di popup 2 kembali ke popup 1; Batal di popup 1 menutup semuanya.
 *
 * onConfirm('archive' | 'remove')  -> 'archive' = masuk Arsip Kepengurusan, 'remove' = hanya diganti.
 */
function PersonCard({ person, tone }) {
  const photo = person.photoPath ? getUploadUrl(person.photoPath) : '';
  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      <PhotoAvatar src={photo} name={person.name} className={styles.avatar} placeholderClassName={`${styles.avatar} ${styles.initials}`} />
      <b className={styles.name}>{person.name}</b>
      {person.className && <span className={styles.meta}>{person.className}</span>}
      {person.caption && <span className={styles.badge}>{person.caption}</span>}
    </div>
  );
}

export default function ReplaceFlow({ open, jabatan, oldHolders = [], newPerson, onCancel, onConfirm }) {
  const [step, setStep] = useState(1);

  useEffect(() => { if (open) setStep(1); }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && (step === 2 ? setStep(1) : onCancel());
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, onCancel]);

  if (!open) return null;
  const many = oldHolders.length > 1;

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && (step === 2 ? setStep(1) : onCancel())}>
      <div className={styles.dialog} role="alertdialog" aria-modal="true">
        {step === 1 ? (
          <>
            <h3 className={styles.title}>Yakin mengganti pejabat <span>{jabatan}</span>?</h3>
            <p className={styles.sub}>Jabatan ini hanya boleh dipegang satu orang.</p>
            <div className={styles.compare}>
              <div className={styles.side}>
                <span className={styles.label}>Pejabat saat ini</span>
                {oldHolders.map((h) => <PersonCard key={h.memberId || h.name} person={h} tone="old" />)}
              </div>
              <ArrowRight className={styles.arrow} size={28} />
              <div className={styles.side}>
                <span className={styles.label}>Pejabat baru</span>
                <PersonCard person={newPerson} tone="new" />
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={onCancel}>Batal</button>
              <button type="button" className={styles.btnPrimary} onClick={() => setStep(2)}>Ganti</button>
            </div>
          </>
        ) : (
          <>
            <h3 className={styles.title}><Archive size={20} /> Arsipkan jabatan {many ? 'pejabat lama' : 'lama'}?</h3>
            <p className={styles.sub}>
              Jika diarsipkan, jabatan <b>{jabatan}</b> {many ? 'mereka' : 'ini'} tercatat di Arsip Kepengurusan
              (label alumni tim inti tetap muncul). Jika tidak, pejabat lama hanya diganti tanpa catatan arsip.
            </p>
            <div className={styles.single}>
              {oldHolders.map((h) => <PersonCard key={h.memberId || h.name} person={{ ...h, caption: jabatan }} tone="old" />)}
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.btnGhost} onClick={() => setStep(1)}>Batal</button>
              <button type="button" className={styles.btnSoft} onClick={() => onConfirm('remove')}>Tidak</button>
              <button type="button" className={styles.btnPrimary} onClick={() => onConfirm('archive')}>Arsipkan</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

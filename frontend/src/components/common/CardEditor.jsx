import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Save, Upload, Trash2, Plus, ExternalLink, Eye, EyeOff, Lock } from 'lucide-react';
import BioCard from '@/components/common/BioCard';
import { getMyCard, saveMyCard } from '@/api/candidates';
import { getUploadUrl } from '@/api/axios';
import { compressImage } from '@/utils/compressor';
import styles from './CardEditor.module.css';

const SECTION_LABEL = { bio: 'Bio', kelas: 'Kelas', gender: 'Jenis kelamin', asalSekolah: 'Asal sekolah', angkatan: 'Angkatan', idAnggota: 'ID anggota' };
const COVER_LABEL = { gradasi: 'Gradasi', garis: 'Garis', titik: 'Titik', gelombang: 'Gelombang', polos: 'Polos', foto: 'Foto sendiri' };
const ICON_LABEL = { star: 'Bintang', heart: 'Hati', book: 'Buku', music: 'Musik', camera: 'Kamera', trophy: 'Piala', code: 'Kode', game: 'Game', sport: 'Olahraga', food: 'Makanan', travel: 'Perjalanan', quote: 'Kutipan' };
const PALETTE = ['#f97316', '#0ea5e9', '#16a34a', '#8b5cf6', '#e11d48', '#14b8a6', '#d97706', '#475569'];

/**
 * Editor kartu biodata milik anggota yang sedang login: sampul, foto kartu, warna, bagian yang disembunyikan,
 * kartu info tambahan. Bio diambil dari profil (diedit di tab Profil). Pratinjau langsung di sebelah kanan.
 *
 * profile: data profil anggota dari getProfile() (untuk nama, kelas, dst.)
 */
export default function CardEditor({ profile }) {
  const [data, setData] = useState(null);
  const [card, setCard] = useState({ cover: null, accent: null, hidden: [], info: [] });
  const [files, setFiles] = useState({ cardPhoto: null, coverPhoto: null });
  const [resets, setResets] = useState({ cardPhoto: false, coverPhoto: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const cardInput = useRef(null);
  const coverInput = useRef(null);

  useEffect(() => {
    getMyCard()
      .then((r) => { setData(r.data); setCard({ cover: null, accent: null, hidden: [], info: [], ...r.data.card }); })
      .catch((e) => setError(e.response?.data?.message || 'Kartu belum tersedia untuk akun ini'));
  }, []);

  // pratinjau foto lokal sebelum disimpan
  const [local, setLocal] = useState({});
  useEffect(() => () => Object.values(local).forEach((u) => u && URL.revokeObjectURL(u)), [local]);

  if (error) return <div className={styles.note}>{error}</div>;
  if (!data) return <div className={styles.loading}><Loader2 size={24} className={styles.spin} /></div>;

  const locked = !data.allowEdit;
  const set = (p) => setCard((c) => ({ ...c, ...p }));

  const pickFile = async (kind, e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    const small = await compressImage(f).catch(() => f);
    setFiles((x) => ({ ...x, [kind]: small }));
    setResets((x) => ({ ...x, [kind]: false }));
    setLocal((l) => ({ ...l, [kind]: URL.createObjectURL(small) }));
    if (kind === 'coverPhoto') set({ cover: 'foto' });
  };

  const clearPhoto = (kind) => {
    setFiles((x) => ({ ...x, [kind]: null }));
    setResets((x) => ({ ...x, [kind]: true }));
    setLocal((l) => ({ ...l, [kind]: null }));
    set({ [kind]: null, ...(kind === 'coverPhoto' && card.cover === 'foto' ? { cover: null } : {}) });
  };

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('cover', card.cover || '');
      fd.append('accent', card.accent || '');
      fd.append('hidden', JSON.stringify(card.hidden));
      fd.append('info', JSON.stringify(card.info));
      if (files.cardPhoto) fd.append('cardPhoto', files.cardPhoto);
      if (files.coverPhoto) fd.append('coverPhoto', files.coverPhoto);
      if (resets.cardPhoto) fd.append('resetCardPhoto', 'true');
      if (resets.coverPhoto) fd.append('resetCoverPhoto', 'true');
      const res = await saveMyCard(fd);
      setCard(res.data.card);
      setFiles({ cardPhoto: null, coverPhoto: null }); setResets({ cardPhoto: false, coverPhoto: false }); setLocal({});
      toast.success('Kartu disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kartu');
    } finally { setSaving(false); }
  };

  const updInfo = (i, p) => set({ info: card.info.map((x, n) => (n === i ? { ...x, ...p } : x)) });
  const toggleHidden = (k) => set({ hidden: card.hidden.includes(k) ? card.hidden.filter((x) => x !== k) : [...card.hidden, k] });

  // kartu untuk pratinjau (foto lokal menggantikan foto tersimpan)
  const previewCard = {
    ...card,
    cardPhoto: local.cardPhoto || (resets.cardPhoto ? null : card.cardPhoto),
    coverPhoto: local.coverPhoto || (resets.coverPhoto ? null : card.coverPhoto)
  };
  const previewProfile = {
    name: profile?.name || 'Nama Anggota', className: profile?.className, gender: profile?.gender, asalSekolah: profile?.asalSekolah,
    joinYear: profile?.joinYear, memberCode: profile?.memberCode, jabatan: profile?.jabatan || 'Anggota', bio: profile?.bio || data.bio,
    status: profile?.status, photoPath: profile?.photoPath
  };
  const designForPreview = { hidden: data.siteHidden, style: 'portofolio' };
  const covers = data.catalog.covers.map((c) => c.key);

  return (
    <div className={styles.wrap}>
      <div className={styles.form}>
        {locked && <div className={styles.lock}><Lock size={15} /> Admin sedang mengunci pengaturan kartu. Perubahan tidak bisa disimpan.</div>}
        <p className={styles.hint}>Bio diambil dari tab <b>Profil</b>. Ubah di sana, lalu kartu ikut berubah.</p>

        <section>
          <h4>Sampul</h4>
          <div className={styles.chips}>
            {covers.map((c) => (
              <button key={c} type="button" disabled={locked} className={`${styles.chip} ${(card.cover || 'gradasi') === c ? styles.on : ''}`}
                onClick={() => (c === 'foto' ? coverInput.current?.click() : set({ cover: c }))}>{COVER_LABEL[c]}</button>
            ))}
            <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => pickFile('coverPhoto', e)} />
          </div>
          {(card.coverPhoto || local.coverPhoto) && <button type="button" className={styles.link} onClick={() => clearPhoto('coverPhoto')}><Trash2 size={13} /> Hapus foto sampul</button>}
        </section>

        <section>
          <h4>Foto di kartu</h4>
          <p className={styles.hint}>Boleh berbeda dari foto profil. Bila kosong, kartu memakai foto profil.</p>
          <div className={styles.row}>
            {(local.cardPhoto || card.cardPhoto) && <img className={styles.thumb} src={local.cardPhoto || getUploadUrl(card.cardPhoto)} alt="Foto kartu" />}
            <button type="button" className={styles.btn} disabled={locked} onClick={() => cardInput.current?.click()}><Upload size={14} /> {card.cardPhoto || local.cardPhoto ? 'Ganti foto' : 'Pilih foto kartu'}</button>
            {(card.cardPhoto || local.cardPhoto) && <button type="button" className={styles.link} onClick={() => clearPhoto('cardPhoto')}><Trash2 size={13} /> Pakai foto profil</button>}
            <input ref={cardInput} type="file" accept="image/*" hidden onChange={(e) => pickFile('cardPhoto', e)} />
          </div>
        </section>

        <section>
          <h4>Warna aksen</h4>
          <div className={styles.chips}>
            <button type="button" disabled={locked} className={`${styles.swatch} ${!card.accent ? styles.on : ''}`} onClick={() => set({ accent: null })} title="Ikut tema situs">Tema</button>
            {PALETTE.map((p) => <button key={p} type="button" disabled={locked} className={`${styles.dot} ${card.accent === p ? styles.on : ''}`} style={{ background: p }} onClick={() => set({ accent: p })} aria-label={p} />)}
            <input type="color" disabled={locked} value={card.accent || '#f97316'} onChange={(e) => set({ accent: e.target.value })} className={styles.color} aria-label="Warna bebas" />
          </div>
        </section>

        <section>
          <h4>Bagian yang ditampilkan</h4>
          <div className={styles.chips}>
            {data.catalog.sections.filter((k) => !data.siteHidden.includes(k)).map((k) => {
              const off = card.hidden.includes(k);
              return <button key={k} type="button" disabled={locked} className={`${styles.chip} ${off ? styles.off : styles.on}`} onClick={() => toggleHidden(k)}>{off ? <EyeOff size={13} /> : <Eye size={13} />} {SECTION_LABEL[k]}</button>;
            })}
          </div>
        </section>

        <section>
          <h4>Kartu info tambahan <small>({card.info.length}/6)</small></h4>
          <p className={styles.hint}>Prestasi, hobi, cita-cita, atau apa pun yang ingin Anda tampilkan.</p>
          {card.info.map((i, n) => (
            <div key={n} className={styles.infoRow}>
              <select value={i.icon} disabled={locked} onChange={(e) => updInfo(n, { icon: e.target.value })}>{data.catalog.infoIcons.map((k) => <option key={k} value={k}>{ICON_LABEL[k]}</option>)}</select>
              <input value={i.label} placeholder="Judul, mis. Hobi" maxLength={30} disabled={locked} onChange={(e) => updInfo(n, { label: e.target.value })} />
              <input value={i.value} placeholder="Isi, mis. Bermain gitar" maxLength={80} disabled={locked} onChange={(e) => updInfo(n, { value: e.target.value })} />
              <button type="button" className={styles.del} disabled={locked} onClick={() => set({ info: card.info.filter((_, k) => k !== n) })} aria-label="Hapus"><Trash2 size={14} /></button>
            </div>
          ))}
          {card.info.length < 6 && <button type="button" className={styles.btn} disabled={locked} onClick={() => set({ info: [...card.info, { icon: 'star', label: '', value: '' }] })}><Plus size={14} /> Tambah kartu info</button>}
        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.save} onClick={save} disabled={saving || locked}>{saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />} Simpan kartu</button>
          {data.slug && <a className={styles.link} href={`/@${data.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Buka kartu saya</a>}
        </div>
      </div>

      <aside className={styles.preview}>
        <b>Pratinjau</b>
        <div className={styles.previewBox}><BioCard preview profile={previewProfile} card={previewCard} design={designForPreview} /></div>
      </aside>
    </div>
  );
}

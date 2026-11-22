import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users2, ShieldCheck, Plus, X, Save, Loader2, Info } from 'lucide-react';
import { getWaPolicy, saveWaPolicy } from '@/api/admin';
import styles from './BotPolicyCard.module.css';

const MODES = [
  { k: 'listed', title: 'Hanya grup terdaftar', desc: 'Disarankan. Bot hanya menjawab perintah di grup yang dicentang di bawah.' },
  { k: 'all', title: 'Semua grup', desc: 'Bot menjawab di grup mana pun ia dimasukkan, termasuk grup publik.' },
  { k: 'off', title: 'Matikan di grup', desc: 'Perintah hanya dijawab lewat japri.' }
];
const fmtPhone = (n) => `+${n.slice(0, 2)} ${n.slice(2, 5)}-${n.slice(5, 9)}-${n.slice(9)}`;

/** Pengaturan grup & allowlist /rekap untuk halaman Atur Bot WhatsApp. */
export default function BotPolicyCard() {
  const [data, setData] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWaPolicy().then((r) => { setData(r.data); setPolicy(r.data.policy); }).catch(() => toast.error('Gagal memuat pengaturan bot'));
  }, []);

  if (!policy) return <section className={styles.card}><div className={styles.loading}><Loader2 className={styles.spin} size={20} /> Memuat pengaturan…</div></section>;

  const dirty = JSON.stringify(policy) !== JSON.stringify(data.policy);
  const set = (patch) => setPolicy((p) => ({ ...p, ...patch }));
  const toggleGroup = (jid) => set({ allowedGroups: policy.allowedGroups.includes(jid) ? policy.allowedGroups.filter((j) => j !== jid) : [...policy.allowedGroups, jid] });
  const addPhone = (e) => {
    e.preventDefault();
    let n = phone.replace(/\D/g, '');
    if (n.startsWith('0')) n = '62' + n.slice(1); else if (n.startsWith('8')) n = '62' + n;
    if (n.length < 10 || n.length > 15) { toast.error('Nomor tidak valid'); return; }
    if (policy.rekapAllow.includes(n)) { toast('Nomor sudah ada'); return; }
    set({ rekapAllow: [...policy.rekapAllow, n] });
    setPhone('');
  };
  const save = async () => {
    setSaving(true);
    try {
      const r = await saveWaPolicy(policy);
      setData((d) => ({ ...d, policy: r.data.policy }));
      setPolicy(r.data.policy);
      toast.success('Pengaturan bot disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };
  // Grup yang dicentang tapi belum pernah terlihat bot tetap ditampilkan (JID saja)
  const known = new Map(data.groups.map((g) => [g.jid, g]));
  const groupRows = [...data.groups, ...policy.allowedGroups.filter((j) => !known.has(j)).map((jid) => ({ jid, name: null }))];

  return (
    <section className={styles.card}>
      <h2 className={styles.title}><Users2 size={18} /> Grup &amp; Akses</h2>

      <div className={styles.block}>
        <div className={styles.label}>Perintah di grup</div>
        <div className={styles.modes} role="radiogroup">
          {MODES.map((m) => (
            <button key={m.k} type="button" role="radio" aria-checked={policy.groupMode === m.k}
              className={`${styles.mode} ${policy.groupMode === m.k ? styles.modeOn : ''}`} onClick={() => set({ groupMode: m.k })}>
              <b>{m.title}</b><span>{m.desc}</span>
            </button>
          ))}
        </div>
        {policy.groupMode === 'listed' && (
          <div className={styles.groups}>
            {groupRows.length === 0 ? (
              <p className={styles.muted}>Belum ada grup. Masukkan bot ke grup lalu ketik <code>!id</code> di sana: grup akan muncul di sini.</p>
            ) : groupRows.map((g) => (
              <label key={g.jid} className={styles.groupRow}>
                <input type="checkbox" checked={policy.allowedGroups.includes(g.jid)} onChange={() => toggleGroup(g.jid)} />
                <span className={styles.groupName}>{g.name || 'Grup belum dikenal'}</span>
                <code className={styles.jid}>{g.jid}</code>
              </label>
            ))}
          </div>
        )}
        <p className={styles.hint}><Info size={14} /> Di grup mana pun, bot tetap menolak <code>/sandi</code> dan <code>/absen</code> (data pribadi, hanya japri), membatasi 12 perintah/menit per grup dan 5 perintah/menit per orang, serta mengabaikan perintah bot lain.</p>
      </div>

      <div className={styles.block}>
        <div className={styles.label}><ShieldCheck size={15} /> Allowlist <code>/rekap</code></div>
        <label className={styles.switchRow}>
          <input type="checkbox" checked={policy.rekapCore} onChange={(e) => set({ rekapCore: e.target.checked })} />
          <span>Pengurus inti (Ketua, Wakil, Kabinet, Pembina) otomatis boleh, dicocokkan dari nomor WhatsApp di data anggota</span>
        </label>
        <label className={styles.switchRow}>
          <input type="checkbox" checked={policy.rekapInGroups} onChange={(e) => set({ rekapInGroups: e.target.checked })} />
          <span>Izinkan <code>/rekap</code> di grup (tidak disarankan: rekap berisi kehadiran semua anggota)</span>
        </label>
        <form onSubmit={addPhone} className={styles.addRow}>
          <input className="form-input" inputMode="tel" placeholder="Tambah nomor, mis. 0812 3456 7890" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button type="submit" className="btn btn-secondary"><Plus size={15} /> Tambah</button>
        </form>
        {policy.rekapAllow.length > 0 ? (
          <ul className={styles.chips}>
            {policy.rekapAllow.map((n) => (
              <li key={n}>{fmtPhone(n)}<button type="button" aria-label={`Hapus ${n}`} onClick={() => set({ rekapAllow: policy.rekapAllow.filter((x) => x !== n) })}><X size={13} /></button></li>
            ))}
          </ul>
        ) : <p className={styles.muted}>Belum ada nomor tambahan.</p>}
      </div>

      <div className={styles.actions}>
        {dirty && <span className={styles.unsaved}>Ada perubahan belum disimpan</span>}
        <button type="button" className="btn btn-primary" disabled={!dirty || saving} onClick={save}>
          {saving ? <Loader2 size={15} className={styles.spin} /> : <Save size={15} />} Simpan Pengaturan
        </button>
      </div>
    </section>
  );
}

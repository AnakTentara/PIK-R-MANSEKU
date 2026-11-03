import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Palette, IdCard, Home, Info, Target, FilePlus2, Navigation, Save, Loader2, Plus, Trash2, Upload, RotateCcw,
  Sun, Moon, Check, Eye, EyeOff, Monitor, Smartphone
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import BioCard from '@/components/common/BioCard';
import { getSettings, saveSettings, getAdminDesign, saveAdminDesign, uploadDesignImage } from '@/api/admin';
import { applyThemeVars } from '@/utils/theme';
import { getUploadUrl } from '@/api/axios';
import { compressImage } from '@/utils/compressor';
import { useAuthStore } from '@/stores/authStore';
import styles from './AdminDesignPage.module.css';

const TABS = [
  { id: 'tema', label: 'Tema', icon: Palette },
  { id: 'kartu', label: 'Kartu Biodata', icon: IdCard },
  { id: 'beranda', label: 'Beranda & Menu', icon: Home },
  { id: 'tentang', label: 'Tentang Kami', icon: Info },
  { id: 'visi', label: 'Visi & Misi', icon: Target },
  { id: 'halaman', label: 'Halaman Baru', icon: FilePlus2 }
];

const SECTION_LABEL = { bio: 'Bio / Tentang Saya', kelas: 'Kelas', gender: 'Jenis kelamin', asalSekolah: 'Asal sekolah', angkatan: 'Angkatan', idAnggota: 'ID anggota' };
const COVER_LABEL = { gradasi: 'Gradasi', garis: 'Garis', titik: 'Titik', gelombang: 'Gelombang', polos: 'Polos' };
const STYLE_LABEL = { portofolio: 'Portofolio', klasik: 'Klasik', kaca: 'Kaca', minimal: 'Minimal' };
const RADIUS_LABEL = { tegas: 'Tegas', sedang: 'Sedang', lembut: 'Lembut', bulat: 'Bulat' };
const SHADOW_LABEL = { datar: 'Datar', halus: 'Halus', timbul: 'Timbul' };

const SAMPLE_PROFILE = {
  name: 'Aisyah Putri Ramadhani', className: 'XI-2', gender: 'Perempuan', asalSekolah: 'SMPN 1 Muara Enim', joinYear: 2026,
  memberCode: 'PIKR_0042-26', jabatan: 'Ketua Humas', bio: 'Remaja berencana, masa depan cerah. Senang belajar hal baru dan berbagi cerita bersama teman-teman PIK-R!',
  status: 'ACTIVE', photoPath: null
};
const SAMPLE_INFO = [{ icon: 'trophy', label: 'Prestasi', value: 'Juara 2 Konselor Sebaya' }, { icon: 'music', label: 'Hobi', value: 'Bermain gitar' }];

const DEFAULT_CONFIG = {
  hero: { webTitle: 'PIK-R MANSEKU', heroDesc: 'Pusat Informasi & Konseling Remaja MAN 1 Muara Enim — wadah konseling, edukasi, dan pengembangan diri untuk remaja.', navVisibility: { tentangKami: true, anggota: true, alumni: true, blog: true } },
  tentangKami: { aboutText1: '', aboutText2: '', yearFounded: '2023', activeMembersType: 'Real', activeMembersFakeValue: '50+', activitiesCount: '10+ Program' },
  visiMisi: { visi: '', misi: '' },
  customPages: []
};

const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'halaman';

export default function AdminDesignPage() {
  const role = useAuthStore((s) => s.adminUser?.role);
  const canEdit = role === 'DEVELOPER' || role === 'KABINET_UMUM';
  const [tab, setTab] = useState('tema');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [design, setDesign] = useState(null);
  const [saved, setSaved] = useState(null); // salinan JSON terakhir tersimpan (deteksi perubahan)
  const [catalog, setCatalog] = useState(null);
  const [vars, setVars] = useState({});
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [savedConfig, setSavedConfig] = useState(null);
  const [device, setDevice] = useState('mobile');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([getAdminDesign(), getSettings()]);
      setDesign(d.data.design); setSaved(JSON.stringify(d.data.design)); setCatalog(d.data.catalog); setVars(d.data.vars);
      const raw = (s.data.settings || []).find((x) => x.key === 'WEB_EDITOR_CONFIG');
      let cfg = DEFAULT_CONFIG;
      if (raw?.value) { try { cfg = { ...DEFAULT_CONFIG, ...JSON.parse(raw.value) }; } catch { /* pakai bawaan */ } }
      setConfig(cfg); setSavedConfig(JSON.stringify(cfg));
    } catch {
      toast.error('Gagal memuat desain');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Pratinjau langsung: variabel CSS dihitung server (daftar putih) lalu dipasang ke seluruh halaman
  // dashboard dikecualikan, jadi hanya area pratinjau yang berubah.
  const previewVars = useMemo(() => {
    if (!design || !catalog) return {};
    const theme = catalog.themes.find((t) => t.key === design.theme) || catalog.themes[0];
    const hex = design.customAccent;
    const shade = (h, a) => {
      const n = parseInt(h.slice(1), 16);
      const c = (v) => Math.max(0, Math.min(255, v + a)).toString(16).padStart(2, '0');
      return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
    };
    const t = hex ? { accent: hex, hover: shade(hex, -22), dark: shade(hex, -55), soft: `${hex}1f`, bg: '#f8fafc', ink: '#0f172a' } : theme;
    const radius = { tegas: 6, sedang: 10, lembut: 14, bulat: 20 }[design.radius] ?? 14;
    const v = {
      '--color-accent': t.accent, '--color-accent-hover': t.hover, '--color-accent-dark': t.dark, '--color-accent-subtle': t.soft,
      '--color-accent-border': `${t.accent}40`, '--radius-md': `${radius}px`, '--radius-lg': `${radius + 4}px`
    };
    if (!hex && theme.dark_mode) Object.assign(v, { '--color-bg': t.bg, '--color-surface': '#1e293b', '--color-surface-2': '#273449', '--color-text-primary': t.ink, '--color-text-secondary': '#cbd5e1', '--color-text-muted': '#94a3b8', '--color-border-strong': '#334155' });
    return v;
  }, [design, catalog]);

  const dirty = (design && JSON.stringify(design) !== saved) || (savedConfig !== null && JSON.stringify(config) !== savedConfig);

  const patch = (p) => setDesign((d) => ({ ...d, ...p }));
  const patchCard = (p) => setDesign((d) => ({ ...d, card: { ...d.card, ...p } }));
  const setCfg = (section, field, value) => setConfig((c) => ({ ...c, [section]: { ...c[section], [field]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await saveAdminDesign(design);
      await saveSettings({ key: 'WEB_EDITOR_CONFIG', value: JSON.stringify(config) });
      setDesign(res.data.design); setSaved(JSON.stringify(res.data.design)); setVars(res.data.vars); setSavedConfig(JSON.stringify(config));
      toast.success('Desain disimpan. Situs publik memakainya dalam hitungan detik.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan desain');
    } finally { setSaving(false); }
  };

  const uploadThumb = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const t = toast.loading('Mengunggah…');
    try {
      const small = await compressImage(file).catch(() => file);
      const res = await uploadDesignImage(small);
      patchCard({ defaultThumb: res.data.path });
      toast.success('Foto bawaan diunggah. Jangan lupa Simpan.', { id: t });
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengunggah', { id: t }); }
  };

  if (loading || !design || !catalog) {
    return (
      <div className={styles.page}><AdminHeader title="Desain" subtitle="Tema, kartu biodata, dan isi halaman situs" />
        <div className={styles.loading}><Loader2 className={styles.spin} size={28} /></div></div>
    );
  }

  const Choice = ({ value, current, label, onPick, children }) => (
    <button type="button" className={`${styles.choice} ${current === value ? styles.choiceOn : ''}`} onClick={() => onPick(value)} disabled={!canEdit} aria-pressed={current === value}>
      {children}<span>{label}</span>{current === value && <Check size={14} className={styles.tick} />}
    </button>
  );

  const previewFrame = (children) => (
    <aside className={styles.preview}>
      <div className={styles.previewHead}>
        <b>Pratinjau langsung</b>
        <div className={styles.deviceSwitch}>
          <button type="button" className={device === 'mobile' ? styles.devOn : ''} onClick={() => setDevice('mobile')} aria-label="Tampilan HP"><Smartphone size={15} /></button>
          <button type="button" className={device === 'desktop' ? styles.devOn : ''} onClick={() => setDevice('desktop')} aria-label="Tampilan desktop"><Monitor size={15} /></button>
        </div>
      </div>
      <div className={`${styles.previewBox} ${device === 'mobile' ? styles.mobile : ''}`} style={previewVars}>{children}</div>
    </aside>
  );

  const miniSite = (
    <div className={styles.mini}>
      <div className={styles.miniNav}><span className={styles.miniLogo}>{config.hero?.webTitle || 'PIK-R MANSEKU'}</span><i /><i /><i /></div>
      <div className={styles.miniHero}>
        <h4>{config.hero?.webTitle || 'PIK-R MANSEKU'}</h4>
        <p>{(config.hero?.heroDesc || '').slice(0, 110)}</p>
        <span className={styles.miniBtn}>Daftar Sekarang</span>
      </div>
      <div className={styles.miniCards}>{[1, 2, 3].map((n) => <div key={n}><b /><em /><em /></div>)}</div>
      <div className={styles.miniAccent}><span>Bagian Penekanan</span><span className={styles.miniBtnGhost}>Pelajari</span></div>
    </div>
  );

  return (
    <div className={styles.page}>
      <AdminHeader title="Desain" subtitle="Tema, kartu biodata, dan isi halaman situs PIK-R MANSEKU">
        {canEdit && (
          <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />} {dirty ? 'Simpan Perubahan' : 'Tersimpan'}
          </button>
        )}
      </AdminHeader>

      <div className={styles.content}>
        <nav className={styles.tabs} role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" aria-selected={tab === id} className={`${styles.tab} ${tab === id ? styles.tabOn : ''}`} onClick={() => setTab(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        {!canEdit && <div className={styles.notice}>Anda hanya bisa melihat desain. Perubahan hanya untuk Developer dan Kabinet Umum.</div>}

        {/* ═════ TEMA ═════ */}
        {tab === 'tema' && (
          <div className={styles.split}>
            <div className={styles.stack}>
              <section className={styles.card}>
                <h3>Warna tema situs</h3>
                <p className={styles.hint}>Mengubah warna tombol, tautan, dan aksen di seluruh situs publik. Dashboard admin tetap oranye PIK-R.</p>
                <div className={styles.themeGrid}>
                  {catalog.themes.map((t) => (
                    <button key={t.key} type="button" disabled={!canEdit}
                      className={`${styles.themeCard} ${design.theme === t.key && !design.customAccent ? styles.choiceOn : ''}`}
                      onClick={() => patch({ theme: t.key, customAccent: null })}>
                      <span className={styles.swatch} style={{ background: t.dark_mode ? '#0f172a' : t.bg }}>
                        <i style={{ background: t.accent }} /><i style={{ background: t.dark }} /><i style={{ background: t.soft }} />
                      </span>
                      <span>{t.label}{t.dark_mode && <Moon size={12} />}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.customRow}>
                  <label>Warna bebas
                    <input type="color" disabled={!canEdit} value={design.customAccent || '#f97316'} onChange={(e) => patch({ customAccent: e.target.value })} />
                  </label>
                  {design.customAccent && <button type="button" className={styles.linkBtn} onClick={() => patch({ customAccent: null })}><RotateCcw size={13} /> Pakai tema</button>}
                </div>
              </section>

              <section className={styles.card}>
                <h3>Bentuk &amp; huruf</h3>
                <p className={styles.label}>Sudut</p>
                <div className={styles.choices}>{catalog.radii.map((r) => <Choice key={r} value={r} current={design.radius} label={RADIUS_LABEL[r]} onPick={(v) => patch({ radius: v })}><span className={styles.radiusDemo} style={{ borderRadius: { tegas: 4, sedang: 8, lembut: 12, bulat: 18 }[r] }} /></Choice>)}</div>
                <p className={styles.label}>Bayangan</p>
                <div className={styles.choices}>{catalog.shadows.map((r) => <Choice key={r} value={r} current={design.shadow} label={SHADOW_LABEL[r]} onPick={(v) => patch({ shadow: v })} />)}</div>
                <p className={styles.label}>Font</p>
                <div className={styles.choices}>{catalog.fonts.map((f) => <Choice key={f.key} value={f.key} current={design.font} label={f.label} onPick={(v) => patch({ font: v })} />)}</div>
              </section>
            </div>
            {previewFrame(miniSite)}
          </div>
        )}

        {/* ═════ KARTU BIODATA ═════ */}
        {tab === 'kartu' && (
          <div className={styles.split}>
            <div className={styles.stack}>
              <section className={styles.card}>
                <h3>Gaya kartu</h3>
                <p className={styles.hint}>Tampilan halaman biodata <code>/@nama</code> yang dibuka dari QR ID Card.</p>
                <div className={styles.choices}>{catalog.cardStyles.map((s) => <Choice key={s} value={s} current={design.card.style} label={STYLE_LABEL[s]} onPick={(v) => patchCard({ style: v })} />)}</div>
                <p className={styles.label}>Motif sampul bawaan</p>
                <div className={styles.choices}>{Object.keys(COVER_LABEL).map((c) => <Choice key={c} value={c} current={design.card.cover} label={COVER_LABEL[c]} onPick={(v) => patchCard({ cover: v })} />)}</div>
              </section>

              <section className={styles.card}>
                <h3>Foto bawaan (thumbnail)</h3>
                <p className={styles.hint}>Dipakai untuk anggota yang belum punya foto. Bila kosong, tampil inisial nama.</p>
                <div className={styles.thumbRow}>
                  {design.card.defaultThumb ? <img src={getUploadUrl(design.card.defaultThumb)} alt="Foto bawaan" /> : <span className={styles.thumbEmpty}>Inisial</span>}
                  {canEdit && (<>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}><Upload size={14} /> Pilih gambar</button>
                    {design.card.defaultThumb && <button type="button" className={styles.linkBtn} onClick={() => patchCard({ defaultThumb: null })}><Trash2 size={13} /> Hapus</button>}
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadThumb} />
                  </>)}
                </div>
              </section>

              <section className={styles.card}>
                <h3>Bagian kartu</h3>
                <p className={styles.hint}>Matikan bagian yang tidak ingin ditampilkan di <b>semua</b> kartu. Anggota juga bisa menyembunyikan bagian miliknya sendiri.</p>
                <div className={styles.toggles}>
                  {catalog.sections.map((k) => {
                    const hidden = design.card.hidden.includes(k);
                    return (
                      <button key={k} type="button" disabled={!canEdit} className={`${styles.toggle} ${hidden ? styles.toggleOff : ''}`}
                        onClick={() => patchCard({ hidden: hidden ? design.card.hidden.filter((x) => x !== k) : [...design.card.hidden, k] })}>
                        {hidden ? <EyeOff size={15} /> : <Eye size={15} />} {SECTION_LABEL[k]}
                      </button>
                    );
                  })}
                </div>
                <label className={styles.check}><input type="checkbox" disabled={!canEdit} checked={design.card.allowMemberEdit} onChange={(e) => patchCard({ allowMemberEdit: e.target.checked })} /> Anggota boleh mengatur kartunya sendiri (sampul, foto kartu, kartu info)</label>
              </section>
            </div>
            {previewFrame(<BioCard preview profile={SAMPLE_PROFILE} card={{ info: SAMPLE_INFO }} design={design.card} />)}
          </div>
        )}

        {/* ═════ BERANDA & MENU ═════ */}
        {tab === 'beranda' && (
          <div className={styles.split}>
            <div className={styles.stack}>
              <section className={styles.card}>
                <h3>Beranda</h3>
                <label className={styles.field}>Judul website<input value={config.hero?.webTitle || ''} disabled={!canEdit} onChange={(e) => setCfg('hero', 'webTitle', e.target.value)} /></label>
                <label className={styles.field}>Deskripsi hero<textarea rows={4} value={config.hero?.heroDesc || ''} disabled={!canEdit} onChange={(e) => setCfg('hero', 'heroDesc', e.target.value)} /></label>
              </section>
              <section className={styles.card}>
                <h3>Menu navigasi</h3>
                <p className={styles.hint}>Pilih menu yang tampil di bilah atas situs.</p>
                <div className={styles.toggles}>
                  {[['tentangKami', 'Tentang Kami'], ['anggota', 'Anggota'], ['alumni', 'Alumni'], ['blog', 'Blog & Artikel']].map(([k, l]) => {
                    const on = config.hero?.navVisibility?.[k] ?? true;
                    return (
                      <button key={k} type="button" disabled={!canEdit} className={`${styles.toggle} ${on ? '' : styles.toggleOff}`}
                        onClick={() => setConfig((c) => ({ ...c, hero: { ...c.hero, navVisibility: { ...c.hero.navVisibility, [k]: !on } } }))}>
                        {on ? <Eye size={15} /> : <EyeOff size={15} />} {l}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
            {previewFrame(miniSite)}
          </div>
        )}

        {/* ═════ TENTANG ═════ */}
        {tab === 'tentang' && (
          <section className={`${styles.card} ${styles.wide}`}>
            <h3>Tentang Kami</h3>
            <label className={styles.field}>Paragraf 1<textarea rows={4} value={config.tentangKami?.aboutText1 || ''} disabled={!canEdit} onChange={(e) => setCfg('tentangKami', 'aboutText1', e.target.value)} /></label>
            <label className={styles.field}>Paragraf 2<textarea rows={4} value={config.tentangKami?.aboutText2 || ''} disabled={!canEdit} onChange={(e) => setCfg('tentangKami', 'aboutText2', e.target.value)} /></label>
            <div className={styles.grid3}>
              <label className={styles.field}>Tahun berdiri<input value={config.tentangKami?.yearFounded || ''} disabled={!canEdit} onChange={(e) => setCfg('tentangKami', 'yearFounded', e.target.value)} /></label>
              <label className={styles.field}>Label kegiatan<input value={config.tentangKami?.activitiesCount || ''} placeholder="10+ Program" disabled={!canEdit} onChange={(e) => setCfg('tentangKami', 'activitiesCount', e.target.value)} /></label>
              <label className={styles.field}>Angka anggota aktif
                <select value={config.tentangKami?.activeMembersType || 'Real'} disabled={!canEdit} onChange={(e) => setCfg('tentangKami', 'activeMembersType', e.target.value)}>
                  <option value="Real">Sesuai database</option><option value="Fake">Manual</option><option value="Real+Fake">Database + tambahan</option>
                </select>
              </label>
            </div>
            {['Fake', 'Real+Fake'].includes(config.tentangKami?.activeMembersType) && (
              <label className={styles.field}>Angka tambahan / manual<input value={config.tentangKami?.activeMembersFakeValue || ''} placeholder="50+" disabled={!canEdit} onChange={(e) => setCfg('tentangKami', 'activeMembersFakeValue', e.target.value)} /></label>
            )}
          </section>
        )}

        {/* ═════ VISI ═════ */}
        {tab === 'visi' && (
          <section className={`${styles.card} ${styles.wide}`}>
            <h3>Visi &amp; Misi</h3>
            <label className={styles.field}>Visi<textarea rows={3} value={config.visiMisi?.visi || ''} disabled={!canEdit} onChange={(e) => setCfg('visiMisi', 'visi', e.target.value)} /></label>
            <label className={styles.field}>Misi <small>(satu poin per baris)</small><textarea rows={8} value={config.visiMisi?.misi || ''} disabled={!canEdit} onChange={(e) => setCfg('visiMisi', 'misi', e.target.value)} /></label>
          </section>
        )}

        {/* ═════ HALAMAN BARU ═════ */}
        {tab === 'halaman' && (
          <section className={`${styles.card} ${styles.wide}`}>
            <div className={styles.rowBetween}>
              <h3>Halaman baru</h3>
              {canEdit && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfig((c) => ({ ...c, customPages: [...(c.customPages || []), { id: String(Date.now()), title: 'Halaman Baru', slug: 'halaman-baru', html: '<h1>Halo Dunia</h1>' }] }))}><Plus size={14} /> Tambah halaman</button>}
            </div>
            <p className={styles.hint}>Halaman tambahan yang muncul di menu dan bisa dibuka di <code>/p/slug</code>.</p>
            {(config.customPages || []).length === 0 ? <p className={styles.empty}>Belum ada halaman.</p> : config.customPages.map((p) => (
              <div key={p.id} className={styles.page2}>
                <div className={styles.grid2}>
                  <label className={styles.field}>Judul (muncul di menu)<input value={p.title} disabled={!canEdit} onChange={(e) => setConfig((c) => ({ ...c, customPages: c.customPages.map((x) => (x.id === p.id ? { ...x, title: e.target.value, slug: x.slug === slugify(x.title) || !x.slug ? slugify(e.target.value) : x.slug } : x)) }))} /></label>
                  <label className={styles.field}>Alamat (slug)<input value={p.slug} disabled={!canEdit} onChange={(e) => setConfig((c) => ({ ...c, customPages: c.customPages.map((x) => (x.id === p.id ? { ...x, slug: slugify(e.target.value) } : x)) }))} /></label>
                </div>
                <label className={styles.field}>Isi (HTML)<textarea className={styles.mono} rows={7} value={p.html} disabled={!canEdit} onChange={(e) => setConfig((c) => ({ ...c, customPages: c.customPages.map((x) => (x.id === p.id ? { ...x, html: e.target.value } : x)) }))} /></label>
                {canEdit && <button type="button" className={styles.linkBtn} onClick={() => setConfig((c) => ({ ...c, customPages: c.customPages.filter((x) => x.id !== p.id) }))}><Trash2 size={13} /> Hapus halaman ini</button>}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

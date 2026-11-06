import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, CalendarDays, Table2, IdCard, Settings, Trash2, Pencil, Download, Upload,
  ExternalLink, Smartphone, Check, X, Loader2, Search, KeyRound, Plus
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { getUploadUrl } from '@/api/axios';
import { saveBlob } from '@/components/admin/MemberExcelModal';
import * as A from '@/api/absen';
import styles from './AdminAbsensiPage.module.css';
import SelectField from '@/components/common/SelectField';

const ABSEN_URL = import.meta.env.VITE_ABSEN_URL || 'https://absen.pikr-manseku.my.id';
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
const STATUS = { HADIR: 'Hadir', SAKIT: 'Sakit', IZIN: 'Izin', ALFA: 'Alfa' };
const MANAGER_ROLES = ['DEVELOPER', 'KABINET_UMUM'];
const TYPE_LABEL = { PERTEMUAN: 'Pertemuan', WAJIB: 'Wajib', TAMBAHAN: 'Tambahan' };
const TYPE_SHORT = { PERTEMUAN: 'P', WAJIB: 'W', TAMBAHAN: 'T' };
const isMandatory = (t) => t === 'PERTEMUAN' || t === 'WAJIB';

const TABS = [
  { key: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { key: 'kegiatan', label: 'Kegiatan', icon: CalendarDays },
  { key: 'rekap', label: 'Rekap', icon: Table2 },
  { key: 'idcard', label: 'ID Card', icon: IdCard },
  { key: 'pengaturan', label: 'Pengaturan', icon: Settings, managerOnly: true }
];

// Tanggal WIB (UTC+7) 'YYYY-MM-DD'
const wibToday = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const shift = (date, days) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const longDate = (date) => new Date(`${date}T12:00:00+07:00`).toLocaleDateString('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta'
});
const errMsg = (e, fb) => e?.response?.data?.message || fb;

function Avatar({ name, photo, size = 36 }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return photo && !failed
    ? <img className={styles.avatar} style={{ width: size, height: size }} src={getUploadUrl(photo)} alt="" onError={() => setFailed(true)} />
    : <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>;
}

function StatusPill({ status, auto }) {
  if (!status) return <span className={`${styles.pill} ${styles.pillEmpty}`}>—</span>;
  return <span className={`${styles.pill} ${styles[`pill${status}`]}`} title={auto ? 'Alfa otomatis (kegiatan wajib)' : undefined}>{STATUS[status]}{auto ? '*' : ''}</span>;
}

export default function AdminAbsensiPage() {
  const role = useAuthStore((s) => s.adminUser?.role) || 'KABINET_UMUM';
  const isManager = MANAGER_ROLES.includes(role);
  const [tab, setTab] = useState('ringkasan');

  return (
    <div className={styles.page}>
      <AdminHeader title="Absensi" subtitle="Rekap kehadiran kegiatan PIK-R. Pencatatan absen dilakukan lewat web absen di HP.">
        <a className="btn btn-primary" href={ABSEN_URL} target="_blank" rel="noreferrer">
          <Smartphone size={16} /> Buka Web Absen
        </a>
      </AdminHeader>

      <div className={styles.content}>
        <nav className={styles.tabs} role="tablist">
          {TABS.filter(t => !t.managerOnly || isManager).map(({ key, label, icon: Icon }) => (
            <button key={key} role="tab" aria-selected={tab === key}
              className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`} onClick={() => setTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        {tab === 'ringkasan' && <OverviewTab />}
        {tab === 'kegiatan' && <SessionsTab isManager={isManager} />}
        {tab === 'rekap' && <RecapTab isManager={isManager} />}
        {tab === 'idcard' && <IdCardTab isManager={isManager} />}
        {tab === 'pengaturan' && isManager && <SettingsTab />}
      </div>
    </div>
  );
}

// ─── Ringkasan ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    A.getAbsenOverview().then(r => setData(r.data)).catch(e => toast.error(errMsg(e, 'Gagal memuat ringkasan')));
  }, []);

  if (!data) return <div className={styles.loading}><Loader2 className={styles.spin} /></div>;

  const rate = data.attendanceRate == null ? '—' : `${Math.round(data.attendanceRate * 100)}%`;
  return (
    <div className={styles.stack}>
      <div className={styles.stats}>
        <Stat label="Anggota aktif" value={data.activeMembers} />
        <Stat label="Kegiatan (90 hari)" value={data.sessionCount} hint={`${data.wajibCount} wajib`} />
        <Stat label="Tingkat kehadiran" value={rate} accent />
        <Stat label="Total Alfa" value={data.totals.ALFA} danger={data.totals.ALFA > 0} />
      </div>

      <div className={styles.twoCol}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Kegiatan terakhir</h3>
          {data.last ? (
            <>
              <p className={styles.muted}>{longDate(data.last.date)}</p>
              <p className={styles.sessionTitle}>
                <span className={`${styles.typeBadge} ${isMandatory(data.last.type) ? styles.typeWajib : ''}`}>{TYPE_LABEL[data.last.type]}</span>
                {data.last.title}
              </p>
              <div className={styles.miniStats}>
                {['HADIR', 'SAKIT', 'IZIN', 'ALFA'].map(k => (
                  <div key={k}><b className={styles[`text${k}`]}>{data.last.counts[k]}</b><span>{STATUS[k]}</span></div>
                ))}
                <div><b>{data.last.counts.KOSONG}</b><span>Belum diisi</span></div>
              </div>
            </>
          ) : <p className={styles.muted}>Belum ada kegiatan. Kegiatan wajib dibuat otomatis saat petugas mulai mengabsen.</p>}
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Paling sering Alfa (90 hari)</h3>
          {data.topAlfa.length ? (
            <ul className={styles.list}>
              {data.topAlfa.map(m => (
                <li key={m.id} className={styles.listRow}>
                  <Avatar name={m.name} photo={m.photoPath} />
                  <div className={styles.grow}><b>{m.name.trim()}</b><span className={styles.muted}>{m.className}</span></div>
                  <span className={`${styles.pill} ${styles.pillALFA}`}>{m.alfa}× Alfa</span>
                </li>
              ))}
            </ul>
          ) : <p className={styles.muted}>Tidak ada anggota yang Alfa. 🎉</p>}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, accent, danger }) {
  return (
    <div className={`${styles.stat} ${accent ? styles.statAccent : ''} ${danger ? styles.statDanger : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
      {hint && <small>{hint}</small>}
    </div>
  );
}

// ─── Kegiatan ───────────────────────────────────────────────────────────────

function SessionsTab({ isManager }) {
  const openConfirm = useUIStore((s) => s.openConfirm);
  const [sessions, setSessions] = useState(null);
  const [editing, setEditing] = useState(null); // session | 'new'

  const load = useCallback(() => {
    A.getAbsenSessions().then(r => setSessions(r.data)).catch(e => toast.error(errMsg(e, 'Gagal memuat kegiatan')));
  }, []);
  useEffect(load, [load]);

  const remove = (s) => openConfirm({
    title: 'Hapus kegiatan?',
    message: `"${s.title}" (${longDate(s.date)}) beserta ${s.counts.HADIR + s.counts.SAKIT + s.counts.IZIN + s.counts.ALFA} data absennya akan dihapus permanen.`,
    danger: true,
    onConfirm: async () => {
      try {
        const r = await A.deleteAbsenSession(s.id);
        toast.success(r.data.message);
        load();
      } catch (e) { toast.error(errMsg(e, 'Gagal menghapus')); }
    }
  });

  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>Daftar kegiatan</h3>
        {isManager && <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>+ Kegiatan untuk tanggal lalu</button>}
      </div>
      {!sessions ? <div className={styles.loading}><Loader2 className={styles.spin} /></div>
        : !sessions.length ? <p className={styles.muted}>Belum ada kegiatan.</p>
        : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Tanggal</th><th>Jenis</th><th>Judul</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alfa</th><th>Dibuka oleh</th>{isManager && <th />}</tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td className={styles.nowrap}>{longDate(s.date)}</td>
                    <td><span className={`${styles.typeBadge} ${isMandatory(s.type) ? styles.typeWajib : ''}`}>{TYPE_LABEL[s.type]}</span></td>
                    <td><b>{s.title}</b>{s.description && <div className={styles.muted}>{s.description}</div>}</td>
                    <td className={styles.textHADIR}>{s.counts.HADIR}</td>
                    <td className={styles.textSAKIT}>{s.counts.SAKIT}</td>
                    <td className={styles.textIZIN}>{s.counts.IZIN}</td>
                    <td className={styles.textALFA}>{s.counts.ALFA}</td>
                    <td className={styles.muted}>{s.openedBy}</td>
                    {isManager && (
                      <td className={styles.rowActions}>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEditing(s)}><Pencil size={14} /></button>
                        <button className="btn btn-ghost btn-sm text-danger" title="Hapus" onClick={() => remove(s)}><Trash2 size={14} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <p className={styles.footnote}>Alfa pada <b>pertemuan</b> dan <b>kegiatan wajib</b> dihitung otomatis untuk anggota yang tidak absen. Pada kegiatan <b>tambahan</b>, Alfa diisi manual.</p>
      {editing && <SessionModal session={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </section>
  );
}

function SessionModal({ session, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: session?.date || shift(wibToday(), -1),
    title: session?.title || '',
    description: session?.description || '',
    type: session?.type || 'TAMBAHAN'
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (session) {
        await A.updateAbsenSession(session.id, { title: form.title, description: form.description, type: form.type });
      } else {
        await A.createAbsenSession({ date: form.date, title: form.title, description: form.description });
      }
      toast.success('Kegiatan disimpan');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err, 'Gagal menyimpan kegiatan'));
      setBusy(false);
    }
  };

  return (
    <Modal title={session ? 'Edit kegiatan' : 'Kegiatan baru'} onClose={onClose} actions={<>
      <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
      <button type="submit" form="session-form" className="btn btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
    </>}>
      <form id="session-form" onSubmit={submit} className={styles.form}>
        {!session && (
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input type="date" className="form-input" max={wibToday()} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Judul *</label>
          <input className="form-input" maxLength={100} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Deskripsi</label>
          <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        {session && (
          <div className="form-group">
            <label className="form-label">Jenis</label>
            <SelectField className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="PERTEMUAN">Pertemuan rutin (Alfa otomatis)</option>
              <option value="WAJIB">Kegiatan wajib (Alfa otomatis)</option>
              <option value="TAMBAHAN">Tambahan (Alfa manual)</option>
            </SelectField>
          </div>
        )}
      </form>
    </Modal>
  );
}

// ─── Rekap ──────────────────────────────────────────────────────────────────

function RecapTab({ isManager }) {
  const today = wibToday();
  const [range, setRange] = useState({ from: shift(today, -30), to: today });
  const [recap, setRecap] = useState(null);
  const [q, setQ] = useState('');
  const [view, setView] = useState('ringkas'); // ringkas | detail
  const [cell, setCell] = useState(null); // { row, dayIndex }
  const [history, setHistory] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setRecap(null);
    A.getAbsenRecap(range.from, range.to).then(r => setRecap(r.data)).catch(e => toast.error(errMsg(e, 'Gagal memuat rekap')));
  }, [range.from, range.to]);
  useEffect(load, [load]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (recap?.rows || []).filter(r => !needle || r.name.toLowerCase().includes(needle) || r.className.toLowerCase().includes(needle));
  }, [recap, q]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await A.exportAbsenExcel(range.from, range.to);
      const url = URL.createObjectURL(res.data);
      Object.assign(document.createElement('a'), { href: url, download: `Rekap_Absensi_PIKR_${range.from}_${range.to}.xlsx` }).click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { toast.error(errMsg(e, 'Gagal export Excel')); }
    setExporting(false);
  };

  const openHistory = async (row) => {
    setHistory({ row, data: null });
    try {
      const r = await A.getMemberAttendance(row.id);
      setHistory({ row, data: r.data });
    } catch (e) {
      toast.error(errMsg(e, 'Gagal memuat riwayat'));
      setHistory(null);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.toolbar}>
        <div className={styles.range}>
          <input type="date" className="form-input" value={range.from} max={range.to} onChange={e => e.target.value && setRange({ ...range, from: e.target.value })} />
          <span>s/d</span>
          <input type="date" className="form-input" value={range.to} max={today} onChange={e => e.target.value && setRange({ ...range, to: e.target.value })} />
        </div>
        <div className={styles.search}>
          <Search size={16} />
          <input placeholder="Cari nama / kelas" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className={styles.segment}>
          <button className={view === 'ringkas' ? styles.segOn : ''} onClick={() => setView('ringkas')}>Ringkas</button>
          <button className={view === 'detail' ? styles.segOn : ''} onClick={() => setView('detail')}>Per tanggal</button>
        </div>
        <button className="btn btn-secondary" onClick={exportExcel} disabled={exporting || !recap?.sessions.length}>
          <Download size={16} /> {exporting ? 'Menyiapkan…' : 'Excel'}
        </button>
      </div>

      {!recap ? <div className={styles.loading}><Loader2 className={styles.spin} /></div>
        : !recap.sessions.length ? <p className={styles.muted}>Tidak ada kegiatan di rentang ini.</p>
        : view === 'ringkas' ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Nama</th><th>Kelas</th><th>Jabatan</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alfa</th><th>% Hadir</th></tr></thead>
              <tbody>
                {rows.map(r => {
                  const total = r.counts.HADIR + r.counts.SAKIT + r.counts.IZIN + r.counts.ALFA;
                  return (
                    <tr key={r.id} className={styles.clickable} onClick={() => openHistory(r)} title="Lihat riwayat">
                      <td><div className={styles.nameCell}><Avatar name={r.name} photo={r.photoPath} size={30} /><b>{r.name.trim()}</b></div></td>
                      <td>{r.className}</td>
                      <td className={styles.muted}>{r.jabatan}</td>
                      <td className={styles.textHADIR}>{r.counts.HADIR}</td>
                      <td className={styles.textSAKIT}>{r.counts.SAKIT}</td>
                      <td className={styles.textIZIN}>{r.counts.IZIN}</td>
                      <td className={styles.textALFA}>{r.counts.ALFA}</td>
                      <td>
                        <div className={styles.bar}><i style={{ width: `${total ? (r.counts.HADIR / total) * 100 : 0}%` }} /></div>
                        <small>{total ? `${Math.round((r.counts.HADIR / total) * 100)}%` : '—'}</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.matrix}`}>
              <thead>
                <tr>
                  <th className={styles.sticky}>Nama</th>
                  {recap.sessions.map(s => (
                    <th key={s.id} title={s.title}>
                      {s.date.slice(8)}/{s.date.slice(5, 7)}
                      <div className={styles.thType}>{TYPE_SHORT[s.type]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td className={styles.sticky}><b>{r.name.trim()}</b><div className={styles.muted}>{r.className}</div></td>
                    {r.days.map((d, i) => (
                      <td key={i}>
                        <button className={styles.cellBtn} disabled={!isManager}
                          onClick={() => setCell({ row: r, session: recap.sessions[i], day: d })}
                          title={d.status === 'HADIR' ? `${d.checkIn || '?'} – ${d.checkOut || '?'}` : d.note || ''}>
                          <StatusPill status={d.status} auto={d.auto} />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <p className={styles.footnote}>* Alfa otomatis (kegiatan wajib, anggota tidak absen). P = pertemuan, W = wajib, T = tambahan.{isManager && ' Klik sel di tampilan "Per tanggal" untuk mengoreksi.'}</p>

      {cell && <RecordModal cell={cell} onClose={() => setCell(null)} onSaved={() => { setCell(null); load(); }} />}
      {history && <HistoryModal history={history} onClose={() => setHistory(null)} />}
    </section>
  );
}

function RecordModal({ cell, onClose, onSaved }) {
  const { row, session, day } = cell;
  const openConfirm = useUIStore((s) => s.openConfirm);
  const [action, setAction] = useState(day.status === 'HADIR' ? 'IN' : (day.auto ? 'ALFA' : day.status || 'IN'));
  const [time, setTime] = useState(day.checkIn || session.startTime || '15:00');
  const [timeOut, setTimeOut] = useState(day.checkOut || '');
  const [note, setNote] = useState(day.note || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await A.saveAbsenRecord({ memberId: row.id, action, date: session.date, ...(action === 'IN' ? { time } : { note }) });
      if (action === 'IN' && timeOut) {
        await A.saveAbsenRecord({ memberId: row.id, action: 'OUT', date: session.date, time: timeOut });
      }
      toast.success('Absensi disimpan');
      onSaved();
    } catch (e) {
      toast.error(errMsg(e, 'Gagal menyimpan'));
      setBusy(false);
    }
  };

  const remove = () => openConfirm({
    title: 'Hapus data absen?',
    message: isMandatory(session.type) ? 'Anggota akan kembali dihitung Alfa otomatis.' : 'Data akan kembali "belum diisi".',
    danger: true,
    onConfirm: async () => {
      try { await A.deleteAbsenRecord(day.id); toast.success('Dihapus'); onSaved(); }
      catch (e) { toast.error(errMsg(e, 'Gagal menghapus')); }
    }
  });

  return (
    <Modal title={`${row.name.trim()} · ${longDate(session.date)}`} onClose={onClose} actions={<>
      {day.id && !day.auto && <button type="button" className="btn btn-ghost text-danger" onClick={remove}><Trash2 size={14} /> Hapus</button>}
      <span style={{ flex: 1 }} />
      <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
      <button type="button" className="btn btn-primary" onClick={save} disabled={busy || (action === 'IN' && !time)}>Simpan</button>
    </>}>
      <p className={styles.muted} style={{ marginBottom: 12 }}>{session.title}</p>
      <div className={styles.choice}>
        {[['IN', 'Hadir'], ['SAKIT', 'Sakit'], ['IZIN', 'Izin'], ['ALFA', 'Alfa']].map(([k, l]) => (
          <button key={k} type="button" className={action === k ? styles.choiceOn : ''} onClick={() => setAction(k)}>{l}</button>
        ))}
      </div>
      {action === 'IN' ? (
        <div className={styles.timeRow}>
          <label>Masuk<input type="time" className="form-input" value={time} onChange={e => setTime(e.target.value)} required /></label>
          <label>Keluar<input type="time" className="form-input" value={timeOut} onChange={e => setTimeOut(e.target.value)} /></label>
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Keterangan</label>
          <textarea className="form-textarea" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Opsional" />
        </div>
      )}
    </Modal>
  );
}

function HistoryModal({ history, onClose }) {
  const { row, data } = history;
  return (
    <Modal title={`Riwayat kehadiran · ${row.name.trim()}`} onClose={onClose} wide actions={<button type="button" className="btn btn-secondary" onClick={onClose}>Tutup</button>}>
      {!data ? <div className={styles.loading}><Loader2 className={styles.spin} /></div> : (
        <>
          <div className={styles.miniStats}>
            {['HADIR', 'SAKIT', 'IZIN', 'ALFA'].map(k => <div key={k}><b className={styles[`text${k}`]}>{data.counts[k]}</b><span>{STATUS[k]}</span></div>)}
          </div>
          {data.days.length ? (
            <ul className={styles.list}>
              {data.days.map((d, i) => (
                <li key={i} className={styles.listRow}>
                  <div className={styles.grow}>
                    <b>{d.session?.title}</b>
                    <span className={styles.muted}>{longDate(d.date)} · {TYPE_LABEL[d.session?.type] || 'Tambahan'}</span>
                  </div>
                  <span className={styles.muted}>{d.status === 'HADIR' ? `${d.checkIn || '?'} – ${d.checkOut || '?'}` : d.note || ''}</span>
                  <StatusPill status={d.status} auto={d.auto} />
                </li>
              ))}
            </ul>
          ) : <p className={styles.muted}>Belum ada data kehadiran.</p>}
        </>
      )}
    </Modal>
  );
}

// ─── ID Card ────────────────────────────────────────────────────────────────

function IdCardTab({ isManager }) {
  const [cards, setCards] = useState(null);
  const [q, setQ] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // hasil dry run impor
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const load = useCallback(() => {
    A.getIdCards().then(r => setCards(r.data)).catch(e => toast.error(errMsg(e, 'Gagal memuat ID Card')));
  }, []);
  useEffect(load, [load]);

  const download = async () => {
    try {
      const r = await A.exportIdCardRoster();
      saveBlob(r.data, `Daftar_ID_Card_PIKR_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) { toast.error(errMsg(e, 'Gagal mengunduh Excel')); }
  };

  const pickFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const r = await A.importIdCardRoster(f, true);
      setFile(f);
      setPreview(r.data);
    } catch (err) { toast.error(errMsg(err, 'Gagal membaca file Excel')); }
  };

  const applyImport = async () => {
    try {
      const r = await A.importIdCardRoster(file, false);
      toast.success(`${r.data.saved} kode ID Card disimpan`);
      setPreview(null);
      setFile(null);
      load();
    } catch (e) { toast.error(errMsg(e, 'Gagal mengimpor')); }
  };

  const doReset = async () => {
    try {
      const r = await A.resetIdCardCodes();
      toast.success(r.data.message);
      setResetOpen(false);
      setConfirmText('');
      load();
    } catch (e) { toast.error(errMsg(e, 'Gagal mengosongkan kode')); }
  };

  const needle = q.toLowerCase();
  const shown = (cards || []).filter(c => !q || c.name.toLowerCase().includes(needle) || c.memberCode?.toLowerCase().includes(needle));
  const withCode = (cards || []).filter(c => c.memberCode).length;

  return (
    <section className={styles.card}>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} />
          <input placeholder="Cari nama / kode" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={download}><Download size={16} /> Ekspor Excel</button>
        {isManager && (
          <>
            <label className="btn btn-primary">
              <Upload size={16} /> Impor Excel
              <input type="file" accept=".xlsx" hidden onChange={pickFile} />
            </label>
            <button className="btn btn-secondary" onClick={() => setResetOpen(true)} disabled={!withCode}>
              <Trash2 size={16} /> Hapus semua kode
            </button>
          </>
        )}
      </div>
      <p className={styles.footnote} style={{ marginTop: 0 }}>
        <b>{withCode}</b> dari <b>{cards?.length ?? 0}</b> anggota aktif sudah punya kode ID Card.
        Ekspor Excel, isi kolom <code>Kode ID Card</code> (mis. <code>PIKR_0001-26</code>), lalu impor kembali.
        File yang sama dipilih di aplikasi ID Card Generator untuk membuat kartunya.
      </p>
      {!cards ? <div className={styles.loading}><Loader2 className={styles.spin} /></div> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Kode barcode</th><th>Nama</th><th>Kelas</th><th>Link QR (biodata)</th></tr></thead>
            <tbody>
              {shown.map(c => (
                <tr key={c.id}>
                  <td>{c.memberCode ? <code className={styles.code}>{c.memberCode}</code> : <span className={styles.muted}>belum ada</span>}</td>
                  <td><div className={styles.nameCell}><Avatar name={c.name} photo={c.photoPath} size={30} /><b>{c.name}</b></div></td>
                  <td>{c.className}</td>
                  <td><a className={styles.link} href={`/@${c.slug}`} target="_blank" rel="noreferrer">/@{c.slug} <ExternalLink size={12} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview && (
        <Modal title="Pratinjau impor ID Card" onClose={() => setPreview(null)} wide actions={<>
          <button className="btn btn-secondary" onClick={() => setPreview(null)}>Batal</button>
          <button className="btn btn-primary" onClick={applyImport} disabled={!preview.changed}><Check size={16} /> Simpan {preview.changed} kode</button>
        </>}>
          <p>
            <b>{preview.changed}</b> kode akan disimpan, <b>{preview.same}</b> sudah sama,{' '}
            <b>{preview.skipped}</b> baris tanpa kode dilewati, <b>{preview.errors.length}</b> bermasalah.
          </p>
          {preview.detail.length > 0 && (
            <>
              <h4 className={styles.subTitle}>Akan diubah:</h4>
              <ul className={styles.list}>
                {preview.detail.map(d => (
                  <li key={d.id} className={styles.listRow}>
                    <span className={styles.grow}><b>{d.name}</b></span>
                    <span className={styles.muted}>{d.before || 'belum ada'} →</span> <code className={styles.code}>{d.code}</code>
                  </li>
                ))}
              </ul>
            </>
          )}
          {preview.errors.length > 0 && (
            <>
              <h4 className={styles.subTitle}>Bermasalah (tidak disimpan):</h4>
              <ul className={styles.list}>
                {preview.errors.map((u, i) => (
                  <li key={i} className={styles.listRow}>
                    <span className={styles.grow}><b>Baris {u.line}: {u.nama}</b><div className={styles.muted}>{u.alasan}</div></span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      )}

      {resetOpen && (
        <Modal title="Hapus semua kode ID Card?" onClose={() => setResetOpen(false)} actions={<>
          <button className="btn btn-secondary" onClick={() => setResetOpen(false)}>Batal</button>
          <button className="btn btn-primary" onClick={doReset} disabled={confirmText !== 'HAPUS'}><Trash2 size={16} /> Hapus semua kode</button>
        </>}>
          <p>
            Kode ID Card <b>{withCode} anggota</b> akan dikosongkan. ID Card yang sudah dicetak dengan kode lama
            tidak akan terbaca lagi sampai kode baru diisi. Data anggota lain tidak berubah.
          </p>
          <p className={styles.muted}>Ketik <b>HAPUS</b> untuk melanjutkan.</p>
          <input className="form-input" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="HAPUS" autoFocus />
        </Modal>
      )}
    </section>
  );
}

// ─── Pengaturan ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const [s, setS] = useState(null);
  const [pw, setPw] = useState('');
  const [dateDraft, setDateDraft] = useState({ date: '', title: '', time: '15:00', description: '' });

  useEffect(() => {
    A.getAbsenSettings().then(r => setS(r.data)).catch(e => toast.error(errMsg(e, 'Gagal memuat pengaturan')));
  }, []);

  const saveRoutine = async (e) => {
    e.preventDefault();
    try {
      const r = await A.updateAbsenSettings({ wajibDay: s.wajibDay, wajibTime: s.wajibTime, wajibTitle: s.wajibTitle });
      setS(r.data);
      toast.success(`Pertemuan rutin: ${r.data.wajibDayName} ${r.data.wajibTime}`);
    } catch (err) { toast.error(errMsg(err, 'Gagal menyimpan')); }
  };

  const saveDates = async (list) => {
    try {
      const r = await A.updateAbsenSettings({ kegiatanWajib: list });
      setS(r.data);
      toast.success('Kegiatan wajib disimpan');
      return true;
    } catch (err) { toast.error(errMsg(err, 'Gagal menyimpan kegiatan wajib')); return false; }
  };

  const addDate = async (e) => {
    e.preventDefault();
    const list = [...s.kegiatanWajib, { ...dateDraft, title: dateDraft.title.trim() }];
    if (await saveDates(list)) setDateDraft({ date: '', title: '', time: dateDraft.time, description: '' });
  };

  const resetPw = async (e) => {
    e.preventDefault();
    try {
      const r = await A.resetAbsenPassword(pw);
      toast.success(r.data.message);
      setPw('');
    } catch (err) { toast.error(errMsg(err, 'Gagal mereset password')); }
  };

  if (!s) return <div className={styles.loading}><Loader2 className={styles.spin} /></div>;
  const today = wibToday();

  return (
    <div className={styles.stack}>
      <div className={styles.twoCol}>
        <form className={styles.card} onSubmit={saveRoutine}>
          <h3 className={styles.cardTitle}><CalendarDays size={16} /> Pertemuan rutin</h3>
          <p className={styles.muted}>Dibuat otomatis setiap minggu di hari ini. Anggota yang tidak absen dihitung Alfa.</p>
          <div className={styles.timeRow}>
            <label>Hari
              <select className="form-select" value={s.wajibDay} onChange={e => setS({ ...s, wajibDay: Number(e.target.value) })}>
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </label>
            <label>Jam<input type="time" className="form-input" value={s.wajibTime} onChange={e => setS({ ...s, wajibTime: e.target.value })} required /></label>
          </div>
          <div className="form-group">
            <label className="form-label">Judul pertemuan</label>
            <input className="form-input" maxLength={100} value={s.wajibTitle} onChange={e => setS({ ...s, wajibTitle: e.target.value })} required />
          </div>
          <button className="btn btn-primary" type="submit">Simpan pertemuan</button>
        </form>

        <form className={styles.card} onSubmit={resetPw}>
          <h3 className={styles.cardTitle}><KeyRound size={16} /> Akun web absen</h3>
          <p className={styles.muted}>Username petugas: <code className={styles.code}>{s.username}</code>. Reset password bila lupa (tidak perlu password lama). Beri tahu petugas lain password barunya.</p>
          <div className="form-group">
            <label className="form-label">Password baru (min. 8 karakter)</label>
            <input type="password" className="form-input" minLength={8} value={pw} onChange={e => setPw(e.target.value)} required autoComplete="new-password" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={pw.length < 8}>Reset password</button>
        </form>
      </div>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}><CalendarDays size={16} /> Kegiatan wajib</h3>
        <p className={styles.muted}>Tanggal tertentu di luar pertemuan rutin (mis. latihan, lomba, pelantikan). Boleh lebih dari satu. Di tanggal ini kegiatan dibuat otomatis dan anggota yang tidak absen dihitung Alfa.</p>

        <form className={styles.dateForm} onSubmit={addDate}>
          <input type="date" className="form-input" value={dateDraft.date} onChange={e => setDateDraft({ ...dateDraft, date: e.target.value })} required aria-label="Tanggal" />
          <input className="form-input" placeholder="Judul kegiatan" maxLength={100} value={dateDraft.title} onChange={e => setDateDraft({ ...dateDraft, title: e.target.value })} required />
          <input type="time" className="form-input" value={dateDraft.time} onChange={e => setDateDraft({ ...dateDraft, time: e.target.value })} aria-label="Jam" />
          <button className="btn btn-primary" type="submit"><Plus size={16} /> Tambah</button>
        </form>

        {s.kegiatanWajib.length === 0 ? (
          <p className={styles.footnote}>Belum ada kegiatan wajib bertanggal.</p>
        ) : (
          <ul className={styles.list}>
            {[...s.kegiatanWajib].sort((x, y) => y.date.localeCompare(x.date)).map((k) => (
              <li key={k.date} className={styles.listRow}>
                <div className={styles.grow}>
                  <b>{k.title}</b>
                  <span className={styles.muted}>{longDate(k.date)}{k.time ? ` · ${k.time}` : ''}</span>
                </div>
                <span className={`${styles.typeBadge} ${k.date >= today ? styles.typeWajib : ''}`}>{k.date >= today ? 'Akan datang' : 'Selesai'}</span>
                <button type="button" className="btn btn-ghost btn-sm text-danger" title="Hapus dari daftar"
                  onClick={() => saveDates(s.kegiatanWajib.filter((x) => x.date !== k.date))}><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ─── Modal sederhana ────────────────────────────────────────────────────────

/** Popup halaman Absensi: isi menggulir, tombol di `actions` tampil di bar bawah yang selalu terlihat. */
function Modal({ title, children, onClose, wide, actions }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${wide ? styles.modalWide : ''} modal-shell`} role="dialog" aria-modal="true">
        <div className={styles.modalHead}>
          <h3>{title}</h3>
          <button className={styles.close} onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className={`${styles.modalBody} modal-scroll`}>{children}</div>
        {actions && <div className="modal-bar">{actions}</div>}
      </div>
    </div>
  );
}

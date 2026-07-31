import { useState, useEffect, useMemo } from 'react';
import {
  getCandidates,
  updateCandidate,
  deleteCandidate,
  promoteCandidateToMember,
  sendNotifications,
  getSettings,
  closeSession,
  openSession,
  exportExcel,
  exportSelectionExcel,
  exportJSON,
  randomizeSelectionDays,
  sendSelectionNotifications,
  batchUpdateAttendance,
  exportAttendanceExcel,
  getSelectionEvaluators,
  getSelectionScores,
  updateSelectionScore,
  toggleSelectionLock,
  exportPOSScoreExcel
} from '@/api/admin';
import { useUIStore } from '@/stores/uiStore';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import {
  Edit, Trash2, Search, CheckCircle, XCircle, AlertCircle, ToggleLeft, ToggleRight,
  FileSpreadsheet, FileJson, ChevronLeft, ChevronRight, UserCheck, Calendar,
  Send, Paperclip, Shuffle, User, Layers, CheckSquare, Square, X, Key, Eye, EyeOff, ShieldAlert, Lock, Unlock, Award, FileText, Download, Target, GraduationCap, Star, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminPendaftaranPage.module.css';
import { downloadBlob } from '@/utils/truncate';

const ITEMS_PER_PAGE = 100;
const DAYS_OF_WEEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAY_FULL_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// ─── Visual Calendar Picker Component ─────────────────────────────────────
function SelectionCalendarPicker({ selectedDate, selectedDay, onSelectDate }) {
  const parseDate = (dStr) => {
    if (!dStr) return new Date(2026, 6, 29);
    const parsed = new Date(dStr);
    return isNaN(parsed.getTime()) ? new Date(2026, 6, 29) : parsed;
  };

  const initial = parseDate(selectedDate);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    const updated = parseDate(selectedDate);
    setViewYear(updated.getFullYear());
    setViewMonth(updated.getMonth());
  }, [selectedDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      arr.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d);
    }
    return arr;
  }, [viewYear, viewMonth, firstDayOfWeek, daysInMonth]);

  const activeDate = parseDate(selectedDate);
  const isSameDate = (dayNum) => {
    if (!dayNum) return false;
    return (
      activeDate.getDate() === dayNum &&
      activeDate.getMonth() === viewMonth &&
      activeDate.getFullYear() === viewYear
    );
  };

  const handleDayClick = (dayNum) => {
    if (!dayNum) return;
    const newDateObj = new Date(viewYear, viewMonth, dayNum);
    const dayName = DAY_FULL_NAMES[newDateObj.getDay()];
    const monthName = MONTH_NAMES[viewMonth];

    const yyyy = viewYear;
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const formattedDateStr = `${yyyy}-${mm}-${dd}`;
    const formattedDayStr = `${dayName}, ${dayNum} ${monthName} ${viewYear}`;

    onSelectDate({
      selectionDate: formattedDateStr,
      selectionDay: formattedDayStr
    });
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <button type="button" onClick={handlePrevMonth} className={styles.calendarNavBtn}>
          <ChevronLeft size={16} />
        </button>
        <div className={styles.calendarTitle}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>
        <button type="button" onClick={handleNextMonth} className={styles.calendarNavBtn}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={styles.calendarWeekDays}>
        {DAYS_OF_WEEK.map(dw => (
          <div key={dw}>{dw}</div>
        ))}
      </div>

      <div className={styles.calendarGrid}>
        {calendarDays.map((dayNum, idx) => (
          dayNum === null ? (
            <div key={`empty-${idx}`} className={styles.calendarDayEmpty} />
          ) : (
            <button
              key={dayNum}
              type="button"
              onClick={() => handleDayClick(dayNum)}
              className={`${styles.calendarDayCell} ${isSameDate(dayNum) ? styles.calendarDaySelected : ''}`}
            >
              {dayNum}
            </button>
          )
        ))}
      </div>

      {selectedDay && (
        <div className={styles.calendarFooterSelected}>
          <span>📅 Hari Terpilih:</span>
          <span>{selectedDay}</span>
        </div>
      )}
    </div>
  );
}

export default function AdminPendaftaranPage() {
  const getAvgBadgeClass = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '';
    if (val >= 7.5) return styles.avgHigh;
    if (val >= 6.0) return styles.avgMed;
    return styles.avgLow;
  };

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Sub-Tab State: 'data' | 'seleksi'
  // activeSubTab superseded by mainMode

  // ─── Main Mode & Selection POS State ─────────────────────────────────────
  const [mainMode, setMainMode] = useState('pendaftaran'); // 'pendaftaran' | 'seleksi' | 'kelulusan'
  const [seleksiSubTab, setSeleksiSubTab] = useState('jadwal'); // 'jadwal' | 'kehadiran' | 'pos1' | 'pos2' | 'pos3' | 'rekap'
  const [filterHariSeleksi, setFilterHariSeleksi] = useState('');
  const [filterStatusPresensi, setFilterStatusPresensi] = useState('');
  const [evaluators, setEvaluators] = useState({ members: [], admins: [] });
  const [scoresMap, setScoresMap] = useState({});
  const [loadingScores, setLoadingScores] = useState(false);
  const [savingScoreCandidateId, setSavingScoreCandidateId] = useState(null);
  const [posEvaluator, setPosEvaluator] = useState({ pos1: '', pos2: '', pos3: '' });

  const uniqueSelectionDays = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => {
      if (c.selectionDay && c.selectionDay.trim()) {
        set.add(c.selectionDay.trim());
      }
    });
    return Array.from(set).sort();
  }, [candidates]);

  const handleSingleAttendance = async (candidate, targetAttendance) => {
    try {
      await updateCandidate(candidate.id, { attendanceStatus: targetAttendance });
      setCandidates(prev => prev.map(item => item.id === candidate.id ? {
        ...item,
        attendanceStatus: targetAttendance
      } : item));
      if (targetAttendance === 'TIDAK_HADIR') {
        toast.error(`${candidate.name} ditandai TIDAK HADIR`);
      } else if (targetAttendance === 'HADIR') {
        toast.success(`${candidate.name} ditandai HADIR seleksi`);
      } else {
        toast.success(`Presensi ${candidate.name} di-reset`);
      }
    } catch {
      toast.error('Gagal memperbarui presensi peserta');
    }
  };

  const handleBatchAttendance = async (targetAttendance, targetCandidateIds) => {
    if (!targetCandidateIds || targetCandidateIds.length === 0) {
      toast.error('Tidak ada peserta yang terpilih');
      return;
    }
    try {
      await batchUpdateAttendance({ candidateIds: targetCandidateIds, attendanceStatus: targetAttendance });
      setCandidates(prev => prev.map(item => targetCandidateIds.includes(item.id) ? {
        ...item,
        attendanceStatus: targetAttendance
      } : item));
      const label = targetAttendance === 'HADIR' ? 'HADIR' : (targetAttendance === 'TIDAK_HADIR' ? 'TIDAK HADIR' : 'BELUM PRESENSI');
      toast.success(`Berhasil menandai ${targetCandidateIds.length} peserta ${label}.`);
    } catch {
      toast.error('Gagal memperbarui presensi massal');
    }
  };

  const handleExportAttendance = async () => {
    try {
      const res = await exportAttendanceExcel();
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PRESENSI_SELEKSI_${new Date().getFullYear()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Rekapan Presensi berhasil dieksport!');
    } catch {
      toast.error('Gagal mengekspor presensi ke Excel');
    }
  };

  const fetchSelectionData = async () => {
    setLoadingScores(true);
    try {
      const [evalRes, scoresRes] = await Promise.all([
        getSelectionEvaluators(),
        getSelectionScores()
      ]);
      setEvaluators(evalRes.data || { members: [], admins: [] });
      const map = {};
      (scoresRes.data || []).forEach(item => {
        map[item.candidateId] = item;
      });
      setScoresMap(map);
    } catch (err) {
      console.error('Error loading selection data:', err);
    } finally {
      setLoadingScores(false);
    }
  };

  useEffect(() => {
    if (mainMode === 'seleksi') {
      fetchSelectionData();
    }
  }, [mainMode]);

  const handleScoreInputChange = (candidateId, field, val) => {
    const num = val === '' ? null : Math.min(10, Math.max(1, parseFloat(val) || 0));
    setScoresMap(prev => {
      const existing = prev[candidateId] || { candidateId };
      const updated = { ...existing, [field]: num };

      const parse = (v) => (v !== null && v !== undefined && v !== '' ? parseFloat(v) : null);

      // POS 1 Avg (9 kriteria)
      const p1 = [parse(updated.pos1Comm), parse(updated.pos1Trust), parse(updated.pos1Motiv), parse(updated.pos1Komitmen), parse(updated.pos1KerjaSama), parse(updated.pos1Kepemimpinan), parse(updated.pos1Pengetahuan), parse(updated.pos1Etika), parse(updated.pos1Bonus)].filter(v => v !== null && !isNaN(v));
      updated.pos1Avg = p1.length > 0 ? Math.round((p1.reduce((a,b)=>a+b,0)/p1.length)*100)/100 : null;

      // POS 2 Avg
      const p2 = [parse(updated.pos2Creativity), parse(updated.pos2Mastery), parse(updated.pos2Pres), parse(updated.pos2Orig), parse(updated.pos2Potency), parse(updated.pos2Confidence)].filter(v => v !== null && !isNaN(v));
      updated.pos2Avg = p2.length > 0 ? Math.round((p2.reduce((a,b)=>a+b,0)/p2.length)*100)/100 : null;

      // POS 3 Avg (7 kriteria)
      const p3 = [parse(updated.pos3Pemahaman), parse(updated.pos3Analysis), parse(updated.pos3Solution), parse(updated.pos3Empati), parse(updated.pos3PublicSpk), parse(updated.pos3Logika), parse(updated.pos3Pengetahuan)].filter(v => v !== null && !isNaN(v));
      updated.pos3Avg = p3.length > 0 ? Math.round((p3.reduce((a,b)=>a+b,0)/p3.length)*100)/100 : null;

      // Final Score (33.3% per POS)
      const avgs = [updated.pos1Avg, updated.pos2Avg, updated.pos3Avg].filter(v => v !== null);
      updated.finalScore = avgs.length > 0 ? Math.round((avgs.reduce((a,b)=>a+b,0)/avgs.length)*100)/100 : null;

      return { ...prev, [candidateId]: updated };
    });
  };

  const handleSaveCandidateScore = async (candidateId, posName) => {
    setSavingScoreCandidateId(candidateId);
    try {
      const obj = scoresMap[candidateId] || {};
      const payload = { ...obj };
      const res = await updateSelectionScore(candidateId, payload);
      setScoresMap(prev => ({ ...prev, [candidateId]: res.data.score }));
    } catch {
      // silent on blur saves
    } finally {
      setSavingScoreCandidateId(null);
    }
  };

  // Fix race condition: evaluator dipilih langsung simpan dengan nilai fresh
  const handleEvaluatorChange = async (candidateId, posName, evaluatorValue) => {
    setScoresMap(prev => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || { candidateId }),
        [`${posName}Evaluator`]: evaluatorValue
      }
    }));
    try {
      const obj = scoresMap[candidateId] || {};
      const payload = { ...obj, [`${posName}Evaluator`]: evaluatorValue };
      await updateSelectionScore(candidateId, payload);
      toast.success('Penyeleksi berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan penyeleksi');
    }
  };

  const handleToggleLockState = async (candidateId, pos, targetCompleted) => {
    try {
      const obj = scoresMap[candidateId] || {};
      await updateSelectionScore(candidateId, obj);
      const res = await toggleSelectionLock(candidateId, { pos, isCompleted: targetCompleted });
      toast.success(res.data.message || `Status penilaian di-${targetCompleted ? 'lock' : 'unlock'}`);
      fetchSelectionData();
    } catch {
      toast.error('Gagal mengubah status penilaian');
    }
  };

  const handleExportPOS = async (posType) => {
    try {
      const toastId = toast.loading(`Mengekspor Excel POS ${posType.toUpperCase()}...`);
      const res = await exportPOSScoreExcel(posType);
      const filename = `RAPOR_SELEKSI_POS_${posType.toUpperCase()}_PIK-R_${new Date().getFullYear()}.xlsx`;
      downloadBlob(res.data, filename);
      toast.success('File Excel Rapor berhasil diunduh!', { id: toastId });
    } catch {
      toast.error('Gagal mengunduh Excel');
    }
  };

  // Registration Session State
  const [isSessionOpen, setIsSessionOpen] = useState(true);
  const [savingSession, setSavingSession] = useState(false);

  // ─── Table Multiple Selected Action State ─────────────────────────────
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  // ─── Modal 1: 3-Tab Candidate Detail/Edit Modal State ──────────────────
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('biodata'); // 'biodata' | 'seleksi' | 'status'
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    nisn: '',
    className: '',
    asalSekolah: '',
    email: '',
    whatsappNumber: '',
    gender: '',
    reason: '',
    status: 'PENDING',
    selectionDay: '',
    selectionDate: '',
    selectionNotified: false
  });

  // Single WA Notification State inside Modal
  const [singleWaText, setSingleWaText] = useState('');
  const [singlePdfFiles, setSinglePdfFiles] = useState([]);
  const [singleDebugMode, setSingleDebugMode] = useState(false);
  const [singleDebugNumber, setSingleDebugNumber] = useState('');
  const [sendingSingleWa, setSendingSingleWa] = useState(false);

  // ─── Modal 2: Atur Hari Seleksi Massal Modal State ─────────────────────
  const [randomizeModalOpen, setRandomizeModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState('proceed'); // 'proceed' | 'exclude' | 'all'
  const [selectedChecklistIds, setSelectedChecklistIds] = useState([]);
  const [checklistSearch, setChecklistSearch] = useState('');

  const [day1Name, setDay1Name] = useState('Rabu, 29 Juli 2026');
  const [day1Date, setDay1Date] = useState('2026-07-29');
  const [day1Quota, setDay1Quota] = useState('25');

  const [day2Name, setDay2Name] = useState('Kamis, 30 Juli 2026');
  const [day2Date, setDay2Date] = useState('2026-07-30');
  const [day2Quota, setDay2Quota] = useState('26');

  const [savingRandomize, setSavingRandomize] = useState(false);

  // ─── Modal 3: Kirim WA Massal + PDF Modal State ─────────────────────────
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [massWaTemplate, setMassWaTemplate] = useState('');
  const [massPdfFiles, setMassPdfFiles] = useState([]);
  const [massDebugMode, setMassDebugMode] = useState(false);
  const [massDebugNumber, setMassDebugNumber] = useState('');
  const [targetBatchIds, setTargetBatchIds] = useState([]);
  const [sendingMassWa, setSendingMassWa] = useState(false);

  const { openConfirm } = useUIStore();

  useEffect(() => {
    fetchSessionAndCandidates();
  }, []);

  const fetchSessionAndCandidates = async () => {
    setLoading(true);
    try {
      const settingsRes = await getSettings();
      const settingsList = settingsRes.data?.settings || [];
      const sessionSetting = settingsList.find((s) => s.key === 'REGISTRATION_SESSION');
      if (sessionSetting?.value) {
        const sessionData = JSON.parse(sessionSetting.value);
        setIsSessionOpen(sessionData.status === 'open');
      } else {
        setIsSessionOpen(true);
      }

      const candRes = await getCandidates();
      setCandidates(candRes.data || []);
    } catch {
      toast.error('Gagal memuat data pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Registration Session
  const handleToggleSession = async () => {
    const actionText = isSessionOpen 
      ? 'Menutup sesi akan memindahkan seluruh peserta LULUS ke data Anggota Tetap (nama diformat menjadi Title Case), lalu memicu pembersihan pendaftaran.' 
      : 'Membuka sesi pendaftaran baru akan membersihkan data pendaftaran lama.';

    openConfirm({
      title: `${isSessionOpen ? 'Tutup' : 'Buka'} Sesi Pendaftaran`,
      message: `${actionText} Apakah Anda yakin?`,
      danger: isSessionOpen,
      onConfirm: async () => {
        setSavingSession(true);
        try {
          if (isSessionOpen) {
            const res = await closeSession();
            toast.success(res.data.message || 'Sesi pendaftaran ditutup.');
          } else {
            await openSession();
            toast.success('Sesi pendaftaran baru dibuka.');
          }
          await fetchSessionAndCandidates();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal memperbarui sesi.');
        } finally {
          setSavingSession(false);
        }
      },
    });
  };

  // ─── Filtering & Pagination Logic ─────────────────────────────────────
  const kelasOptions = useMemo(() => [...new Set(candidates.map(c => c.className).filter(Boolean))].sort(), [candidates]);

  const filteredCandidates = useMemo(() => {
    const list = candidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.nisn || '').includes(search);

      const matchesStatus = statusFilter ? c.status === statusFilter : true;
      const matchesKelas = filterKelas ? c.className === filterKelas : true;

      return matchesSearch && matchesStatus && matchesKelas;
    });

    if (mainMode === 'seleksi') {
      return [...list].sort((a, b) => {
        const hasDayA = Boolean(a.selectionDay || a.selectionDate);
        const hasDayB = Boolean(b.selectionDay || b.selectionDate);

        if (hasDayA && !hasDayB) return -1;
        if (!hasDayA && hasDayB) return 1;

        if (hasDayA && hasDayB) {
          const dateA = a.selectionDate ? new Date(a.selectionDate).getTime() : 0;
          const dateB = b.selectionDate ? new Date(b.selectionDate).getTime() : 0;

          if (dateA && dateB && dateA !== dateB) {
            return dateA - dateB;
          }

          if (a.selectionDay && b.selectionDay) {
            return a.selectionDay.localeCompare(b.selectionDay);
          }
        }

        return a.name.localeCompare(b.name);
      });
    }

    return list;
  }, [candidates, search, statusFilter, filterKelas, mainMode]);

  const filteredKehadiranCandidates = useMemo(() => {
    return filteredCandidates.filter(c => {
      if (filterHariSeleksi && (c.selectionDay || '').trim() !== filterHariSeleksi.trim()) {
        return false;
      }
      if (filterStatusPresensi) {
        const att = c.attendanceStatus || 'BELUM_KONFIRMASI';
        if (att !== filterStatusPresensi) return false;
      }
      return true;
    });
  }, [filteredCandidates, filterHariSeleksi, filterStatusPresensi]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE));
  const paginatedCandidates = useMemo(() => {
    return filteredCandidates.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredCandidates, currentPage]);

  const handlePageChange = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const handleSearchChange = (val) => { setSearch(val); setCurrentPage(1); };
  const handleStatusChange = (val) => { setStatusFilter(val); setCurrentPage(1); };
  const handleKelasChange = (val) => { setFilterKelas(val); setCurrentPage(1); };

  // ─── Table Multiple Selected Action Handlers ──────────────────────────
  const handleToggleSelectRow = (id) => {
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPage = (shouldSelectAll) => {
    const pageIds = paginatedCandidates.map(c => c.id);
    if (shouldSelectAll) {
      setSelectedRowIds(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      setSelectedRowIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const isAllPageSelected = useMemo(() => {
    if (paginatedCandidates.length === 0) return false;
    return paginatedCandidates.every(c => selectedRowIds.includes(c.id));
  }, [paginatedCandidates, selectedRowIds]);

  const handleBatchDelete = () => {
    if (selectedRowIds.length === 0) return;
    openConfirm({
      title: `Hapus ${selectedRowIds.length} Peserta Terpilih`,
      message: `Apakah Anda yakin ingin menghapus ${selectedRowIds.length} peserta terpilih secara permanen?`,
      danger: true,
      onConfirm: async () => {
        try {
          for (const id of selectedRowIds) {
            await deleteCandidate(id);
          }
          toast.success(`${selectedRowIds.length} peserta berhasil dihapus.`);
          setSelectedRowIds([]);
          fetchSessionAndCandidates();
        } catch {
          toast.error('Gagal menghapus peserta terpilih.');
        }
      }
    });
  };

  const openBatchWaModal = () => {
    if (selectedRowIds.length === 0) {
      toast.error('Pilih minimal 1 peserta di tabel terlebih dahulu.');
      return;
    }
    setTargetBatchIds(selectedRowIds);
    openMassWaModal();
  };

  // ─── Modal 1 Handlers (Candidate Edit / Detail) ───────────────────────
  const openEditModal = (candidate, initialTab = 'biodata') => {
    setSelectedCandidate(candidate);
    setModalTab(initialTab);
    setEditForm({
      name: candidate.name || '',
      nisn: candidate.nisn || '',
      className: candidate.className || '',
      asalSekolah: candidate.asalSekolah || '',
      email: candidate.email || '',
      whatsappNumber: candidate.whatsappNumber || '',
      gender: candidate.gender || 'Laki-laki',
      reason: candidate.reason || '',
      status: candidate.status || 'PENDING',
      selectionDay: candidate.selectionDay || 'Rabu, 29 Juli 2026',
      selectionDate: candidate.selectionDate ? candidate.selectionDate.split('T')[0] : '2026-07-29',
      selectionNotified: candidate.selectionNotified || false
    });

    const defaultSingleMsg =
      `Halo {nama} ({kelas}),\n\n` +
      `Kamu dijadwalkan mengikuti *Tahap Seleksi Calon Anggota PIK-R MANSEKU* pada:\n` +
      `📅 *Hari/Tanggal:* ${candidate.selectionDay || 'Rabu, 29 Juli 2026'}\n` +
      `📍 *Lokasi:* Ruang PIK-R MAN 1 Muara Enim\n\n` +
      `Harap hadir tepat waktu ya! 💪`;

    setSingleWaText(defaultSingleMsg);
    setSinglePdfFiles([]);
    setSingleDebugMode(false);
    setSingleDebugNumber('');
    setShowPassword(false);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.whatsappNumber.trim()) {
      toast.error('Kolom Nama, Email, dan WhatsApp wajib diisi.');
      return;
    }

    try {
      await updateCandidate(selectedCandidate.id, editForm);
      toast.success('Data peserta & hari seleksi berhasil diperbarui.');
      setEditModalOpen(false);
      fetchSessionAndCandidates();
    } catch {
      toast.error('Gagal memperbarui data peserta.');
    }
  };

  const handlePromoteCandidate = (candidate) => {
    setEditModalOpen(false);
    openConfirm({
      title: 'Promosikan ke Anggota Tetap',
      message: `Promosikan "${candidate.name}" ke data Anggota Tetap? Peserta ini akan dinyatakan LULUS, namanya diubah ke Title Case, dan otomatis menerima notifikasi WhatsApp kelulusan.`,
      onConfirm: async () => {
        try {
          const res = await promoteCandidateToMember(candidate.id);
          toast.success(res.data.message || `${candidate.name} berhasil dipromosikan!`);
          fetchSessionAndCandidates();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal mempromosikan peserta.');
        }
      },
    });
  };

  const handleDeleteCandidate = (id, name) => {
    openConfirm({
      title: 'Hapus Calon Peserta',
      message: `Yakin menghapus pendaftar "${name}" secara permanen?`,
      danger: true,
      onConfirm: async () => {
        try {
          await deleteCandidate(id);
          toast.success('Pendaftar berhasil dihapus.');
          setEditModalOpen(false);
          fetchSessionAndCandidates();
        } catch {
          toast.error('Gagal menghapus pendaftar.');
        }
      },
    });
  };

  // Send Single WA in Modal Tab 2
  const handleSendSingleWa = async () => {
    if (!selectedCandidate) return;
    setSendingSingleWa(true);
    try {
      const formData = new FormData();
      formData.append('singleCandidateId', selectedCandidate.id);
      formData.append('template', singleWaText);
      if (singleDebugMode && singleDebugNumber.trim()) {
        formData.append('debugTargetNumber', singleDebugNumber.trim());
        formData.append('isDebugMode', 'true');
      }

      singlePdfFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const res = await sendSelectionNotifications(formData);
      toast.success(res.data.message || 'Pesan Notifikasi WA Seleksi berhasil dikirim!');
      setEditForm(prev => ({ ...prev, selectionNotified: true }));
      fetchSessionAndCandidates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim pesan WA.');
    } finally {
      setSendingSingleWa(false);
    }
  };

  // ─── Modal 2 Handlers (Atur Hari Seleksi Massal) ──────────────────────
  const openRandomizeModal = () => {
    const pendingIds = candidates.filter(c => c.status === 'PENDING').map(c => c.id);
    setSelectedChecklistIds(pendingIds);
    setSelectionMode('proceed');
    setChecklistSearch('');

    const half = Math.floor(pendingIds.length / 2);
    setDay1Quota(String(half));
    setDay2Quota(String(pendingIds.length - half));

    setRandomizeModalOpen(true);
  };

  const handleToggleChecklist = (id) => {
    setSelectedChecklistIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllChecklist = (shouldSelectAll) => {
    if (shouldSelectAll) {
      const allIds = candidates.filter(c => c.status === 'PENDING').map(c => c.id);
      setSelectedChecklistIds(allIds);
    } else {
      setSelectedChecklistIds([]);
    }
  };

  const checklistCandidates = useMemo(() => {
    return candidates.filter(c => {
      const q = checklistSearch.toLowerCase();
      return (
        c.status === 'PENDING' &&
        (c.name.toLowerCase().includes(q) || (c.nisn || '').includes(q) || c.className.toLowerCase().includes(q))
      );
    });
  }, [candidates, checklistSearch]);

  const targetCandidatesForSelection = useMemo(() => {
    const allPending = candidates.filter(c => c.status === 'PENDING');
    if (selectionMode === 'proceed') {
      return allPending.filter(c => selectedChecklistIds.includes(c.id));
    } else if (selectionMode === 'exclude') {
      return allPending.filter(c => !selectedChecklistIds.includes(c.id));
    }
    return allPending;
  }, [candidates, selectionMode, selectedChecklistIds]);

  const handleExecuteRandomize = async () => {
    if (targetCandidatesForSelection.length === 0) {
      toast.error('Tidak ada peserta yang terpilih untuk diatur hari seleksi.');
      return;
    }

    const q1 = parseInt(day1Quota) || 0;
    const q2 = parseInt(day2Quota) || 0;

    if (q1 + q2 === 0) {
      toast.error('Masukkan alokasi kuota minimal untuk salah satu hari seleksi.');
      return;
    }

    setSavingRandomize(true);
    try {
      const targetIds = targetCandidatesForSelection.map(c => c.id);
      const excludedIds = candidates
        .filter(c => c.status === 'PENDING' && !targetIds.includes(c.id))
        .map(c => c.id);

      const dayQuotas = [
        { day: day1Name.trim(), date: day1Date, quota: q1 },
        { day: day2Name.trim(), date: day2Date, quota: q2 }
      ];

      const res = await randomizeSelectionDays({
        targetCandidateIds: targetIds,
        excludedCandidateIds: excludedIds,
        dayQuotas
      });

      toast.success(res.data.message || 'Jadwal seleksi berhasil dialokasikan!');
      setRandomizeModalOpen(false);
      fetchSessionAndCandidates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengalokasikan jadwal seleksi.');
    } finally {
      setSavingRandomize(false);
    }
  };

  // ─── Modal 3 Handlers (Kirim WA Seleksi Massal + PDF) ─────────────────
  const openMassWaModal = () => {
    const defaultTemplate =
      `Halo {nama} ({kelas}),\n\n` +
      `Selamat! Kamu dijadwalkan untuk mengikuti *Tahap Seleksi Calon Anggota PIK-R MANSEKU* pada:\n` +
      `📅 *Hari/Tanggal:* {hari_seleksi}\n` +
      `📌 *NISN:* {nisn}\n` +
      `📍 *Lokasi:* Ruang PIK-R MAN 1 Muara Enim\n\n` +
      `Harap hadir tepat waktu dan membawa dokumen terlampir ya.\n\n` +
      `Semangat dan persiapkan dirimu sebaik mungkin! 💪`;

    setMassWaTemplate(defaultTemplate);
    setMassPdfFiles([]);
    setMassDebugMode(false);
    setMassDebugNumber('');
    setWaModalOpen(true);
  };

  const handleExecuteMassWa = async () => {
    let targetIds = targetBatchIds.length > 0
      ? targetBatchIds
      : candidates.filter(c => c.status === 'PENDING' && c.selectionDay).map(c => c.id);

    if (targetIds.length === 0) {
      toast.error('Belum ada peserta yang memiliki jadwal seleksi.');
      return;
    }

    setSendingMassWa(true);
    try {
      const formData = new FormData();
      formData.append('template', massWaTemplate);
      formData.append('candidateIds', JSON.stringify(targetIds));

      if (massDebugMode && massDebugNumber.trim()) {
        formData.append('debugTargetNumber', massDebugNumber.trim());
        formData.append('isDebugMode', 'true');
      }

      massPdfFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const res = await sendSelectionNotifications(formData);
      toast.success(res.data.message || 'Pengiriman WA seleksi massal berhasil dimulai!');
      setWaModalOpen(false);
      setTargetBatchIds([]);
      setSelectedRowIds([]);
      fetchSessionAndCandidates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim WA massal.');
    } finally {
      setSendingMassWa(false);
    }
  };

  // ─── Export Handlers ──────────────────────────────────────────────────
  const handleExportExcel = async () => {
    try {
      const res = await exportExcel();
      downloadBlob(res.data, 'rekap_pendaftaran_pikr.xlsx');
      toast.success('Data pendaftaran berhasil diexport ke Excel.');
    } catch {
      toast.error('Gagal mengeksport data.');
    }
  };

  const handleExportSelectionExcel = async () => {
    try {
      const res = await exportSelectionExcel();
      downloadBlob(res.data, 'jadwal_seleksi_pikr.xlsx');
      toast.success('Jadwal seleksi berhasil diexport ke Excel.');
    } catch {
      toast.error('Gagal mengeksport jadwal seleksi.');
    }
  };

  const handleExportJSON = async () => {
    try {
      const res = await exportJSON();
      downloadBlob(res.data, 'akun_pendaftaran.json');
      toast.success('Data pendaftaran berhasil diexport ke JSON.');
    } catch {
      toast.error('Gagal mengeksport data.');
    }
  };

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Manajemen Pendaftaran & Penyeleksian"
        subtitle={`${candidates.length} total calon peserta terdaftar`}
      >
        <div className={styles.headerActions}>
          <button
            onClick={handleToggleSession}
            disabled={savingSession}
            className={`btn ${isSessionOpen ? 'btn-danger' : 'btn-primary'} btn-sm`}
          >
            {isSessionOpen ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {isSessionOpen ? 'Tutup Sesi Pendaftaran' : 'Buka Sesi Pendaftaran'}
          </button>
        </div>
      </AdminHeader>

      <div className={styles.body}>
        {/* Banner Status Sesi */}
        <div className={`${styles.sessionBanner} ${isSessionOpen ? styles.openBanner : styles.closedBanner}`}>
          <div className={styles.bannerIcon}>
            <AlertCircle size={20} />
          </div>
          <div className={styles.bannerText}>
            <strong style={{ display: 'block', marginBottom: '2px' }}>
              Status Sesi Pendaftaran: {isSessionOpen ? 'TERBUKA' : 'DITUTUP'}
            </strong>
            <span style={{ fontSize: '0.8rem', color: isSessionOpen ? '#166534' : '#92400e' }}>
              {isSessionOpen
                ? 'Calon anggota dapat mendaftar secara online melalui halaman /daftar.'
                : 'Pendaftaran ditutup. Sesi ini siap diarsipkan atau mempromosikan peserta LULUS ke Anggota Tetap.'}
            </span>
          </div>
        </div>

        {/* ── Hero KPI Stat Cards Grid (3 Cards Compact) ── */}
        <div className={styles.heroStatsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIconBadge} ${styles.iconBlue}`}>
              <UserCheck size={20} />
            </div>
            <div className={styles.statMeta}>
              <span className={styles.statValue}>{candidates.length}</span>
              <span className={styles.statLabel}>Total Pendaftar</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBadge} ${isSessionOpen ? styles.iconGreen : styles.iconAmber}`}>
              {isSessionOpen ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className={styles.statMeta}>
              <span className={styles.statValue}>{isSessionOpen ? 'TERBUKA' : 'DITUTUP'}</span>
              <span className={styles.statLabel}>Sesi Pendaftaran</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBadge} ${styles.iconPurple}`}>
              <Star size={20} />
            </div>
            <div className={styles.statMeta}>
              <span className={styles.statValue}>
                {candidates.filter(c => c.status === 'LULUS').length}
              </span>
              <span className={styles.statLabel}>Peserta Lulus</span>
            </div>
          </div>
        </div>

        {/* ── Main Module Segmented Navigation Tabs (Compact & Clean) ── */}
        <div className={styles.mainNavContainer}>
          <button
            type="button"
            className={`${styles.mainNavTab} ${mainMode === 'pendaftaran' ? styles.mainNavActive : ''}`}
            onClick={() => setMainMode('pendaftaran')}
          >
            <FileText size={16} />
            <span>Pendaftaran</span>
            <span className={styles.mainNavBadge}>{candidates.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.mainNavTab} ${mainMode === 'seleksi' ? styles.mainNavActive : ''}`}
            onClick={() => {
              setMainMode('seleksi');
              if (Object.keys(scoresMap).length === 0) fetchSelectionData();
            }}
          >
            <Target size={16} />
            <span>Seleksi</span>
            <span className={styles.mainNavBadge}>Rapor Seleksi</span>
          </button>

          <button
            type="button"
            className={`${styles.mainNavTab} ${mainMode === 'kelulusan' ? styles.mainNavActive : ''}`}
            onClick={() => setMainMode('kelulusan')}
          >
            <GraduationCap size={16} />
            <span>Kelulusan</span>
            <span className={styles.mainNavBadge}>{candidates.filter(c => c.status === 'LULUS').length} Lulus</span>
          </button>
        </div>

        {mainMode === 'seleksi' && (
        <div className={styles.raporCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ── POS Sub-Tab Navigation Pills (No numbers, clean icons) ── */}
          <div className={styles.posSubNavContainer}>
            <button
              type="button"
              onClick={() => setSeleksiSubTab('jadwal')}
              className={`${styles.posSubNavTab} ${seleksiSubTab === 'jadwal' ? styles.posJadwalActive : ''}`}
            >
              <Calendar size={15} />
              <span>Jadwal & Notifikasi</span>
            </button>
            <button
              type="button"
              onClick={() => setSeleksiSubTab('kehadiran')}
              className={`${styles.posSubNavTab} ${seleksiSubTab === 'kehadiran' ? styles.posJadwalActive : ''}`}
            >
              <UserCheck size={15} />
              <span>Presensi Kehadiran</span>
            </button>
            <button
              type="button"
              onClick={() => setSeleksiSubTab('pos1')}
              className={`${styles.posSubNavTab} ${seleksiSubTab === 'pos1' ? styles.pos1Active : ''}`}
            >
              <Award size={15} />
              <span>POS 1: Wawancara & Perkenalan</span>
            </button>
            <button
              type="button"
              onClick={() => setSeleksiSubTab('pos2')}
              className={`${styles.posSubNavTab} ${seleksiSubTab === 'pos2' ? styles.pos2Active : ''}`}
            >
              <Star size={15} />
              <span>POS 2: Tes Minat Bakat</span>
            </button>
            <button
              type="button"
              onClick={() => setSeleksiSubTab('pos3')}
              className={`${styles.posSubNavTab} ${seleksiSubTab === 'pos3' ? styles.pos3Active : ''}`}
            >
              <FileText size={15} />
              <span>POS 3: Studi Kasus</span>
            </button>
            <button
              type="button"
              onClick={() => setSeleksiSubTab('rekap')}
              className={`${styles.posSubNavTab} ${seleksiSubTab === 'rekap' ? styles.posRekapActive : ''}`}
            >
              <Target size={15} />
              <span>Rekap Rapor & Ranking</span>
            </button>
          </div>

          {/* ── Toolbar Search & Filter untuk Seleksi ── */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.searchWrap}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Cari nama atau NISN..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <select
                value={filterKelas}
                onChange={(e) => handleKelasChange(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Semua Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                >
                  Reset
                </button>
              )}
            </div>

            <div className={styles.toolbarRight}>
              <button
                type="button"
                onClick={() => handleExportPOS('all')}
                className="btn btn-secondary btn-sm"
                title="Unduh XLSX Rapor Total (Semua POS)"
              >
                <Download size={14} /> Export ALL POS (Rapor Total)
              </button>
            </div>
          </div>

          {/* ── PRESENSI KEHADIRAN VIEW ── */}
          {seleksiSubTab === 'kehadiran' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.posHeaderBar}>
                <div className={styles.posTitle}>
                  <span className={styles.posBadge} style={{ background: '#0284c7', color: '#ffffff' }}>PRESENSI</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Presensi Kehadiran Seleksi</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                      Tandai peserta yang hadir atau tidak hadir pada hari seleksi.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const targetIds = filteredKehadiranCandidates.filter(c => c.attendanceStatus !== 'HADIR').map(c => c.id);
                      handleBatchAttendance('HADIR', targetIds);
                    }}
                    className="btn btn-success btn-sm"
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <CheckCircle size={14} /> Tandai Semua Terfilter HADIR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetIds = filteredKehadiranCandidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR').map(c => c.id);
                      handleBatchAttendance('TIDAK_HADIR', targetIds);
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <XCircle size={14} /> Tandai Semua Terfilter TIDAK HADIR
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAttendance}
                    className={styles.btnExportExcel}
                    style={{ fontSize: '0.78rem', backgroundColor: '#1e40af' }}
                  >
                    <Download size={14} /> Export Presensi (.xlsx)
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className={styles.heroStatsGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div className={styles.heroStatCard} style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                  <span className={styles.heroStatLabel}>Total Terjadwal</span>
                  <strong className={styles.heroStatVal} style={{ color: '#0f172a' }}>
                    {candidates.filter(c => c.selectionDay).length}
                  </strong>
                </div>
                <div className={styles.heroStatCard} style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                  <span className={styles.heroStatLabel} style={{ color: '#166534' }}>Hadir Seleksi</span>
                  <strong className={styles.heroStatVal} style={{ color: '#15803d' }}>
                    {candidates.filter(c => c.attendanceStatus === 'HADIR').length}
                  </strong>
                </div>
                <div className={styles.heroStatCard} style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                  <span className={styles.heroStatLabel} style={{ color: '#991b1b' }}>Tidak Hadir</span>
                  <strong className={styles.heroStatVal} style={{ color: '#b91c1c' }}>
                    {candidates.filter(c => c.attendanceStatus === 'TIDAK_HADIR').length}
                  </strong>
                </div>
                <div className={styles.heroStatCard} style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                  <span className={styles.heroStatLabel} style={{ color: '#92400e' }}>Belum Presensi</span>
                  <strong className={styles.heroStatVal} style={{ color: '#b45309' }}>
                    {candidates.filter(c => !c.attendanceStatus || c.attendanceStatus === 'BELUM_KONFIRMASI').length}
                  </strong>
                </div>
              </div>

              {/* Filter Toolbar Extra */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Filter Presensi:</span>
                <select
                  value={filterHariSeleksi}
                  onChange={e => setFilterHariSeleksi(e.target.value)}
                  className={styles.filterSelect}
                  style={{ height: '34px', fontSize: '0.78rem' }}
                >
                  <option value="">Semua Hari Seleksi</option>
                  {uniqueSelectionDays.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>

                <select
                  value={filterStatusPresensi}
                  onChange={e => setFilterStatusPresensi(e.target.value)}
                  className={styles.filterSelect}
                  style={{ height: '34px', fontSize: '0.78rem' }}
                >
                  <option value="">Semua Status Presensi</option>
                  <option value="HADIR">Hadir</option>
                  <option value="TIDAK_HADIR">Tidak Hadir (Absen)</option>
                  <option value="BELUM_KONFIRMASI">Belum Presensi</option>
                </select>
              </div>

              {/* Candidate Presensi Card List */}
              <div className={styles.scoreCardList}>
                {filteredKehadiranCandidates.map((c, idx) => {
                  const att = c.attendanceStatus || 'BELUM_KONFIRMASI';
                  const isAbsent = att === 'TIDAK_HADIR';
                  const isAttended = att === 'HADIR';

                  return (
                    <div key={`presensi-${c.id}`} className={`${styles.scoreCard} ${isAbsent ? styles.scoreCardLocked : ''}`}>
                      <div className={styles.scoreCardHeader}>
                        <span className={styles.scoreCardNum} style={{ background: isAttended ? '#16a34a' : (isAbsent ? '#dc2626' : '#64748b') }}>
                          {idx + 1}
                        </span>
                        <div className={styles.scoreCardInfo}>
                          <strong className={styles.scoreCardName}>{c.name}</strong>
                          <span className={styles.scoreCardMeta}>{c.className} · NISN: {c.nisn}</span>
                        </div>
                        <div className={styles.scoreCardBadges}>
                          {c.selectionDay ? (
                            <span className={styles.badgeDay}>{c.selectionDay}</span>
                          ) : (
                            <span className={styles.badgeUnnotified}>Jadwal Belum Diatur</span>
                          )}

                          {isAttended && (
                            <span className={styles.badgeNotified} style={{ background: '#dcfce7', color: '#15803d' }}>
                              <CheckCircle size={11} style={{ marginRight: '3px' }} /> HADIR SELEKSI
                            </span>
                          )}
                          {isAbsent && (
                            <span className={styles.lockedBadge} style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}>
                              <XCircle size={11} style={{ marginRight: '3px' }} /> TIDAK HADIR — OTOMATIS TIDAK LULUS
                            </span>
                          )}
                          {!isAttended && !isAbsent && (
                            <span className={styles.badgeUnnotified}>BELUM PRESENSI</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.scoreCardFooter} style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                          Status Kelulusan: <strong style={{ color: c.status === 'LULUS' ? '#16a34a' : (c.status === 'TIDAK_LULUS' ? '#dc2626' : '#d97706') }}>{c.status}</strong>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleSingleAttendance(c, 'HADIR')}
                            className={`btn btn-sm ${isAttended ? 'btn-success' : 'btn-secondary'}`}
                            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: isAttended ? 700 : 500 }}
                          >
                            <CheckCircle size={14} /> HADIR
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSingleAttendance(c, 'TIDAK_HADIR')}
                            className={`btn btn-sm ${isAbsent ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: isAbsent ? 700 : 500 }}
                          >
                            <XCircle size={14} /> TIDAK HADIR (Absen)
                          </button>

                          {(isAttended || isAbsent) && (
                            <button
                              type="button"
                              onClick={() => handleSingleAttendance(c, 'BELUM_KONFIRMASI')}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.74rem' }}
                              title="Reset status presensi ke Belum Konfirmasi"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredKehadiranCandidates.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px border-dashed #cbd5e1' }}>
                    Tidak ada peserta yang cocok dengan filter presensi.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── POS 1 VIEW ── */}
          {seleksiSubTab === 'pos1' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.posHeaderBar}>
                <div className={styles.posTitle}>
                  <span className={`${styles.posBadge} ${styles.pos1Badge}`}>POS 1</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Wawancara dan Perkenalan</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                      9 Kriteria (1–10): Komunikasi · Percaya Diri · Motivasi · Komitmen · Kerja Sama · Kepemimpinan · Pengetahuan · Etika · Bonus
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => handleExportPOS('1')} className={styles.btnExportExcel}>
                  <Download size={16} /> Export Excel POS 1
                </button>
              </div>

              <div className={styles.scoreCardList}>
                {filteredCandidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR').map((c, idx) => {
                  const s = scoresMap[c.id] || {};
                  const isLocked = Boolean(s.pos1Completed);
                  const p1Fields = [
                    { key: 'pos1Comm', label: 'Komunikasi' },
                    { key: 'pos1Trust', label: 'Percaya Diri' },
                    { key: 'pos1Motiv', label: 'Motivasi' },
                    { key: 'pos1Komitmen', label: 'Komitmen' },
                    { key: 'pos1KerjaSama', label: 'Kerja Sama' },
                    { key: 'pos1Kepemimpinan', label: 'Kepemimpinan' },
                    { key: 'pos1Pengetahuan', label: 'Pengetahuan' },
                    { key: 'pos1Etika', label: 'Etika' },
                    { key: 'pos1Bonus', label: '✨ Bonus' },
                  ];
                  return (
                    <div key={`pos1-${c.id}`} className={`${styles.scoreCard} ${isLocked ? styles.scoreCardLocked : ''}`}>
                      <div className={styles.scoreCardHeader}>
                        <span className={styles.scoreCardNum}>{idx + 1}</span>
                        <div className={styles.scoreCardInfo}>
                          <strong className={styles.scoreCardName}>{c.name}</strong>
                          <span className={styles.scoreCardMeta}>{c.className} · NISN: {c.nisn}</span>
                        </div>
                        <div className={styles.scoreCardBadges}>
                          {c.selectionDay && <span className={styles.badgeDay}>{c.selectionDay}</span>}
                          {isLocked && <span className={styles.lockedBadge}><Lock size={11} /> Terkunci</span>}
                        </div>
                      </div>
                      <div className={styles.scoreGrid}>
                        {p1Fields.map(({ key, label }) => {
                          const val = s[key] ?? '';
                          const numVal = parseFloat(val);
                          const colorClass = val !== '' && !isNaN(numVal) ? (numVal >= 7.5 ? styles.inputHigh : numVal >= 6 ? styles.inputMed : styles.inputLow) : '';
                          return (
                            <div key={key} className={styles.scoreField}>
                              <label className={styles.scoreFieldLabel}>{label}</label>
                              <input
                                type="number" min="1" max="10" step="0.5"
                                disabled={isLocked}
                                value={val}
                                onChange={e => handleScoreInputChange(c.id, key, e.target.value)}
                                onBlur={() => handleSaveCandidateScore(c.id, 'pos1')}
                                className={`${styles.scoreBigInput} ${colorClass} ${isLocked ? styles.scoreBigInputDisabled : ''}`}
                                placeholder="–"
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className={styles.scoreCardFooter}>
                        <div className={styles.evaluatorWrap}>
                          <User size={14} color="#64748b" />
                          <select
                            value={s.pos1Evaluator || ''}
                            disabled={isLocked}
                            onChange={e => handleEvaluatorChange(c.id, 'pos1', e.target.value)}
                            className={styles.evaluatorFullSelect}
                          >
                            <option value="">-- Pilih Penyeleksi --</option>
                            {evaluators.members.map(m => (
                              <option key={`mem-${m.id}`} value={m.name}>Anggota: {m.name} ({m.className})</option>
                            ))}
                            {evaluators.admins.map(a => (
                              <option key={`adm-${a.id}`} value={a.username}>Admin: {a.username}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.scoreCardActions}>
                          <span className={`${styles.avgBadgeLarge} ${getAvgBadgeClass(s.pos1Avg)}`}>
                            Rata-rata: <strong>{s.pos1Avg !== null && s.pos1Avg !== undefined ? s.pos1Avg.toFixed(2) : '—'}</strong>
                          </span>
                          {isLocked ? (
                            <button type="button" onClick={() => handleToggleLockState(c.id, 'pos1', false)} className={`${styles.btnLock} ${styles.btnLockUnlock}`}>
                              <Unlock size={14} /> Perbarui
                            </button>
                          ) : (
                            <button type="button" onClick={() => handleToggleLockState(c.id, 'pos1', true)} className={`${styles.btnLock} ${styles.btnLockSubmit}`}>
                              <Lock size={14} /> Selesai
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredCandidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR').length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px border-dashed #cbd5e1' }}>
                    Belum ada peserta hadir yang dapat dinilai pada POS 1.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── POS 2 VIEW ── */}
          {seleksiSubTab === 'pos2' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.posHeaderBar}>
                <div className={styles.posTitle}>
                  <span className={`${styles.posBadge} ${styles.pos2Badge}`}>POS 2</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Tes Minat Bakat</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                      6 Kriteria (1–10): Kreativitas · Penguasaan · Presentasi · Orisinalitas · Potensi · Percaya Diri
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => handleExportPOS('2')} className={styles.btnExportExcel}>
                  <Download size={16} /> Export Excel POS 2
                </button>
              </div>

              <div className={styles.scoreCardList}>
                {filteredCandidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR').map((c, idx) => {
                  const s = scoresMap[c.id] || {};
                  const isLocked = Boolean(s.pos2Completed);
                  const p2Fields = [
                    { key: 'pos2Creativity', label: 'Kreativitas' },
                    { key: 'pos2Mastery', label: 'Penguasaan' },
                    { key: 'pos2Pres', label: 'Presentasi' },
                    { key: 'pos2Orig', label: 'Orisinalitas' },
                    { key: 'pos2Potency', label: 'Potensi' },
                    { key: 'pos2Confidence', label: 'Percaya Diri' },
                  ];
                  return (
                    <div key={`pos2-${c.id}`} className={`${styles.scoreCard} ${isLocked ? styles.scoreCardLocked : ''}`}>
                      <div className={styles.scoreCardHeader}>
                        <span className={styles.scoreCardNum}>{idx + 1}</span>
                        <div className={styles.scoreCardInfo}>
                          <strong className={styles.scoreCardName}>{c.name}</strong>
                          <span className={styles.scoreCardMeta}>{c.className} · NISN: {c.nisn}</span>
                        </div>
                        <div className={styles.scoreCardBadges}>
                          {c.selectionDay && <span className={styles.badgeDay}>{c.selectionDay}</span>}
                          {isLocked && <span className={styles.lockedBadge}><Lock size={11} /> Terkunci</span>}
                        </div>
                      </div>
                      <div className={styles.scoreGrid}>
                        {p2Fields.map(({ key, label }) => {
                          const val = s[key] ?? '';
                          const numVal = parseFloat(val);
                          const colorClass = val !== '' && !isNaN(numVal) ? (numVal >= 7.5 ? styles.inputHigh : numVal >= 6 ? styles.inputMed : styles.inputLow) : '';
                          return (
                            <div key={key} className={styles.scoreField}>
                              <label className={styles.scoreFieldLabel}>{label}</label>
                              <input
                                type="number" min="1" max="10" step="0.5"
                                disabled={isLocked}
                                value={val}
                                onChange={e => handleScoreInputChange(c.id, key, e.target.value)}
                                onBlur={() => handleSaveCandidateScore(c.id, 'pos2')}
                                className={`${styles.scoreBigInput} ${colorClass} ${isLocked ? styles.scoreBigInputDisabled : ''}`}
                                placeholder="–"
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className={styles.scoreCardFooter}>
                        <div className={styles.evaluatorWrap}>
                          <User size={14} color="#64748b" />
                          <select
                            value={s.pos2Evaluator || ''}
                            disabled={isLocked}
                            onChange={e => handleEvaluatorChange(c.id, 'pos2', e.target.value)}
                            className={styles.evaluatorFullSelect}
                          >
                            <option value="">-- Pilih Penyeleksi --</option>
                            {evaluators.members.map(m => (
                              <option key={`mem-${m.id}`} value={m.name}>Anggota: {m.name} ({m.className})</option>
                            ))}
                            {evaluators.admins.map(a => (
                              <option key={`adm-${a.id}`} value={a.username}>Admin: {a.username}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.scoreCardActions}>
                          <span className={`${styles.avgBadgeLarge} ${getAvgBadgeClass(s.pos2Avg)}`}>
                            Rata-rata: <strong>{s.pos2Avg !== null && s.pos2Avg !== undefined ? s.pos2Avg.toFixed(2) : '—'}</strong>
                          </span>
                          {isLocked ? (
                            <button type="button" onClick={() => handleToggleLockState(c.id, 'pos2', false)} className={`${styles.btnLock} ${styles.btnLockUnlock}`}>
                              <Unlock size={14} /> Perbarui
                            </button>
                          ) : (
                            <button type="button" onClick={() => handleToggleLockState(c.id, 'pos2', true)} className={`${styles.btnLock} ${styles.btnLockSubmit}`}>
                              <Lock size={14} /> Selesai
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredCandidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR').length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px border-dashed #cbd5e1' }}>
                    Belum ada peserta hadir yang dapat dinilai pada POS 2.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── POS 3 VIEW ── */}
          {seleksiSubTab === 'pos3' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.posHeaderBar}>
                <div className={styles.posTitle}>
                  <span className={`${styles.posBadge} ${styles.pos3Badge}`}>POS 3</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Studi Kasus</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                      7 Kriteria (1–10): Pemahaman · Analisis · Solusi · Empati · Public Speaking · Logika · Pengetahuan
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => handleExportPOS('3')} className={styles.btnExportExcel}>
                  <Download size={16} /> Export Excel POS 3
                </button>
              </div>

              <div className={styles.scoreCardList}>
                {filteredCandidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR').map((c, idx) => {
                  const s = scoresMap[c.id] || {};
                  const isLocked = Boolean(s.pos3Completed);
                  const p3Fields = [
                    { key: 'pos3Pemahaman', label: 'Pemahaman' },
                    { key: 'pos3Analysis', label: 'Analisis' },
                    { key: 'pos3Solution', label: 'Solusi' },
                    { key: 'pos3Empati', label: 'Empati' },
                    { key: 'pos3PublicSpk', label: 'Public Speaking' },
                    { key: 'pos3Logika', label: 'Logika' },
                    { key: 'pos3Pengetahuan', label: 'Pengetahuan' },
                  ];
                  return (
                    <div key={`pos3-${c.id}`} className={`${styles.scoreCard} ${isLocked ? styles.scoreCardLocked : ''}`}>
                      <div className={styles.scoreCardHeader}>
                        <span className={styles.scoreCardNum}>{idx + 1}</span>
                        <div className={styles.scoreCardInfo}>
                          <strong className={styles.scoreCardName}>{c.name}</strong>
                          <span className={styles.scoreCardMeta}>{c.className} · NISN: {c.nisn}</span>
                        </div>
                        <div className={styles.scoreCardBadges}>
                          {c.selectionDay && <span className={styles.badgeDay}>{c.selectionDay}</span>}
                          {isLocked && <span className={styles.lockedBadge}><Lock size={11} /> Terkunci</span>}
                        </div>
                      </div>
                      <div className={styles.scoreGrid}>
                        {p3Fields.map(({ key, label }) => {
                          const val = s[key] ?? '';
                          const numVal = parseFloat(val);
                          const colorClass = val !== '' && !isNaN(numVal) ? (numVal >= 7.5 ? styles.inputHigh : numVal >= 6 ? styles.inputMed : styles.inputLow) : '';
                          return (
                            <div key={key} className={styles.scoreField}>
                              <label className={styles.scoreFieldLabel}>{label}</label>
                              <input
                                type="number" min="1" max="10" step="0.5"
                                disabled={isLocked}
                                value={val}
                                onChange={e => handleScoreInputChange(c.id, key, e.target.value)}
                                onBlur={() => handleSaveCandidateScore(c.id, 'pos3')}
                                className={`${styles.scoreBigInput} ${colorClass} ${isLocked ? styles.scoreBigInputDisabled : ''}`}
                                placeholder="–"
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className={styles.scoreCardFooter}>
                        <div className={styles.evaluatorWrap}>
                          <User size={14} color="#64748b" />
                          <select
                            value={s.pos3Evaluator || ''}
                            disabled={isLocked}
                            onChange={e => handleEvaluatorChange(c.id, 'pos3', e.target.value)}
                            className={styles.evaluatorFullSelect}
                          >
                            <option value="">-- Pilih Penyeleksi --</option>
                            {evaluators.members.map(m => (
                              <option key={`mem-${m.id}`} value={m.name}>Anggota: {m.name} ({m.className})</option>
                            ))}
                            {evaluators.admins.map(a => (
                              <option key={`adm-${a.id}`} value={a.username}>Admin: {a.username}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.scoreCardActions}>
                          <span className={`${styles.avgBadgeLarge} ${getAvgBadgeClass(s.pos3Avg)}`}>
                            Rata-rata: <strong>{s.pos3Avg !== null && s.pos3Avg !== undefined ? s.pos3Avg.toFixed(2) : '—'}</strong>
                          </span>
                          {isLocked ? (
                            <button type="button" onClick={() => handleToggleLockState(c.id, 'pos3', false)} className={`${styles.btnLock} ${styles.btnLockUnlock}`}>
                              <Unlock size={14} /> Perbarui
                            </button>
                          ) : (
                            <button type="button" onClick={() => handleToggleLockState(c.id, 'pos3', true)} className={`${styles.btnLock} ${styles.btnLockSubmit}`}>
                              <Lock size={14} /> Selesai
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredCandidates.filter(c => c.attendanceStatus !== 'TIDAK_HADIR').length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                    Belum ada peserta hadir yang dapat dinilai pada POS 3.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── REKAP RAPOR & RANKING VIEW ── */}
          {seleksiSubTab === 'rekap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.posHeaderBar}>
                <div className={styles.posTitle}>
                  <span className={`${styles.posBadge} ${styles.posAllBadge}`}>REKAP RAPOR TOTAL</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Rekapitulasi Nilai Akhir & Ranking</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                      Nilai Akhir Rapor dihitung dari rata-rata 33.3% tiap POS (POS 1 + POS 2 + POS 3) / 3
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExportPOS('all')}
                  className={styles.btnExportExcel}
                  style={{ backgroundColor: '#1e40af' }}
                >
                  <Download size={16} /> Export All POS (Rapor Total)
                </button>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>Rank</th>
                      <th className={styles.stickyNameCol}>Nama Kandidat</th>
                      <th>Kelas</th>
                      <th>Rata-Rata POS 1</th>
                      <th>Rata-Rata POS 2</th>
                      <th>Rata-Rata POS 3</th>
                      <th>NILAI AKHIR RAPOR</th>
                      <th style={{ textAlign: 'center' }}>Status Penilaian</th>
                      <th style={{ textAlign: 'center' }}>Aksi Lock Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredCandidates]
                      .filter(c => c.attendanceStatus !== 'TIDAK_HADIR')
                      .sort((a, b) => {
                        const scoreA = scoresMap[a.id]?.finalScore ?? -1;
                        const scoreB = scoresMap[b.id]?.finalScore ?? -1;
                        return scoreB - scoreA;
                      })
                      .map((c, rankIdx) => {
                        const s = scoresMap[c.id] || {};
                        const isTotalLocked = Boolean(s.isCompleted);
                        const rankBadgeStyle = (s.finalScore || 0) > 0
                          ? (rankIdx === 0 ? styles.rankTop1 : rankIdx === 1 ? styles.rankTop2 : rankIdx === 2 ? styles.rankTop3 : '')
                          : '';

                        return (
                          <tr key={`rekap-${c.id}`}>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`${styles.rankBadge} ${rankBadgeStyle}`}>
                                {rankIdx + 1}
                              </span>
                            </td>
                            <td className={`${styles.tdName} ${styles.stickyNameCol}`}>
                              <strong>{c.name}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NISN: {c.nisn}</div>
                            </td>
                            <td>{c.className}</td>
                            <td>{s.pos1Avg !== null && s.pos1Avg !== undefined ? s.pos1Avg.toFixed(2) : '-'}</td>
                            <td>{s.pos2Avg !== null && s.pos2Avg !== undefined ? s.pos2Avg.toFixed(2) : '-'}</td>
                            <td>{s.pos3Avg !== null && s.pos3Avg !== undefined ? s.pos3Avg.toFixed(2) : '-'}</td>
                            <td>
                              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e40af' }}>
                                {s.finalScore !== null && s.finalScore !== undefined ? s.finalScore.toFixed(2) : '-'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isTotalLocked ? (
                                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
                                  ✓ Lengkap & Terkunci
                                </span>
                              ) : (
                                <span style={{ color: '#d97706', fontSize: '0.85rem' }}>Belum Dikunci</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isTotalLocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleLockState(c.id, 'all', false)}
                                  className={`${styles.btnLock} ${styles.btnLockUnlock}`}
                                >
                                  <Unlock size={14} /> Perbarui Nilai
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleLockState(c.id, 'all', true)}
                                  className={`${styles.btnLock} ${styles.btnLockSubmit}`}
                                >
                                  <Lock size={14} /> Selesai Seleksi
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── JADWAL SELEKSI VIEW ── */}
          {seleksiSubTab === 'jadwal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.posHeaderBar}>
                <div className={styles.posTitle}>
                  <span className={`${styles.posBadge} ${styles.pos1Badge}`}>PENJADWALAN</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Pengaturan Hari & Notifikasi Seleksi</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                      Atur alokasi tanggal seleksi massal dan kirim notifikasi WhatsApp
                    </p>
                  </div>
                </div>
                <div className={styles.posActions}>
                  <button type="button" onClick={openRandomizeModal} className="btn btn-secondary btn-sm">
                    <Shuffle size={16} /> Atur Hari Seleksi Otomatis
                  </button>
                  <button type="button" onClick={openMassWaModal} className="btn btn-primary btn-sm">
                    <Send size={16} /> Kirim WA Seleksi Massal
                  </button>
                </div>
              </div>

              {/* Table Daftar Hari Seleksi Peserta */}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                      <th className={styles.stickyNameCol}>Nama Kandidat</th>
                      <th>Kelas</th>
                      <th>Hari Seleksi</th>
                      <th style={{ textAlign: 'center', width: '140px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                          Tidak ada data pendaftar yang cocok.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((c, idx) => (
                        <tr key={`jadwal-${c.id}`}>
                          <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                          <td className={`${styles.tdName} ${styles.stickyNameCol}`}>
                            <strong>{c.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NISN: {c.nisn || '-'}</div>
                          </td>
                          <td>{c.className}</td>
                          <td>
                            {c.selectionDay ? (
                              <span className={styles.badgeDay}>{c.selectionDay}</span>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Belum Diset</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(c, 'seleksi')}
                              className="btn btn-secondary btn-sm"
                              title="Ubah Hari Seleksi & Kirim WA"
                            >
                              <Calendar size={14} /> Ubah Hari
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ── 3. MODUL KELULUSAN & PROMOSI VIEW ── */}
      {mainMode === 'kelulusan' && (
        <div className={styles.raporCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.posHeaderBar}>
            <div className={styles.posTitleGroup}>
              <span className={`${styles.posBadge} ${styles.posAllBadge}`}>MODUL KELULUSAN</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Penetapan Status & Promosi Anggota Tetap</h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  Tentukan kelulusan pendaftar berdasarkan Nilai Akhir Rapor dan promosikan peserta LULUS ke data Anggota Tetap
                </p>
              </div>
            </div>

            <div className={styles.posActions}>
              <button
                type="button"
                onClick={openMassWaModal}
                className="btn btn-primary btn-sm"
              >
                <Send size={16} /> Kirim Pengumuman WA
              </button>
            </div>
          </div>

          {/* ── Toolbar Search & Filter untuk Kelulusan ── */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.searchWrap}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Cari nama atau NISN..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <select
                value={filterKelas}
                onChange={(e) => handleKelasChange(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Semua Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Semua Status</option>
                <option value="PENDING">PENDING</option>
                <option value="LULUS">LULUS</option>
                <option value="TIDAK_LULUS">TIDAK LULUS</option>
              </select>
            </div>

            <div className={styles.toolbarRight}>
              <button
                type="button"
                onClick={() => handleExportPOS('all')}
                className="btn btn-secondary btn-sm"
                title="Unduh XLSX Rapor Total"
              >
                <Download size={14} /> Export Excel
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                  <th>Nama Kandidat</th>
                  <th>Kelas</th>
                  <th>No. WhatsApp</th>
                  <th>Nilai Rapor Akhir</th>
                  <th style={{ textAlign: 'center' }}>Status Kelulusan</th>
                  <th style={{ textAlign: 'center' }}>Aksi Status & Promosi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c, idx) => {
                  const scoreObj = scoresMap[c.id] || {};
                  const finalScore = scoreObj.finalScore;

                  return (
                    <tr key={`kelulusan-${c.id}`}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>
                        <strong>{c.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NISN: {c.nisn}</div>
                      </td>
                      <td>{c.className}</td>
                      <td>{c.whatsappNumber}</td>
                      <td>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e40af' }}>
                          {finalScore !== null && finalScore !== undefined ? finalScore.toFixed(2) : '-'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {c.status === 'LULUS' && (
                          <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.82rem' }}>
                            ✓ LULUS
                          </span>
                        )}
                        {c.status === 'TIDAK_LULUS' && (
                          <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.82rem' }}>
                            ✕ TIDAK LULUS
                          </span>
                        )}
                        {c.status === 'PENDING' && (
                          <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.82rem' }}>
                            ⏳ PROSES
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateCandidate(c.id, { status: 'LULUS' });
                                toast.success(`Status ${c.name} diubah ke LULUS`);
                                fetchSessionAndCandidates();
                              } catch {
                                toast.error('Gagal merubah status');
                              }
                            }}
                            className="btn btn-success btn-xs"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            Set Lulus
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateCandidate(c.id, { status: 'TIDAK_LULUS' });
                                toast.success(`Status ${c.name} diubah ke TIDAK LULUS`);
                                fetchSessionAndCandidates();
                              } catch {
                                toast.error('Gagal merubah status');
                              }
                            }}
                            className="btn btn-danger btn-xs"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            Set Tidak Lulus
                          </button>
                          {c.status === 'LULUS' && (
                            <button
                              type="button"
                              onClick={() => handlePromoteCandidate(c)}
                              className="btn btn-primary btn-xs"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                              title="Promosikan peserta ke data Anggota Tetap"
                            >
                              Promosi Anggota
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Floating / Top Multiple Selected Action Bar */}
        {selectedRowIds.length > 0 && (
          <div className={styles.batchActionBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.875rem' }}>
              <CheckSquare size={18} color="var(--color-accent)" />
              <span>Terpilih <strong>{selectedRowIds.length}</strong> Peserta</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={openBatchWaModal} className="btn btn-primary btn-sm">
                <Send size={14} /> 📢 Kirim Notif WA + PDF (Hanya {selectedRowIds.length} Terpilih)
              </button>
              <button onClick={handleBatchDelete} className="btn btn-danger btn-sm">
                <Trash2 size={14} /> Hapus Terpilih
              </button>
              <button onClick={() => setSelectedRowIds([])} className="btn btn-secondary btn-sm">
                Batal Pilih
              </button>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 1: DATA PENDAFTARAN ── */}
        {mainMode === 'pendaftaran' && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <div className={styles.searchWrap}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Cari nama atau NISN..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <select
                  value={filterKelas}
                  onChange={(e) => handleKelasChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">Semua Kelas</option>
                  {kelasOptions.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="">Semua Status</option>
                  <option value="PENDING">PENDING</option>
                  <option value="LULUS">LULUS</option>
                  <option value="TIDAK_LULUS">TIDAK LULUS</option>
                </select>
              </div>

              <div className={styles.toolbarRight}>
                <button onClick={handleExportExcel} className="btn btn-secondary btn-sm">
                  <FileSpreadsheet size={16} /> Export Excel
                </button>
                <button onClick={handleExportJSON} className="btn btn-secondary btn-sm">
                  <FileJson size={16} /> Export JSON
                </button>
              </div>
            </div>

            {loading ? (
              <SkeletonTable rows={5} columns={9} />
            ) : paginatedCandidates.length === 0 ? (
              <div className={styles.empty}>
                <p>Tidak ada pendaftar yang cocok dengan pencarian/filter.</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '36px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          onChange={(e) => handleToggleSelectAllPage(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th>No</th>
                      <th>NISN</th>
                      <th>Nama Lengkap</th>
                      <th>Kelas</th>
                      <th>Asal Sekolah</th>
                      <th>No. WhatsApp</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCandidates.map((c, i) => {
                      const isSelected = selectedRowIds.includes(c.id);
                      return (
                        <tr key={c.id} className={isSelected ? styles.rowSelected : (i % 2 === 1 ? styles.rowAlt : '')}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(c.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td className={styles.tdNum}>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                          <td className={styles.tdMono}>{c.nisn}</td>
                          <td className={styles.tdName}>{c.name}</td>
                          <td>{c.className}</td>
                          <td>{c.asalSekolah || '-'}</td>
                          <td className={styles.tdMono}>{c.whatsappNumber}</td>
                          <td>
                            <span className={`badge ${
                              c.status === 'LULUS'
                                ? 'badge-success'
                                : c.status === 'TIDAK_LULUS'
                                ? 'badge-accent'
                                : 'badge-warning'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                onClick={() => openEditModal(c, 'biodata')}
                                className="btn btn-secondary btn-sm"
                                title="Edit / Detail Pendaftar"
                              >
                                <Edit size={14} /> Detail
                              </button>
                              <button
                                onClick={() => handlePromoteCandidate(c)}
                                className="btn btn-primary btn-sm"
                                title="Promosikan ke Anggota Tetap"
                                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                              >
                                <UserCheck size={14} /> Promosi
                              </button>
                              <button
                                onClick={() => handleDeleteCandidate(c.id, c.name)}
                                className="btn btn-danger btn-sm"
                                title="Hapus Peserta"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredCandidates.length)} dari {filteredCandidates.length} data
            </div>

            <div className={styles.paginationControls}>
              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ''}`}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: 3-TAB CANDIDATE DETAIL/EDIT MODAL ────────────────── */}
      {editModalOpen && selectedCandidate && (
        <div className={styles.modalOverlay} onClick={() => setEditModalOpen(false)}>
          <div className={`${styles.modalCard} ${styles.wideModalCard}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Detail & Pengaturan Calon Anggota</h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {selectedCandidate.name} ({selectedCandidate.className})
                </span>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 3-Tab Header in Modal */}
            <div className={styles.modalTabNav}>
              <button
                className={`${styles.modalTabBtn} ${modalTab === 'biodata' ? styles.modalTabActive : ''}`}
                onClick={() => setModalTab('biodata')}
              >
                <User size={16} /> 📄 Biodata Pendaftar
              </button>
              <button
                className={`${styles.modalTabBtn} ${modalTab === 'seleksi' ? styles.modalTabActive : ''}`}
                onClick={() => setModalTab('seleksi')}
              >
                <Calendar size={16} /> 📅 Jadwal & Notif Seleksi
              </button>
              <button
                className={`${styles.modalTabBtn} ${modalTab === 'status' ? styles.modalTabActive : ''}`}
                onClick={() => setModalTab('status')}
              >
                <UserCheck size={16} /> 🎓 Status Kelulusan
              </button>
            </div>

            <div className={styles.modalForm}>
              {/* TAB 1: BIODATA */}
              {modalTab === 'biodata' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.twoColGrid}>
                    <div className="form-group">
                      <label className="form-label">NISN</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.nisn}
                        onChange={(e) => setEditForm({ ...editForm, nisn: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nama Lengkap</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.twoColGrid}>
                    <div className="form-group">
                      <label className="form-label">Kelas</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.className}
                        onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Asal Sekolah SMP/MTs</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.asalSekolah}
                        onChange={(e) => setEditForm({ ...editForm, asalSekolah: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.twoColGrid}>
                    <div className="form-group">
                      <label className="form-label">No. WhatsApp</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.whatsappNumber}
                        onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Jenis Kelamin</label>
                    <select
                      className="form-select"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alasan Bergabung</label>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      value={editForm.reason}
                      onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: JADWAL SELEKSI & WA NOTIFIKASI INDIVIDU */}
              {modalTab === 'seleksi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Interactive Visual Calendar Component */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      🗓️ Pilih Hari & Tanggal Seleksi (Klik Tanggal di Kalender Interaktif)
                    </label>
                    <SelectionCalendarPicker
                      selectedDate={editForm.selectionDate}
                      selectedDay={editForm.selectionDay}
                      onSelectDate={({ selectionDate, selectionDay }) => {
                        setEditForm(prev => ({ ...prev, selectionDate, selectionDay }));
                        setSingleWaText(
                          `Halo {nama} ({kelas}),\n\n` +
                          `Kamu dijadwalkan mengikuti *Tahap Seleksi Calon Anggota PIK-R MANSEKU* pada:\n` +
                          `📅 *Hari/Tanggal:* ${selectionDay}\n` +
                          `📍 *Lokasi:* Ruang PIK-R MAN 1 Muara Enim\n\n` +
                          `Harap hadir tepat waktu ya! 💪`
                        );
                      }}
                    />
                  </div>

                  <hr className="divider" />

                  {/* Mode Debug / Override Admin Target Number */}
                  <div className={styles.debugBox}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={singleDebugMode}
                        onChange={(e) => setSingleDebugMode(e.target.checked)}
                      />
                      <span>🛠️ Mode Debug / Alihkan ke Nomor Admin (Forwarder)</span>
                    </label>

                    {singleDebugMode && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Nomor WhatsApp Admin (e.g. 082373352409)"
                          value={singleDebugNumber}
                          onChange={(e) => setSingleDebugNumber(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          Pesan akan dikirim ke nomor Admin dalam urutan terpisah (Teks Nomor Peserta, Teks Isi Notifikasi + PDF, dan =========) agar mudah di-copy/forward manual saat bot utama diblokir 24 jam.
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label className="form-label" style={{ margin: 0 }}>Pesan WhatsApp Notifikasi Seleksi</label>
                      <span className={editForm.selectionNotified ? styles.badgeNotified : styles.badgeUnnotified}>
                        {editForm.selectionNotified ? '✅ WA Notif Terkirim' : '⚠️ Belum Dikirim'}
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      className="form-textarea"
                      value={singleWaText}
                      onChange={(e) => setSingleWaText(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Placeholder: <code>&#123;nama&#125;</code>, <code>&#123;nisn&#125;</code>, <code>&#123;kelas&#125;</code>, <code>&#123;hari_seleksi&#125;</code>
                    </span>
                  </div>

                  {/* PDF Attachment Input */}
                  <div className="form-group">
                    <label className="form-label"><Paperclip size={14} /> Lampirkan File PDF (Opsional)</label>
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={(e) => setSinglePdfFiles(Array.from(e.target.files))}
                      className="form-input"
                    />
                    {singlePdfFiles.length > 0 && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 600 }}>
                        {singlePdfFiles.length} file PDF dilampirkan.
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendSingleWa}
                    disabled={sendingSingleWa}
                    className="btn btn-primary btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {sendingSingleWa ? <span className="spinner" /> : <Send size={14} />}
                    {sendingSingleWa ? 'Mengirim WA...' : `Kirim WA Notifikasi (${singleDebugMode ? 'ke Admin' : selectedCandidate.name})`}
                  </button>
                </div>
              )}

              {/* TAB 3: STATUS KELULUSAN & PROMOSI */}
              {modalTab === 'status' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Status Seleksi Candidate</label>
                    <select
                      className="form-select"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="PENDING">PENDING (Proses Seleksi)</option>
                      <option value="LULUS">LULUS (Siap Dipromosikan)</option>
                      <option value="TIDAK_LULUS">TIDAK LULUS</option>
                    </select>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-surface-2)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-strong)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Password Akun Anggota:</span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                      {showPassword ? selectedCandidate.plainPassword || 'pikr2024' : '••••••••'}
                    </span>
                  </div>

                  <hr className="divider" />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="form-label">Promosi Langsung ke Anggota Tetap</label>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      Memindahkan pendaftar ke tabel Member aktif, memformat nama ke Title Case, dan mengirimkan pesan WA kelulusan.
                    </p>
                    <button
                      type="button"
                      onClick={() => handlePromoteCandidate(selectedCandidate)}
                      className="btn btn-primary"
                      style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', alignSelf: 'flex-start' }}
                    >
                      <UserCheck size={16} /> Promosikan Sebagai Anggota Aktif Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions (Structured Left-Right) */}
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => handleDeleteCandidate(selectedCandidate.id, selectedCandidate.name)}
                className="btn btn-danger btn-sm"
              >
                <Trash2 size={14} /> Hapus Pendaftar
              </button>

              <div className={styles.modalActionsRight}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="btn btn-primary btn-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ATUR HARI SELEKSI MASSAL MODAL ────────────────────── */}
      {randomizeModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setRandomizeModalOpen(false)}>
          <div className={`${styles.modalCard} ${styles.wideModalCard}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>🎲 Acak & Atur Hari Seleksi Massal</h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Alokasikan hari seleksi dan kuota spesifik per hari
                </span>
              </div>
              <button
                onClick={() => setRandomizeModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalForm}>
              {/* 1. Mode Pemilihan Peserta */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>1. Mode Pemilihan Peserta Seleksi</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="selectionMode"
                      value="proceed"
                      checked={selectionMode === 'proceed'}
                      onChange={() => setSelectionMode('proceed')}
                    />
                    <span><strong>Mode A: Pilih Peserta yang LANJUT Seleksi</strong> (Checklist peserta yang hadir/lanjut)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="selectionMode"
                      value="exclude"
                      checked={selectionMode === 'exclude'}
                      onChange={() => setSelectionMode('exclude')}
                    />
                    <span><strong>Mode B: Pilih Peserta yang TIDAK Lanjut</strong> (Checklist peserta yang absen/gugur)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="radio"
                      name="selectionMode"
                      value="all"
                      checked={selectionMode === 'all'}
                      onChange={() => setSelectionMode('all')}
                    />
                    <span><strong>Mode C: Semua Pendaftar PENDING Lanjut Seleksi</strong></span>
                  </label>
                </div>
              </div>

              {/* 2. Candidate Checklist */}
              {selectionMode !== 'all' && (
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      2. Daftar Peserta ({selectedChecklistIds.length} dari {candidates.filter(c => c.status === 'PENDING').length} Tercentang)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSelectAllChecklist(true)}
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSelectAllChecklist(false)}
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Cari nama/NISN di daftar checklist..."
                    value={checklistSearch}
                    onChange={(e) => setChecklistSearch(e.target.value)}
                    className="form-input"
                    style={{ marginBottom: '8px', padding: '6px 10px', fontSize: '0.8125rem' }}
                  />

                  <div className={styles.checklistCard}>
                    {checklistCandidates.map((c) => {
                      const checked = selectedChecklistIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          className={styles.checklistItem}
                          onClick={() => handleToggleChecklist(c.id)}
                        >
                          {checked ? <CheckSquare size={16} color="var(--color-accent)" /> : <Square size={16} color="var(--color-text-muted)" />}
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>({c.className})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Alokasi Kuota Per Hari */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  3. Alokasi Kuota Peserta Per Hari ({targetCandidatesForSelection.length} Peserta Akan Diacak)
                </label>

                <div className={styles.quotaGrid}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Pilih Tanggal Hari 1</label>
                    <SelectionCalendarPicker
                      selectedDate={day1Date}
                      selectedDay={day1Name}
                      onSelectDate={({ selectionDate, selectionDay }) => {
                        setDay1Date(selectionDate);
                        setDay1Name(selectionDay);
                      }}
                    />
                    <input
                      type="number"
                      className="form-input"
                      value={day1Quota}
                      onChange={(e) => setDay1Quota(e.target.value)}
                      placeholder="Jumlah Peserta Kuota Hari 1"
                      style={{ marginTop: '8px' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Pilih Tanggal Hari 2</label>
                    <SelectionCalendarPicker
                      selectedDate={day2Date}
                      selectedDay={day2Name}
                      onSelectDate={({ selectionDate, selectionDay }) => {
                        setDay2Date(selectionDate);
                        setDay2Name(selectionDay);
                      }}
                    />
                    <input
                      type="number"
                      className="form-input"
                      value={day2Quota}
                      onChange={(e) => setDay2Quota(e.target.value)}
                      placeholder="Jumlah Peserta Kuota Hari 2"
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setRandomizeModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRandomize}
                disabled={savingRandomize}
                className="btn btn-primary btn-sm"
              >
                {savingRandomize ? <span className="spinner" /> : <Shuffle size={14} />}
                {savingRandomize ? 'Memproses...' : `Terapkan Jadwal ke ${targetCandidatesForSelection.length} Peserta`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: KIRIM WA SELEKSI MASSAL + PDF MODAL ───────────── */}
      {waModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setWaModalOpen(false)}>
          <div className={`${styles.modalCard} ${styles.wideModalCard}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>📢 Kirim Notifikasi WA Seleksi Massal + PDF</h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Akan dikirim ke {targetBatchIds.length > 0 ? `${targetBatchIds.length} peserta terpilih` : `${candidates.filter(c => c.status === 'PENDING' && c.selectionDay).length} peserta berjadwal`}
                </span>
              </div>
              <button
                onClick={() => setWaModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalForm}>
              {/* Mode Debug / Override Admin Target Number */}
              <div className={styles.debugBox}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={massDebugMode}
                    onChange={(e) => setMassDebugMode(e.target.checked)}
                  />
                  <span>🛠️ Mode Debug / Alihkan Pengiriman ke Nomor Admin (Forwarder Manual)</span>
                </label>

                {massDebugMode && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Masukkan Nomor WA Admin (Contoh: 082373352409)"
                      value={massDebugNumber}
                      onChange={(e) => setMassDebugNumber(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.8125rem' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      Pesan akan dikirim ke nomor Admin dalam urutan terpisah (Teks Nomor Peserta, Teks Isi Notifikasi + PDF, dan =========) agar Anda bisa dengan mudah me-forward manual pesan ke peserta saat bot utama diblokir 24 jam.
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Template Teks Pesan WhatsApp</label>
                <textarea
                  rows={6}
                  className="form-textarea"
                  value={massWaTemplate}
                  onChange={(e) => setMassWaTemplate(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Placeholder otomatis: <code>&#123;nama&#125;</code>, <code>&#123;nisn&#125;</code>, <code>&#123;kelas&#125;</code>, <code>&#123;hari_seleksi&#125;</code>
                </span>
              </div>

              <div className="form-group">
                <label className="form-label"><Paperclip size={14} /> Lampirkan File PDF Panduan (Opsional)</label>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => setMassPdfFiles(Array.from(e.target.files))}
                  className="form-input"
                />
                {massPdfFiles.length > 0 && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 600 }}>
                    {massPdfFiles.length} file PDF terlampir.
                  </span>
                )}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setWaModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteMassWa}
                disabled={sendingMassWa}
                className="btn btn-primary btn-sm"
              >
                {sendingMassWa ? <span className="spinner" /> : <Send size={14} />}
                {sendingMassWa ? 'Mengirim Massal...' : `Kirim Pesan & PDF ${massDebugMode ? 'ke Admin' : 'Massal'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

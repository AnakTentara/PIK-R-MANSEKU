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
  sendSelectionNotifications
} from '@/api/admin';
import { useUIStore } from '@/stores/uiStore';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonTable from '@/components/skeletons/SkeletonTable';
import {
  Edit, Trash2, Search, CheckCircle, XCircle, AlertCircle, ToggleLeft, ToggleRight,
  FileSpreadsheet, FileJson, ChevronLeft, ChevronRight, UserCheck, Calendar,
  Send, Paperclip, Shuffle, User, Layers, CheckSquare, Square, X, Key, Eye, EyeOff, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminPendaftaranPage.module.css';
import { downloadBlob } from '@/utils/truncate';

const ITEMS_PER_PAGE = 10;
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
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Sub-Tab State: 'data' | 'seleksi'
  const [activeSubTab, setActiveSubTab] = useState('data');

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

      if (activeSubTab === 'seleksi') {
        return matchesSearch && matchesKelas && (c.status === 'PENDING');
      }

      return matchesSearch && matchesStatus && matchesKelas;
    });

    if (activeSubTab === 'seleksi') {
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
  }, [candidates, search, statusFilter, filterKelas, activeSubTab]);

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
            <strong>Status Sesi Pendaftaran: {isSessionOpen ? 'TERBUKA' : 'DITUTUP'}</strong>
            <span>
              {isSessionOpen
                ? 'Calon anggota dapat mendaftar secara online melalui halaman /daftar.'
                : 'Pendaftaran ditutup. Sesi ini siap diarsipkan atau mempromosikan peserta LULUS ke Anggota Tetap.'}
            </span>
          </div>
        </div>

        {/* ── Sub-Tab Navigation Header ── */}
        <div className={styles.subTabNav}>
          <button
            className={`${styles.subTabBtn} ${activeSubTab === 'data' ? styles.subTabActive : ''}`}
            onClick={() => { setActiveSubTab('data'); setCurrentPage(1); }}
          >
            <Layers size={18} />
            📋 Data Pendaftaran ({candidates.length})
          </button>
          <button
            className={`${styles.subTabBtn} ${activeSubTab === 'seleksi' ? styles.subTabActive : ''}`}
            onClick={() => { setActiveSubTab('seleksi'); setCurrentPage(1); }}
          >
            <Calendar size={18} />
            📅 Jadwal & Tahap Seleksi ({candidates.filter(c => c.status === 'PENDING').length})
          </button>
        </div>

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
        {activeSubTab === 'data' && (
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
                      <th>Hari Seleksi</th>
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
                            {c.selectionDay ? (
                              <span className={styles.badgeDay}>{c.selectionDay}</span>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Belum Set</span>
                            )}
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

        {/* ── SUB-TAB 2: JADWAL & TAHAP SELEKSI ── */}
        {activeSubTab === 'seleksi' && (
          <>
            {/* Selection Toolbar */}
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
              </div>

              <div className={styles.toolbarRight}>
                <button onClick={openRandomizeModal} className="btn btn-secondary btn-sm">
                  <Shuffle size={16} /> 🎲 Atur Hari Seleksi Massal
                </button>

                <button onClick={openMassWaModal} className="btn btn-primary btn-sm">
                  <Send size={16} /> 📢 Kirim WA Seleksi + PDF
                </button>

                <button onClick={handleExportSelectionExcel} className="btn btn-secondary btn-sm">
                  <FileSpreadsheet size={16} /> Export Excel Jadwal
                </button>
              </div>
            </div>

            {loading ? (
              <SkeletonTable rows={5} columns={8} />
            ) : paginatedCandidates.length === 0 ? (
              <div className={styles.empty}>
                <p>Tidak ada peserta seleksi yang cocok dengan filter.</p>
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
                      <th>Jadwal Seleksi</th>
                      <th>Status WA Notif</th>
                      <th>Aksi Penjadwalan</th>
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
                          <td>
                            {c.selectionDay ? (
                              <span className={styles.badgeDay}><Calendar size={13} /> {c.selectionDay}</span>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Belum Ditentukan</span>
                            )}
                          </td>
                          <td>
                            {c.selectionNotified ? (
                              <span className={styles.badgeNotified}><CheckCircle size={13} /> Terkirim</span>
                            ) : (
                              <span className={styles.badgeUnnotified}><AlertCircle size={13} /> Belum Dikirim</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => openEditModal(c, 'seleksi')}
                              className="btn btn-secondary btn-sm"
                              title="Edit Hari Seleksi Cepat"
                            >
                              <Calendar size={14} /> Edit Hari Seleksi
                            </button>
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

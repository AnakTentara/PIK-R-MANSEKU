import { useState, useEffect, useRef, useMemo } from 'react';
import { Award, Download, X, Settings2, Image as ImageIcon, Sparkles, CheckSquare } from 'lucide-react';
import styles from './InfografisModal.module.css';

export default function InfografisModal({ isOpen, onClose, candidates = [], scoresMap = {} }) {
  const canvasRef = useRef(null);

  // Settings State
  const [rankStart, setRankStart] = useState(1);
  const [rankEnd, setRankEnd] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('1:1'); // '1:1' (1080x1080) or '4:3' (1440x1080)
  const [themeMode, setThemeMode] = useState('orange_light'); // 'orange_light' or 'orange_dark'
  
  // Toggle Checkboxes (Check ON/OFF)
  const [showName, setShowName] = useState(true);
  const [showNisn, setShowNisn] = useState(true);
  const [showClass, setShowClass] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showFinalScore, setShowFinalScore] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [showOptionalText, setShowOptionalText] = useState(true);
  const [optionalText, setOptionalText] = useState(
    'Selamat kepada para calon anggota dengan hasil seleksi terbaik! Tetap berprestasi & berkarya bersama PIK-R MANSEKU.'
  );

  // Filtered & Sorted Candidates (Ranked by finalScore)
  const rankedCandidates = useMemo(() => {
    return [...candidates]
      .filter(c => c.attendanceStatus !== 'TIDAK_HADIR')
      .sort((a, b) => {
        const scoreA = scoresMap[a.id]?.finalScore ?? -1;
        const scoreB = scoresMap[b.id]?.finalScore ?? -1;
        return scoreB - scoreA;
      });
  }, [candidates, scoresMap]);

  const selectedCandidates = useMemo(() => {
    const start = Math.max(1, rankStart) - 1;
    const end = Math.min(rankedCandidates.length, rankEnd);
    return rankedCandidates.slice(start, end).map((c, idx) => ({
      ...c,
      actualRank: start + idx + 1,
      scoreObj: scoresMap[c.id] || {}
    }));
  }, [rankedCandidates, rankStart, rankEnd, scoresMap]);

  // Helper Title Case
  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Draw Canvas Effect
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const width = aspectRatio === '1:1' ? 1080 : 1440;
    const height = 1080;

    canvas.width = width;
    canvas.height = height;

    const isDark = themeMode === 'orange_dark';
    const textColorMain = isDark ? '#ffffff' : '#0f172a';
    const textColorSub = isDark ? '#94a3b8' : '#475569';

    // ── 1. BACKGROUND GRADIENT & PATTERN ──
    if (isDark) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient glows
      const glow1 = ctx.createRadialGradient(width * 0.2, height * 0.2, 50, width * 0.2, height * 0.2, 500);
      glow1.addColorStop(0, 'rgba(234, 88, 12, 0.25)');
      glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(width * 0.8, height * 0.8, 50, width * 0.8, height * 0.8, 500);
      glow2.addColorStop(0, 'rgba(249, 115, 22, 0.2)');
      glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Light Orange Theme
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#fff7ed');
      grad.addColorStop(0.5, '#ffedd5');
      grad.addColorStop(1, '#fed7aa');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient glows
      const glow1 = ctx.createRadialGradient(width * 0.85, height * 0.15, 50, width * 0.85, height * 0.15, 600);
      glow1.addColorStop(0, 'rgba(249, 115, 22, 0.18)');
      glow1.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);
    }

    // Top & Bottom Accent Bar
    const topBarGrad = ctx.createLinearGradient(0, 0, width, 0);
    topBarGrad.addColorStop(0, '#ea580c');
    topBarGrad.addColorStop(0.5, '#f97316');
    topBarGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = topBarGrad;
    ctx.fillRect(0, 0, width, 12);

    // ── 2. HEADER BANNER ──
    const pillText = '🏆 INFOGRAFIS REKAP RANKING SELEKSI 🏆';
    ctx.font = 'bold 15px "Arial", sans-serif';
    const pillWidth = ctx.measureText(pillText).width + 36;
    const pillX = (width - pillWidth) / 2;
    const pillY = 28;

    ctx.fillStyle = isDark ? 'rgba(234, 88, 12, 0.3)' : 'rgba(234, 88, 12, 0.15)';
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.5;
    roundRect(ctx, pillX, pillY, pillWidth, 30, 15, true, true);

    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 14px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(pillText, width / 2, pillY + 20);

    // Main Title
    ctx.fillStyle = textColorMain;
    ctx.font = 'bold 32px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOP RANKING SELEKSI CALON ANGGOTA', width / 2, 92);

    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 18px "Arial", sans-serif';
    ctx.fillText('PIK-R MANSEKU — MAN 1 MUARA ENIM TAHUN 2026', width / 2, 118);

    // Header Decorative Underline
    const lineGrad = ctx.createLinearGradient(width / 2 - 150, 0, width / 2 + 150, 0);
    lineGrad.addColorStop(0, 'rgba(234, 88, 12, 0)');
    lineGrad.addColorStop(0.5, '#ea580c');
    lineGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(width / 2 - 150, 126, 300, 3);

    // ── 3. CANDIDATE CARDS AUTO-SIZING & VERTICAL CENTERING ──
    const count = selectedCandidates.length;
    const isMultiColumn = count > 5;
    const itemsPerCol = isMultiColumn ? Math.ceil(count / 2) : count;

    const topHeaderBottom = 138;
    const footerTop = height - (showOptionalText ? 85 : 45);
    const maxAvailableHeight = footerTop - topHeaderBottom - 20;

    let cardHeight = 76;
    let cardGap = 12;

    if (!isMultiColumn) {
      if (count <= 3) {
        cardHeight = 92;
        cardGap = 16;
      } else if (count <= 5) {
        cardHeight = 82;
        cardGap = 14;
      }
    } else {
      if (itemsPerCol > 6) {
        cardHeight = 62;
        cardGap = 8;
      } else {
        cardHeight = 72;
        cardGap = 10;
      }
    }

    const totalCardsHeight = itemsPerCol * cardHeight + (itemsPerCol - 1) * cardGap;
    const cardAreaY = topHeaderBottom + Math.max(10, Math.floor((maxAvailableHeight - totalCardsHeight) / 2));

    const colWidth = isMultiColumn ? (width - 100 - 24) / 2 : width - 160;
    const startX = isMultiColumn ? 50 : 80;

    selectedCandidates.forEach((c, i) => {
      const colIdx = isMultiColumn ? Math.floor(i / itemsPerCol) : 0;
      const rowIdx = isMultiColumn ? (i % itemsPerCol) : i;

      const cardX = isMultiColumn ? (startX + colIdx * (colWidth + 24)) : startX;
      const cardY = cardAreaY + rowIdx * (cardHeight + cardGap);
      const rank = c.actualRank;

      const isTop1 = rank === 1;
      const isTop2 = rank === 2;
      const isTop3 = rank === 3;

      let cardBg = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.96)';
      let borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';

      if (isTop1) {
        cardBg = isDark ? 'rgba(245, 158, 11, 0.18)' : '#fffbeb';
        borderColor = '#f59e0b';
      } else if (isTop2) {
        cardBg = isDark ? 'rgba(148, 163, 184, 0.14)' : '#f8fafc';
        borderColor = '#94a3b8';
      } else if (isTop3) {
        cardBg = isDark ? 'rgba(217, 119, 6, 0.18)' : '#fff7ed';
        borderColor = '#ea580c';
      }

      // Draw Card Outer Drop Shadow for 3D feel
      ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = cardBg;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isTop1 || isTop2 || isTop3 ? 2 : 1;
      roundRect(ctx, cardX, cardY, colWidth, cardHeight, 10, true, true);

      // Reset shadow for inner elements
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // ── RANK BADGE: EXACT SQUARE 3D ORANGE BOX (1:1 Ratio) ──
      const badgeSize = Math.min(50, Math.max(40, cardHeight - 16));
      const badgeX = cardX + 12;
      const badgeY = cardY + (cardHeight - badgeSize) / 2;

      // 3D Drop Shadow for Badge
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;

      let badgeGrad;
      if (isTop1) {
        badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeSize);
        badgeGrad.addColorStop(0, '#f59e0b');
        badgeGrad.addColorStop(1, '#d97706');
      } else if (isTop2) {
        badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeSize);
        badgeGrad.addColorStop(0, '#94a3b8');
        badgeGrad.addColorStop(1, '#64748b');
      } else if (isTop3) {
        badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeSize);
        badgeGrad.addColorStop(0, '#ea580c');
        badgeGrad.addColorStop(1, '#c2410c');
      } else {
        badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeSize);
        badgeGrad.addColorStop(0, '#f97316');
        badgeGrad.addColorStop(1, '#ea580c');
      }

      ctx.fillStyle = badgeGrad;
      roundRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 8, true, false);

      // Reset Shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Square Rank Badge Text (Crisp #1, #2, #3, etc.)
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.min(22, badgeSize * 0.48)}px "Arial", sans-serif`;
      ctx.fillText(`#${rank}`, badgeX + badgeSize / 2, badgeY + badgeSize / 2);

      // Candidate Avatar Photo / Initial Circle
      let contentLeft = badgeX + badgeSize + 14;

      if (showPhoto) {
        const photoRadius = Math.min(20, Math.max(15, cardHeight * 0.28));
        const photoX = contentLeft + photoRadius;
        const photoY = cardY + cardHeight / 2;

        ctx.beginPath();
        ctx.arc(photoX, photoY, photoRadius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
        ctx.fill();
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ea580c';
        ctx.font = `bold ${photoRadius * 0.9}px "Arial", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.name ? c.name[0].toUpperCase() : 'P', photoX, photoY + 1);

        contentLeft = photoX + photoRadius + 14;
      }

      // Candidate Name & Class (Compact & Balanced Font Sizes)
      ctx.textAlign = 'left';

      const showSubMeta = showClass || showNisn;

      if (showName) {
        ctx.fillStyle = textColorMain;
        const nameFontSize = !isMultiColumn
          ? Math.min(20, Math.max(16, cardHeight * 0.26))
          : Math.min(17, Math.max(14, cardHeight * 0.24));

        ctx.font = `bold ${nameFontSize}px "Arial", sans-serif`;
        const displayName = toTitleCase(c.name || 'Nama Candidate');

        // Truncate name if too long to prevent overlapping right side badges
        let truncatedName = displayName;
        const maxNameWidth = colWidth - (contentLeft - cardX) - (showFinalScore ? 80 : 20);
        if (ctx.measureText(truncatedName).width > maxNameWidth) {
          while (truncatedName.length > 3 && ctx.measureText(truncatedName + '...').width > maxNameWidth) {
            truncatedName = truncatedName.slice(0, -1);
          }
          truncatedName += '...';
        }

        if (showSubMeta) {
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(truncatedName, contentLeft, cardY + cardHeight / 2 - 2);
        } else {
          ctx.textBaseline = 'middle';
          ctx.fillText(truncatedName, contentLeft, cardY + cardHeight / 2);
        }
      }

      if (showSubMeta) {
        ctx.fillStyle = textColorSub;
        ctx.textBaseline = 'alphabetic';
        ctx.font = `500 ${Math.min(12, Math.max(10, cardHeight * 0.18))}px "Arial", sans-serif`;
        const metaParts = [];
        if (showClass && c.className) metaParts.push(`Kelas: ${c.className}`);
        if (showNisn && c.nisn) metaParts.push(`NISN: ${c.nisn}`);
        ctx.fillText(metaParts.join('  ·  '), contentLeft, cardY + cardHeight / 2 + 15);
      }

      // Right Side Badges: NILAI AKHIR (EXACT SQUARE 3D ORANGE BOX 1:1)
      let rightX = cardX + colWidth - 12;

      if (showFinalScore) {
        const finalScoreVal = c.scoreObj.finalScore !== null && c.scoreObj.finalScore !== undefined
          ? c.scoreObj.finalScore.toFixed(2)
          : '-';

        const finalBadgeSize = Math.min(50, Math.max(40, cardHeight - 16));
        const finalBadgeX = rightX - finalBadgeSize;
        const finalBadgeY = cardY + (cardHeight - finalBadgeSize) / 2;

        // 3D Drop Shadow for Nilai Akhir Square Badge
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        const badgeGradFinal = ctx.createLinearGradient(finalBadgeX, finalBadgeY, finalBadgeX, finalBadgeY + finalBadgeSize);
        badgeGradFinal.addColorStop(0, '#ea580c');
        badgeGradFinal.addColorStop(1, '#f97316');

        ctx.fillStyle = badgeGradFinal;
        roundRect(ctx, finalBadgeX, finalBadgeY, finalBadgeSize, finalBadgeSize, 8, true, false);

        // Reset Shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.min(19, finalBadgeSize * 0.44)}px "Arial", sans-serif`;
        ctx.fillText(finalScoreVal, finalBadgeX + finalBadgeSize / 2, finalBadgeY + finalBadgeSize / 2);

        rightX = finalBadgeX - 10;
      }

      if (showStatus && !isMultiColumn) {
        const statusVal = c.status || 'PENDING';
        const isLulus = statusVal === 'LULUS';
        const statusLabel = isLulus ? '✓ LULUS' : '⏳ PENDING';
        const statusBg = isLulus ? '#dcfce7' : '#fef3c7';
        const statusColor = isLulus ? '#15803d' : '#b45309';

        ctx.font = `bold ${Math.min(12, cardHeight * 0.18)}px "Arial", sans-serif`;
        const stWidth = ctx.measureText(statusLabel).width + 14;
        const stHeight = Math.min(24, cardHeight * 0.35);
        const stX = rightX - stWidth;
        const stY = cardY + (cardHeight - stHeight) / 2;

        ctx.fillStyle = statusBg;
        roundRect(ctx, stX, stY, stWidth, stHeight, 6, true, false);

        ctx.fillStyle = statusColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(statusLabel, stX + stWidth / 2, stY + stHeight / 2);
      }
    });

    // ── 4. FOOTER OPTIONAL TEXT & WATERMARK (WELL INSIDE CANVAS FRAME) ──
    const footerY = height - (showOptionalText ? 80 : 40);

    // Divider line
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(234, 88, 12, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, footerY);
    ctx.lineTo(width - 60, footerY);
    ctx.stroke();

    if (showOptionalText && optionalText.trim()) {
      ctx.fillStyle = '#ea580c';
      ctx.font = 'bold 14px "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(optionalText.trim(), width / 2, footerY + 26);

      ctx.fillStyle = textColorSub;
      ctx.font = '12px "Arial", sans-serif';
      ctx.fillText(`Official PIK-R MANSEKU Announcement  ·  Dicetak pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, width / 2, footerY + 48);
    } else {
      ctx.fillStyle = textColorSub;
      ctx.font = '12px "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`Official PIK-R MANSEKU Announcement  ·  ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, width / 2, footerY + 26);
    }

  }, [
    isOpen,
    aspectRatio,
    themeMode,
    rankStart,
    rankEnd,
    showName,
    showNisn,
    showClass,
    showPhoto,
    showFinalScore,
    showStatus,
    showOptionalText,
    optionalText,
    selectedCandidates
  ]);

  // Helper Canvas Round Rectangle
  function roundRect(ctx, x, y, w, h, radius, fill, stroke) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + w - radius.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
    ctx.lineTo(x + w, y + h - radius.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
    ctx.lineTo(x + radius.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // Trigger Download PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `INFOGRAFIS_RANKING_TOP_${rankStart}_SD_${rankEnd}_PIK-R.png`;
    link.href = dataUrl;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitle}>
            <Award size={20} color="#f97316" />
            <div>
              <h3>Generator Infografis Top Ranking</h3>
              <p>Buat dan unduh poster infografis nilai seleksi terbaik (High-Res 1080p)</p>
            </div>
          </div>

          <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>

        {/* Body Grid: Settings Panel + Live Canvas Preview */}
        <div className={styles.modalBody}>
          {/* Settings Panel */}
          <div className={styles.settingsPanel}>
            {/* Rentang Rank */}
            <div className={styles.controlGroup}>
              <div className={styles.sectionTitle}>
                <Settings2 size={14} /> Rentang Rank Peserta
              </div>

              <div className={styles.rowTwoCol}>
                <div>
                  <label className={styles.label}>Rank Awal</label>
                  <input
                    type="number"
                    min="1"
                    max={rankedCandidates.length || 1}
                    value={rankStart}
                    onChange={(e) => setRankStart(parseInt(e.target.value) || 1)}
                    className={styles.input}
                  />
                </div>
                <div>
                  <label className={styles.label}>Rank Akhir</label>
                  <input
                    type="number"
                    min="1"
                    max={rankedCandidates.length || 1}
                    value={rankEnd}
                    onChange={(e) => setRankEnd(parseInt(e.target.value) || 1)}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Preset Buttons */}
              <div className={styles.presetGroup} style={{ marginTop: '4px' }}>
                <button type="button" onClick={() => { setRankStart(1); setRankEnd(3); }} className={`${styles.btnPreset} ${rankStart === 1 && rankEnd === 3 ? styles.btnPresetActive : ''}`}>Top 3</button>
                <button type="button" onClick={() => { setRankStart(1); setRankEnd(5); }} className={`${styles.btnPreset} ${rankStart === 1 && rankEnd === 5 ? styles.btnPresetActive : ''}`}>Top 5</button>
                <button type="button" onClick={() => { setRankStart(1); setRankEnd(10); }} className={`${styles.btnPreset} ${rankStart === 1 && rankEnd === 10 ? styles.btnPresetActive : ''}`}>Top 10</button>
                <button type="button" onClick={() => { setRankStart(1); setRankEnd(rankedCandidates.length); }} className={`${styles.btnPreset} ${rankStart === 1 && rankEnd === rankedCandidates.length ? styles.btnPresetActive : ''}`}>Semua ({rankedCandidates.length})</button>
              </div>
            </div>

            {/* Format & Tema */}
            <div className={styles.controlGroup}>
              <div className={styles.sectionTitle}>
                <ImageIcon size={14} /> Format Poster & Tema
              </div>

              <div className={styles.rowTwoCol}>
                <div>
                  <label className={styles.label}>Rasio Layar</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className={styles.select}
                  >
                    <option value="1:1">1:1 (Instagram Feed / Status)</option>
                    <option value="4:3">4:3 (Layar Presentation / Banner)</option>
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Gaya Tema</label>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    className={styles.select}
                  >
                    <option value="orange_light">Oren Warm Soft White</option>
                    <option value="orange_dark">Oren Dark Sleek Night</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Toggle Element Checks (Check ON/OFF) */}
            <div className={styles.controlGroup}>
              <div className={styles.sectionTitle}>
                <CheckSquare size={14} /> Elemen Tampilan (Check ON/OFF)
              </div>

              <div className={styles.checkboxGrid}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
                  <span>Nama Peserta</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showClass} onChange={(e) => setShowClass(e.target.checked)} />
                  <span>Kelas</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showNisn} onChange={(e) => setShowNisn(e.target.checked)} />
                  <span>NISN</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} />
                  <span>Foto Profil Avatar</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showFinalScore} onChange={(e) => setShowFinalScore(e.target.checked)} />
                  <span>Nilai Rapor Total</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showStatus} onChange={(e) => setShowStatus(e.target.checked)} />
                  <span>Status Kelulusan</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={showOptionalText} onChange={(e) => setShowOptionalText(e.target.checked)} />
                  <span>Teks Catatan Footer</span>
                </label>
              </div>
            </div>

            {/* Custom Optional Footer Text Input */}
            {showOptionalText && (
              <div className={styles.controlGroup}>
                <label className={styles.label}>Teks Catatan Tambahan (Footer)</label>
                <textarea
                  rows={3}
                  value={optionalText}
                  onChange={(e) => setOptionalText(e.target.value)}
                  placeholder="Ketik catatan selamat atau informasi di bagian bawah infografis..."
                  className={styles.textarea}
                />
              </div>
            )}
          </div>

          {/* Canvas Live Preview Panel */}
          <div className={styles.previewPanel}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#f97316" />
              <span>Live Preview Poster Infografis ({aspectRatio === '1:1' ? '1080 x 1080 px' : '1440 x 1080 px'}) — 100% Fit & Auto-Sized</span>
            </div>

            <div className={styles.canvasContainer}>
              <canvas ref={canvasRef} className={styles.canvas} />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Menampilkan <strong>{selectedCandidates.length}</strong> peserta teratas dalam tata letak otomatis ({selectedCandidates.length > 5 ? '2 Kolom Kanan-Kiri' : '1 Kolom Terpusat'}).
          </span>

          <button type="button" onClick={handleDownload} className={styles.downloadBtn}>
            <Download size={16} /> Unduh Gambar Infografis (PNG 1080p)
          </button>
        </div>
      </div>
    </div>
  );
}

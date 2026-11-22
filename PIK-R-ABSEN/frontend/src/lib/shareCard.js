import { longDate } from './time.js';

/**
 * Memuat gambar untuk canvas.
 */
function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Polyfill roundRect jika belum tersedia di browser lawas.
 */
function roundRectPolyfill(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const radius = typeof r === 'number' ? r : (r[0] || 0);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Menggambar card dengan gaya Claymorphism khas PIK-R:
 * - Sudut membulat
 * - Multi-layer shadow lembut
 * - Bevel highlight putih di atas-kiri
 */
function drawClayCard(ctx, x, y, w, h, r, {
  fill = '#fcf9f6',
  borderColor = 'rgba(255, 255, 255, 0.9)',
  borderWidth = 2,
  shadowColor = 'rgba(150, 120, 95, 0.18)',
  shadowBlur = 18,
  shadowOffsetY = 8,
  shadowOffsetX = 0,
  gradientSheen = true
} = {}) {
  ctx.save();

  // 1. Bayangan jatuh luar (Clay soft drop-shadow)
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = shadowOffsetX;
  ctx.shadowOffsetY = shadowOffsetY;

  ctx.beginPath();
  roundRectPolyfill(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();

  // Matikan shadow untuk operasi selanjutnya
  ctx.shadowColor = 'transparent';

  // 2. Kilau gradien atas (sheen)
  if (gradientSheen) {
    const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.6);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    sheen.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
    sheen.addColorStop(1, 'rgba(0, 0, 0, 0.02)');
    ctx.fillStyle = sheen;
    ctx.fill();
  }

  // 3. Border highlight putih
  if (borderWidth > 0 && borderColor) {
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Menggambar vector ikon tajam di canvas
 */
function drawVectorIcon(ctx, type, cx, cy, color = '#ffffff') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'check') {
    // Tanda Centang (Checkmark)
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx - 2, cy + 6);
    ctx.lineTo(cx + 9, cy - 6);
    ctx.stroke();
  } else if (type === 'cross') {
    // Tanda Silang (Alfa)
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 7);
    ctx.lineTo(cx + 7, cy + 7);
    ctx.moveTo(cx + 7, cy - 7);
    ctx.lineTo(cx - 7, cy + 7);
    ctx.stroke();
  } else if (type === 'mail') {
    // Ikon Surat / Izin
    ctx.lineWidth = 2.4;
    ctx.strokeRect(cx - 9, cy - 6, 18, 13);
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy - 5);
    ctx.lineTo(cx, cy + 1);
    ctx.lineTo(cx + 9, cy - 5);
    ctx.stroke();
  } else if (type === 'plus') {
    // Ikon Palang Medis / Sakit
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();
  } else if (type === 'instagram') {
    // Ikon Instagram
    ctx.lineWidth = 2.4;
    roundRectPolyfill(ctx, cx - 11, cy - 11, 22, 22, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 6, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'globe') {
    // Ikon Globe
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 4.5, 9.8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Potong teks jika terlalu panjang agar tidak tumpang-tindih.
 */
function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let str = text;
  while (str.length > 0 && ctx.measureText(str + '...').width > maxWidth) {
    str = str.slice(0, -1);
  }
  return str + '...';
}

/**
 * Generate 4:3 Landscape PNG Card Rekapitulasi Presensi PIK-R MANSEKU.
 * Resolusi: 1200 x 900 px (Presisi 4:3, crisp retina).
 *
 * Tata Letak:
 * - Kiri: Hadir (memanjang di atas), lalu Izin, Sakit, Alfa (3 berjejer di bawah)
 * - Kanan: Persentase Kehadiran (Donut Chart) + Ringkasan Total
 */
export async function generateRecapCard({ mode, date, range, recap, totals }) {
  await document.fonts?.ready;

  const width = 1200;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const isDay = mode === 'day';
  const session = isDay ? recap?.sessions?.[0] : null;
  const title = isDay
    ? (session?.title || 'Presensi Pertemuan PIK-R')
    : `Rekapitulasi Presensi (${recap?.sessions?.length || 0} Sesi)`;
  const sessionTypeLabel = isDay
    ? ({ PERTEMUAN: 'Pertemuan Rutin', WAJIB: 'Kegiatan Wajib', TAMBAHAN: 'Kegiatan Tambahan' }[session?.type] || 'Presensi Harian')
    : 'Rekap Rentang Waktu';
  const dateStr = isDay
    ? longDate(date)
    : `${longDate(range.from)} – ${longDate(range.to)}`;

  const totalPresensi = totals.HADIR + totals.ALFA + totals.IZIN + totals.SAKIT;
  const pctHadir = totalPresensi > 0 ? Math.round((totals.HADIR / totalPresensi) * 100) : 0;
  const totalAnggota = recap?.rows?.length || 0;

  // 1. Background Kanvas Clay Warm
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#fbf8f5');
  bgGrad.addColorStop(1, '#ede5dc');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Ambient Clay Radial Lighting
  const light1 = ctx.createRadialGradient(160, 140, 10, 160, 140, 380);
  light1.addColorStop(0, 'rgba(249, 115, 22, 0.08)');
  light1.addColorStop(1, 'transparent');
  ctx.fillStyle = light1;
  ctx.fillRect(0, 0, width, height);

  const light2 = ctx.createRadialGradient(1080, 780, 10, 1080, 780, 420);
  light2.addColorStop(0, 'rgba(37, 99, 235, 0.06)');
  light2.addColorStop(1, 'transparent');
  ctx.fillStyle = light2;
  ctx.fillRect(0, 0, width, height);

  // 2. Header Card (Clay Top Bar)
  drawClayCard(ctx, 45, 40, 1110, 136, 26, {
    fill: '#fdfbf9',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    shadowColor: 'rgba(150, 120, 95, 0.18)',
    shadowBlur: 18,
    shadowOffsetY: 8
  });

  // Logo PIK-R
  const logo = await loadImage('/logo_pik-r.png');
  const logoSize = 82;
  const logoX = 70;
  const logoY = 67;

  // Bingkai avatar clay logo
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(150, 120, 95, 0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.restore();

  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  } else {
    // Fallback badge logo
    ctx.save();
    ctx.fillStyle = '#ea580c';
    ctx.font = '900 24px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PIK-R', logoX + logoSize / 2, logoY + logoSize / 2);
    ctx.restore();
  }

  // Teks Header
  const textLeftX = logoX + logoSize + 24;

  // Badge Organisasi
  ctx.save();
  const orgBadgeWidth = 148;
  const orgBadgeHeight = 26;
  drawClayCard(ctx, textLeftX, 60, orgBadgeWidth, orgBadgeHeight, 13, {
    fill: '#ffe6d3',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    shadowColor: 'rgba(234, 88, 12, 0.15)',
    shadowBlur: 6,
    shadowOffsetY: 2
  });
  ctx.fillStyle = '#b8430a';
  ctx.font = '800 12px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PIK-R MANSEKU', textLeftX + orgBadgeWidth / 2, 60 + orgBadgeHeight / 2);
  ctx.restore();

  // Judul Kegiatan
  ctx.save();
  ctx.fillStyle = '#2a1f17';
  ctx.font = '800 26px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const truncatedTitle = truncateText(ctx, title, 580);
  ctx.fillText(truncatedTitle, textLeftX, 118);

  // Tanggal / Subtitle
  ctx.fillStyle = '#62523f';
  ctx.font = '600 16px "Inter", sans-serif';
  ctx.fillText(`🗓️ ${dateStr}`, textLeftX, 146);
  ctx.restore();

  // Badge Status Kegiatan (Kanan Atas)
  ctx.save();
  const rightTagWidth = 190;
  const rightTagHeight = 42;
  const rightTagX = 1120 - rightTagWidth;
  const rightTagY = 87;
  drawClayCard(ctx, rightTagX, rightTagY, rightTagWidth, rightTagHeight, 21, {
    fill: '#ffffff',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    borderWidth: 1.5,
    shadowColor: 'rgba(150, 120, 95, 0.15)',
    shadowBlur: 8,
    shadowOffsetY: 3
  });
  ctx.beginPath();
  ctx.arc(rightTagX + 22, rightTagY + rightTagHeight / 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f97316';
  ctx.fill();

  ctx.fillStyle = '#b8430a';
  ctx.font = '700 13px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(sessionTypeLabel, rightTagX + 35, rightTagY + rightTagHeight / 2);
  ctx.restore();

  // ─── 3. MAIN SECTION ──────────────────────────────────────────
  // Kiri: Hadir (memanjang atas) + Izin, Sakit, Alfa (3 berjejer bawah) (Width: 705px)
  // Kanan: Donut Persentase Kehadiran + Ringkasan (Width: 385px)
  const leftX = 45;
  const leftW = 705;
  const topCardY = 198;
  const topCardH = 245;

  // ── KIRI ATAS: HADIR (MEMANJANG) ──
  const hadirGrad = ctx.createLinearGradient(leftX, topCardY, leftX, topCardY + topCardH);
  hadirGrad.addColorStop(0, '#f0fdf4');
  hadirGrad.addColorStop(1, '#dcfce7');
  drawClayCard(ctx, leftX, topCardY, leftW, topCardH, 26, {
    fill: hadirGrad,
    borderColor: 'rgba(34, 197, 94, 0.55)',
    borderWidth: 2,
    shadowColor: 'rgba(21, 128, 61, 0.2)',
    shadowBlur: 18,
    shadowOffsetY: 8
  });

  // Hadir: Kolom Kiri (Ikon + Label + Info)
  const hadirIconX = leftX + 36;
  const hadirIconY = topCardY + 40;
  const iconRadius = 22;

  ctx.save();
  ctx.beginPath();
  ctx.arc(hadirIconX + iconRadius, hadirIconY + iconRadius, iconRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#16a34a';
  ctx.shadowColor = 'rgba(21, 128, 61, 0.25)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  drawVectorIcon(ctx, 'check', hadirIconX + iconRadius, hadirIconY + iconRadius, '#ffffff');
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#15803d';
  ctx.font = '800 20px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HADIR', hadirIconX + iconRadius * 2 + 16, hadirIconY + iconRadius);

  ctx.fillStyle = '#166534';
  ctx.font = '500 14px "Inter", sans-serif';
  ctx.fillText('Anggota hadir tepat waktu di kegiatan', hadirIconX, topCardY + 125);

  // Pill persentase di bawah deskripsi
  const pillPctW = 160;
  drawClayCard(ctx, hadirIconX, topCardY + 155, pillPctW, 36, 12, {
    fill: 'rgba(34, 197, 94, 0.16)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    borderWidth: 1.5,
    shadowColor: 'transparent',
    gradientSheen: false
  });
  ctx.fillStyle = '#15803d';
  ctx.font = '700 13px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${pctHadir}% dari total presensi`, hadirIconX + pillPctW / 2, topCardY + 155 + 18);
  ctx.restore();

  // Hadir: Kolom Kanan (Angka Besar + Teks "Orang" yang TIDAK BENTROK)
  ctx.save();
  const hadirRightCenterX = leftX + leftW - 145;
  const hadirBaselineY = topCardY + 145;

  // Angka Hadir (align right dari titik tengah pemisah)
  ctx.fillStyle = '#15803d';
  ctx.font = '900 84px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(totals.HADIR), hadirRightCenterX - 8, hadirBaselineY);

  // Teks "Orang" (align left dari titik tengah pemisah dengan baseline sejajar)
  ctx.fillStyle = '#166534';
  ctx.font = '700 20px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Orang', hadirRightCenterX + 6, hadirBaselineY - 14);
  ctx.restore();

  // ── KIRI BAWAH: IZIN, SAKIT, ALFA (3 BERJEJER) ──
  const bottomCardY = 465;
  const bottomCardH = 273;
  const gapBottom = 18;
  const colW = Math.floor((leftW - gapBottom * 2) / 3); // 223px

  const bottomCards = [
    {
      label: 'IZIN',
      val: totals.IZIN,
      sub: 'Izin resmi / surat',
      bgGrad: ['#fffbeb', '#fef3c7'],
      border: 'rgba(245, 158, 11, 0.5)',
      iconBg: '#d97706',
      iconType: 'mail',
      textColor: '#b45309',
      shadowColor: 'rgba(180, 83, 9, 0.16)'
    },
    {
      label: 'SAKIT',
      val: totals.SAKIT,
      sub: 'Kondisi sakit',
      bgGrad: ['#eff6ff', '#dbeafe'],
      border: 'rgba(59, 130, 246, 0.5)',
      iconBg: '#2563eb',
      iconType: 'plus',
      textColor: '#1d4ed8',
      shadowColor: 'rgba(37, 99, 235, 0.16)'
    },
    {
      label: 'ALFA',
      val: totals.ALFA,
      sub: totals.ALFA > 0 ? 'Tanpa keterangan' : 'Nihil / Tertib',
      bgGrad: ['#fef2f2', '#fee2e2'],
      border: 'rgba(239, 68, 68, 0.5)',
      iconBg: '#dc2626',
      iconType: 'cross',
      textColor: '#b91c1c',
      shadowColor: 'rgba(185, 28, 28, 0.16)'
    }
  ];

  bottomCards.forEach((c, idx) => {
    const cx = leftX + idx * (colW + gapBottom);
    const cardBg = ctx.createLinearGradient(cx, bottomCardY, cx, bottomCardY + bottomCardH);
    cardBg.addColorStop(0, c.bgGrad[0]);
    cardBg.addColorStop(1, c.bgGrad[1]);

    drawClayCard(ctx, cx, bottomCardY, colW, bottomCardH, 22, {
      fill: cardBg,
      borderColor: c.border,
      borderWidth: 2,
      shadowColor: c.shadowColor,
      shadowBlur: 14,
      shadowOffsetY: 6
    });

    // Ikon + Label (Baris Atas)
    const topBarY = bottomCardY + 28;
    const miniIconR = 17;
    const miniIconX = cx + 22;

    ctx.save();
    ctx.beginPath();
    ctx.arc(miniIconX + miniIconR, topBarY + miniIconR, miniIconR, 0, Math.PI * 2);
    ctx.fillStyle = c.iconBg;
    ctx.shadowColor = c.shadowColor;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    drawVectorIcon(ctx, c.iconType, miniIconX + miniIconR, topBarY + miniIconR, '#ffffff');
    ctx.restore();

    ctx.save();
    ctx.fillStyle = c.textColor;
    ctx.font = '800 16px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.label, miniIconX + miniIconR * 2 + 12, topBarY + miniIconR);

    // Angka Besar Terpusat
    const numY = bottomCardY + 140;
    ctx.font = '900 62px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(c.val), cx + colW / 2, numY);

    // Label "Orang" Berdiri Sendiri di Bawah Angka (Pasti tidak ketutupan!)
    ctx.font = '700 15px "Inter", sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Orang', cx + colW / 2, numY + 28);

    // Subtitle / keterangan kecil
    ctx.fillStyle = '#62523f';
    ctx.font = '500 12px "Inter", sans-serif';
    ctx.fillText(c.sub, cx + colW / 2, bottomCardY + bottomCardH - 24);
    ctx.restore();
  });

  // ── KANAN: PERSENTASE KEHADIRAN (DONUT CHART) ──
  const rightX = 770;
  const rightW = 385;
  const rightH = 540;

  drawClayCard(ctx, rightX, topCardY, rightW, rightH, 28, {
    fill: '#fcf9f6',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    shadowColor: 'rgba(150, 120, 95, 0.18)',
    shadowBlur: 20,
    shadowOffsetY: 8
  });

  // Judul Section Kanan
  ctx.save();
  ctx.fillStyle = '#2a1f17';
  ctx.font = '800 22px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Persentase Kehadiran', rightX + rightW / 2, topCardY + 44);

  ctx.fillStyle = '#766759';
  ctx.font = '500 13px "Inter", sans-serif';
  ctx.fillText('Rasio kehadiran anggota presensi', rightX + rightW / 2, topCardY + 70);
  ctx.restore();

  // Lingkaran Donut Kehadiran
  const donutCx = rightX + rightW / 2;
  const donutCy = topCardY + 235;
  const donutRadius = 110;
  const donutStrokeWidth = 26;

  // Background ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(donutCx, donutCy, donutRadius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ebe4dc';
  ctx.lineWidth = donutStrokeWidth;
  ctx.stroke();

  // Progress arc
  if (pctHadir > 0) {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (pctHadir / 100) * 2 * Math.PI;

    const arcGrad = ctx.createLinearGradient(
      donutCx - donutRadius, donutCy - donutRadius,
      donutCx + donutRadius, donutCy + donutRadius
    );
    if (pctHadir >= 75) {
      arcGrad.addColorStop(0, '#22c55e');
      arcGrad.addColorStop(1, '#15803d');
    } else if (pctHadir >= 50) {
      arcGrad.addColorStop(0, '#f59e0b');
      arcGrad.addColorStop(1, '#d97706');
    } else {
      arcGrad.addColorStop(0, '#ef4444');
      arcGrad.addColorStop(1, '#dc2626');
    }

    ctx.beginPath();
    ctx.arc(donutCx, donutCy, donutRadius, startAngle, endAngle);
    ctx.strokeStyle = arcGrad;
    ctx.lineWidth = donutStrokeWidth;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(21, 128, 61, 0.35)';
    ctx.shadowBlur = 12;
    ctx.stroke();
  }
  ctx.restore();

  // Center Clay Disc inside Donut
  const innerDiscRadius = donutRadius - donutStrokeWidth / 2 - 12;
  ctx.save();
  ctx.beginPath();
  ctx.arc(donutCx, donutCy, innerDiscRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(150, 120, 95, 0.16)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Angka Persentase
  ctx.fillStyle = '#2a1f17';
  ctx.font = '900 48px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${pctHadir}%`, donutCx, donutCy + 8);

  ctx.fillStyle = pctHadir >= 75 ? '#15803d' : pctHadir >= 50 ? '#b45309' : '#b91c1c';
  ctx.font = '800 13px "Outfit", "Inter", sans-serif';
  ctx.fillText('TINGKAT KEHADIRAN', donutCx, donutCy + 30);
  ctx.restore();

  // 2 Pill Stat Ringkasan di Bawah Donut
  const pillY1 = topCardY + 395;
  const pillY2 = pillY1 + 58;
  const pillW = rightW - 48;
  const pillX = rightX + 24;

  drawClayCard(ctx, pillX, pillY1, pillW, 46, 16, {
    fill: '#f3eee8',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    shadowColor: 'rgba(150, 120, 95, 0.1)',
    shadowBlur: 6,
    shadowOffsetY: 2
  });
  ctx.save();
  ctx.fillStyle = '#766759';
  ctx.font = '600 13px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Total Peserta Terabsen', pillX + 16, pillY1 + 23);
  ctx.fillStyle = '#2a1f17';
  ctx.font = '800 15px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${totalPresensi} Orang`, pillX + pillW - 16, pillY1 + 23);
  ctx.restore();

  drawClayCard(ctx, pillX, pillY2, pillW, 46, 16, {
    fill: '#f3eee8',
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    shadowColor: 'rgba(150, 120, 95, 0.1)',
    shadowBlur: 6,
    shadowOffsetY: 2
  });
  ctx.save();
  ctx.fillStyle = '#766759';
  ctx.font = '600 13px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Total Anggota Terdaftar', pillX + 16, pillY2 + 23);
  ctx.fillStyle = '#2a1f17';
  ctx.font = '800 15px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${totalAnggota} Anggota`, pillX + pillW - 16, pillY2 + 23);
  ctx.restore();

  // ─── 4. FOOTER CARD ──────────────────────────────────────────
  const footerX = 45;
  const footerY = 768;
  const footerW = 1110;
  const footerH = 92;

  drawClayCard(ctx, footerX, footerY, footerW, footerH, 24, {
    fill: '#fcf9f6',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    shadowColor: 'rgba(150, 120, 95, 0.16)',
    shadowBlur: 16,
    shadowOffsetY: 6
  });

  // Footer Kiri: Instagram PIK-R
  ctx.save();
  const igBadgeX = footerX + 30;
  const igBadgeY = footerY + footerH / 2;
  drawVectorIcon(ctx, 'instagram', igBadgeX + 10, igBadgeY, '#e1306c');

  ctx.fillStyle = '#2a1f17';
  ctx.font = '800 16px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('@pikrmanseku_official', igBadgeX + 32, igBadgeY);
  ctx.restore();

  // Footer Tengah: Slogan PIK-R
  ctx.save();
  ctx.fillStyle = '#766759';
  ctx.font = 'italic 600 15px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('“Beriman, Bertanggung Jawab, Berencana”', footerX + footerW / 2, footerY + footerH / 2);
  ctx.restore();

  // Footer Kanan: Website PIK-R
  ctx.save();
  const webX = footerX + footerW - 30;
  const webY = footerY + footerH / 2;

  ctx.fillStyle = '#2563eb';
  ctx.font = '800 16px "Outfit", "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('pikr-manseku.my.id', webX, webY);

  const textWidth = ctx.measureText('pikr-manseku.my.id').width;
  drawVectorIcon(ctx, 'globe', webX - textWidth - 18, webY, '#2563eb');
  ctx.restore();

  // Konversi canvas ke Blob & DataURL
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const dataUrl = canvas.toDataURL('image/png');
  const filename = `Rekap_Absensi_PIKR_${isDay ? date : `${range.from}_${range.to}`}.png`;

  return { canvas, blob, dataUrl, filename };
}

/**
 * Format caption teks pengumuman rekapitulasi sesuai template user:
 * - List Hadir, Alfa, Izin
 * - Jika ada yang sakit (> 0), otomatis ditambah
 * - Jika ada yang 0, tidak dimasukkan ke list
 */
export function buildShareCaption({ mode, date, range, recap, totals }) {
  const isDay = mode === 'day';
  const session = isDay ? recap?.sessions?.[0] : null;
  const dateStr = isDay ? longDate(date) : `${longDate(range.from)} s/d ${longDate(range.to)}`;
  const titleInfo = isDay && session?.title ? `\n*📌 Agenda:* ${session.title}` : '';

  const statItems = [];
  if (totals.HADIR > 0) statItems.push(`- 🟢 Hadir: ${totals.HADIR}`);
  if (totals.ALFA > 0) statItems.push(`- 🔴 Alfa: ${totals.ALFA}`);
  if (totals.IZIN > 0) statItems.push(`- 🟡 Izin: ${totals.IZIN}`);
  if (totals.SAKIT > 0) statItems.push(`- 🔵 Sakit: ${totals.SAKIT}`);

  if (statItems.length === 0) {
    statItems.push('- ⚪ Belum ada data presensi');
  }

  const statListText = statItems.join('\n');
  const periodClosing = isDay ? 'hari ini' : 'periode ini';

  return `*📢PENGUMUMAN REKAPITULASI ABSENSI PIK-R MANSEKU*

Disampaikan kepada seluruh anggota PIK-R MANSEKU, berikut merupakan hasil rekapitulasi absensi pada hari:

*🗓️ ${dateStr}*${titleInfo}

📊 Rekapitulasi Kehadiran:
${statListText}

Demikianlah hasil rekapitulasi absensi ${periodClosing}. Diharapkan seluruh anggota PIK-R MANSEKU dapat terus meningkatkan kedisiplinan dan tanggung jawab dalam mengikuti setiap kegiatan organisasi.

Terima kasih atas perhatian dan kerja samanya.

*PIK-R MANSEKU*
> Beriman, Bertanggung Jawab, Berencana.

@pikrmanseku_official`;
}

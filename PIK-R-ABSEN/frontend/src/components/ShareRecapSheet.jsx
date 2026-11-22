import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Share2, Download, Copy, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { Sheet } from './Common.jsx';
import { feedback } from '../lib/feedback.js';
import { generateRecapCard, buildShareCaption } from '../lib/shareCard.js';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Popup Modal "Bagikan Rekapitulasi Presensi".
 * Menampilkan pratinjau gambar 4:3 (landscape), teks caption yang bisa disalin,
 * serta tombol Batal, Bagikan, dan Selesai.
 */
export default function ShareRecapSheet({ mode, date, range, recap, totals, onClose }) {
  const [generating, setGenerating] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [imageBlob, setImageBlob] = useState(null);
  const [filename, setFilename] = useState('Rekap_Absensi_PIKR.png');
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Generate canvas dan caption saat sheet dibuka
  useEffect(() => {
    let active = true;

    async function generate() {
      try {
        setGenerating(true);
        const text = buildShareCaption({ mode, date, range, recap, totals });
        if (active) setCaption(text);

        const res = await generateRecapCard({ mode, date, range, recap, totals });
        if (active) {
          setImageUrl(res.dataUrl);
          setImageBlob(res.blob);
          setFilename(res.filename);
        }
      } catch (err) {
        console.error('Gagal generate share card:', err);
        toast.error('Gagal membuat gambar rekap');
      } finally {
        if (active) setGenerating(false);
      }
    }

    generate();
    return () => { active = false; };
  }, [mode, date, range.from, range.to, recap, totals]);

  // Handler Simpan Gambar
  function handleDownload() {
    if (!imageBlob) return;
    downloadBlob(imageBlob, filename);
    feedback.tap?.();
    toast.success('Gambar rekapitulasi berhasil disimpan');
  }

  // Handler Salin Teks
  async function handleCopyText() {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      feedback.success?.();
      setCopied(true);
      toast.success('Teks pengumuman tersalin!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Gagal menyalin teks');
    }
  }

  // Handler Bagikan (Web Share API dengan file gambar + caption teks)
  async function handleShare() {
    if (!imageBlob) {
      toast.error('Gambar belum selesai diproses');
      return;
    }

    setSharing(true);
    try {
      const file = new File([imageBlob], filename, { type: 'image/png' });

      // Cek apakah browser mendukung share file
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Rekapitulasi Absensi PIK-R MANSEKU',
            text: caption,
            files: [file]
          });
          feedback.success?.();
          toast.success('Laporan berhasil dibagikan');
          return;
        } catch (err) {
          if (err.name === 'AbortError') return; // User membatalkan dialog share
          console.warn('Share API error, fallback to download:', err);
        }
      }

      // Fallback untuk perangkat / desktop yang belum mendukung share file langsung:
      // Salin caption ke clipboard & download gambar secara otomatis
      try {
        await navigator.clipboard.writeText(caption);
      } catch {}
      downloadBlob(imageBlob, filename);
      feedback.success?.();
      toast.success('Gambar diunduh & teks tersalin ke clipboard!');
    } finally {
      setSharing(false);
    }
  }

  return (
    <Sheet onClose={onClose} title="Bagikan Rekapitulasi">
      <div className="stack" style={{ gap: 14 }}>
        {/* Pratinjau Gambar 4:3 */}
        <div>
          <label className="label" style={{ marginBottom: 6, display: 'block' }}>
            Pratinjau Gambar (4:3 Landscape)
          </label>

          <div className="share-preview-card">
            {generating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--muted)' }}>
                <Loader2 className="spin" size={32} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Membuat kartu rekapitulasi 4:3...</span>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Pratinjau Rekapitulasi" className="share-preview-img" />
            ) : (
              <div style={{ color: 'var(--muted)', textAlign: 'center' }}>
                <ImageIcon size={32} />
                <p style={{ fontSize: 13 }}>Gagal memuat pratinjau</p>
              </div>
            )}
          </div>

          <div className="share-img-footer">
            <span className="muted" style={{ fontSize: 12 }}>Format PNG 4:3 (1200×900 px)</span>
            <button
              className="share-pill-btn"
              onClick={handleDownload}
              disabled={generating || !imageBlob}
              type="button"
            >
              <Download size={15} /> Simpan Gambar
            </button>
          </div>
        </div>

        {/* Teks Pesan Pengumuman */}
        <div>
          <div className="share-header-row">
            <label className="label" style={{ margin: 0 }}>Teks Pengumuman WhatsApp</label>
            <button
              className={`share-pill-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyText}
              disabled={generating || !caption}
              type="button"
            >
              {copied ? <><Check size={15} /> Tersalin!</> : <><Copy size={15} /> Salin Teks</>}
            </button>
          </div>

          <textarea
            className="share-caption-area"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Menyiapkan format pesan pengumuman..."
            rows={7}
          />
        </div>

        {/* Tombol Aksi Bawah: Batal, Bagikan, Selesai */}
        <div className="share-modal-actions">
          <button className="cbtn c-plain" onClick={onClose} type="button">
            Batal
          </button>
          <button
            className="cbtn c-accent"
            disabled={generating || sharing || !imageBlob}
            onClick={handleShare}
            type="button"
          >
            {sharing ? <Loader2 className="spin" size={18} /> : <Share2 size={18} />}
            Bagikan
          </button>
          <button className="cbtn c-green" onClick={onClose} type="button">
            <Check size={18} /> Selesai
          </button>
        </div>
      </div>
    </Sheet>
  );
}

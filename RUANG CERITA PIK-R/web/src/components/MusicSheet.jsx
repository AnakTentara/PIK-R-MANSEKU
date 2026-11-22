import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Music, X, Play, Pause, ArrowRight, Loader2 } from 'lucide-react';
import { useBackClose } from '@/lib/back.js';
import { loadCatalog, trackUrl, fmtTime } from '@/lib/music.js';
import styles from './MusicSheet.module.css';

const cover = (t) => ({ background: `linear-gradient(145deg, ${(t.colors || ['#fdba74', '#f97316'])[0]}, ${(t.colors || ['#fdba74', '#f97316'])[1]})` });

function Eq() {
  return <span className={styles.eq} aria-hidden="true"><i /><i /><i /></span>;
}

/**
 * Pilih musik: muncul dari bawah (70% layar). Empat lagu disarankan (kotak 2×2), sekat, lalu daftar lagu.
 * Ketuk lagu = pratinjau; geser penggeser untuk pindah ke bagian lain (itu jadi titik mulai); tombol → memakainya.
 */
export default function MusicSheet({ current, onPick, onClose }) {
  const [tracks, setTracks] = useState(null);
  const [failed, setFailed] = useState(false);
  const [sel, setSel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [start, setStart] = useState(0);
  const audio = useRef(null);
  const selRef = useRef(null);
  const startRef = useRef(0);
  useBackClose(true, onClose);

  useEffect(() => {
    let alive = true;
    loadCatalog().then((t) => alive && setTracks(t)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'auto';
    a.onended = () => { a.currentTime = startRef.current; a.play().catch(() => {}); };   // ulang dari titik mulai
    a.onloadedmetadata = () => setDur(a.duration || 0);
    audio.current = a;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); a.pause(); a.removeAttribute('src'); a.load(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Penggeser mengikuti lagu saat diputar
  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0;
    const tick = () => { setPos(audio.current.currentTime); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const choose = useCallback(async (t) => {
    const a = audio.current;
    if (selRef.current?.id === t.id) {            // lagu yang sama: putar / jeda
      if (a.paused) { a.play().then(() => setPlaying(true)).catch(() => {}); } else { a.pause(); setPlaying(false); }
      return;
    }
    a.pause();
    selRef.current = t;
    startRef.current = 0;
    setSel(t); setStart(0); setPos(0); setDur(t.duration || 0); setPlaying(false); setLoading(true);
    try {
      const url = await trackUrl(t);
      if (selRef.current?.id !== t.id) return;
      a.src = url;
      a.currentTime = 0;
      await a.play();
      setPlaying(true);
    } catch { setPlaying(false); } finally { if (selRef.current?.id === t.id) setLoading(false); }
  }, []);

  const seek = (v) => {
    const a = audio.current;
    a.currentTime = v;
    startRef.current = v;
    setPos(v); setStart(v);
  };
  const use = async () => {
    if (!sel) return;
    const url = await trackUrl(sel);
    audio.current.pause();
    onPick({ id: sel.id, title: sel.title, artist: sel.artist, url, start, duration: dur || sel.duration, colors: sel.colors });
  };

  const featured = (tracks || []).filter((t) => t.featured).slice(0, 4);
  const total = dur || sel?.duration || 1;
  const pct = Math.min(100, (pos / total) * 100);

  return createPortal(
    <div className={styles.layer}>
      <div className={styles.back} onClick={onClose} />
      <section className={styles.sheet} role="dialog" aria-label="Tambahkan Musik">
        <i className={styles.grab} aria-hidden="true" />
        <header className={styles.head}>
          <b>Tambahkan Musik</b>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </header>

        <div className={`${styles.scroll} ${sel ? styles.withDock : ''}`}>
          {!tracks && !failed && <div className={styles.state}><Loader2 size={26} className="spin" /></div>}
          {failed && <div className={styles.state}>Pustaka musik belum bisa dimuat. Periksa koneksi lalu coba lagi.</div>}

          {tracks && (
            <>
              <h3 className={styles.label}>Disarankan</h3>
              <div className={styles.grid}>
                {featured.map((t) => (
                  <button key={t.id} type="button" className={`${styles.card} ${sel?.id === t.id ? styles.on : ''}`} style={cover(t)} onClick={() => choose(t)} aria-label={`Putar ${t.title}`}>
                    <span className={styles.cardIcon}>{sel?.id === t.id && playing ? <Eq /> : <Music size={18} />}</span>
                    <span className={styles.cardText}><b>{t.title}</b><small>{t.artist} · {fmtTime(t.duration)}</small></span>
                  </button>
                ))}
              </div>

              <div className={styles.sekat}><i /><span>Semua lagu</span><i /></div>

              <ul className={styles.list}>
                {tracks.map((t) => (
                  <li key={t.id}>
                    <button type="button" className={`${styles.row} ${sel?.id === t.id ? styles.rowOn : ''}`} onClick={() => choose(t)}>
                      <span className={styles.thumb} style={cover(t)}>{sel?.id === t.id && playing ? <Eq /> : <Music size={16} />}</span>
                      <span className={styles.meta}><b>{t.title}</b><small>{t.artist}{current?.id === t.id ? ' · dipakai' : ''}</small></span>
                      <span className={styles.time}>{fmtTime(t.duration)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {sel && (
          <div className={styles.dock}>
            <button type="button" className={styles.play} onClick={() => choose(sel)} aria-label={playing ? 'Jeda' : 'Putar'}>
              {loading ? <Loader2 size={20} className="spin" /> : playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <div className={styles.seek}>
              <p><b>{sel.title}</b><small>{sel.artist}</small></p>
              <input type="range" min="0" max={total} step="0.1" value={pos} style={{ '--p': `${pct}%` }}
                onChange={(e) => seek(Number(e.target.value))} aria-label="Geser posisi lagu" />
              <div className={styles.times}><span>{fmtTime(pos)}</span><em>Mulai dari {fmtTime(start)}</em><span>{fmtTime(total)}</span></div>
            </div>
            <button type="button" className={styles.use} onClick={use} aria-label={`Pakai ${sel.title}`}><ArrowRight size={24} strokeWidth={2.6} /></button>
          </div>
        )}
      </section>
    </div>,
    document.body
  );
}

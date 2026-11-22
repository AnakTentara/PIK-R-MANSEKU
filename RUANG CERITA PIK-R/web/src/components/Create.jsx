import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, X, ChevronLeft, ChevronRight, Users2, Globe2, Type, BarChart3, HelpCircle, Loader2, MessageSquareOff, EyeOff, AtSign, Camera as CameraIcon, Wand2 } from 'lucide-react';
import { rc, errMsg } from '@/lib/api.js';
import { useSession } from '@/lib/session.js';
import { releaseCamera } from '@/lib/camera.js';
import { Sheet, Avatar } from './ui.jsx';
import { STORY_BG } from './Stories.jsx';
import Camera from './Camera.jsx';
import MediaEditor from './MediaEditor.jsx';
import styles from './Create.module.css';

const MAX_FILES = 10;
const MAX_PHOTO_MB = 15;
const MAX_VIDEO_MB = 60;
const GALLERY_ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime';

/**
 * Media yang dipilih/diambil selama sesi ini (browser tidak boleh membaca isi galeri HP,
 * jadi "galeri" di sini = file yang pernah kamu pilih atau foto dari kamera di sesi ini).
 */
const recent = [];
const remember = (list) => {
  for (const it of list) if (!recent.some((r) => r.url === it.url)) recent.unshift(it);
  recent.splice(18);
};

function pickFiles(list, max) {
  const out = [];
  for (const f of list) {
    const isVid = f.type.startsWith('video/');
    const isImg = f.type.startsWith('image/');
    if (!isVid && !isImg) { toast.error(`${f.name}: bukan foto/video`); continue; }
    if (f.size > (isVid ? MAX_VIDEO_MB : MAX_PHOTO_MB) * 1024 * 1024) { toast.error(`${f.name}: terlalu besar (maks. ${isVid ? MAX_VIDEO_MB : MAX_PHOTO_MB} MB)`); continue; }
    out.push({ file: f, url: URL.createObjectURL(f), video: isVid });
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Buat postingan atau cerita.
 *   laci (kamera langsung + galeri) → kamera layar penuh / pilih file → penyunting → detail → bagikan
 * Satu keputusan per layar, tombol utama selalu di bawah (jangkauan jempol).
 */
export default function Create({ open, onClose, onCreated, initialKind = 'story' }) {
  const me = useSession((s) => s.me?.user);
  const [kind, setKind] = useState(initialKind);
  const [stage, setStage] = useState('camera'); // camera | edit | details — tanpa popup laci
  const [raw, setRaw] = useState([]);            // media yang akan disunting
  const [items, setItems] = useState([]);        // media hasil suntingan
  const [idx, setIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState('FOLLOWERS');
  const [commentsOff, setCommentsOff] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagQ, setTagQ] = useState('');
  const [tagResults, setTagResults] = useState([]);
  const [text, setText] = useState('');
  const [bg, setBg] = useState('sunset');
  const [sticker, setSticker] = useState(null);
  const [progress, setProgress] = useState(null);
  const input = useRef(null);
  const afterPick = useRef('edit');

  useEffect(() => {
    if (!open) return;
    setKind(initialKind); setStage('camera'); setRaw([]); setItems([]); setIdx(0); setCaption(''); setAudience('FOLLOWERS');
    setCommentsOff(false); setHideLikes(false); setTags([]); setText(''); setBg('sunset'); setSticker(null); setProgress(null);
  }, [open, initialKind]);
  // Lampu kamera mati begitu tidak dipakai
  useEffect(() => { if (stage === 'edit' || stage === 'details') releaseCamera(); }, [stage]);
  useEffect(() => () => releaseCamera(), []);
  useEffect(() => {
    if (!tagQ.trim()) { setTagResults([]); return undefined; }
    const t = setTimeout(() => rc.search(tagQ.trim()).then((r) => setTagResults(r.data.items.filter((u) => !u.self))).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [tagQ]);

  const max = kind === 'story' ? 1 : MAX_FILES;
  const openPicker = (then = 'edit') => { afterPick.current = then; input.current?.click(); };
  const onFiles = (e) => {
    const room = afterPick.current === 'add' ? MAX_FILES - items.length : max;
    const got = pickFiles(e.target.files, room);
    e.target.value = '';
    if (!got.length) return;
    remember(got);
    if (afterPick.current === 'add') { setRaw([...items, ...got]); setStage('edit'); return; }
    setRaw(got);
    setStage('edit');
  };
  const onCaptured = (it) => {
    const captured = it.collageItems?.length ? it.collageItems : [it];
    remember(captured);
    setKind(it.mode === 'story' ? 'story' : 'post');
    setRaw(captured);
    setStage('edit');
  };
  const onEdited = (out) => { setItems(out); setIdx(0); setStage('details'); };
  const removeItem = (i) => { setItems((cur) => cur.filter((_, n) => n !== i)); setIdx(0); };
  const move = (i, d) => setItems((cur) => { const a = [...cur]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; setIdx(j); return a; });

  const share = async () => {
    const fd = new FormData();
    try {
      if (kind === 'post') {
        if (!items.length) return;
        items.forEach((it) => fd.append('media', it.file));
        fd.append('caption', caption);
        fd.append('audience', audience);
        fd.append('commentsOff', String(commentsOff));
        fd.append('hideLikes', String(hideLikes));
        fd.append('tags', JSON.stringify(tags.map((t) => t.username)));
        setProgress(0);
        await rc.createPost(fd, (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)));
        toast.success('Postingan dibagikan');
      } else {
        if (!items.length && !text.trim()) { toast.error('Tambahkan foto atau tulis sesuatu'); return; }
        if (items[0]) fd.append('media', items[0].file);
        if (!items[0] && text.trim()) fd.append('text', text.trim());
        fd.append('bg', bg);
        fd.append('audience', audience);
        if (sticker) fd.append('sticker', JSON.stringify(sticker));
        setProgress(0);
        await rc.createStory(fd, (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)));
        toast.success(audience === 'CLOSE_FRIENDS' ? 'Cerita dibagikan ke Teman Dekat' : 'Cerita dibagikan');
      }
      onCreated?.(kind);
      onClose();
    } catch (err) {
      toast.error(errMsg(err, 'Gagal membagikan'));
      setProgress(null);
    }
  };

  const busy = progress !== null;
  const cur = items[idx];
  const fileInput = <input ref={input} type="file" hidden accept={GALLERY_ACCEPT} multiple={kind === 'post' || afterPick.current === 'add'} onChange={onFiles} />;

  // ── Kamera layar penuh (satu-satunya pintu masuk; Cerita/Postingan dipilih di dalamnya) ──
  if (stage === 'camera') {
    return (
      <>
        {fileInput}
        <Camera mode={kind} onKind={setKind} onCapture={onCaptured}
          onGallery={(k) => { setKind(k); openPicker(); }}
          onText={({ text: t, bg: b }) => { setKind('story'); setItems([]); setText(t); setBg(b); setStage('details'); }}
          onClose={onClose} />
      </>
    );
  }

  // ── Penyunting ──
  if (stage === 'edit') {
    return (
      <>
        {fileInput}
        <MediaEditor items={raw} target={kind} doneLabel="Lanjut" onDone={onEdited}
          onCancel={() => (items.length ? setStage('details') : setStage('camera'))} />
      </>
    );
  }

  // ── Detail: keterangan & audiens (postingan) / stiker & audiens (cerita) ──
  return (
    <Sheet open={open} onClose={() => !busy && onClose()} size="lg"
      title={kind === 'post' ? 'Postingan baru' : 'Cerita baru'}
      footer={(
        <div className={styles.footRow}>
          <button type="button" className="btn btn-soft" onClick={() => setStage(items.length ? 'edit' : 'camera')} disabled={busy}>
            {items.length ? <><Wand2 size={16} /> Sunting</> : <><ChevronLeft size={16} /> Kembali</>}
          </button>
          <button type="button" className="btn btn-primary" onClick={share} disabled={busy || (kind === 'post' ? !items.length : !items.length && !text.trim())}>
            {busy ? <><Loader2 size={17} className="spin" /> Mengunggah {progress}%</> : kind === 'post' ? 'Bagikan' : audience === 'CLOSE_FRIENDS' ? 'Bagikan ke Teman Dekat' : 'Bagikan cerita'}
          </button>
        </div>
      )}>
      {fileInput}
      {kind === 'post' && (
        <div className={styles.details}>
          <div className={styles.preview} style={{ aspectRatio: cur?.w && cur?.h ? `${cur.w} / ${cur.h}` : '3 / 4' }}>
            {cur && (cur.video ? <video src={cur.url} playsInline muted loop autoPlay /> : <img src={cur.url} alt="" />)}
            {items.length > 1 && (
              <>
                {idx > 0 && <button type="button" className={`${styles.pnav} ${styles.pl}`} onClick={() => setIdx(idx - 1)} aria-label="Sebelumnya"><ChevronLeft size={20} /></button>}
                {idx < items.length - 1 && <button type="button" className={`${styles.pnav} ${styles.pr}`} onClick={() => setIdx(idx + 1)} aria-label="Berikutnya"><ChevronRight size={20} /></button>}
              </>
            )}
          </div>
          <div className={styles.thumbs}>
            {items.map((it, i) => (
              <div key={it.url} className={`${styles.thumb} ${i === idx ? styles.thumbOn : ''}`}>
                <button type="button" onClick={() => setIdx(i)} aria-label={`Media ${i + 1}`}>{it.video ? <video src={it.url} muted /> : <img src={it.url} alt="" />}</button>
                <button type="button" className={styles.thumbX} onClick={() => removeItem(i)} aria-label="Hapus"><X size={12} /></button>
                {i === idx && items.length > 1 && (
                  <div className={styles.order}>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Geser kiri">‹</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Geser kanan">›</button>
                  </div>
                )}
              </div>
            ))}
            {items.length < MAX_FILES && <button type="button" className={styles.addMore} onClick={() => openPicker('add')} aria-label="Tambah media"><ImagePlus size={20} /></button>}
          </div>

          <div className={styles.captionRow}>
            <Avatar user={me} size={32} />
            <textarea className={styles.caption} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2200} rows={4}
              placeholder="Tulis keterangan… sebut teman dengan @nama, tambahkan #tagar" />
          </div>
          <div className={styles.count}>{caption.length}/2200</div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}><AtSign size={16} /> Tandai teman</div>
            <div className={styles.tagChips}>
              {tags.map((t) => <span key={t.username}><Avatar user={t} size={20} />{t.username}<button type="button" onClick={() => setTags(tags.filter((x) => x.username !== t.username))} aria-label="Hapus"><X size={12} /></button></span>)}
            </div>
            <input className="field" value={tagQ} onChange={(e) => setTagQ(e.target.value)} placeholder="Cari teman untuk ditandai" />
            {tagResults.length > 0 && (
              <div className={styles.tagResults}>
                {tagResults.slice(0, 6).map((u) => (
                  <button key={u.username} type="button" onClick={() => { if (!tags.some((t) => t.username === u.username) && tags.length < 20) setTags([...tags, u]); setTagQ(''); }}>
                    <Avatar user={u} size={30} /><span><b>{u.username}</b><small>{u.name}</small></span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Audience value={audience} onChange={setAudience} />

          <div className={styles.section}>
            <label className={styles.switchRow}><span><EyeOff size={17} /> Sembunyikan jumlah suka</span><input type="checkbox" checked={hideLikes} onChange={(e) => setHideLikes(e.target.checked)} /></label>
            <label className={styles.switchRow}><span><MessageSquareOff size={17} /> Matikan komentar</span><input type="checkbox" checked={commentsOff} onChange={(e) => setCommentsOff(e.target.checked)} /></label>
          </div>
        </div>
      )}

      {kind === 'story' && (
        <div className={styles.storyMaker}>
          <div className={styles.storyCanvas} style={items[0] ? undefined : { background: STORY_BG[bg] }}>
            {items[0] ? (items[0].video ? <video src={items[0].url} playsInline muted loop autoPlay /> : <img src={items[0].url} alt="" />) : (
              <textarea className={`${styles.storyText} ${bg === 'clay' ? styles.storyTextDark : ''}`}
                value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Ketuk untuk menulis…" />
            )}
            {sticker && (
              <div className={styles.stickerPrev}>
                <input value={sticker.q} onChange={(e) => setSticker({ ...sticker, q: e.target.value.slice(0, 80) })} placeholder={sticker.type === 'poll' ? 'Tulis pertanyaan…' : 'Tanya aku apa saja'} />
                {sticker.type === 'poll' && (
                  <div>{sticker.options.map((o, i) => <input key={i} value={o} onChange={(e) => { const opts = [...sticker.options]; opts[i] = e.target.value.slice(0, 30); setSticker({ ...sticker, options: opts }); }} />)}</div>
                )}
                <button type="button" onClick={() => setSticker(null)} aria-label="Hapus stiker"><X size={14} /></button>
              </div>
            )}
          </div>
          <div className={styles.storyTools}>
            <button type="button" onClick={() => setStage('camera')}><CameraIcon size={20} /><span>Kamera</span></button>
            <button type="button" onClick={() => openPicker()}><ImagePlus size={20} /><span>{items[0] ? 'Ganti' : 'Galeri'}</span></button>
            {items[0] && <button type="button" onClick={() => setItems([])}><Type size={20} /><span>Teks saja</span></button>}
            <button type="button" onClick={() => setSticker({ type: 'poll', q: '', options: ['Ya', 'Tidak'] })} aria-pressed={sticker?.type === 'poll'}><BarChart3 size={20} /><span>Polling</span></button>
            <button type="button" onClick={() => setSticker({ type: 'question', q: 'Tanya aku apa saja' })} aria-pressed={sticker?.type === 'question'}><HelpCircle size={20} /><span>Pertanyaan</span></button>
          </div>
          {!items[0] && (
            <div className={styles.bgs} role="radiogroup" aria-label="Warna latar">
              {Object.entries(STORY_BG).map(([k, v]) => <button key={k} type="button" role="radio" aria-checked={bg === k} style={{ background: v }} className={bg === k ? styles.bgOn : ''} onClick={() => setBg(k)} aria-label={k} />)}
            </div>
          )}
          <Audience value={audience} onChange={setAudience} story />
          <p className={styles.note}>Cerita hilang otomatis setelah 24 jam. Kamu bisa menyimpannya ke Sorotan di profil.</p>
        </div>
      )}
    </Sheet>
  );
}

function Audience({ value, onChange, story = false }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Siapa yang bisa melihat?</div>
      <div className={styles.audience} role="radiogroup">
        <button type="button" role="radio" aria-checked={value === 'FOLLOWERS'} className={value === 'FOLLOWERS' ? styles.audOn : ''} onClick={() => onChange('FOLLOWERS')}>
          <Globe2 size={18} /><span><b>{story ? 'Ceritamu' : 'Pengikut'}</b><small>Semua pengikutmu</small></span>
        </button>
        <button type="button" role="radio" aria-checked={value === 'CLOSE_FRIENDS'} className={`${value === 'CLOSE_FRIENDS' ? styles.audOn : ''} ${styles.cfBtn}`} onClick={() => onChange('CLOSE_FRIENDS')}>
          <Users2 size={18} /><span><b>Teman Dekat</b><small>Hanya daftar teman dekatmu</small></span>
        </button>
      </div>
    </div>
  );
}


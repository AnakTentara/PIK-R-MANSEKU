import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Check, ChevronDown, X } from 'lucide-react';
import PhotoAvatar from './PhotoAvatar';
import styles from './PickerField.module.css';

/* ──────────────────────────────────────────────────────────────
   Pemilih bergaya claymorphism pengganti <select> di dashboard.
   - Daftar pendek (≤ 4 pilihan sederhana)  → tombol segmen langsung (tanpa popup)
   - Daftar panjang / kaya                  → popup berisi kartu: cari, kategori, urut A–Z
   ────────────────────────────────────────────────────────────── */

const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });
const KELAS_RE = /^(XII|XI|X)[-. ]?(\d+)$/i;
const TINGKAT = { X: 1, XI: 2, XII: 3 };

/** Urutan kelas yang benar: X-1 … X-9, XI-1 …, XII-1 … (bukan urutan huruf). */
export function compareKelas(a, b) {
  const ma = KELAS_RE.exec(String(a || '').trim());
  const mb = KELAS_RE.exec(String(b || '').trim());
  if (ma && mb) {
    return (TINGKAT[ma[1].toUpperCase()] - TINGKAT[mb[1].toUpperCase()]) || (Number(ma[2]) - Number(mb[2]));
  }
  if (ma) return -1;
  if (mb) return 1;
  return collator.compare(a || '', b || '');
}

export const compareText = (a, b) => collator.compare(a || '', b || '');

const isInline = (options, clearLabel) =>
  options.length > 0 &&
  options.length + (clearLabel ? 1 : 0) <= 4 &&
  options.every((o) => !o.description && o.avatar === undefined && String(o.label).length <= 26);

function sortOptions(options, sort) {
  const list = [...options];
  if (sort === 'az') list.sort((a, b) => compareText(a.label, b.label));
  else if (sort === 'kelas') list.sort((a, b) => compareKelas(a.label, b.label));
  return list;
}

/* ── Popup ─────────────────────────────────────────────────── */
export function PickerModal({
  open, onClose, onSelect, options, value, title = 'Pilih',
  searchable = 'auto', sort = 'none', clearLabel, minCard = 150
}) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('ALL');
  const bodyRef = useRef(null);
  const letterRefs = useRef({});
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setTab('ALL');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => searchRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const showSearch = searchable === true || (searchable === 'auto' && options.length > 8);
  const groups = useMemo(() => {
    const seen = [];
    options.forEach((o) => { if (o.group && !seen.includes(o.group)) seen.push(o.group); });
    return seen;
  }, [options]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = options.filter((o) => {
      if (tab !== 'ALL' && o.group !== tab) return false;
      if (!q) return true;
      return `${o.label} ${o.description || ''} ${o.group || ''}`.toLowerCase().includes(q);
    });
    return sortOptions(base, sort);
  }, [options, query, tab, sort]);

  // Pengelompokan tampilan: huruf (A–Z) atau kategori
  const sections = useMemo(() => {
    const byLetter = sort === 'az' && options.length > 12;
    if (byLetter) {
      const map = new Map();
      visible.forEach((o) => {
        const l = (String(o.label).trim()[0] || '#').toUpperCase();
        const k = /[A-Z]/.test(l) ? l : '#';
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(o);
      });
      return { kind: 'letter', list: [...map.entries()] };
    }
    if (groups.length > 1 && tab === 'ALL') {
      return { kind: 'group', list: groups.map((g) => [g, visible.filter((o) => o.group === g)]).filter(([, l]) => l.length) };
    }
    return { kind: 'flat', list: [['', visible]] };
  }, [visible, groups, tab, sort, options.length]);

  const letters = sections.kind === 'letter' && options.length > 24 ? sections.list.map(([l]) => l) : [];
  const dense = options.every((o) => !o.description && o.avatar === undefined);
  const gridMin = dense ? Math.min(minCard, 92) : minCard;

  if (!open) return null;

  const pick = (o) => { if (!o.disabled) { onSelect(o.value, o); onClose(); } };

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.head}>
          <h3>{title}</h3>
          <span className={styles.count}>{visible.length} pilihan</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>

        {showSearch && (
          <label className={styles.search}>
            <Search size={16} />
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari…" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian"><X size={14} /></button>}
          </label>
        )}

        {groups.length > 1 && (
          <div className={styles.chips} role="tablist">
            <button type="button" className={tab === 'ALL' ? styles.chipOn : ''} onClick={() => setTab('ALL')}>Semua ({options.length})</button>
            {groups.map((g) => (
              <button key={g} type="button" className={tab === g ? styles.chipOn : ''} onClick={() => setTab(g)}>
                {g} ({options.filter((o) => o.group === g).length})
              </button>
            ))}
          </div>
        )}

        <div className={styles.bodyWrap}>
          <div className={styles.body} ref={bodyRef}>
            {visible.length === 0 && <div className={styles.empty}>Tidak ada pilihan yang cocok.</div>}
            {sections.list.map(([heading, list]) => (
              <section key={heading || 'flat'} ref={(el) => { if (heading) letterRefs.current[heading] = el; }}>
                {heading && <h4 className={styles.sectionTitle}>{heading}</h4>}
                <div className={styles.grid} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${gridMin}px, 1fr))` }}>
                  {list.map((o) => {
                    const selected = String(value ?? '') === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        disabled={o.disabled}
                        className={`${styles.card} ${selected ? styles.cardOn : ''} ${dense ? styles.cardDense : ''}`}
                        onClick={() => pick(o)}
                      >
                        {o.avatar !== undefined && <PhotoAvatar src={o.avatar} name={o.label} className={styles.avatar} alt="" />}
                        <span className={styles.cardLabel}>{o.label}</span>
                        {o.description && <span className={styles.cardDesc}>{o.description}</span>}
                        {o.badge && <span className={styles.cardBadge}>{o.badge}</span>}
                        {selected && <span className={styles.tick}><Check size={13} /></span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          {letters.length > 0 && (
            <nav className={styles.letters} aria-label="Loncat ke huruf">
              {letters.map((l) => (
                <button key={l} type="button" onClick={() => letterRefs.current[l]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{l}</button>
              ))}
            </nav>
          )}
        </div>

        {clearLabel && (
          <div className={styles.foot}>
            <button type="button" className={styles.clearBtn} onClick={() => { onSelect('', null); onClose(); }}>
              <X size={14} /> {clearLabel}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Field (tombol pemicu / tombol segmen) ───────────────────── */
export default function PickerField({
  value, onChange, options = [], placeholder = 'Pilih…', title, searchable = 'auto', sort = 'none',
  clearLabel, mode = 'auto', compact = false, disabled = false, required = false, id, name, minCard
}) {
  const [open, setOpen] = useState(false);
  const stringValue = String(value ?? '');
  const selected = options.find((o) => o.value === stringValue);
  const inline = mode === 'inline' || (mode === 'auto' && isInline(options, clearLabel));
  const emit = (v, o) => onChange?.(v, o);

  if (inline) {
    const items = clearLabel ? [{ value: '', label: clearLabel }, ...options] : options;
    return (
      <div className={styles.segment} role="radiogroup" id={id}>
        {items.map((o) => (
          <button
            key={o.value || '__clear'}
            type="button"
            role="radio"
            aria-checked={stringValue === o.value}
            disabled={disabled || o.disabled}
            className={stringValue === o.value ? styles.segOn : ''}
            onClick={() => emit(o.value, o)}
          >
            {o.label}
          </button>
        ))}
        {required && <input className={styles.hiddenInput} tabIndex={-1} aria-hidden="true" value={stringValue} onChange={() => {}} required name={name} />}
      </div>
    );
  }

  const shown = selected?.label ?? (stringValue === '' && clearLabel ? clearLabel : null);
  return (
    <div className={`${styles.field} ${compact ? styles.fieldCompact : ''}`}>
      <button
        type="button"
        id={id}
        className={`${styles.trigger} ${shown ? '' : styles.placeholder}`}
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {selected?.avatar !== undefined && selected && <PhotoAvatar src={selected.avatar} name={selected.label} className={styles.triggerAvatar} alt="" />}
        <span className={styles.triggerText}>{shown ?? placeholder}</span>
        <ChevronDown size={16} className={styles.chev} />
      </button>
      {required && <input className={styles.hiddenInput} tabIndex={-1} aria-hidden="true" value={stringValue} onChange={() => {}} required name={name} />}
      <PickerModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={emit}
        options={options}
        value={stringValue}
        title={title || placeholder.replace(/…$/, '')}
        searchable={searchable}
        sort={sort}
        clearLabel={clearLabel}
        minCard={minCard}
      />
    </div>
  );
}

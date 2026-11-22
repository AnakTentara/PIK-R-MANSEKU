import { Children, Fragment, isValidElement } from 'react';
import PickerField from './PickerField';

/**
 * Pengganti langsung <select>: bentuk pemakaian sama (value, onChange(e), <option> sebagai children),
 * tetapi tampil sebagai pemilih claymorphism. Opsi dengan value="" dianggap "kosongkan / semua".
 *
 * Opsional pada <option>:  data-desc="keterangan"  data-group="kategori"
 * Pengurutan: kelas (X-1, X-2 … XI-1 … XII-…) terdeteksi otomatis; sort="az" untuk abjad.
 */
const KELAS_RE = /^(XII|XI|X)[-. ]?\d+$/i;

function parseOptions(children, group, out = []) {
  Children.toArray(children).forEach((child) => {
    if (!isValidElement(child)) return;
    if (child.type === 'option') {
      const label = Children.toArray(child.props.children).join('');
      out.push({
        value: String(child.props.value ?? label),
        label,
        disabled: child.props.disabled,
        description: child.props['data-desc'],
        group: child.props['data-group'] || group
      });
    } else if (child.type === 'optgroup') {
      parseOptions(child.props.children, child.props.label, out);
    } else if (child.type === Fragment) {
      parseOptions(child.props.children, group, out);
    }
  });
  return out;
}

export default function SelectField({
  children, value, onChange, disabled, required, id, name, className = '', style,
  title, placeholder, sort, searchable, compact
}) {
  const all = parseOptions(children);
  const clear = all.find((o) => o.value === '');
  const options = all.filter((o) => o.value !== '');
  const isCompact = compact ?? /filter/i.test(className);
  const autoSort = options.length > 1 && options.every((o) => KELAS_RE.test(o.label.trim())) ? 'kelas' : 'none';

  return (
    <div style={style} className={isCompact ? undefined : undefined}>
      <PickerField
        id={id}
        name={name}
        value={value ?? ''}
        options={options}
        clearLabel={clear?.label}
        placeholder={placeholder || clear?.label || 'Pilih…'}
        title={title || clear?.label?.replace(/^(Semua|Pilih)\s+/i, 'Pilih ') || undefined}
        sort={sort ?? autoSort}
        searchable={searchable ?? 'auto'}
        compact={isCompact}
        disabled={disabled}
        required={required}
        onChange={(v) => onChange?.({ target: { value: v, name, id } })}
      />
    </div>
  );
}

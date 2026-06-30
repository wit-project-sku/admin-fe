import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import styles from './SearchableSelect.module.css';

export type SearchableOption = { value: string; label: string; sublabel?: string };

type SearchableSelectProps = {
  id?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  /** Visible min width for the closed trigger (e.g. toolbar). */
  minWidth?: string;
  className?: string;
  'aria-label'?: string;
};

export default function SearchableSelect({
  id: idProp,
  options,
  value,
  onChange,
  placeholder = '선택…',
  emptyLabel = '일치하는 항목이 없습니다.',
  minWidth = '200px',
  className,
  'aria-label': ariaLabel,
}: SearchableSelectProps) {
  const uid = useId();
  const listboxId = `${uid}-listbox`;
  const id = idProp ?? uid;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(t) || (o.sublabel && o.sublabel.toLowerCase().includes(t)),
    );
  }, [options, q]);

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [],
  );

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${className ?? ''}`}
      style={{ minWidth }}
      onKeyDown={onKeyDown}
    >
      <button
        type='button'
        id={id}
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''} ${!selected ? styles.triggerMuted : ''}`}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.triggerLabel}>{selected ? selected.label : placeholder}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronUp : ''}`} aria-hidden>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
            <path d='M6 9l6 6 6-6' />
          </svg>
        </span>
      </button>
      {open && (
        <div className={styles.panel} id={listboxId} role='listbox' aria-labelledby={id}>
          <div className={styles.search}>
            <input
              type='search'
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='검색…'
              autoFocus
              aria-label='목록 검색'
            />
          </div>
          <div className={styles.list}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>{emptyLabel}</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type='button'
                  role='option'
                  aria-selected={o.value === value}
                  className={`${styles.option} ${o.value === value ? styles.optionActive : ''}`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  {o.sublabel ? `${o.label} · ${o.sublabel}` : o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

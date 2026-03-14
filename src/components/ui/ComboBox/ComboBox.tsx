import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from 'react';
import styles from './ComboBox.module.scss';
import type { EmployeeMeta } from '../../../models/week.model';
import { empLabel } from '../../../utils/schedule.utils';

interface ComboBoxProps {
  candidates: string[];
  value: string;
  meta: Record<string, EmployeeMeta>;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ComboBox({
  candidates,
  value,
  meta,
  onChange,
  disabled = false,
  placeholder = 'Search ID or name…',
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Sync display value
  const displayValue = open ? filter : (value ? empLabel(value, meta) : '');

  const filtered = candidates.filter((id) => {
    if (!filter) return true;
    const fl = filter.toLowerCase();
    const m = meta[id] || {};
    return (
      id.toLowerCase().includes(fl) ||
      (m.name || '').toLowerCase().includes(fl) ||
      (m.homeBranch || '').toLowerCase().includes(fl)
    );
  });

  const commit = useCallback(
    (id: string) => {
      onChange(id);
      setFilter('');
      setOpen(false);
      setActiveIdx(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      commit(filtered[activeIdx]);
    } else if (e.key === 'Escape') {
      setFilter('');
      setOpen(false);
    }
  };

  // Scroll active option into view
  useEffect(() => {
    if (activeIdx < 0 || !dropRef.current) return;
    const opts = dropRef.current.querySelectorAll('[data-opt]');
    opts[activeIdx]?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        dropRef.current &&
        !dropRef.current.contains(e.target as Node)
      ) {
        setFilter('');
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={styles.comboWrap}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => { setFilter(''); setOpen(true); setActiveIdx(-1); }}
        onChange={(e) => { setFilter(e.target.value); setActiveIdx(-1); }}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <div className={styles.comboDrop} ref={dropRef}>
          {filtered.length === 0 ? (
            <div className={styles.noMatch}>No matches</div>
          ) : (
            filtered.map((id, idx) => {
              const m = meta[id] || {};
              const tags = [m.canDrive ? 'DL' : '', m.homeBranch || '', m.experience || '']
                .filter(Boolean)
                .join(' · ');
              return (
                <div
                  key={id}
                  data-opt
                  className={`${styles.comboOpt} ${idx === activeIdx || id === value ? styles.active : ''}`}
                  onMouseDown={() => commit(id)}
                >
                  <span className={styles.optId}>{id}</span>
                  {m.name && <span className={styles.optMeta}>{m.name}</span>}
                  {tags && <span className={styles.optMeta}>{tags}</span>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

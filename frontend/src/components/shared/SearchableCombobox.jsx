import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X, ChevronDown } from 'lucide-react';

/**
 * SearchableCombobox — server-searched single-select with a plain inline dropdown.
 *
 * State ownership (preserves the W5.5-P1 one-time snap-back fix): this component owns
 * DISPLAY state (input text, open/closed, highlight). The FORM owns submit state — the
 * selected value lives in the parent (RHF), and `selectedLabel` is passed back down so
 * the closed input shows the chosen label. Selecting a pinned option keeps its label
 * displayed exactly as the P1 controlled-value pattern guarantees.
 *
 * No Radix / portal: a plain absolutely-positioned div dropdown avoids Dialog
 * z-index/focus-trap pain. RTL-safe via logical properties only.
 */
export default function SearchableCombobox({
  value,
  selectedLabel,
  onSelect,
  onClear,
  fetchOptions,
  getOptionValue,
  getOptionLabel,
  placeholder,
  pinnedOptions = [],
  disabled = false,
  error = false,
  name,
  id,
}) {
  const { t } = useTranslation();
  const reactId = useId();
  const listId = `${id || name || reactId}-listbox`;
  const optId = (i) => `${id || name || reactId}-opt-${i}`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);
  const fetchGen = useRef(0); // race guard: only the latest fetch may apply its results

  // Combined navigable list: pinned options always on top, then fetched results.
  const combined = [...pinnedOptions, ...options];

  const runFetch = useCallback(async (term) => {
    const gen = ++fetchGen.current;
    setLoading(true);
    try {
      const result = await fetchOptions(term);
      if (gen !== fetchGen.current) return; // a newer fetch superseded this one
      setOptions(Array.isArray(result) ? result : []);
    } catch {
      if (gen === fetchGen.current) setOptions([]);
    } finally {
      if (gen === fetchGen.current) setLoading(false);
    }
  }, [fetchOptions]);

  // Open: browse immediately with an empty term (browsing must work, not only searching).
  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setHighlight(-1);
    runFetch('');
  };

  // Debounced search as the user types.
  const onInputChange = (e) => {
    const term = e.target.value;
    setQuery(term);
    setHighlight(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runFetch(term), 300);
  };

  const choose = (opt) => {
    onSelect(opt);
    setOpen(false);
    setQuery('');
    setHighlight(-1);
  };

  const clear = (e) => {
    e.stopPropagation();
    onClear();
    setQuery('');
    setOptions([]);
    inputRef.current?.focus();
  };

  // Close on outside click.
  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Cleanup pending debounce on unmount.
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (!open || highlight < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`#${CSS.escape(optId(highlight))}`);
    if (el) el.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, open]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { openDropdown(); return; }
      setHighlight((h) => Math.min(h + 1, combined.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && highlight >= 0 && combined[highlight]) {
        e.preventDefault();
        choose(combined[highlight]);
      }
    }
  };

  const inputValue = open ? query : (selectedLabel || '');

  return (
    <div className="relative" ref={containerRef}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        className="relative"
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={inputValue}
          placeholder={placeholder}
          onChange={onInputChange}
          onFocus={openDropdown}
          onClick={openDropdown}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={open && highlight >= 0 ? optId(highlight) : undefined}
          className={`flex h-9 w-full rounded-md border bg-transparent ps-3 pe-14 py-1 text-sm shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50
                      ${error ? 'border-destructive' : 'border-input'}`}
        />
        {/* Trailing controls: clear (×) when a value is selected, plus a chevron. */}
        <div className="absolute inset-y-0 end-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={clear}
              aria-label={t('common.clear')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border
                     bg-popover text-popover-foreground shadow-md"
        >
          {loading && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </li>
          )}

          {!loading && combined.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t('combobox.noResults')}</li>
          )}

          {combined.map((opt, i) => {
            const val = getOptionValue(opt);
            const selected = val === value;
            const isHighlighted = i === highlight;
            const isPinned = i < pinnedOptions.length;
            return (
              <li
                key={val ?? `pinned-${i}`}
                id={optId(i)}
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => { e.preventDefault(); choose(opt); }}
                onMouseEnter={() => setHighlight(i)}
                className={`cursor-pointer px-3 py-2 text-sm
                            ${isHighlighted ? 'bg-accent text-accent-foreground' : ''}
                            ${selected ? 'font-medium' : ''}
                            ${isPinned ? 'text-primary' : ''}`}
              >
                {getOptionLabel(opt)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

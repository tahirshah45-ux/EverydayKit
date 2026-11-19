import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  Calendar,
  FileImage,
  Files,
  ImageDown,
  Info,
  Percent,
  Scale,
  Scissors,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { TOOLS_CATALOG } from '../lib/toolsCatalog';

interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchEntry {
  id: string;
  label: string;
  subtitle: string;
  path: string;
  group: string;
  keywords: string[];
}

const STATIC_ENTRIES: SearchEntry[] = [
  {
    id: 'all-tools',
    label: 'All Tools Directory',
    subtitle: 'Browse all 7 local PDF, image, and calculator utilities',
    path: '/tools',
    group: 'Pages',
    keywords: ['directory', 'all', 'tools', 'list'],
  },
  {
    id: 'privacy',
    label: 'Privacy & Local Processing',
    subtitle: 'Zero-upload architecture, ad separation, and DevTools verification',
    path: '/privacy',
    group: 'Pages',
    keywords: ['privacy', 'local', 'offline', 'security', 'ads', 'gdpr'],
  },
  {
    id: 'about',
    label: 'About EverydayKit',
    subtitle: 'Mission, engineering standards, and browser-first philosophy',
    path: '/about',
    group: 'Pages',
    keywords: ['about', 'mission', 'team', 'standards'],
  },
  {
    id: 'contact',
    label: 'Contact & Support',
    subtitle: 'Report an issue, accessibility feedback, or general questions',
    path: '/contact',
    group: 'Pages',
    keywords: ['contact', 'support', 'help', 'bug', 'feedback'],
  },
];

function getToolIcon(id: string) {
  switch (id) {
    case 'merge-pdf':
      return <Files className="h-4 w-4 text-primary" aria-hidden="true" />;
    case 'split-pdf':
      return <Scissors className="h-4 w-4 text-primary" aria-hidden="true" />;
    case 'images-to-pdf':
      return <FileImage className="h-4 w-4 text-primary" aria-hidden="true" />;
    case 'resize-compress-image':
      return <ImageDown className="h-4 w-4 text-tertiary" aria-hidden="true" />;
    case 'percentage-discount-calculator':
      return <Percent className="h-4 w-4 text-primary" aria-hidden="true" />;
    case 'unit-converter':
      return <Scale className="h-4 w-4 text-primary" aria-hidden="true" />;
    case 'date-calculator':
      return <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />;
    case 'privacy':
      return <ShieldCheck className="h-4 w-4 text-tertiary" aria-hidden="true" />;
    case 'all-tools':
      return <Calculator className="h-4 w-4 text-secondary" aria-hidden="true" />;
    default:
      return <Info className="h-4 w-4 text-secondary" aria-hidden="true" />;
  }
}

export default function CommandSearchModal({ open, onClose }: CommandSearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const allEntries = useMemo<SearchEntry[]>(() => {
    const toolEntries: SearchEntry[] = TOOLS_CATALOG.map((t) => ({
      id: t.id,
      label: t.name,
      subtitle: t.summary,
      path: t.path,
      group: t.categoryLabel,
      keywords: [t.code, t.shortName, ...t.keywords],
    }));
    return [...toolEntries, ...STATIC_ENTRIES];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allEntries;
    return allEntries.filter((entry) => {
      const haystack = `${entry.label} ${entry.subtitle} ${entry.group} ${entry.keywords.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allEntries, query]);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0
        );
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        navigate(filtered[activeIndex].path);
        onClose();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'input, button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, activeIndex, navigate, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-on-surface/45 px-4 pt-16 sm:pt-24 backdrop-blur-xs"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-find-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-outline-variant/30 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden="true" />
          <label htmlFor="quick-find-input" id="quick-find-title" className="sr-only">
            Quick find a tool or page
          </label>
          <input
            ref={inputRef}
            id="quick-find-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a tool (e.g., merge pdf, discount, unit, date)..."
            className="w-full bg-transparent text-base text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick find dialog"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-on-surface-variant">
              No matching tools found for “{query}”. Try “PDF”, “image”, “discount”, “unit”, or “date”.
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((entry, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <li key={entry.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(entry.path);
                        onClose();
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-surface-container-low text-on-surface'
                          : 'text-on-surface hover:bg-surface-container-low/60'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                          {getToolIcon(entry.id)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-display text-sm font-bold text-on-surface">
                              {entry.label}
                            </span>
                            <span className="shrink-0 rounded bg-surface-container px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                              {entry.group}
                            </span>
                          </div>
                          <p className="truncate text-xs text-on-surface-variant">{entry.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`h-4 w-4 shrink-0 transition-opacity ${
                          isSelected ? 'text-primary opacity-100' : 'opacity-30'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/25 bg-surface-container-low/60 px-4 py-2.5 text-xs text-on-surface-variant">
          <span>Use ↑ / ↓ arrows to navigate, Enter to open, Esc to close</span>
          <span className="font-mono text-[11px]">Local search • Zero network</span>
        </div>
      </div>
    </div>
  );
}

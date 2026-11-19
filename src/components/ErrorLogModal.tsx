import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, ShieldCheck, Trash2, X } from 'lucide-react';
import {
  clearDiagnostics,
  exportDiagnosticsJson,
  getDiagnostics,
  subscribeDiagnostics,
  type LocalDiagnosticEntry,
} from '../lib/errorLog';
import { triggerBlobDownload } from '../lib/sanitize';

interface ErrorLogModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ErrorLogModal({ open, onClose }: ErrorLogModalProps) {
  const [entries, setEntries] = useState<LocalDiagnosticEntry[]>(() => getDiagnostics());
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setEntries(getDiagnostics());
    return subscribeDiagnostics(() => setEntries(getDiagnostics()));
  }, []);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => closeBtnRef.current?.focus());
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
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
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleExport = () => {
    const json = exportDiagnosticsJson();
    const blob = new Blob([json], { type: 'application/json' });
    triggerBlobDownload(blob, 'everydaykit-local-diagnostics.json');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/45 p-4 backdrop-blur-xs"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostics-dialog-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 px-6 py-4">
          <div>
            <h2
              id="diagnostics-dialog-title"
              className="font-display text-lg font-bold text-on-surface"
            >
              Local Operation &amp; Integrity Log
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Volatile session log stored only in browser RAM. Never records filenames, file contents,
              calculator values, or dates.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close local diagnostics dialog"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-low/70 px-6 py-10 text-center">
              <CheckCircle2 className="mb-3 h-8 w-8 text-tertiary" aria-hidden="true" />
              <p className="font-display text-sm font-bold text-on-surface">
                No validation or processing errors recorded this session
              </p>
              <p className="mt-1 max-w-md text-xs text-on-surface-variant">
                If a file fails header validation, exceeds local size limits, or hits a decoding error
                while online or offline, sanitized diagnostic codes appear here to help troubleshoot.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          entry.severity === 'error'
                            ? 'text-error'
                            : entry.severity === 'warning'
                              ? 'text-primary'
                              : 'text-tertiary'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-xs font-bold text-on-surface">
                        {entry.code}
                      </span>
                      <span className="rounded bg-surface-container px-1.5 py-0.5 text-[11px] font-medium text-on-surface-variant">
                        {entry.toolId} • {entry.stage}
                      </span>
                    </div>
                    <time className="font-mono text-[11px] text-on-surface-variant">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </time>
                  </div>
                  <p className="mt-2 text-sm font-medium text-on-surface">{entry.message}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    <span className="font-semibold text-on-surface">Next step:</span> {entry.guidance}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 bg-surface-container-low/50 px-6 py-3.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-tertiary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Cleared automatically when this tab closes
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={clearDiagnostics}
              disabled={entries.length === 0}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-45"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

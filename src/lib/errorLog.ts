/**
 * Privacy-safe in-memory operation & integrity logger for offline operations.
 *
 * STRICT PRIVACY INVARIANT:
 * - Never logs file contents, user filenames, calculator inputs, or dates.
 * - Never sends data over the network or persists to cookies/localStorage.
 * - Lives strictly in volatile session memory and is cleared on tab close or reset.
 */

export type LogSeverity = 'error' | 'warning' | 'info';

export interface LocalDiagnosticEntry {
  id: string;
  timestamp: string;
  toolId: string;
  stage: 'validation' | 'worker' | 'processing' | 'export' | 'integrity';
  severity: LogSeverity;
  code: string;
  message: string;
  guidance: string;
  offline: boolean;
}

const MAX_LOG_ENTRIES = 100;
let entries: LocalDiagnosticEntry[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function logDiagnostic(params: {
  toolId: string;
  stage: LocalDiagnosticEntry['stage'];
  severity: LogSeverity;
  code: string;
  message: string;
  guidance: string;
}): LocalDiagnosticEntry {
  const entry: LocalDiagnosticEntry = {
    id: `diag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    toolId: params.toolId,
    stage: params.stage,
    severity: params.severity,
    code: params.code,
    message: params.message,
    guidance: params.guidance,
    offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  };

  entries = [entry, ...entries].slice(0, MAX_LOG_ENTRIES);
  notify();
  return entry;
}

export function getDiagnostics(): LocalDiagnosticEntry[] {
  return entries;
}

export function clearDiagnostics(): void {
  entries = [];
  notify();
}

export function subscribeDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function exportDiagnosticsJson(): string {
  return JSON.stringify(
    {
      schema: 'everydaykit-local-diagnostics/v1',
      exportedAt: new Date().toISOString(),
      privacyNote:
        'Generated locally in browser memory. Contains no file contents, filenames, calculator values, or date inputs.',
      count: entries.length,
      entries,
    },
    null,
    2
  );
}

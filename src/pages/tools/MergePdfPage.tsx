import { useRef, useState, type DragEvent } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownAZ,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Download,
  FileText,
  Files,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import ToolPageShell from '../../components/ToolPageShell';
import { logDiagnostic } from '../../lib/errorLog';
import { inspectPdf, mergePdfs } from '../../lib/pdfClient';
import { PDF_LIMITS } from '../../lib/pdfValidation';
import {
  formatBytes,
  hasPdfMagicBytes,
  readFileHeaderBytes,
  sanitizeDisplayText,
  sanitizeDownloadFilename,
  triggerBlobDownload,
} from '../../lib/sanitize';
import { getToolById } from '../../lib/toolsCatalog';

interface QueuedPdf {
  id: string;
  displayName: string;
  sizeBytes: number;
  pageCount: number;
  bytes: Uint8Array;
}

interface MergeResultState {
  blob: Blob;
  filename: string;
  pageCount: number;
  sizeBytes: number;
  sourceFileCount: number;
  elapsedMs: number;
}

export default function MergePdfPage() {
  const tool = getToolById('merge-pdf')!;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<QueuedPdf[]>([]);
  const [outputName, setOutputName] = useState('merged-document');
  const [normalizePortrait, setNormalizePortrait] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<MergeResultState | null>(null);

  const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);

  const handleFilesAdded = async (incomingList: FileList | File[]) => {
    const incoming = Array.from(incomingList);
    if (incoming.length === 0) return;

    setErrorMessage(null);
    setResult(null);
    setIsInspecting(true);
    setStatusMessage('Validating selected PDF files locally…');

    const accepted: QueuedPdf[] = [];
    const errors: string[] = [];
    let runningCount = files.length;
    let runningBytes = totalBytes;

    for (const file of incoming) {
      const safeName = sanitizeDisplayText(file.name);

      if (runningCount >= PDF_LIMITS.MERGE_MAX_FILES) {
        errors.push(
          `Maximum of ${PDF_LIMITS.MERGE_MAX_FILES} PDF files reached. "${safeName}" was skipped.`
        );
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'warning',
          code: 'PDF_MERGE_MAX_FILES',
          message: 'File queue exceeded the 20-file ceiling.',
          guidance: 'Merge in two batches of up to 20 files, then combine the two merged outputs.',
        });
        break;
      }

      if (file.size === 0) {
        errors.push(`"${safeName}" is empty (0 bytes) and cannot be merged.`);
        continue;
      }

      if (runningBytes + file.size > PDF_LIMITS.MERGE_MAX_TOTAL_BYTES) {
        errors.push(
          `Adding "${safeName}" (${formatBytes(file.size)}) exceeds the 50 MB combined limit.`
        );
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'warning',
          code: 'PDF_MERGE_SIZE_LIMIT',
          message: 'Combined file size exceeded 50 MB browser limit.',
          guidance: 'Remove large files or split your merge into smaller batches under 50 MB.',
        });
        continue;
      }

      try {
        const header = await readFileHeaderBytes(file, 1024);
        if (!hasPdfMagicBytes(header)) {
          errors.push(
            `"${safeName}" does not have a valid PDF file header (%PDF-). Only PDF files are supported.`
          );
          logDiagnostic({
            toolId: tool.id,
            stage: 'validation',
            severity: 'error',
            code: 'PDF_INVALID_MAGIC_BYTES',
            message: 'Rejected non-PDF file based on binary header signature.',
            guidance: 'Select a valid .pdf file (or convert JPG/PNG images via Images to PDF).',
          });
          continue;
        }

        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const inspected = await inspectPdf(bytes);

        accepted.push({
          id: `pdf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          displayName: safeName,
          sizeBytes: file.size,
          pageCount: inspected.pageCount,
          bytes,
        });
        runningCount += 1;
        runningBytes += file.size;
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'Unable to parse PDF.';
        errors.push(`"${safeName}": ${reason}`);
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'error',
          code: 'PDF_PARSE_FAILED',
          message: 'PDF failed local structural inspection.',
          guidance: 'Ensure the PDF is not password-protected or corrupted before retrying.',
        });
      }
    }

    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted]);
      setStatusMessage(
        `Added ${accepted.length} PDF file${accepted.length > 1 ? 's' : ''} locally.`
      );
    }
    if (errors.length > 0) {
      setErrorMessage(errors.join(' '));
    }

    setIsInspecting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files?.length) {
      void handleFilesAdded(e.dataTransfer.files);
    }
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= files.length || fromIndex === toIndex) return;
    setResult(null);
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const removeFile = (id: string) => {
    setResult(null);
    setErrorMessage(null);
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const invertOrder = () => {
    setResult(null);
    setFiles((prev) => [...prev].reverse());
  };

  const sortAlphabetically = () => {
    setResult(null);
    setFiles((prev) =>
      [...prev].sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: 'base' })
      )
    );
  };

  const handleMerge = async () => {
    if (files.length < PDF_LIMITS.MERGE_MIN_FILES) {
      setErrorMessage('Add at least 2 PDF files before merging.');
      return;
    }

    setErrorMessage(null);
    setResult(null);
    setIsProcessing(true);
    setProgress(5);
    setStatusMessage('Starting local PDF merge worker…');

    try {
      const merged = await mergePdfs(
        files.map((f) => ({ name: f.displayName, bytes: f.bytes })),
        { normalizePortrait },
        (pct, status) => {
          setProgress(pct);
          setStatusMessage(status);
        }
      );

      const safeFilename = sanitizeDownloadFilename(outputName || 'merged-document', '.pdf');
      const blob = new Blob([new Uint8Array(merged.bytes)], { type: 'application/pdf' });

      setResult({
        blob,
        filename: safeFilename,
        pageCount: merged.pageCount,
        sizeBytes: blob.size,
        sourceFileCount: files.length,
        elapsedMs: merged.elapsedMs,
      });
      setProgress(100);
      setStatusMessage(
        `Merged ${files.length} files (${merged.pageCount} pages) in ${merged.elapsedMs} ms.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF merge failed in browser memory.';
      setErrorMessage(msg);
      setStatusMessage('Merge failed.');
      logDiagnostic({
        toolId: tool.id,
        stage: 'processing',
        severity: 'error',
        code: 'PDF_MERGE_EXECUTION_ERROR',
        message: 'Local PDF merge operation failed.',
        guidance: 'Remove any damaged PDF or reduce total file size and try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setOutputName('merged-document');
    setNormalizePortrait(false);
    setProgress(0);
    setStatusMessage('Workspace cleared from browser memory.');
    setErrorMessage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const suppressAds = isInspecting || isProcessing || Boolean(errorMessage) || files.length === 0;

  return (
    <ToolPageShell tool={tool} suppressAds={suppressAds}>
      {/* Screen-reader live region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <div className="space-y-6">
        {/* Dropzone Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:p-10 ${
            isDraggingOver
              ? 'border-primary bg-surface-container'
              : 'border-outline-variant bg-surface-container-lowest hover:border-primary/60'
          }`}
        >
          <input
            ref={fileInputRef}
            id="merge-pdf-file-input"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void handleFilesAdded(e.target.files);
            }}
          />

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
            {isInspecting ? (
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-7 w-7" aria-hidden="true" />
            )}
          </div>

          <h2 className="mt-4 font-display text-lg font-bold text-on-surface">
            {files.length === 0 ? 'Drop PDF files here to combine' : 'Add more PDF files to the queue'}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-on-surface-variant">
            2 to 20 PDF files • Up to 50 MB total • Validated and merged locally in browser memory
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <label
              htmlFor="merge-pdf-file-input"
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Select PDF Files
            </label>
            {files.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Actionable Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-error/30 bg-error-container/50 p-4 text-sm text-on-error-container"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-bold">Validation or Processing Issue</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Queue & Configuration Workspace */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* File Sequence List */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 pb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-on-surface">
                    Merge Sequence ({files.length} / {PDF_LIMITS.MERGE_MAX_FILES} files)
                  </h3>
                  <p className="mt-0.5 text-xs text-on-surface-variant tabular-nums">
                    {totalPages} total page{totalPages === 1 ? '' : 's'} • {formatBytes(totalBytes)}{' '}
                    / 50.00 MB used
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={sortAlphabetically}
                    disabled={files.length < 2 || isProcessing}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low/60 px-3 text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40"
                  >
                    <ArrowDownAZ className="h-4 w-4" aria-hidden="true" />
                    Sort A–Z
                  </button>
                  <button
                    type="button"
                    onClick={invertOrder}
                    disabled={files.length < 2 || isProcessing}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low/60 px-3 text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40"
                  >
                    <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                    Invert
                  </button>
                </div>
              </div>

              <ol className="mt-4 space-y-2.5" aria-label="Ordered PDF merge queue">
                {files.map((item, idx) => (
                  <li
                    key={item.id}
                    draggable={!isProcessing}
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null && draggedIndex !== idx) {
                        moveFile(draggedIndex, idx);
                      }
                      setDraggedIndex(null);
                    }}
                    onDragEnd={() => setDraggedIndex(null)}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                      draggedIndex === idx
                        ? 'border-primary bg-surface-container-low'
                        : 'border-outline-variant/30 bg-surface-container-low/40 hover:bg-surface-container-low/80'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="hidden cursor-grab text-outline sm:inline-flex"
                        aria-hidden="true"
                      >
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-fixed font-mono text-xs font-bold text-on-primary-fixed">
                        {idx + 1}
                      </span>
                      <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-on-surface">
                          {item.displayName}
                        </p>
                        <p className="text-xs text-on-surface-variant tabular-nums">
                          {item.pageCount} page{item.pageCount === 1 ? '' : 's'} •{' '}
                          {formatBytes(item.sizeBytes)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveFile(idx, idx - 1)}
                        disabled={idx === 0 || isProcessing}
                        aria-label={`Move ${item.displayName} up`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-35"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFile(idx, idx + 1)}
                        disabled={idx === files.length - 1 || isProcessing}
                        aria-label={`Move ${item.displayName} down`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-35"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        disabled={isProcessing}
                        aria-label={`Remove ${item.displayName}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-error hover:bg-error-container/50 disabled:opacity-35"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Output Settings & Execute Panel */}
            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-on-surface">
                  Merge Settings
                </h3>

                <div>
                  <label
                    htmlFor="merge-output-filename"
                    className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant"
                  >
                    Output Filename
                  </label>
                  <div className="mt-1.5 flex items-center rounded-xl border border-outline-variant bg-surface-container-low/50 focus-within:border-primary focus-within:bg-surface-container-lowest">
                    <input
                      id="merge-output-filename"
                      type="text"
                      value={outputName}
                      onChange={(e) => setOutputName(e.target.value)}
                      placeholder="merged-document"
                      disabled={isProcessing}
                      className="min-h-[44px] w-full bg-transparent px-3 text-sm font-medium text-on-surface focus:outline-none"
                    />
                    <span className="pr-3 font-mono text-xs font-semibold text-on-surface-variant">
                      .pdf
                    </span>
                  </div>
                </div>

                <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-3">
                  <input
                    type="checkbox"
                    checked={normalizePortrait}
                    onChange={(e) => setNormalizePortrait(e.target.checked)}
                    disabled={isProcessing}
                    className="mt-1 h-4 w-4 rounded border-outline accent-primary"
                  />
                  <span className="text-xs leading-relaxed text-on-surface-variant">
                    <strong className="block font-semibold text-on-surface">
                      Rotate landscape pages to portrait
                    </strong>
                    Applies a 90° clockwise rotation to wider-than-tall pages for uniform reading.
                  </span>
                </label>

                {files.length < PDF_LIMITS.MERGE_MIN_FILES && (
                  <p className="rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                    Add at least <strong>1 more PDF file</strong> to enable merging.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {isProcessing && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs font-medium text-on-surface-variant">
                      <span>{statusMessage || 'Merging PDFs…'}</span>
                      <span className="font-mono tabular-nums">{progress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="PDF merge progress"
                      className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleMerge()}
                  disabled={files.length < PDF_LIMITS.MERGE_MIN_FILES || isProcessing}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-on-primary shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Merging Locally…
                    </>
                  ) : (
                    <>
                      <Files className="h-4 w-4" aria-hidden="true" />
                      Merge {files.length} PDF{files.length === 1 ? '' : 's'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Result Card */}
        {result && (
          <div className="rounded-2xl border border-tertiary/35 bg-tertiary-container/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-tertiary" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-lg font-extrabold text-on-surface">
                    Merged PDF Ready for Download
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant tabular-nums">
                    <span className="font-mono font-semibold text-on-surface">
                      {result.filename}
                    </span>{' '}
                    • {result.pageCount} pages from {result.sourceFileCount} files •{' '}
                    {formatBytes(result.sizeBytes)} • Built locally in {result.elapsedMs} ms
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBlobDownload(result.blob, result.filename)}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-tertiary px-5 text-sm font-bold text-on-tertiary shadow-sm hover:bg-tertiary-container"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download Merged PDF
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}

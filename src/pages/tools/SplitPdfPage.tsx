import { useMemo, useRef, useState, type DragEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileArchive,
  FileText,
  Loader2,
  RotateCcw,
  Scissors,
  Upload,
} from 'lucide-react';
import ToolPageShell from '../../components/ToolPageShell';
import { logDiagnostic } from '../../lib/errorLog';
import { inspectPdf, splitPdf } from '../../lib/pdfClient';
import type { PdfPageInfo, SplitExportMode } from '../../lib/pdfCore';
import {
  formatPagesToRangeString,
  parsePageRanges,
  PDF_LIMITS,
} from '../../lib/pdfValidation';
import {
  formatBytes,
  hasPdfMagicBytes,
  readFileHeaderBytes,
  sanitizeDisplayText,
  sanitizeDownloadFilename,
  stripFileExtension,
  triggerBlobDownload,
} from '../../lib/sanitize';
import { getToolById } from '../../lib/toolsCatalog';

interface LoadedSplitPdf {
  displayName: string;
  baseName: string;
  sizeBytes: number;
  pageCount: number;
  pages: PdfPageInfo[];
  bytes: Uint8Array;
}

interface SplitResultState {
  blob: Blob;
  filename: string;
  isZip: boolean;
  outputFileCount: number;
  extractedPageCount: number;
  sizeBytes: number;
  elapsedMs: number;
}

export default function SplitPdfPage() {
  const tool = getToolById('split-pdf')!;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sourcePdf, setSourcePdf] = useState<LoadedSplitPdf | null>(null);
  const [rangeInput, setRangeInput] = useState('');
  const [exportMode, setExportMode] = useState<SplitExportMode>('single-pdf');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SplitResultState | null>(null);

  const parsedRanges = useMemo(() => {
    if (!sourcePdf) return null;
    if (exportMode === 'every-page-zip') {
      const all = Array.from({ length: sourcePdf.pageCount }, (_, i) => i + 1);
      return {
        valid: true,
        groups: all.map((p) => ({ label: `p${p}`, pages: [p] })),
        uniquePages: all,
        orderedPages: all,
      };
    }
    return parsePageRanges(rangeInput, sourcePdf.pageCount);
  }, [sourcePdf, rangeInput, exportMode]);

  const selectedPageSet = useMemo(() => {
    if (!parsedRanges || !parsedRanges.valid) return new Set<number>();
    return new Set(parsedRanges.uniquePages);
  }, [parsedRanges]);

  const loadFile = async (file: File) => {
    setErrorMessage(null);
    setResult(null);
    setIsInspecting(true);
    setStatusMessage('Validating PDF locally…');

    const safeName = sanitizeDisplayText(file.name);

    try {
      if (file.size === 0) {
        throw new Error(`"${safeName}" is empty (0 bytes).`);
      }
      if (file.size > PDF_LIMITS.SPLIT_MAX_FILE_BYTES) {
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'warning',
          code: 'PDF_SPLIT_SIZE_LIMIT',
          message: 'Selected PDF exceeded 50 MB size limit.',
          guidance: 'Select a PDF file under 50 MB for browser-local splitting.',
        });
        throw new Error(
          `"${safeName}" is ${formatBytes(file.size)}, which exceeds the 50 MB local limit.`
        );
      }

      const header = await readFileHeaderBytes(file, 1024);
      if (!hasPdfMagicBytes(header)) {
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'error',
          code: 'PDF_INVALID_MAGIC_BYTES',
          message: 'Rejected non-PDF file based on header bytes.',
          guidance: 'Choose a valid .pdf document.',
        });
        throw new Error(
          `"${safeName}" does not contain a valid PDF header (%PDF-). Select a valid PDF document.`
        );
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const inspected = await inspectPdf(bytes);

      setSourcePdf({
        displayName: safeName,
        baseName: stripFileExtension(safeName),
        sizeBytes: file.size,
        pageCount: inspected.pageCount,
        pages: inspected.pages,
        bytes,
      });

      const defaultRange = inspected.pageCount > 1 ? `1-${inspected.pageCount}` : '1';
      setRangeInput(defaultRange);
      setStatusMessage(`Loaded ${inspected.pageCount}-page PDF locally.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to read PDF file.';
      setErrorMessage(msg);
      setSourcePdf(null);
      logDiagnostic({
        toolId: tool.id,
        stage: 'validation',
        severity: 'error',
        code: 'PDF_SPLIT_LOAD_ERROR',
        message: 'Failed to inspect PDF document locally.',
        guidance: 'Confirm the PDF is unlocked and uncorrupted, then retry.',
      });
    } finally {
      setIsInspecting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const first = e.dataTransfer.files?.[0];
    if (first) void loadFile(first);
  };

  const togglePage = (pageNum: number) => {
    if (!sourcePdf || exportMode === 'every-page-zip') return;
    setResult(null);
    const nextSet = new Set(selectedPageSet);
    if (nextSet.has(pageNum)) {
      nextSet.delete(pageNum);
    } else {
      nextSet.add(pageNum);
    }
    setRangeInput(formatPagesToRangeString(Array.from(nextSet)));
  };

  const applyQuickSelect = (kind: 'all' | 'odd' | 'even' | 'invert' | 'clear') => {
    if (!sourcePdf) return;
    setResult(null);
    if (exportMode === 'every-page-zip') setExportMode('single-pdf');
    const pages: number[] = [];
    for (let p = 1; p <= sourcePdf.pageCount; p++) {
      if (kind === 'all') pages.push(p);
      else if (kind === 'odd' && p % 2 === 1) pages.push(p);
      else if (kind === 'even' && p % 2 === 0) pages.push(p);
      else if (kind === 'invert' && !selectedPageSet.has(p)) pages.push(p);
    }
    setRangeInput(formatPagesToRangeString(pages));
  };

  const handleSplit = async () => {
    if (!sourcePdf || !parsedRanges || !parsedRanges.valid) {
      setErrorMessage(parsedRanges?.error ?? 'Enter valid page ranges before splitting.');
      return;
    }

    setErrorMessage(null);
    setResult(null);
    setIsProcessing(true);
    setProgress(8);
    setStatusMessage('Running local PDF split worker…');

    try {
      const output = await splitPdf(
        sourcePdf.bytes,
        sourcePdf.baseName,
        parsedRanges.groups,
        parsedRanges.orderedPages,
        exportMode,
        (pct, status) => {
          setProgress(pct);
          setStatusMessage(status);
        }
      );

      const ext = output.isZip ? '.zip' : '.pdf';
      const suffix = output.isZip ? '-split-pages' : '-extracted';
      const filename = sanitizeDownloadFilename(`${sourcePdf.baseName}${suffix}`, ext);
      const blob = new Blob([new Uint8Array(output.bytes)], { type: output.mimeType });

      setResult({
        blob,
        filename,
        isZip: output.isZip,
        outputFileCount: output.outputFileCount,
        extractedPageCount: output.extractedPageCount,
        sizeBytes: blob.size,
        elapsedMs: output.elapsedMs,
      });
      setProgress(100);
      setStatusMessage(
        `Extracted ${output.extractedPageCount} page(s) into ${output.outputFileCount} file(s) locally.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF split failed locally.';
      setErrorMessage(msg);
      logDiagnostic({
        toolId: tool.id,
        stage: 'processing',
        severity: 'error',
        code: 'PDF_SPLIT_EXECUTION_ERROR',
        message: 'Local PDF split operation failed.',
        guidance: 'Check your page ranges and try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSourcePdf(null);
    setRangeInput('');
    setExportMode('single-pdf');
    setProgress(0);
    setErrorMessage(null);
    setResult(null);
    setStatusMessage('Split workspace cleared from browser memory.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const suppressAds = isInspecting || isProcessing || Boolean(errorMessage) || !sourcePdf;

  return (
    <ToolPageShell tool={tool} suppressAds={suppressAds}>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <div className="space-y-6">
        {!sourcePdf ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
              isDraggingOver
                ? 'border-primary bg-surface-container'
                : 'border-outline-variant bg-surface-container-lowest hover:border-primary/60'
            }`}
          >
            <input
              ref={fileInputRef}
              id="split-pdf-file-input"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void loadFile(file);
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
              Select or drop a PDF to split by page ranges
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-on-surface-variant">
              Up to 50 MB • Extract single PDFs or multi-file ZIP archives locally in your browser
            </p>
            <div className="mt-5">
              <label
                htmlFor="split-pdf-file-input"
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-95"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Choose PDF File
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Loaded Source Summary */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-on-surface">
                    {sourcePdf.displayName}
                  </p>
                  <p className="text-xs text-on-surface-variant tabular-nums">
                    {sourcePdf.pageCount} page{sourcePdf.pageCount === 1 ? '' : 's'} •{' '}
                    {formatBytes(sourcePdf.sizeBytes)} • Loaded in browser memory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Change PDF
              </button>
            </div>

            {/* Split Controls + Interactive Page Matrix */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              {/* Left: Page Matrix */}
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 pb-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-on-surface">
                      Page Matrix ({selectedPageSet.size} of {sourcePdf.pageCount} selected)
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Click any page tile below or edit the range expression on the right.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'odd', 'even', 'invert', 'clear'] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => applyQuickSelect(kind)}
                        disabled={isProcessing}
                        className="min-h-[36px] rounded-lg border border-outline-variant/50 bg-surface-container-low/70 px-2.5 text-xs font-semibold capitalize text-on-surface hover:bg-surface-container"
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="mt-4 grid max-h-[420px] grid-cols-3 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-6"
                  role="group"
                  aria-label="Selectable PDF pages"
                >
                  {sourcePdf.pages.map((page) => {
                    const isSelected = selectedPageSet.has(page.pageNumber);
                    return (
                      <button
                        key={page.pageNumber}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={exportMode === 'every-page-zip' || isProcessing}
                        onClick={() => togglePage(page.pageNumber)}
                        className={`flex min-h-[76px] flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary-fixed/50 text-on-primary-fixed'
                            : 'border-outline-variant/40 bg-surface-container-low/40 text-on-surface-variant hover:border-primary/40 hover:bg-surface-container-low'
                        } disabled:cursor-default`}
                      >
                        <span className="font-mono text-sm font-bold tabular-nums">
                          p.{page.pageNumber}
                        </span>
                        <span className="text-[10px] font-medium opacity-80">
                          {page.orientation === 'landscape' ? 'Landscape' : 'Portrait'}
                        </span>
                        <span className="font-mono text-[10px] opacity-70 tabular-nums">
                          {page.widthPt}×{page.heightPt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Range Input & Export Mode */}
              <div className="flex flex-col justify-between gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
                <div className="space-y-5">
                  <fieldset>
                    <legend className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                      Export Mode
                    </legend>
                    <div className="mt-2 space-y-2">
                      {(
                        [
                          {
                            id: 'single-pdf',
                            title: 'Combine into one PDF',
                            desc: 'Extracts selected pages into a single .pdf file.',
                          },
                          {
                            id: 'separate-ranges-zip',
                            title: 'Separate PDF per range (ZIP)',
                            desc: 'Creates one PDF per comma-separated range inside a .zip.',
                          },
                          {
                            id: 'every-page-zip',
                            title: 'Split every page (ZIP)',
                            desc: `Exports all ${sourcePdf.pageCount} pages as individual PDFs in a .zip.`,
                          },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex min-h-[48px] cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                            exportMode === opt.id
                              ? 'border-primary bg-surface-container-low'
                              : 'border-outline-variant/35 bg-surface-container-lowest hover:bg-surface-container-low/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name="split-export-mode"
                            value={opt.id}
                            checked={exportMode === opt.id}
                            onChange={() => {
                              setExportMode(opt.id);
                              setResult(null);
                              setErrorMessage(null);
                            }}
                            disabled={isProcessing}
                            className="mt-1 accent-primary"
                          />
                          <span className="text-xs">
                            <strong className="block font-semibold text-on-surface">
                              {opt.title}
                            </strong>
                            <span className="text-on-surface-variant">{opt.desc}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {exportMode !== 'every-page-zip' && (
                    <div>
                      <label
                        htmlFor="split-page-ranges"
                        className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                      >
                        Page Ranges (1–{sourcePdf.pageCount})
                      </label>
                      <input
                        id="split-page-ranges"
                        type="text"
                        value={rangeInput}
                        onChange={(e) => {
                          setRangeInput(e.target.value);
                          setResult(null);
                        }}
                        disabled={isProcessing}
                        placeholder="e.g. 1-3, 5, 8-10"
                        aria-invalid={parsedRanges ? !parsedRanges.valid : false}
                        aria-describedby="split-range-hint"
                        className="mt-1.5 min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 font-mono text-sm font-medium text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none"
                      />
                      <p id="split-range-hint" className="mt-1.5 text-xs text-on-surface-variant">
                        {parsedRanges?.valid ? (
                          <span className="text-tertiary font-medium">
                            Valid: {parsedRanges.orderedPages.length} page
                            {parsedRanges.orderedPages.length === 1 ? '' : 's'} across{' '}
                            {parsedRanges.groups.length} range group
                            {parsedRanges.groups.length === 1 ? '' : 's'}.
                          </span>
                        ) : (
                          <span className="text-error font-medium">{parsedRanges?.error}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {isProcessing && (
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs font-medium text-on-surface-variant">
                        <span>{statusMessage || 'Splitting PDF…'}</span>
                        <span className="font-mono tabular-nums">{progress}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="PDF split progress"
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
                    onClick={() => void handleSplit()}
                    disabled={!parsedRanges?.valid || isProcessing}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-on-primary shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Splitting Locally…
                      </>
                    ) : (
                      <>
                        <Scissors className="h-4 w-4" aria-hidden="true" />
                        Split PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-error/30 bg-error-container/50 p-4 text-sm text-on-error-container"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
            <div>
              <p className="font-bold">Validation or Processing Issue</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Card */}
        {result && (
          <div className="rounded-2xl border border-tertiary/35 bg-tertiary-container/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-tertiary" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-lg font-extrabold text-on-surface">
                    {result.isZip ? 'Split ZIP Archive Ready' : 'Extracted PDF Ready'}
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant tabular-nums">
                    <span className="font-mono font-semibold text-on-surface">
                      {result.filename}
                    </span>{' '}
                    • {result.extractedPageCount} page{result.extractedPageCount === 1 ? '' : 's'}{' '}
                    in {result.outputFileCount} file{result.outputFileCount === 1 ? '' : 's'} •{' '}
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
                  {result.isZip ? (
                    <FileArchive className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
                  Download {result.isZip ? 'ZIP Archive' : 'Extracted PDF'}
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

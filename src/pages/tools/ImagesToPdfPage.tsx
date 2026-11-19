import { useEffect, useRef, useState, type DragEvent } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  FileImage,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import ToolPageShell from '../../components/ToolPageShell';
import { logDiagnostic } from '../../lib/errorLog';
import { readImageDimensions } from '../../lib/imageProcessor';
import { imagesToPdf } from '../../lib/pdfClient';
import type {
  PdfMarginPreset,
  PdfOrientationPreset,
  PdfPageSizePreset,
} from '../../lib/pdfCore';
import { PDF_LIMITS } from '../../lib/pdfValidation';
import {
  detectImageMagicFormat,
  formatBytes,
  readFileHeaderBytes,
  sanitizeDisplayText,
  sanitizeDownloadFilename,
  triggerBlobDownload,
} from '../../lib/sanitize';
import { getToolById } from '../../lib/toolsCatalog';

interface QueuedImage {
  id: string;
  displayName: string;
  format: 'jpeg' | 'png';
  sizeBytes: number;
  width: number;
  height: number;
  bytes: Uint8Array;
  previewUrl: string;
}

interface ImagesToPdfResultState {
  blob: Blob;
  filename: string;
  pageCount: number;
  sizeBytes: number;
  elapsedMs: number;
}

export default function ImagesToPdfPage() {
  const tool = getToolById('images-to-pdf')!;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<QueuedImage[]>([]);

  const [images, setImages] = useState<QueuedImage[]>([]);
  const [pageSize, setPageSize] = useState<PdfPageSizePreset>('a4');
  const [orientation, setOrientation] = useState<PdfOrientationPreset>('auto');
  const [margin, setMargin] = useState<PdfMarginPreset>('small');
  const [outputName, setOutputName] = useState('images-to-pdf');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImagesToPdfResultState | null>(null);

  itemsRef.current = images;

  // Revoke all temporary object URLs on unmount to keep memory clean
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  const totalBytes = images.reduce((sum, img) => sum + img.sizeBytes, 0);

  const handleFilesAdded = async (incomingList: FileList | File[]) => {
    const incoming = Array.from(incomingList);
    if (incoming.length === 0) return;

    setErrorMessage(null);
    setResult(null);
    setIsLoadingFiles(true);
    setStatusMessage('Validating JPG and PNG images locally…');

    const accepted: QueuedImage[] = [];
    const errors: string[] = [];
    let runningCount = images.length;
    let runningBytes = totalBytes;

    for (const file of incoming) {
      const safeName = sanitizeDisplayText(file.name);

      if (runningCount >= PDF_LIMITS.IMAGES_TO_PDF_MAX_FILES) {
        errors.push(
          `Maximum of ${PDF_LIMITS.IMAGES_TO_PDF_MAX_FILES} images reached. "${safeName}" was skipped.`
        );
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'warning',
          code: 'IMG_TO_PDF_MAX_FILES',
          message: 'Image queue exceeded 50-file ceiling.',
          guidance: 'Convert up to 50 images per PDF, then merge PDFs if needed.',
        });
        break;
      }

      if (file.size === 0) {
        errors.push(`"${safeName}" is empty (0 bytes).`);
        continue;
      }

      if (runningBytes + file.size > PDF_LIMITS.IMAGES_TO_PDF_MAX_TOTAL_BYTES) {
        errors.push(
          `Adding "${safeName}" (${formatBytes(file.size)}) exceeds the 50 MB total limit.`
        );
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'warning',
          code: 'IMG_TO_PDF_SIZE_LIMIT',
          message: 'Combined image size exceeded 50 MB limit.',
          guidance: 'Compress large photos first with Resize & Compress Image, or split into batches.',
        });
        continue;
      }

      try {
        const header = await readFileHeaderBytes(file, 16);
        const detected = detectImageMagicFormat(header);
        if (detected !== 'jpeg' && detected !== 'png') {
          errors.push(
            `"${safeName}" is not a valid JPG or PNG image. Convert WebP or other formats to JPG/PNG first.`
          );
          logDiagnostic({
            toolId: tool.id,
            stage: 'validation',
            severity: 'error',
            code: 'IMG_TO_PDF_UNSUPPORTED_FORMAT',
            message: 'Rejected non-JPG/PNG file based on magic bytes.',
            guidance: 'Select JPG (.jpg/.jpeg) or PNG (.png) files only.',
          });
          continue;
        }

        const dims = await readImageDimensions(file);
        const bytes = new Uint8Array(await file.arrayBuffer());
        const previewUrl = URL.createObjectURL(file);

        accepted.push({
          id: `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          displayName: safeName,
          format: detected,
          sizeBytes: file.size,
          width: dims.width,
          height: dims.height,
          bytes,
          previewUrl,
        });
        runningCount += 1;
        runningBytes += file.size;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to decode image.';
        errors.push(`"${safeName}": ${msg}`);
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'error',
          code: 'IMG_TO_PDF_DECODE_ERROR',
          message: 'Image failed browser decoding.',
          guidance: 'Verify the image opens normally and re-save as standard JPG or PNG.',
        });
      }
    }

    if (accepted.length > 0) {
      setImages((prev) => [...prev, ...accepted]);
      setStatusMessage(
        `Added ${accepted.length} image${accepted.length === 1 ? '' : 's'} locally.`
      );
    }
    if (errors.length > 0) {
      setErrorMessage(errors.join(' '));
    }

    setIsLoadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files?.length) {
      void handleFilesAdded(e.dataTransfer.files);
    }
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    setResult(null);
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const removeImage = (id: string) => {
    setResult(null);
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setErrorMessage('Add at least 1 JPG or PNG image before converting.');
      return;
    }

    setErrorMessage(null);
    setResult(null);
    setIsProcessing(true);
    setProgress(5);
    setStatusMessage('Building PDF from images locally…');

    try {
      const output = await imagesToPdf(
        images.map((img) => ({
          name: img.displayName,
          format: img.format,
          bytes: img.bytes,
        })),
        { pageSize, orientation, margin },
        (pct, status) => {
          setProgress(pct);
          setStatusMessage(status);
        }
      );

      const safeFilename = sanitizeDownloadFilename(outputName || 'images-to-pdf', '.pdf');
      const blob = new Blob([new Uint8Array(output.bytes)], { type: 'application/pdf' });

      setResult({
        blob,
        filename: safeFilename,
        pageCount: output.pageCount,
        sizeBytes: blob.size,
        elapsedMs: output.elapsedMs,
      });
      setProgress(100);
      setStatusMessage(
        `Converted ${output.pageCount} image(s) to PDF locally in ${output.elapsedMs} ms.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image-to-PDF conversion failed.';
      setErrorMessage(msg);
      logDiagnostic({
        toolId: tool.id,
        stage: 'processing',
        severity: 'error',
        code: 'IMG_TO_PDF_EXECUTION_ERROR',
        message: 'Local image-to-PDF worker conversion failed.',
        guidance: 'Remove any malformed image and retry.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setPageSize('a4');
    setOrientation('auto');
    setMargin('small');
    setOutputName('images-to-pdf');
    setProgress(0);
    setErrorMessage(null);
    setResult(null);
    setStatusMessage('Image queue cleared and preview URLs revoked.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const suppressAds = isLoadingFiles || isProcessing || Boolean(errorMessage) || images.length === 0;

  return (
    <ToolPageShell tool={tool} suppressAds={suppressAds}>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <div className="space-y-6">
        {/* Dropzone */}
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
            id="images-to-pdf-input"
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void handleFilesAdded(e.target.files);
            }}
          />

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
            {isLoadingFiles ? (
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-7 w-7" aria-hidden="true" />
            )}
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-on-surface">
            {images.length === 0
              ? 'Drop JPG or PNG images to build a PDF'
              : 'Add more JPG or PNG images'}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-on-surface-variant">
            Up to 50 images • 50 MB total • Embedded directly into PDF pages inside your browser
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <label
              htmlFor="images-to-pdf-input"
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Select JPG / PNG Images
            </label>
            {images.length > 0 && (
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

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-error/30 bg-error-container/50 p-4 text-sm text-on-error-container"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
            <div>
              <p className="font-bold">Validation or Conversion Issue</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Image Queue */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
              <div className="border-b border-outline-variant/25 pb-4">
                <h3 className="font-display text-base font-bold text-on-surface">
                  Page Sequence ({images.length} / {PDF_LIMITS.IMAGES_TO_PDF_MAX_FILES} images)
                </h3>
                <p className="mt-0.5 text-xs text-on-surface-variant tabular-nums">
                  {formatBytes(totalBytes)} / 50.00 MB used
                </p>
              </div>

              <ol className="mt-4 space-y-2.5" aria-label="Ordered images for PDF pages">
                {images.map((img, idx) => (
                  <li
                    key={img.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-fixed font-mono text-xs font-bold text-on-primary-fixed">
                        {idx + 1}
                      </span>
                      <img
                        src={img.previewUrl}
                        alt={`Page ${idx + 1} preview: ${img.displayName}`}
                        className="h-12 w-12 shrink-0 rounded-lg border border-outline-variant/30 bg-surface-container-lowest object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-on-surface">
                          {img.displayName}
                        </p>
                        <p className="text-xs text-on-surface-variant tabular-nums">
                          {img.format.toUpperCase()} • {img.width}×{img.height} px •{' '}
                          {formatBytes(img.sizeBytes)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx - 1)}
                        disabled={idx === 0 || isProcessing}
                        aria-label={`Move ${img.displayName} up`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-35"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx + 1)}
                        disabled={idx === images.length - 1 || isProcessing}
                        aria-label={`Move ${img.displayName} down`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:opacity-35"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        disabled={isProcessing}
                        aria-label={`Remove ${img.displayName}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-error hover:bg-error-container/50 disabled:opacity-35"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* PDF Page Layout Controls */}
            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-on-surface">
                  PDF Layout Options
                </h3>

                <div>
                  <label
                    htmlFor="img-pdf-page-size"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Page Size
                  </label>
                  <select
                    id="img-pdf-page-size"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(e.target.value as PdfPageSizePreset);
                      setResult(null);
                    }}
                    disabled={isProcessing}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-medium text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                  >
                    <option value="a4">A4 (210 × 297 mm)</option>
                    <option value="letter">US Letter (8.5 × 11 in)</option>
                    <option value="fit">Fit Page to Each Image</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="img-pdf-orientation"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Orientation
                  </label>
                  <select
                    id="img-pdf-orientation"
                    value={orientation}
                    onChange={(e) => {
                      setOrientation(e.target.value as PdfOrientationPreset);
                      setResult(null);
                    }}
                    disabled={isProcessing || pageSize === 'fit'}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-medium text-on-surface focus:border-primary focus:bg-surface-container-lowest disabled:opacity-50"
                  >
                    <option value="auto">Auto (match each image)</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="img-pdf-margin"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Page Margins
                  </label>
                  <select
                    id="img-pdf-margin"
                    value={margin}
                    onChange={(e) => {
                      setMargin(e.target.value as PdfMarginPreset);
                      setResult(null);
                    }}
                    disabled={isProcessing}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-medium text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                  >
                    <option value="none">None (0 pt)</option>
                    <option value="small">Small (18 pt)</option>
                    <option value="standard">Standard (36 pt)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="img-pdf-filename"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Output Filename
                  </label>
                  <div className="mt-1.5 flex items-center rounded-xl border border-outline-variant bg-surface-container-low/50 focus-within:border-primary focus-within:bg-surface-container-lowest">
                    <input
                      id="img-pdf-filename"
                      type="text"
                      value={outputName}
                      onChange={(e) => setOutputName(e.target.value)}
                      disabled={isProcessing}
                      placeholder="images-to-pdf"
                      className="min-h-[44px] w-full bg-transparent px-3 text-sm font-medium text-on-surface focus:outline-none"
                    />
                    <span className="pr-3 font-mono text-xs font-semibold text-on-surface-variant">
                      .pdf
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {isProcessing && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs font-medium text-on-surface-variant">
                      <span>{statusMessage || 'Building PDF…'}</span>
                      <span className="font-mono tabular-nums">{progress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Images to PDF conversion progress"
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
                  onClick={() => void handleConvert()}
                  disabled={images.length === 0 || isProcessing}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-on-primary shadow-sm hover:opacity-95 disabled:opacity-45"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Converting Locally…
                    </>
                  ) : (
                    <>
                      <FileImage className="h-4 w-4" aria-hidden="true" />
                      Convert {images.length} Image{images.length === 1 ? '' : 's'} to PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-2xl border border-tertiary/35 bg-tertiary-container/10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-tertiary" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-lg font-extrabold text-on-surface">
                    PDF Created from Images
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant tabular-nums">
                    <span className="font-mono font-semibold text-on-surface">
                      {result.filename}
                    </span>{' '}
                    • {result.pageCount} page{result.pageCount === 1 ? '' : 's'} •{' '}
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
                  Download PDF
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

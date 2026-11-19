import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ImageDown,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Unlock,
  Upload,
} from 'lucide-react';
import ToolPageShell from '../../components/ToolPageShell';
import { logDiagnostic } from '../../lib/errorLog';
import {
  computeTargetDimensions,
  processImageLocally,
  readImageDimensions,
  type OutputImageMime,
  type ProcessedImageResult,
} from '../../lib/imageProcessor';
import { PDF_LIMITS } from '../../lib/pdfValidation';
import {
  detectImageMagicFormat,
  formatBytes,
  readFileHeaderBytes,
  sanitizeDisplayText,
  sanitizeDownloadFilename,
  stripFileExtension,
  triggerBlobDownload,
} from '../../lib/sanitize';
import { getToolById } from '../../lib/toolsCatalog';

interface LoadedImage {
  file: File;
  displayName: string;
  baseName: string;
  sourceFormat: 'jpeg' | 'png' | 'webp';
  width: number;
  height: number;
  sizeBytes: number;
  previewUrl: string;
}

export default function ResizeCompressImagePage() {
  const tool = getToolById('resize-compress-image')!;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  const [source, setSource] = useState<LoadedImage | null>(null);
  const [resizeMode, setResizeMode] = useState<'pixels' | 'percent'>('pixels');
  const [widthInput, setWidthInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [scalePercent, setScalePercent] = useState(100);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [preventUpscaling, setPreventUpscaling] = useState(true);
  const [outputMime, setOutputMime] = useState<OutputImageMime>('image/jpeg');
  const [qualityPercent, setQualityPercent] = useState(82);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedImageResult | null>(null);
  const [resultPreviewUrl, setResultPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    };
  }, []);

  const clearOutputPreview = () => {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }
    setResultPreviewUrl(null);
    setResult(null);
  };

  const targetDims = useMemo(() => {
    if (!source) return null;
    const parsedW = Number.parseInt(widthInput, 10);
    const parsedH = Number.parseInt(heightInput, 10);
    return computeTargetDimensions({
      originalWidth: source.width,
      originalHeight: source.height,
      mode: resizeMode,
      targetWidth: Number.isFinite(parsedW) && parsedW > 0 ? parsedW : source.width,
      targetHeight: Number.isFinite(parsedH) && parsedH > 0 ? parsedH : source.height,
      scalePercent,
      lockAspectRatio,
      preventUpscaling,
    });
  }, [source, resizeMode, widthInput, heightInput, scalePercent, lockAspectRatio, preventUpscaling]);

  const handleLoadImage = async (file: File) => {
    setErrorMessage(null);
    clearOutputPreview();
    setIsLoading(true);
    setStatusMessage('Validating image locally…');

    const safeName = sanitizeDisplayText(file.name);

    try {
      if (file.size === 0) {
        throw new Error(`"${safeName}" is empty (0 bytes).`);
      }
      if (file.size > PDF_LIMITS.IMAGE_COMPRESS_MAX_BYTES) {
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'warning',
          code: 'IMAGE_SIZE_LIMIT',
          message: 'Selected image exceeded 25 MB browser limit.',
          guidance: 'Select an image file 25 MB or smaller.',
        });
        throw new Error(
          `"${safeName}" is ${formatBytes(file.size)}, which exceeds the 25 MB local limit.`
        );
      }

      const header = await readFileHeaderBytes(file, 16);
      const format = detectImageMagicFormat(header);
      if (!format) {
        logDiagnostic({
          toolId: tool.id,
          stage: 'validation',
          severity: 'error',
          code: 'IMAGE_INVALID_FORMAT',
          message: 'Rejected unsupported image signature.',
          guidance: 'Upload a standard JPG, PNG, or WebP image file.',
        });
        throw new Error(
          `"${safeName}" is not a valid JPG, PNG, or WebP image file. Check the file format and try again.`
        );
      }

      const dims = await readImageDimensions(file);
      if (
        dims.width > PDF_LIMITS.IMAGE_MAX_DIMENSION_PX ||
        dims.height > PDF_LIMITS.IMAGE_MAX_DIMENSION_PX
      ) {
        throw new Error(
          `Image dimensions (${dims.width}×${dims.height} px) exceed the 10,000 × 10,000 px safe canvas ceiling.`
        );
      }

      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      const previewUrl = URL.createObjectURL(file);
      sourceUrlRef.current = previewUrl;

      setSource({
        file,
        displayName: safeName,
        baseName: stripFileExtension(safeName),
        sourceFormat: format,
        width: dims.width,
        height: dims.height,
        sizeBytes: file.size,
        previewUrl,
      });

      setWidthInput(String(dims.width));
      setHeightInput(String(dims.height));
      setScalePercent(100);
      setOutputMime(
        format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg'
      );
      setStatusMessage(`Loaded ${dims.width}×${dims.height} px ${format.toUpperCase()} image locally.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load image.';
      setErrorMessage(msg);
      logDiagnostic({
        toolId: tool.id,
        stage: 'validation',
        severity: 'error',
        code: 'IMAGE_LOAD_FAILED',
        message: 'Image decoding failed locally.',
        guidance: 'Confirm the file is a valid JPG, PNG, or WebP image.',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleLoadImage(file);
  };

  const handleWidthChange = (raw: string) => {
    setWidthInput(raw);
    clearOutputPreview();
    if (!source || !lockAspectRatio) return;
    const val = Number.parseInt(raw, 10);
    if (Number.isFinite(val) && val > 0) {
      const scaledH = Math.max(1, Math.round((val / source.width) * source.height));
      setHeightInput(String(scaledH));
    }
  };

  const handleHeightChange = (raw: string) => {
    setHeightInput(raw);
    clearOutputPreview();
    if (!source || !lockAspectRatio) return;
    const val = Number.parseInt(raw, 10);
    if (Number.isFinite(val) && val > 0) {
      const scaledW = Math.max(1, Math.round((val / source.height) * source.width));
      setWidthInput(String(scaledW));
    }
  };

  const handleProcess = async () => {
    if (!source || !targetDims) return;

    setErrorMessage(null);
    clearOutputPreview();
    setIsProcessing(true);
    setStatusMessage('Resizing and encoding image in browser memory…');

    try {
      const processed = await processImageLocally({
        file: source.file,
        targetWidth: targetDims.width,
        targetHeight: targetDims.height,
        outputMime,
        qualityPercent,
      });

      const outUrl = URL.createObjectURL(processed.blob);
      outputUrlRef.current = outUrl;
      setResult(processed);
      setResultPreviewUrl(outUrl);
      setStatusMessage(
        `Processed image to ${processed.width}×${processed.height} px (${formatBytes(processed.outputBytes)}) locally.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image processing failed in browser.';
      setErrorMessage(msg);
      logDiagnostic({
        toolId: tool.id,
        stage: 'processing',
        severity: 'error',
        code: 'IMAGE_ENCODE_FAILED',
        message: 'Canvas image encoding failed.',
        guidance: 'Try lowering output dimensions or switching output format to JPG or PNG.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!source || !result) return;
    const filename = sanitizeDownloadFilename(`${source.baseName}-resized`, `.${result.extension}`);
    triggerBlobDownload(result.blob, filename);
  };

  const handleReset = () => {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
      sourceUrlRef.current = null;
    }
    clearOutputPreview();
    setSource(null);
    setResizeMode('pixels');
    setWidthInput('');
    setHeightInput('');
    setScalePercent(100);
    setLockAspectRatio(true);
    setPreventUpscaling(true);
    setOutputMime('image/jpeg');
    setQualityPercent(82);
    setErrorMessage(null);
    setStatusMessage('Image workspace cleared and preview memory released.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const suppressAds = isLoading || isProcessing || Boolean(errorMessage) || !source;

  return (
    <ToolPageShell tool={tool} suppressAds={suppressAds}>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <div className="space-y-6">
        {!source ? (
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
              id="resize-image-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleLoadImage(file);
              }}
            />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low text-tertiary">
              {isLoading ? (
                <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-7 w-7" aria-hidden="true" />
              )}
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-on-surface">
              Drop a JPG, PNG, or WebP image to resize &amp; compress
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-on-surface-variant">
              Up to 25 MB • Max 10,000 × 10,000 px • EXIF metadata automatically stripped locally
            </p>
            <div className="mt-5">
              <label
                htmlFor="resize-image-file-input"
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-95"
              >
                <ImageDown className="h-4 w-4" aria-hidden="true" />
                Select Image
              </label>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Left: Preview & Comparison */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/25 pb-4">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold text-on-surface">
                      {source.displayName}
                    </p>
                    <p className="text-xs text-on-surface-variant tabular-nums">
                      Original: {source.width}×{source.height} px •{' '}
                      {source.sourceFormat.toUpperCase()} • {formatBytes(source.sizeBytes)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Change Image
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <figure className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-3">
                    <figcaption className="mb-2 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                      <span>Original</span>
                      <span className="font-mono tabular-nums">{formatBytes(source.sizeBytes)}</span>
                    </figcaption>
                    <div className="flex h-52 items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest">
                      <img
                        src={source.previewUrl}
                        alt={`Original image preview: ${source.displayName}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </figure>

                  <figure className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 p-3">
                    <figcaption className="mb-2 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                      <span>Processed Output</span>
                      <span className="font-mono tabular-nums">
                        {result ? formatBytes(result.outputBytes) : 'Pending'}
                      </span>
                    </figcaption>
                    <div className="flex h-52 items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest">
                      {resultPreviewUrl ? (
                        <img
                          src={resultPreviewUrl}
                          alt="Processed output preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <p className="px-4 text-center text-xs text-on-surface-variant">
                          Adjust settings and click <strong>Process Image</strong> to generate a
                          local preview and exact byte comparison.
                        </p>
                      )}
                    </div>
                  </figure>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-tertiary-container/10 px-3.5 py-2.5 text-xs text-tertiary">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Privacy safeguard: Canvas re-encoding strips camera &amp; GPS EXIF metadata
                    automatically.
                  </span>
                </div>
              </div>

              {result && (
                <div className="rounded-2xl border border-tertiary/35 bg-tertiary-container/10 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="mt-0.5 h-6 w-6 shrink-0 text-tertiary"
                        aria-hidden="true"
                      />
                      <div>
                        <h3 className="font-display text-base font-extrabold text-on-surface">
                          Optimized Image Ready
                        </h3>
                        <p className="mt-1 text-sm text-on-surface-variant tabular-nums">
                          {result.width}×{result.height} px • {result.extension.toUpperCase()} •{' '}
                          <strong className="text-on-surface">
                            {formatBytes(result.outputBytes)}
                          </strong>{' '}
                          (
                          {result.savedBytes >= 0 ? (
                            <span className="font-semibold text-tertiary">
                              saved {formatBytes(result.savedBytes)} /{' '}
                              {result.savedPercent.toFixed(1)}%
                            </span>
                          ) : (
                            <span>
                              +{formatBytes(Math.abs(result.savedBytes))} larger than source
                            </span>
                          )}
                          ) • {result.elapsedMs} ms
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-tertiary px-5 text-sm font-bold text-on-tertiary shadow-sm hover:bg-tertiary-container"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download .{result.extension}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
              <div className="space-y-5">
                <h2 className="font-display text-base font-bold text-on-surface">
                  Resize &amp; Compression Controls
                </h2>

                {/* Resize Mode Switch */}
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-container-low p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setResizeMode('pixels');
                      clearOutputPreview();
                    }}
                    className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors ${
                      resizeMode === 'pixels'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Exact Pixels
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResizeMode('percent');
                      clearOutputPreview();
                    }}
                    className={`min-h-[40px] rounded-lg text-xs font-bold transition-colors ${
                      resizeMode === 'percent'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Percentage Scale
                  </button>
                </div>

                {resizeMode === 'pixels' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="resize-width-px"
                          className="block text-xs font-semibold text-on-surface-variant"
                        >
                          Width (px)
                        </label>
                        <input
                          id="resize-width-px"
                          type="number"
                          min={1}
                          max={PDF_LIMITS.IMAGE_MAX_DIMENSION_PX}
                          value={widthInput}
                          onChange={(e) => handleWidthChange(e.target.value)}
                          className="mt-1 min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 font-mono text-sm font-semibold text-on-surface tabular-nums focus:border-primary focus:bg-surface-container-lowest"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="resize-height-px"
                          className="block text-xs font-semibold text-on-surface-variant"
                        >
                          Height (px)
                        </label>
                        <input
                          id="resize-height-px"
                          type="number"
                          min={1}
                          max={PDF_LIMITS.IMAGE_MAX_DIMENSION_PX}
                          value={heightInput}
                          onChange={(e) => handleHeightChange(e.target.value)}
                          className="mt-1 min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 font-mono text-sm font-semibold text-on-surface tabular-nums focus:border-primary focus:bg-surface-container-lowest"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLockAspectRatio((prev) => !prev)}
                      aria-pressed={lockAspectRatio}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-low/60 px-3 text-xs font-semibold text-on-surface hover:bg-surface-container"
                    >
                      {lockAspectRatio ? (
                        <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
                      ) : (
                        <Unlock className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
                      )}
                      {lockAspectRatio ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                      <label htmlFor="resize-scale-percent">Scale Percentage</label>
                      <span className="font-mono font-bold text-primary tabular-nums">
                        {scalePercent}%
                      </span>
                    </div>
                    <input
                      id="resize-scale-percent"
                      type="range"
                      min={10}
                      max={preventUpscaling ? 100 : 200}
                      value={preventUpscaling ? Math.min(100, scalePercent) : scalePercent}
                      onChange={(e) => {
                        setScalePercent(Number.parseInt(e.target.value, 10));
                        clearOutputPreview();
                      }}
                      className="mt-2 h-2 w-full cursor-pointer accent-primary"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setScalePercent(pct);
                            clearOutputPreview();
                          }}
                          className={`min-h-[36px] rounded-lg px-2.5 font-mono text-xs font-semibold ${
                            scalePercent === pct
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3 py-2 text-xs font-medium text-on-surface">
                  <input
                    type="checkbox"
                    checked={preventUpscaling}
                    onChange={(e) => {
                      setPreventUpscaling(e.target.checked);
                      if (e.target.checked && scalePercent > 100) setScalePercent(100);
                      clearOutputPreview();
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Prevent upscaling beyond {source.width}×{source.height} px</span>
                </label>

                {targetDims && (
                  <div className="rounded-xl bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface-variant tabular-nums">
                    Output dimensions:{' '}
                    <strong className="font-mono text-on-surface">
                      {targetDims.width} × {targetDims.height} px
                    </strong>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="resize-output-format"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Output Format
                  </label>
                  <select
                    id="resize-output-format"
                    value={outputMime}
                    onChange={(e) => {
                      setOutputMime(e.target.value as OutputImageMime);
                      clearOutputPreview();
                    }}
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-medium text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                  >
                    <option value="image/jpeg">JPEG (.jpg) — Best for photos</option>
                    <option value="image/webp">WebP (.webp) — Smallest modern web size</option>
                    <option value="image/png">PNG (.png) — Lossless / transparency</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                    <label htmlFor="resize-quality-slider">Compression Quality</label>
                    <span className="font-mono font-bold text-primary tabular-nums">
                      {outputMime === 'image/png' ? 'Lossless' : `${qualityPercent}%`}
                    </span>
                  </div>
                  <input
                    id="resize-quality-slider"
                    type="range"
                    min={1}
                    max={100}
                    value={qualityPercent}
                    disabled={outputMime === 'image/png'}
                    onChange={(e) => {
                      setQualityPercent(Number.parseInt(e.target.value, 10));
                      clearOutputPreview();
                    }}
                    className="mt-2 h-2 w-full cursor-pointer accent-primary disabled:opacity-40"
                  />
                  {outputMime === 'image/png' && (
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      PNG is lossless, so quality applies only to JPG and WebP. Reduce dimensions or
                      export to WebP/JPG for smaller file sizes.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleProcess()}
                disabled={isProcessing}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-on-primary shadow-sm hover:opacity-95 disabled:opacity-45"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Processing Locally…
                  </>
                ) : (
                  <>
                    <ImageDown className="h-4 w-4" aria-hidden="true" />
                    Process Image
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-error/30 bg-error-container/50 p-4 text-sm text-on-error-container"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
            <div>
              <p className="font-bold">Image Validation or Processing Error</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}

/**
 * Pure PDF execution core (lazy-loads pdf-lib and fflate on demand).
 * Runs inside the dedicated Web Worker (`pdfWorker.ts`) in browsers, and can also be
 * invoked directly in environments where Worker is unavailable (such as automated tests).
 */

import type { ParsedPageRangeGroup } from './pdfValidation';

export interface PdfPageInfo {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  orientation: 'portrait' | 'landscape';
}

export interface InspectedPdfResult {
  pageCount: number;
  pages: PdfPageInfo[];
}

export interface MergePdfInputItem {
  name: string;
  bytes: Uint8Array;
}

export interface MergePdfOptions {
  normalizePortrait?: boolean;
}

export interface MergePdfOutput {
  bytes: Uint8Array;
  pageCount: number;
  elapsedMs: number;
}

export type SplitExportMode = 'single-pdf' | 'separate-ranges-zip' | 'every-page-zip';

export interface SplitPdfOutput {
  bytes: Uint8Array;
  mimeType: 'application/pdf' | 'application/zip';
  isZip: boolean;
  outputFileCount: number;
  extractedPageCount: number;
  elapsedMs: number;
}

export interface ImageToPdfItem {
  name: string;
  format: 'jpeg' | 'png';
  bytes: Uint8Array;
}

export type PdfPageSizePreset = 'a4' | 'letter' | 'fit';
export type PdfOrientationPreset = 'auto' | 'portrait' | 'landscape';
export type PdfMarginPreset = 'none' | 'small' | 'standard';

export interface ImagesToPdfOptions {
  pageSize: PdfPageSizePreset;
  orientation: PdfOrientationPreset;
  margin: PdfMarginPreset;
}

export interface ImagesToPdfOutput {
  bytes: Uint8Array;
  pageCount: number;
  elapsedMs: number;
}

export type ProgressCallback = (percent: number, status: string) => void;

const PAGE_DIMENSIONS_PT: Record<'a4' | 'letter', [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

const MARGIN_PT: Record<PdfMarginPreset, number> = {
  none: 0,
  small: 18,
  standard: 36,
};

function classifyPdfLoadError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/encrypt|password/i.test(msg)) {
    return new Error(
      'This PDF is password-protected or encrypted. Unlock the PDF in your viewer and try again.'
    );
  }
  return new Error(
    'This file could not be read as a valid PDF. Verify the file is not corrupted and try again.'
  );
}

export async function inspectPdfBytes(bytes: Uint8Array): Promise<InspectedPdfResult> {
  const { PDFDocument } = await import('pdf-lib');
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    const count = doc.getPageCount();
    const pages: PdfPageInfo[] = [];
    for (let i = 0; i < count; i++) {
      const page = doc.getPage(i);
      const { width, height } = page.getSize();
      pages.push({
        pageNumber: i + 1,
        widthPt: Math.round(width),
        heightPt: Math.round(height),
        orientation: width > height ? 'landscape' : 'portrait',
      });
    }
    return { pageCount: count, pages };
  } catch (err) {
    throw classifyPdfLoadError(err);
  }
}

export async function executeMergePdfs(
  items: MergePdfInputItem[],
  options: MergePdfOptions = {},
  onProgress?: ProgressCallback
): Promise<MergePdfOutput> {
  const started = performance.now();
  const { PDFDocument, degrees } = await import('pdf-lib');

  onProgress?.(5, 'Initializing local PDF engine...');
  const mergedDoc = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const pct = Math.round(10 + (i / items.length) * 75);
    onProgress?.(pct, `Processing document ${i + 1} of ${items.length}...`);

    let srcDoc;
    try {
      srcDoc = await PDFDocument.load(item.bytes, { ignoreEncryption: false });
    } catch (err) {
      const classified = classifyPdfLoadError(err);
      throw new Error(`Document #${i + 1}: ${classified.message}`);
    }

    const indices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, indices);

    for (const page of copiedPages) {
      if (options.normalizePortrait) {
        const { width, height } = page.getSize();
        if (width > height) {
          const currentRot = page.getRotation().angle;
          page.setRotation(degrees((currentRot + 90) % 360));
        }
      }
      mergedDoc.addPage(page);
      totalPages++;
    }
  }

  onProgress?.(92, 'Serializing merged PDF bytes...');
  const outputBytes = await mergedDoc.save();
  onProgress?.(100, 'Merge complete.');

  return {
    bytes: outputBytes,
    pageCount: totalPages,
    elapsedMs: Math.max(1, Math.round(performance.now() - started)),
  };
}

export async function executeSplitPdf(
  sourceBytes: Uint8Array,
  baseFilename: string,
  groups: ParsedPageRangeGroup[],
  orderedPages: number[],
  mode: SplitExportMode,
  onProgress?: ProgressCallback
): Promise<SplitPdfOutput> {
  const started = performance.now();
  const { PDFDocument } = await import('pdf-lib');

  onProgress?.(10, 'Loading PDF document into local memory...');
  let srcDoc;
  try {
    srcDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: false });
  } catch (err) {
    throw classifyPdfLoadError(err);
  }

  const totalSourcePages = srcDoc.getPageCount();

  if (mode === 'single-pdf') {
    onProgress?.(40, `Extracting ${orderedPages.length} selected pages...`);
    const outDoc = await PDFDocument.create();
    const zeroBased = orderedPages.map((p) => p - 1);
    const copied = await outDoc.copyPages(srcDoc, zeroBased);
    for (const p of copied) {
      outDoc.addPage(p);
    }
    onProgress?.(88, 'Finalizing extracted PDF...');
    const bytes = await outDoc.save();
    onProgress?.(100, 'Split complete.');
    return {
      bytes,
      mimeType: 'application/pdf',
      isZip: false,
      outputFileCount: 1,
      extractedPageCount: orderedPages.length,
      elapsedMs: Math.max(1, Math.round(performance.now() - started)),
    };
  }

  // Multi-PDF ZIP output
  const { zipSync } = await import('fflate');
  const zipEntries: Record<string, Uint8Array> = {};
  const safeBase = baseFilename.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'document';

  const units: { fileName: string; pages: number[] }[] =
    mode === 'every-page-zip'
      ? Array.from({ length: totalSourcePages }, (_, idx) => ({
          fileName: `${safeBase}_page_${String(idx + 1).padStart(3, '0')}.pdf`,
          pages: [idx + 1],
        }))
      : groups.map((g, idx) => ({
          fileName: `${safeBase}_${String(idx + 1).padStart(2, '0')}_${g.label}.pdf`,
          pages: g.pages,
        }));

  let extractedCount = 0;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const pct = Math.round(15 + (i / units.length) * 70);
    onProgress?.(pct, `Building PDF ${i + 1} of ${units.length}...`);

    const subDoc = await PDFDocument.create();
    const copied = await subDoc.copyPages(
      srcDoc,
      unit.pages.map((p) => p - 1)
    );
    for (const p of copied) {
      subDoc.addPage(p);
      extractedCount++;
    }
    zipEntries[unit.fileName] = await subDoc.save();
  }

  onProgress?.(92, 'Packaging PDFs into ZIP archive...');
  const zipBytes = zipSync(zipEntries, { level: 0 });
  onProgress?.(100, 'ZIP archive ready.');

  return {
    bytes: zipBytes,
    mimeType: 'application/zip',
    isZip: true,
    outputFileCount: units.length,
    extractedPageCount: extractedCount,
    elapsedMs: Math.max(1, Math.round(performance.now() - started)),
  };
}

export async function executeImagesToPdf(
  items: ImageToPdfItem[],
  options: ImagesToPdfOptions,
  onProgress?: ProgressCallback
): Promise<ImagesToPdfOutput> {
  const started = performance.now();
  const { PDFDocument } = await import('pdf-lib');

  onProgress?.(5, 'Initializing local PDF builder...');
  const pdfDoc = await PDFDocument.create();
  const margin = MARGIN_PT[options.margin];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const pct = Math.round(10 + (i / items.length) * 78);
    onProgress?.(pct, `Embedding image ${i + 1} of ${items.length}...`);

    const embedded =
      item.format === 'jpeg'
        ? await pdfDoc.embedJpg(item.bytes)
        : await pdfDoc.embedPng(item.bytes);

    const imgW = embedded.width;
    const imgH = embedded.height;

    let pageW: number;
    let pageH: number;

    if (options.pageSize === 'fit') {
      pageW = imgW + margin * 2;
      pageH = imgH + margin * 2;
    } else {
      const [baseW, baseH] = PAGE_DIMENSIONS_PT[options.pageSize];
      const useLandscape =
        options.orientation === 'landscape' ||
        (options.orientation === 'auto' && imgW > imgH);
      pageW = useLandscape ? baseH : baseW;
      pageH = useLandscape ? baseW : baseH;
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    const availW = Math.max(1, pageW - margin * 2);
    const availH = Math.max(1, pageH - margin * 2);

    const scale = Math.min(availW / imgW, availH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    page.drawImage(embedded, {
      x,
      y,
      width: drawW,
      height: drawH,
    });
  }

  onProgress?.(94, 'Finalizing PDF document...');
  const bytes = await pdfDoc.save();
  onProgress?.(100, 'PDF created.');

  return {
    bytes,
    pageCount: items.length,
    elapsedMs: Math.max(1, Math.round(performance.now() - started)),
  };
}

/**
 * Client-side Image Resize & Compression Engine (JPG, PNG, WebP).
 * Uses HTML5 Canvas / OffscreenCanvas strictly inside browser memory.
 */

import { PDF_LIMITS } from './pdfValidation';

export type OutputImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ResizeCalculationOptions {
  originalWidth: number;
  originalHeight: number;
  mode: 'pixels' | 'percent';
  targetWidth?: number;
  targetHeight?: number;
  scalePercent?: number;
  lockAspectRatio: boolean;
  preventUpscaling: boolean;
}

export interface ProcessedImageResult {
  blob: Blob;
  width: number;
  height: number;
  mimeType: OutputImageMime;
  extension: string;
  originalBytes: number;
  outputBytes: number;
  savedBytes: number;
  savedPercent: number;
  elapsedMs: number;
}

export const MIME_TO_EXTENSION: Record<OutputImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Computes exact, bounded output pixel dimensions while honoring aspect ratio lock
 * and upscale prevention. Pure function suitable for automated testing.
 */
export function computeTargetDimensions(opts: ResizeCalculationOptions): ImageDimensions {
  const origW = Math.max(1, Math.round(opts.originalWidth));
  const origH = Math.max(1, Math.round(opts.originalHeight));

  let width = origW;
  let height = origH;

  if (opts.mode === 'percent') {
    const pct = Math.max(1, Math.min(400, opts.scalePercent ?? 100));
    const effectivePct = opts.preventUpscaling ? Math.min(100, pct) : pct;
    width = Math.max(1, Math.round((origW * effectivePct) / 100));
    height = Math.max(1, Math.round((origH * effectivePct) / 100));
  } else {
    const rawW = opts.targetWidth && opts.targetWidth > 0 ? Math.round(opts.targetWidth) : origW;
    const rawH = opts.targetHeight && opts.targetHeight > 0 ? Math.round(opts.targetHeight) : origH;

    if (opts.lockAspectRatio) {
      // Scale proportionally from width unless width unchanged and height changed
      if (rawW !== origW) {
        width = rawW;
        height = Math.max(1, Math.round((rawW / origW) * origH));
      } else if (rawH !== origH) {
        height = rawH;
        width = Math.max(1, Math.round((rawH / origH) * origW));
      } else {
        width = origW;
        height = origH;
      }
    } else {
      width = rawW;
      height = rawH;
    }

    if (opts.preventUpscaling) {
      if (opts.lockAspectRatio) {
        const downScale = Math.min(1, origW / width, origH / height);
        width = Math.max(1, Math.round(width * downScale));
        height = Math.max(1, Math.round(height * downScale));
      } else {
        width = Math.min(width, origW);
        height = Math.min(height, origH);
      }
    }
  }

  // Enforce browser canvas safety cap
  const maxDim = PDF_LIMITS.IMAGE_MAX_DIMENSION_PX;
  if (width > maxDim || height > maxDim) {
    const capScale = Math.min(maxDim / width, maxDim / height);
    width = Math.max(1, Math.round(width * capScale));
    height = Math.max(1, Math.round(height * capScale));
  }

  return { width, height };
}

export async function readImageDimensions(file: Blob): Promise<ImageDimensions> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode this image in the browser.'));
    };
    img.src = url;
  });
}

export async function processImageLocally(params: {
  file: Blob;
  targetWidth: number;
  targetHeight: number;
  outputMime: OutputImageMime;
  qualityPercent: number; // 1 - 100
}): Promise<ProcessedImageResult> {
  const started = performance.now();
  const { file, targetWidth, targetHeight, outputMime } = params;
  const clampedQuality = Math.min(100, Math.max(1, Math.round(params.qualityPercent))) / 100;

  let blob: Blob | null = null;

  if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Browser 2D canvas context unavailable.');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (outputMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      blob = await canvas.convertToBlob({
        type: outputMime,
        quality: outputMime === 'image/png' ? undefined : clampedQuality,
      });
    } finally {
      bitmap.close();
    }
  } else {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Could not decode image file.'));
        el.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Browser 2D canvas context unavailable.');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (outputMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(
          resolve,
          outputMime,
          outputMime === 'image/png' ? undefined : clampedQuality
        )
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (!blob) {
    throw new Error('Image encoding failed in this browser. Try JPG or PNG output.');
  }

  const originalBytes = file.size;
  const outputBytes = blob.size;
  const savedBytes = originalBytes - outputBytes;
  const savedPercent = originalBytes > 0 ? (savedBytes / originalBytes) * 100 : 0;

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    mimeType: outputMime,
    extension: MIME_TO_EXTENSION[outputMime],
    originalBytes,
    outputBytes,
    savedBytes,
    savedPercent,
    elapsedMs: Math.max(1, Math.round(performance.now() - started)),
  };
}

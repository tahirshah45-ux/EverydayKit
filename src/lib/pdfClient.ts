/**
 * Client facade for running PDF operations in a lazy-initialized Web Worker,
 * with automatic fallback to lazy-loaded in-thread execution when Worker is unavailable.
 */

import {
  executeImagesToPdf,
  executeMergePdfs,
  executeSplitPdf,
  inspectPdfBytes,
  type ImageToPdfItem,
  type ImagesToPdfOptions,
  type ImagesToPdfOutput,
  type InspectedPdfResult,
  type MergePdfInputItem,
  type MergePdfOptions,
  type MergePdfOutput,
  type ProgressCallback,
  type SplitExportMode,
  type SplitPdfOutput,
} from './pdfCore';
import type { ParsedPageRangeGroup } from './pdfValidation';

let sharedWorker: Worker | null = null;
let workerUnavailable = false;
let reqCounter = 0;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  onProgress?: ProgressCallback;
}

const pending = new Map<string, PendingRequest>();

function getWorker(): Worker | null {
  if (workerUnavailable || typeof Worker === 'undefined') return null;
  if (sharedWorker) return sharedWorker;

  try {
    sharedWorker = new Worker(new URL('../workers/pdfWorker.ts', import.meta.url), {
      type: 'module',
    });

    sharedWorker.onmessage = (event: MessageEvent) => {
      const msg = event.data as {
        id: string;
        kind: 'progress' | 'success' | 'error';
        percent?: number;
        status?: string;
        result?: unknown;
        error?: string;
      };
      const entry = pending.get(msg.id);
      if (!entry) return;

      if (msg.kind === 'progress') {
        entry.onProgress?.(msg.percent ?? 0, msg.status ?? '');
      } else if (msg.kind === 'success') {
        pending.delete(msg.id);
        entry.resolve(msg.result);
      } else if (msg.kind === 'error') {
        pending.delete(msg.id);
        entry.reject(new Error(msg.error || 'PDF operation failed.'));
      }
    };

    sharedWorker.onerror = () => {
      workerUnavailable = true;
      sharedWorker?.terminate();
      sharedWorker = null;
      pending.forEach((entry) => entry.reject(new Error('WORKER_FALLBACK')));
      pending.clear();
    };

    return sharedWorker;
  } catch {
    workerUnavailable = true;
    return null;
  }
}

function dispatchWorker<T>(
  payload: Record<string, unknown>,
  onProgress?: ProgressCallback
): Promise<T> {
  const worker = getWorker();
  if (!worker) {
    return Promise.reject(new Error('WORKER_FALLBACK'));
  }

  const id = `pdf-req-${++reqCounter}`;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (val) => resolve(val as T),
      reject,
      onProgress,
    });
    worker.postMessage({ id, ...payload });
  });
}

export async function inspectPdf(bytes: Uint8Array): Promise<InspectedPdfResult> {
  try {
    return await dispatchWorker<InspectedPdfResult>({ type: 'inspect', bytes });
  } catch (err) {
    if (err instanceof Error && err.message === 'WORKER_FALLBACK') {
      return inspectPdfBytes(bytes);
    }
    throw err;
  }
}

export async function mergePdfs(
  items: MergePdfInputItem[],
  options: MergePdfOptions,
  onProgress?: ProgressCallback
): Promise<MergePdfOutput> {
  try {
    return await dispatchWorker<MergePdfOutput>({ type: 'merge', items, options }, onProgress);
  } catch (err) {
    if (err instanceof Error && err.message === 'WORKER_FALLBACK') {
      return executeMergePdfs(items, options, onProgress);
    }
    throw err;
  }
}

export async function splitPdf(
  sourceBytes: Uint8Array,
  baseFilename: string,
  groups: ParsedPageRangeGroup[],
  orderedPages: number[],
  mode: SplitExportMode,
  onProgress?: ProgressCallback
): Promise<SplitPdfOutput> {
  try {
    return await dispatchWorker<SplitPdfOutput>(
      { type: 'split', sourceBytes, baseFilename, groups, orderedPages, mode },
      onProgress
    );
  } catch (err) {
    if (err instanceof Error && err.message === 'WORKER_FALLBACK') {
      return executeSplitPdf(sourceBytes, baseFilename, groups, orderedPages, mode, onProgress);
    }
    throw err;
  }
}

export async function imagesToPdf(
  items: ImageToPdfItem[],
  options: ImagesToPdfOptions,
  onProgress?: ProgressCallback
): Promise<ImagesToPdfOutput> {
  try {
    return await dispatchWorker<ImagesToPdfOutput>(
      { type: 'images-to-pdf', items, options },
      onProgress
    );
  } catch (err) {
    if (err instanceof Error && err.message === 'WORKER_FALLBACK') {
      return executeImagesToPdf(items, options, onProgress);
    }
    throw err;
  }
}

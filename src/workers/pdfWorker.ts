/**
 * Dedicated Web Worker for heavy PDF operations (inspect, merge, split, images-to-pdf).
 * Keeps the main UI thread responsive while processing files up to 50 MB locally.
 */

import {
  executeImagesToPdf,
  executeMergePdfs,
  executeSplitPdf,
  inspectPdfBytes,
  type ImageToPdfItem,
  type ImagesToPdfOptions,
  type MergePdfInputItem,
  type MergePdfOptions,
  type SplitExportMode,
} from '../lib/pdfCore';
import type { ParsedPageRangeGroup } from '../lib/pdfValidation';

type WorkerRequest =
  | { id: string; type: 'inspect'; bytes: Uint8Array }
  | { id: string; type: 'merge'; items: MergePdfInputItem[]; options: MergePdfOptions }
  | {
      id: string;
      type: 'split';
      sourceBytes: Uint8Array;
      baseFilename: string;
      groups: ParsedPageRangeGroup[];
      orderedPages: number[];
      mode: SplitExportMode;
    }
  | { id: string; type: 'images-to-pdf'; items: ImageToPdfItem[]; options: ImagesToPdfOptions };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  const sendProgress = (percent: number, status: string) => {
    self.postMessage({ id: req.id, kind: 'progress', percent, status });
  };

  try {
    if (req.type === 'inspect') {
      const result = await inspectPdfBytes(req.bytes);
      self.postMessage({ id: req.id, kind: 'success', result });
      return;
    }

    if (req.type === 'merge') {
      const result = await executeMergePdfs(req.items, req.options, sendProgress);
      self.postMessage(
        { id: req.id, kind: 'success', result },
        { transfer: [result.bytes.buffer] }
      );
      return;
    }

    if (req.type === 'split') {
      const result = await executeSplitPdf(
        req.sourceBytes,
        req.baseFilename,
        req.groups,
        req.orderedPages,
        req.mode,
        sendProgress
      );
      self.postMessage(
        { id: req.id, kind: 'success', result },
        { transfer: [result.bytes.buffer] }
      );
      return;
    }

    if (req.type === 'images-to-pdf') {
      const result = await executeImagesToPdf(req.items, req.options, sendProgress);
      self.postMessage(
        { id: req.id, kind: 'success', result },
        { transfer: [result.bytes.buffer] }
      );
      return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PDF processing failed.';
    self.postMessage({ id: req.id, kind: 'error', error: message });
  }
};

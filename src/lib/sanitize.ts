/**
 * Filename, metadata, and binary header sanitization/validation helpers.
 * All validation executes strictly in browser memory.
 */

export const MAX_DISPLAY_NAME_LENGTH = 120;

/**
 * Strips control characters, bidi overrides, and unsafe path separators
 * before displaying user-supplied filenames or metadata in the UI.
 */
export function sanitizeDisplayText(input: string, maxLength = MAX_DISPLAY_NAME_LENGTH): string {
  if (!input) return 'untitled';
  const cleaned = input
    // Remove ASCII control chars, DEL, and Unicode bidi override chars
    .replace(/[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[<>]/g, '')
    .trim();
  if (!cleaned) return 'untitled';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1)}…`;
}

/**
 * Produces a safe, cross-platform download filename with a guaranteed extension.
 */
export function sanitizeDownloadFilename(rawName: string, requiredExt: string): string {
  const normalizedExt = requiredExt.startsWith('.') ? requiredExt.toLowerCase() : `.${requiredExt.toLowerCase()}`;
  const stripped = (rawName || 'everydaykit-output')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^\.+/, '')
    .trim();

  const withoutExt = stripped.toLowerCase().endsWith(normalizedExt)
    ? stripped.slice(0, -normalizedExt.length)
    : stripped.replace(/\.[a-z0-9]{1,6}$/i, '');

  const base = (withoutExt || 'everydaykit-output').slice(0, 90);
  return `${base}${normalizedExt}`;
}

export function stripFileExtension(filename: string): string {
  const clean = sanitizeDisplayText(filename, 100);
  return clean.replace(/\.[^.]+$/, '') || 'file';
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 2 : 1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/**
 * Inspects leading file bytes (magic numbers) to confirm true format before parsing.
 */
export async function readFileHeaderBytes(file: Blob, length = 16): Promise<Uint8Array> {
  const slice = file.slice(0, length);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

export function hasPdfMagicBytes(bytes: Uint8Array): boolean {
  // Check for "%PDF-" anywhere in the first 1024 bytes (per PDF spec)
  const limit = Math.min(bytes.length - 4, 1020);
  for (let i = 0; i <= limit; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return true;
    }
  }
  return false;
}

export type DetectedImageFormat = 'jpeg' | 'png' | 'webp' | null;

export function detectImageMagicFormat(bytes: Uint8Array): DetectedImageFormat {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return 'webp';
  }
  return null;
}

/**
 * Triggers an immediate client-side Blob download and revokes the temporary object URL.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke asynchronously so browser download manager finishes reading handle
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 4000);
}

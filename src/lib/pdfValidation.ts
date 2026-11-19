/**
 * Exact limits and deterministic validation rules for PDF and image-to-PDF tools.
 */

export const PDF_LIMITS = {
  MERGE_MIN_FILES: 2,
  MERGE_MAX_FILES: 20,
  MERGE_MAX_TOTAL_BYTES: 50 * 1024 * 1024, // 50 MB
  SPLIT_MAX_FILE_BYTES: 50 * 1024 * 1024, // 50 MB
  IMAGES_TO_PDF_MAX_FILES: 50,
  IMAGES_TO_PDF_MAX_TOTAL_BYTES: 50 * 1024 * 1024, // 50 MB
  IMAGE_COMPRESS_MAX_BYTES: 25 * 1024 * 1024, // 25 MB
  IMAGE_MAX_DIMENSION_PX: 10000,
} as const;

export interface ParsedPageRangeGroup {
  label: string;
  pages: number[]; // 1-based page numbers
}

export interface PageRangeParseResult {
  valid: boolean;
  error?: string;
  groups: ParsedPageRangeGroup[];
  uniquePages: number[]; // sorted 1-based unique pages
  orderedPages: number[]; // pages in user-requested order (deduplicated across sequence)
}

/**
 * Parses range expressions like "1-4, 8, 15-20" against a known total page count.
 * Rejects non-numeric tokens, page numbers < 1, page numbers > totalPages, and reversed spans like "10-5".
 */
export function parsePageRanges(input: string, totalPages: number): PageRangeParseResult {
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    return {
      valid: false,
      error: 'Load a valid PDF with at least 1 page before entering page ranges.',
      groups: [],
      uniquePages: [],
      orderedPages: [],
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Enter at least one page number or range (for example: 1-3, 5, 8-10).',
      groups: [],
      uniquePages: [],
      orderedPages: [],
    };
  }

  const rawTokens = trimmed.split(',').map((t) => t.trim());
  const groups: ParsedPageRangeGroup[] = [];
  const seen = new Set<number>();
  const orderedPages: number[] = [];

  for (const token of rawTokens) {
    if (!token) {
      return {
        valid: false,
        error: 'Remove empty commas from your page range (for example: use "1-3, 5" instead of "1-3, , 5").',
        groups: [],
        uniquePages: [],
        orderedPages: [],
      };
    }

    if (/^\d+$/.test(token)) {
      const page = Number.parseInt(token, 10);
      if (page < 1 || page > totalPages) {
        return {
          valid: false,
          error: `Page ${page} is out of bounds. Enter page numbers between 1 and ${totalPages}.`,
          groups: [],
          uniquePages: [],
          orderedPages: [],
        };
      }
      groups.push({ label: `p${page}`, pages: [page] });
      if (!seen.has(page)) {
        seen.add(page);
        orderedPages.push(page);
      }
      continue;
    }

    const spanMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (spanMatch) {
      const start = Number.parseInt(spanMatch[1], 10);
      const end = Number.parseInt(spanMatch[2], 10);
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        return {
          valid: false,
          error: `Range "${token}" exceeds document bounds. Enter page numbers between 1 and ${totalPages}.`,
          groups: [],
          uniquePages: [],
          orderedPages: [],
        };
      }
      if (start > end) {
        return {
          valid: false,
          error: `Range "${token}" is reversed. Place the smaller page number first (for example: ${end}-${start}).`,
          groups: [],
          uniquePages: [],
          orderedPages: [],
        };
      }
      const pages: number[] = [];
      for (let p = start; p <= end; p++) {
        pages.push(p);
        if (!seen.has(p)) {
          seen.add(p);
          orderedPages.push(p);
        }
      }
      groups.push({ label: start === end ? `p${start}` : `p${start}-${end}`, pages });
      continue;
    }

    return {
      valid: false,
      error: `Invalid range syntax "${token}". Use numbers, hyphens, and commas only (for example: 1-4, 8, 12-15).`,
      groups: [],
      uniquePages: [],
      orderedPages: [],
    };
  }

  const uniquePages = Array.from(seen).sort((a, b) => a - b);
  return {
    valid: true,
    groups,
    uniquePages,
    orderedPages,
  };
}

/**
 * Formats a sorted set of 1-based page numbers into a compact range string (e.g. "1-4, 8, 15-20").
 */
export function formatPagesToRangeString(pages: number[]): string {
  const sorted = Array.from(new Set(pages)).filter((p) => p >= 1).sort((a, b) => a - b);
  if (sorted.length === 0) return '';

  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      parts.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = curr;
      prev = curr;
    }
  }
  parts.push(start === prev ? `${start}` : `${start}-${prev}`);
  return parts.join(', ');
}

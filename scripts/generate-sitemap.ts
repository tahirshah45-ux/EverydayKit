/**
 * Generates `public/sitemap.xml` from the authoritative routes defined in `src/App.tsx`
 * and cross-checks them against `TOOLS_CATALOG` in `src/lib/toolsCatalog.ts`.
 *
 * Usage:
 *   npx tsx scripts/generate-sitemap.ts
 *   APP_URL=https://everydaykit.app npx tsx scripts/generate-sitemap.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS_CATALOG } from '../src/lib/toolsCatalog.ts';

export interface SitemapRouteEntry {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
  lastmod: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const APP_TSX_PATH = path.join(ROOT_DIR, 'src', 'App.tsx');
const OUTPUT_SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');

const DEFAULT_BASE_URL = 'https://everydaykit.app';

const ROUTE_METADATA: Record<
  string,
  { changefreq: SitemapRouteEntry['changefreq']; priority: string }
> = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/tools': { changefreq: 'weekly', priority: '0.9' },
  '/about': { changefreq: 'monthly', priority: '0.6' },
  '/privacy': { changefreq: 'monthly', priority: '0.7' },
  '/contact': { changefreq: 'monthly', priority: '0.5' },
  '/accessibility': { changefreq: 'monthly', priority: '0.6' },
};

function normalizeBaseUrl(rawUrl?: string): string {
  const candidate = (rawUrl || DEFAULT_BASE_URL).trim();
  if (!candidate || candidate === 'MY_APP_URL') {
    return DEFAULT_BASE_URL;
  }
  return candidate.replace(/\/+$/, '');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extracts all indexable `<Route path="..." />` paths directly from `src/App.tsx`,
 * excluding wildcard (`*`) and dynamic parameter (`:param`) routes, and verifies
 * that every tool route from `TOOLS_CATALOG` is present.
 */
export function extractAppRoutes(appTsxSource: string): string[] {
  const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["']/g;
  const discovered: string[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null = routeRegex.exec(appTsxSource);
  while (match !== null) {
    const routePath = match[1].trim();
    if (
      routePath &&
      routePath !== '*' &&
      !routePath.includes('*') &&
      !routePath.includes(':') &&
      routePath !== '/404'
    ) {
      const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
      if (!seen.has(normalized)) {
        seen.add(normalized);
        discovered.push(normalized);
      }
    }
    match = routeRegex.exec(appTsxSource);
  }

  for (const tool of TOOLS_CATALOG) {
    if (!seen.has(tool.path)) {
      throw new Error(
        `Route mismatch: Tool route "${tool.path}" from TOOLS_CATALOG is missing in src/App.tsx.`
      );
    }
  }

  return discovered;
}

export function buildSitemapEntries(routes: string[], lastmodDate: string): SitemapRouteEntry[] {
  const toolPaths = new Set(TOOLS_CATALOG.map((t) => t.path));

  return routes.map((routePath) => {
    const explicitMeta = ROUTE_METADATA[routePath];
    if (explicitMeta) {
      return {
        path: routePath,
        changefreq: explicitMeta.changefreq,
        priority: explicitMeta.priority,
        lastmod: lastmodDate,
      };
    }

    if (toolPaths.has(routePath) || routePath.startsWith('/tools/')) {
      return {
        path: routePath,
        changefreq: 'monthly',
        priority: '0.9',
        lastmod: lastmodDate,
      };
    }

    return {
      path: routePath,
      changefreq: 'monthly',
      priority: '0.5',
      lastmod: lastmodDate,
    };
  });
}

export function renderSitemapXml(baseUrl: string, entries: SitemapRouteEntry[]): string {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const urlBlocks = entries.map((entry) => {
    const loc = `${cleanBase}${entry.path === '/' ? '/' : entry.path}`;
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlBlocks,
    '</urlset>',
    '',
  ].join('\n');
}

export function generateSitemapFile(options?: {
  baseUrl?: string;
  lastmodDate?: string;
  outputPath?: string;
}): { outputPath: string; routeCount: number; routes: string[] } {
  const appTsxSource = fs.readFileSync(APP_TSX_PATH, 'utf8');
  const routes = extractAppRoutes(appTsxSource);
  const lastmodDate = options?.lastmodDate ?? new Date().toISOString().slice(0, 10);
  const baseUrl = normalizeBaseUrl(options?.baseUrl ?? process.env.APP_URL);
  const outputPath = options?.outputPath ?? OUTPUT_SITEMAP_PATH;

  const entries = buildSitemapEntries(routes, lastmodDate);
  const xml = renderSitemapXml(baseUrl, entries);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, xml, 'utf8');

  return {
    outputPath,
    routeCount: entries.length,
    routes,
  };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  const result = generateSitemapFile();
  console.log(
    `Generated sitemap with ${result.routeCount} routes at ${path.relative(ROOT_DIR, result.outputPath)}:`
  );
  for (const route of result.routes) {
    console.log(`  - ${route}`);
  }
}

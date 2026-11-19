# EverydayKit v1

EverydayKit is a privacy-first, client-side web utility suite built with React, TypeScript, Vite, and Tailwind CSS. All seven tools execute directly inside the user’s browser with **zero server uploads, zero user accounts, and zero tracking of files or calculator inputs**.

## Included Tools & Routes

| Route | Tool | Client-Side Engine & Limits |
| --- | --- | --- |
| `/` | Home | Searchable overview, privacy summary, audience workflows |
| `/tools` | Tools Directory | Category-filtered directory (`?category=pdf\|images\|calculators`) |
| `/tools/merge-pdf` | Merge PDF Files | Web Worker + `pdf-lib`; 2–20 PDFs, 50 MB combined |
| `/tools/split-pdf` | Split PDF by Page Ranges | Web Worker + `pdf-lib` + `fflate`; ≤50 MB; single PDF or ZIP |
| `/tools/images-to-pdf` | Convert Images to PDF | Web Worker + `pdf-lib`; 1–50 JPG/PNG files, 50 MB combined |
| `/tools/resize-compress-image` | Resize & Compress Images | HTML5 `OffscreenCanvas`/`Canvas`; JPG/PNG/WebP ≤25 MB, ≤10,000 px |
| `/tools/percentage-discount-calculator` | Percentage & Discount Calculator | Discounts, stacked coupons, sales tax, Δ%, basic %, margin/markup |
| `/tools/unit-converter` | Unit Converter | Length, Weight, Temperature, Volume (NIST SP 811 constants) |
| `/tools/date-calculator` | Date Calculator | Days between dates, add/subtract calendar or Mon–Fri business days |
| `/about`, `/privacy`, `/contact`, `/accessibility` | Info & Trust Pages | Mission, zero-upload privacy policy, local report builder, WCAG 2.2 AA |

## Local Setup & Development

```bash
npm install
npm run dev
```

The development server listens on `http://localhost:3000`.

## Production Build & Type Check

```bash
npm run lint
npm run build
npm run preview
```

Static production assets are emitted to `dist/`. Because EverydayKit uses client-side routing (`BrowserRouter`), configure your static host (Cloudflare Pages, Vercel, Netlify, NGINX, or Cloud Run) to rewrite unknown paths to `/index.html` while serving `/robots.txt` and `/sitemap.xml` directly.

## Deployment & Rollback

1. Build and verify locally (`npm run lint && npm run build`).
2. Deploy `dist/` to your static CDN/hosting provider.
3. Update canonical domain references in `public/sitemap.xml` and `public/robots.txt` if hosting on a custom domain other than `https://everydaykit.app`.
4. **Rollback:** Because EverydayKit is a stateless static frontend with no database schema migrations, rolling back simply redeploys the previous release tag or restores the previous CDN deployment snapshot.

## Recommended Security Headers (CSP)

When no ad provider is enabled (default), serve the following strict headers from your CDN or reverse proxy:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data:; worker-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

## Isolated Ad-Slot Configuration (Disabled by Default)

EverydayKit separates all advertising logic inside `src/lib/adProvider.ts` and `src/components/AdSlot.tsx`.

- **Default state:** Disabled. No ad scripts, fake ads, placeholder ad boxes, or simulated rewarded flows render unless real environment variables are supplied.
- **Supported placements:** `home-below-hero`, `directory-between-groups`, `tool-sidebar-desktop` (desktop only), and `tool-below-result`.
- **Automatic suppression:** Ad slots are suppressed during active file processing, error states, empty file states, and modal dialogs.
- **Privacy boundary:** Ad components never receive filenames, file bytes, calculator inputs, or dates.

To enable a verified provider in production:
1. Set `VITE_AD_PROVIDER` (`adsense` or `gam`), `VITE_AD_CLIENT_ID`, and the desired `VITE_AD_SLOT_*` variables from `.env.example`.
2. Load the verified provider script tag and extend your Content-Security-Policy strictly to that provider’s documented domains.
3. Implement any required regional consent banner (e.g., GDPR/CCPA CMP) and update `/privacy` before going live.

## Dependency & License Documentation

See [`DEPENDENCIES.md`](./DEPENDENCIES.md) for the exact pinned runtime dependencies, their purposes, and licenses, and [`LICENSE`](./LICENSE) for the MIT license text.

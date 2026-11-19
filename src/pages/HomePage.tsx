import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  FileImage,
  Files,
  GraduationCap,
  ImageDown,
  Lock,
  Percent,
  Scale,
  Scissors,
  Search,
  ShieldCheck,
  Store,
  Terminal,
} from 'lucide-react';
import AdSlot from '../components/AdSlot';
import SeoHead from '../components/SeoHead';
import { TOOLS_CATALOG, type ToolCategory } from '../lib/toolsCatalog';

function renderToolIcon(id: string) {
  switch (id) {
    case 'merge-pdf':
      return <Files className="h-5 w-5" aria-hidden="true" />;
    case 'split-pdf':
      return <Scissors className="h-5 w-5" aria-hidden="true" />;
    case 'images-to-pdf':
      return <FileImage className="h-5 w-5" aria-hidden="true" />;
    case 'resize-compress-image':
      return <ImageDown className="h-5 w-5" aria-hidden="true" />;
    case 'percentage-discount-calculator':
      return <Percent className="h-5 w-5" aria-hidden="true" />;
    case 'unit-converter':
      return <Scale className="h-5 w-5" aria-hidden="true" />;
    case 'date-calculator':
      return <Calendar className="h-5 w-5" aria-hidden="true" />;
    default:
      return <Files className="h-5 w-5" aria-hidden="true" />;
  }
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TOOLS_CATALOG.filter((tool) => {
      const catMatch = selectedCategory === 'all' || tool.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      const hay = `${tool.name} ${tool.summary} ${tool.categoryLabel} ${tool.keywords.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [selectedCategory, searchQuery]);

  return (
    <>
      <SeoHead
        title="EverydayKit — Fast, Private Browser Tools for PDFs, Images & Calculators"
        description="Merge PDFs, split PDFs by page range, convert JPG/PNG to PDF, resize and compress images, calculate discounts, convert units, and compute dates directly in your browser. Zero uploads."
        path="/"
        webApplication={{
          name: 'EverydayKit',
          description:
            'Seven private, client-side PDF, image, and everyday calculator tools that run directly in your web browser with zero server uploads.',
          applicationCategory: 'UtilitiesApplication',
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-outline-variant/25 bg-gradient-to-b from-surface-container-low/70 via-surface to-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="inline-flex items-center gap-2 rounded-lg bg-tertiary-container/12 px-3 py-1.5 text-xs font-bold text-tertiary">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                Zero Uploads • Zero Accounts • 100% Client-Side
              </p>
              <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-on-surface sm:text-5xl sm:leading-[1.1]">
                Fast, private everyday tools that run directly in your browser.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
                Merge or split PDFs, convert photos to PDF, resize and compress images, and run
                exact percentage, unit, and date calculations—without uploading a single file to a
                remote server.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#everyday-tools"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-6 text-sm font-bold text-on-primary shadow-sm hover:opacity-95"
                >
                  Explore 7 Free Tools
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link
                  to="/privacy"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                >
                  <Lock className="h-4 w-4 text-tertiary" aria-hidden="true" />
                  How Local Privacy Works
                </Link>
              </div>
            </div>

            {/* Technical Trust Summary Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-outline-variant/35 bg-surface-container-lowest p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/25 pb-4">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                      Browser-Local Architecture
                    </p>
                    <p className="mt-0.5 font-display text-base font-bold text-on-surface">
                      Verified EverydayKit v1 Suite
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary-container/15 text-tertiary">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-surface-container-low/70 px-3.5 py-2.5">
                    <dt className="text-on-surface-variant">PDF Merge / Split Ceiling</dt>
                    <dd className="font-mono text-xs font-bold text-on-surface">Up to 50 MB local</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-container-low/70 px-3.5 py-2.5">
                    <dt className="text-on-surface-variant">Image Resize &amp; Compress</dt>
                    <dd className="font-mono text-xs font-bold text-on-surface">
                      JPG / PNG / WebP • 25 MB
                    </dd>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-container-low/70 px-3.5 py-2.5">
                    <dt className="text-on-surface-variant">Calculation Standards</dt>
                    <dd className="font-mono text-xs font-bold text-on-surface">
                      NIST SP 811 &amp; UTC ISO
                    </dd>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-tertiary-container/10 px-3.5 py-2.5">
                    <dt className="font-medium text-tertiary">Remote File Uploads</dt>
                    <dd className="font-mono text-xs font-bold text-tertiary">0 bytes</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Home Ad Placement: below hero, above main tools content (disabled unless configured) */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <AdSlot placement="home-below-hero" />
      </div>

      {/* Main Tools Grid */}
      <section
        id="everyday-tools"
        aria-labelledby="home-tools-heading"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="home-tools-heading"
              className="font-display text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl"
            >
              Seven Purpose-Built Browser Utilities
            </h2>
            <p className="mt-1.5 text-sm text-on-surface-variant">
              Every tool opens directly with clear limits, keyboard accessibility, and local
              execution.
            </p>
          </div>

          <Link
            to="/tools"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            Open Full Directory
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Filter tools by category"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                { id: 'all', label: 'All (7)' },
                { id: 'pdf', label: 'PDF Tools (3)' },
                { id: 'images', label: 'Image Tools (1)' },
                { id: 'calculators', label: 'Calculators (3)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={selectedCategory === tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`min-h-[44px] rounded-xl px-4 text-xs font-bold transition-colors sm:text-sm ${
                  selectedCategory === tab.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'border border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
              aria-hidden="true"
            />
            <label htmlFor="home-tool-filter" className="sr-only">
              Filter EverydayKit tools
            </label>
            <input
              id="home-tool-filter"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tools (e.g. PDF, resize, date)…"
              className="min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-2 pr-3 pl-10 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Tool Cards */}
        {visibleTools.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center">
            <p className="font-display text-base font-bold text-on-surface">
              No tools matched “{searchQuery}”
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-4 text-xs font-bold text-on-primary"
            >
              Show All 7 Tools
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleTools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                className="group flex flex-col justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        tool.category === 'images'
                          ? 'bg-tertiary-container/15 text-tertiary'
                          : 'bg-primary-fixed/60 text-primary'
                      }`}
                    >
                      {renderToolIcon(tool.id)}
                    </span>
                    <span className="rounded-md bg-surface-container-low px-2.5 py-1 font-mono text-[11px] font-bold text-on-surface-variant">
                      {tool.categoryLabel}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-on-surface group-hover:text-primary">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    {tool.summary}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-outline-variant/20 pt-4 text-xs">
                  <span className="font-mono text-on-surface-variant">{tool.limits[0]?.value}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-primary">
                    Launch
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Audience Workflows */}
      <section
        aria-labelledby="audience-workflows-heading"
        className="border-t border-outline-variant/25 bg-surface-container-low/60 py-14"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="audience-workflows-heading"
            className="font-display text-2xl font-extrabold tracking-tight text-on-surface"
          >
            Built for Everyday Real-World Workflows
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-display text-base font-bold text-on-surface">
                Students &amp; Researchers
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
                Merge assignment PDFs, extract specific syllabus chapters, convert lecture whiteboard
                photos to PDF, and verify SI unit conversions with NIST formulas.
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <Briefcase className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-display text-base font-bold text-on-surface">
                Freelancers &amp; Consultants
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
                Combine signed contracts and receipts locally without exposing client documents,
                compress web deliverables, and project Net-30/60 business-day invoice deadlines.
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <Store className="h-6 w-6 text-tertiary" aria-hidden="true" />
              <h3 className="mt-3 font-display text-base font-bold text-on-surface">
                Small Businesses &amp; Shoppers
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
                Check stacked retail discounts, sales tax, profit margin vs. markup, and optimize
                product images to WebP or JPG while stripping camera GPS metadata.
              </p>
            </div>
          </div>

          {/* DevTools Verification Callout */}
          <div className="mt-8 rounded-2xl border border-tertiary/30 bg-surface-container-lowest p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary-container/15 text-tertiary">
                  <Terminal className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-on-surface">
                    Verify Zero Uploads Yourself in 10 Seconds
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Open your browser’s <strong>DevTools → Network</strong> tab, select any PDF or
                    image on EverydayKit, and run a merge, split, or resize. You will observe zero
                    outbound requests carrying your files or filenames.
                  </p>
                </div>
              </div>
              <Link
                to="/privacy"
                className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-tertiary px-4 text-xs font-bold text-on-tertiary hover:bg-tertiary-container"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Read Privacy Architecture
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

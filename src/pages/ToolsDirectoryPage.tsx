import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  FileImage,
  Files,
  ImageDown,
  Percent,
  Scale,
  Scissors,
  Search,
  ShieldCheck,
} from 'lucide-react';
import AdSlot from '../components/AdSlot';
import SeoHead from '../components/SeoHead';
import { TOOLS_CATALOG, type ToolCategory, type ToolDefinition } from '../lib/toolsCatalog';

function getIcon(id: string) {
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

function ToolGroupSection({
  title,
  subtitle,
  tools,
}: {
  title: string;
  subtitle: string;
  tools: ToolDefinition[];
}) {
  if (tools.length === 0) return null;

  return (
    <section aria-label={title} className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-extrabold text-on-surface">{title}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.path}
            className="group flex flex-col justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed/60 text-primary">
                  {getIcon(tool.id)}
                </span>
                <span className="font-mono text-[11px] font-bold text-on-surface-variant">
                  {tool.code}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-extrabold text-on-surface group-hover:text-primary">
                {tool.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
                {tool.summary}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-3 text-xs">
              <span className="font-mono text-on-surface-variant">{tool.limits[0]?.value}</span>
              <span className="inline-flex items-center gap-1 font-bold text-primary">
                Open
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ToolsDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCategory = searchParams.get('category');
  const activeCategory: 'all' | ToolCategory =
    rawCategory === 'pdf' || rawCategory === 'images' || rawCategory === 'calculators'
      ? rawCategory
      : 'all';
  const query = searchParams.get('q') ?? '';

  const setCategory = (cat: 'all' | ToolCategory) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'all') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next, { replace: true });
  };

  const setQuery = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (!val.trim()) next.delete('q');
    else next.set('q', val);
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS_CATALOG.filter((tool) => {
      if (activeCategory !== 'all' && tool.category !== activeCategory) return false;
      if (!q) return true;
      const hay = `${tool.name} ${tool.code} ${tool.summary} ${tool.keywords.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [activeCategory, query]);

  const pdfTools = filtered.filter((t) => t.category === 'pdf');
  const imageTools = filtered.filter((t) => t.category === 'images');
  const calcTools = filtered.filter((t) => t.category === 'calculators');

  return (
    <>
      <SeoHead
        title="All EverydayKit Tools — PDF, Image & Calculator Directory"
        description="Browse all 7 local browser tools in EverydayKit: Merge PDF, Split PDF, Images to PDF, Resize & Compress Image, Percentage & Discount Calculator, Unit Converter, and Date Calculator."
        path="/tools"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Tools Directory', path: '/tools' },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-tertiary-container/15 px-3 py-1 text-xs font-bold text-tertiary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            All 7 Utilities Execute Locally in Browser Memory
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            EverydayKit Tools Directory
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant sm:text-base">
            Direct access to every PDF, image, and calculator tool with explicit file limits,
            keyboard support, and zero server uploads.
          </p>
        </header>

        {/* Controls */}
        <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Filter directory by category" className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all', label: 'All Tools (7)' },
                { id: 'pdf', label: 'PDF Suite (3)' },
                { id: 'images', label: 'Image Tools (1)' },
                { id: 'calculators', label: 'Calculators (3)' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                aria-pressed={activeCategory === cat.id}
                onClick={() => setCategory(cat.id)}
                className={`min-h-[44px] rounded-xl px-4 text-xs font-bold transition-colors sm:text-sm ${
                  activeCategory === cat.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
              aria-hidden="true"
            />
            <label htmlFor="directory-search" className="sr-only">
              Search tools directory
            </label>
            <input
              id="directory-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools by keyword…"
              className="min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 py-2 pr-3 pl-10 text-sm text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none"
            />
          </div>
        </div>

        {/* Grouped Tools + AdSlot between category groups */}
        <div className="mt-10 space-y-10">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center">
              <p className="font-display text-base font-bold text-on-surface">
                No tools found matching your filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategory('all');
                  setQuery('');
                }}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-4 text-xs font-bold text-on-primary"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <ToolGroupSection
                title="PDF Tools"
                subtitle="Combine, split by page ranges, and turn JPG/PNG photos into multi-page PDFs via Web Workers."
                tools={pdfTools}
              />

              {pdfTools.length > 0 && (imageTools.length > 0 || calcTools.length > 0) && (
                <AdSlot placement="directory-between-groups" />
              )}

              <ToolGroupSection
                title="Image Tools"
                subtitle="Resize by exact pixels or percentage, convert between JPG/PNG/WebP, and strip EXIF metadata locally."
                tools={imageTools}
              />

              <ToolGroupSection
                title="Everyday Calculators & Converters"
                subtitle="Deterministic math engines for discounts, percentage change, NIST SP 811 units, and UTC calendar dates."
                tools={calcTools}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

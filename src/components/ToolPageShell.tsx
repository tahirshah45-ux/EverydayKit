import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Cpu,
  HardDrive,
  HelpCircle,
  ListChecks,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import AdSlot from './AdSlot';
import SeoHead from './SeoHead';
import { isAdProviderConfigured } from '../lib/adProvider';
import { getRelatedTools, type ToolDefinition } from '../lib/toolsCatalog';

interface ToolPageShellProps {
  tool: ToolDefinition;
  /** Suppresses ad slots during active loading, error, empty-result, or modal states. */
  suppressAds?: boolean;
  /** Optional extra crawlable educational section (e.g. worked examples or reference formulas). */
  extraGuideContent?: ReactNode;
  children: ReactNode;
}

export default function ToolPageShell({
  tool,
  suppressAds = false,
  extraGuideContent,
  children,
}: ToolPageShellProps) {
  const relatedTools = getRelatedTools(tool.relatedToolIds);
  const showDesktopSidebarColumn = isAdProviderConfigured() && !suppressAds;

  return (
    <>
      <SeoHead
        title={tool.title}
        description={tool.metaDescription}
        path={tool.path}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Tools', path: '/tools' },
          { name: tool.shortName, path: tool.path },
        ]}
        faqs={tool.faqs}
        webApplication={{
          name: `${tool.name} — EverydayKit`,
          description: tool.metaDescription,
          applicationCategory: tool.isFileTool ? 'UtilitiesApplication' : 'FinanceApplication',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* Slot 1: Breadcrumb & Tool Identity Header */}
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-on-surface-variant">
          <Link to="/" className="hover:text-primary hover:underline">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-outline" aria-hidden="true" />
          <Link to="/tools" className="hover:text-primary hover:underline">
            Tools
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-outline" aria-hidden="true" />
          <Link
            to={`/tools?category=${tool.category}`}
            className="hover:text-primary hover:underline"
          >
            {tool.categoryLabel}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-outline" aria-hidden="true" />
          <span aria-current="page" className="font-semibold text-on-surface">
            {tool.shortName}
          </span>
        </nav>

        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-primary-fixed px-2.5 py-1 font-mono text-xs font-bold text-on-primary-fixed">
                {tool.code}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-tertiary-container/15 px-2.5 py-1 text-xs font-semibold text-tertiary">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {tool.isFileTool
                  ? '100% Local Browser Processing • Zero Uploads'
                  : 'Instant Local Calculation • Zero Tracking'}
              </span>
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
              {tool.h1}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {tool.summary}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-on-surface-variant">
            <span className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 font-medium">
              {tool.limits[0]?.label}:{' '}
              <strong className="text-on-surface">{tool.limits[0]?.value}</strong>
            </span>
          </div>
        </header>

        {/* Slot 2 & 3: Main Tool Workspace + Optional Desktop Sidebar AdSlot */}
        <div
          className={
            showDesktopSidebarColumn
              ? 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start'
              : 'block'
          }
        >
          <section aria-label={`${tool.name} interactive workspace`}>{children}</section>

          {showDesktopSidebarColumn && (
            <div className="lg:sticky lg:top-24">
              <AdSlot placement="tool-sidebar-desktop" suppressed={suppressAds} />
            </div>
          )}
        </div>

        {/* Slot 4: In-flow Horizontal AdSlot (separated below workspace/result; disabled unless configured) */}
        <AdSlot
          placement="tool-below-result"
          suppressed={suppressAds}
          className="mt-10"
        />

        {/* Optional tool-specific formulas / worked examples */}
        {extraGuideContent && <div className="mt-12">{extraGuideContent}</div>}

        {/* Slot 5: Crawlable Structured Documentation (Formats, Limits, Steps, Privacy, Limitations, FAQs) */}
        <section
          aria-labelledby="tool-guide-heading"
          className="mt-14 space-y-10 border-t border-outline-variant/30 pt-10"
        >
          <div>
            <h2
              id="tool-guide-heading"
              className="font-display text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl"
            >
              How {tool.shortName} Works &amp; Technical Limits
            </h2>
            <p className="mt-1.5 text-sm text-on-surface-variant">
              Clear supported formats, exact processing boundaries, and privacy guarantees for this
              utility.
            </p>
          </div>

          {/* Formats + Limits Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-on-surface">
                <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
                Step-by-Step Instructions
              </h3>
              <ol className="mt-4 space-y-3 text-sm text-on-surface-variant">
                {tool.howToSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container font-mono text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <h3 className="font-display text-base font-bold text-on-surface">
                Supported Formats &amp; Exact Limits
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {tool.supportedFormats.map((fmt) => (
                  <span
                    key={fmt}
                    className="rounded-lg bg-surface-container-low px-2.5 py-1 font-mono text-xs font-medium text-on-surface"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
              <dl className="mt-4 divide-y divide-outline-variant/25 text-sm">
                {tool.limits.map((lim) => (
                  <div key={lim.label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between">
                    <dt className="font-medium text-on-surface-variant">{lim.label}</dt>
                    <dd className="font-semibold text-on-surface">{lim.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Local-Processing Privacy Guarantee Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-surface-container-low p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest text-tertiary shadow-xs">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 font-display text-sm font-bold text-on-surface">
                Zero Server Uploads
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Your files, filenames, and inputs remain exclusively inside browser memory and are
                never uploaded to EverydayKit or third-party processing servers.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-xs">
                <Cpu className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 font-display text-sm font-bold text-on-surface">
                Client-Side Execution
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Heavy PDF tasks run in a local browser Web Worker so your device remains responsive,
                with zero server queues or account sign-ins.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest text-secondary shadow-xs">
                <HardDrive className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 font-display text-sm font-bold text-on-surface">
                Volatile Memory Cleanup
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Clicking Reset or closing the tab releases temporary object URLs and clears working
                state—nothing is persisted to cookies or local storage.
              </p>
            </div>
          </div>

          {/* Known Limitations */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-on-surface">
              <AlertCircle className="h-5 w-5 text-secondary" aria-hidden="true" />
              Important Limitations
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-on-surface-variant">
              {tool.limitations.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* FAQs */}
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-on-surface">
              <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
              Frequently Asked Questions
            </h3>
            <div className="mt-4 space-y-3">
              {tool.faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 open:border-primary/40"
                >
                  <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between gap-4 font-display text-sm font-bold text-on-surface">
                    <span>{faq.question}</span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-on-surface-variant transition-transform group-open:rotate-90"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-3 border-t border-outline-variant/20 pt-3 text-sm leading-relaxed text-on-surface-variant">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Slot 6: Related Internal Tools */}
          {relatedTools.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                Related Local Utilities
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {relatedTools.map((rel) => (
                  <Link
                    key={rel.id}
                    to={rel.path}
                    className="group flex flex-col justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 transition-colors hover:border-primary/50 hover:bg-surface-container-low/40"
                  >
                    <div>
                      <span className="font-mono text-[11px] font-bold text-primary">
                        {rel.code}
                      </span>
                      <h4 className="mt-1 font-display text-base font-bold text-on-surface group-hover:text-primary">
                        {rel.name}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
                        {rel.summary}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Open tool
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

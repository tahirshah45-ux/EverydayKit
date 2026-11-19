import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Cpu, ShieldCheck, Wrench } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function AboutPage() {
  return (
    <>
      <SeoHead
        title="About EverydayKit — Local-First Browser Utilities"
        description="Learn how EverydayKit builds fast, private, WCAG 2.2 AA accessible PDF, image, and everyday calculation tools that run strictly inside your browser."
        path="/about"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-fixed px-3 py-1 font-mono text-xs font-bold text-on-primary-fixed">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            About EverydayKit v1
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Everyday digital utilities without accounts, uploads, or clutter.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-on-surface-variant">
            EverydayKit is a focused suite of seven essential tools—three PDF utilities, one image
            resizer and compressor, and three deterministic calculators—engineered to execute
            entirely on your own device inside modern web browsers.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
            <ShieldCheck className="h-6 w-6 text-tertiary" aria-hidden="true" />
            <h2 className="mt-3 font-display text-base font-bold text-on-surface">
              Local-First Privacy
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
              Sensitive contracts, receipts, photos, and numbers stay in your device’s RAM. We do
              not run backend file-processing servers or store user documents.
            </p>
          </div>

          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
            <Cpu className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-display text-base font-bold text-on-surface">
              Honest Limits &amp; Speed
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
              Heavy PDF libraries are lazy-loaded and executed inside a Web Worker with clear size
              caps (50 MB PDFs, 25 MB images) so browser tabs stay responsive.
            </p>
          </div>

          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
            <Code2 className="h-6 w-6 text-secondary" aria-hidden="true" />
            <h2 className="mt-3 font-display text-base font-bold text-on-surface">
              Transparent Math &amp; Standards
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
              Every calculator shows its exact formula—using NIST SP 811 unit constants, commercial
              rounding for discounts, and UTC Gregorian dates to eliminate DST drift.
            </p>
          </div>
        </div>

        <section className="mt-10 space-y-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="font-display text-xl font-bold text-on-surface">
            What EverydayKit Intentionally Excludes
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            To remain fast, auditable, and trustworthy, EverydayKit v1 deliberately avoids user
            accounts, cloud document storage, paid subscriptions, third-party upload endpoints, and
            hidden background telemetry of your inputs.
          </p>
          <div className="pt-2">
            <Link
              to="/tools"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary hover:opacity-95"
            >
              Browse All 7 Tools
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

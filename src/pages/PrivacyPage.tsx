import { CheckCircle2, EyeOff, HardDrive, Lock, ShieldCheck } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import { getConfiguredAdProvider } from '../lib/adProvider';

export default function PrivacyPage() {
  const configuredProvider = getConfiguredAdProvider();

  return (
    <>
      <SeoHead
        title="Privacy & Local Processing Guarantee | EverydayKit"
        description="Read EverydayKit's privacy architecture: 100% client-side file processing, zero uploads of files or calculator inputs, strict ad separation, and DevTools verification."
        path="/privacy"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/privacy' },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-tertiary-container/15 px-3 py-1 text-xs font-bold text-tertiary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Privacy &amp; Security Architecture
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Privacy Policy &amp; Local Processing Guarantee
          </h1>
          <p className="mt-3 text-base leading-relaxed text-on-surface-variant">
            EverydayKit is designed so your files, filenames, financial figures, unit values, and
            calendar dates never leave your browser.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-on-surface">
              <Lock className="h-5 w-5 text-tertiary" aria-hidden="true" />
              1. Zero File or Input Uploads
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              All seven EverydayKit tools execute strictly in client-side JavaScript, HTML5 Canvas,
              and browser Web Workers. EverydayKit has no file-upload endpoint, no remote document
              storage, and no user account database.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" aria-hidden="true" />
                <span>PDF merges, page splits, and image-to-PDF builds run inside a local Web Worker.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" aria-hidden="true" />
                <span>Image resizing and compression run via local Canvas APIs and strip EXIF metadata.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" aria-hidden="true" />
                <span>Calculator inputs and outputs are never sent to analytics or saved in cookies/localStorage.</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-on-surface">
              <HardDrive className="h-5 w-5 text-primary" aria-hidden="true" />
              2. Volatile Browser Memory &amp; Cleanup
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Loaded files and generated outputs exist solely in volatile tab memory. Clicking{' '}
              <strong>Reset</strong> or closing the browser tab clears working buffers and revokes
              temporary <code className="font-mono text-xs">blob:</code> object URLs. Our optional
              Local Diagnostics Log records only sanitized error codes (never filenames, file bytes,
              or numeric inputs) in volatile session memory.
            </p>
          </section>

          <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-on-surface">
              <EyeOff className="h-5 w-5 text-secondary" aria-hidden="true" />
              3. Advertising Separation &amp; Current Deployment Status
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              EverydayKit includes isolated, clearly labeled advertisement placements separated from
              tool controls, file dropzones, download actions, and error states. Ad components never
              receive filenames, file contents, calculator values, or results.
            </p>
            <div className="mt-3 rounded-xl bg-surface-container-low p-4 text-sm text-on-surface">
              <strong>Current ad status in this deployment:</strong>{' '}
              {configuredProvider ? (
                <span>
                  Configured via isolated adapter (<code className="font-mono">{configuredProvider}</code>).
                </span>
              ) : (
                <span>
                  <strong>Disabled.</strong> No third-party ad network scripts or ad-unit IDs are
                  active in this build. If an operator enables a verified ad provider in production
                  (via <code className="font-mono text-xs">VITE_AD_PROVIDER</code> and slot env
                  variables), this policy and any required regional consent controls must be updated
                  before enabling live ads.
                </span>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
            <h2 className="font-display text-lg font-bold text-on-surface">
              4. Independent Verification (Browser DevTools)
            </h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-on-surface-variant">
              <li>Open any EverydayKit tool and press F12 (or Cmd+Option+I) to open DevTools.</li>
              <li>Select the <strong>Network</strong> tab and clear existing entries.</li>
              <li>Load local PDFs or images and execute a merge, split, resize, or calculation.</li>
              <li>Confirm zero outbound requests transmit your files, filenames, or calculator inputs.</li>
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}

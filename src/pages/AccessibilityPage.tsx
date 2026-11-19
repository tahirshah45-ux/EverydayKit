import { Link } from 'react-router-dom';
import { CheckCircle2, Keyboard } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function AccessibilityPage() {
  return (
    <>
      <SeoHead
        title="Accessibility Statement (WCAG 2.2 AA) | EverydayKit"
        description="EverydayKit's WCAG 2.2 AA accessibility practices covering keyboard navigation, focus indicators, touch target sizes, color contrast, screen-reader status announcements, and reduced motion."
        path="/accessibility"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Accessibility Statement', path: '/accessibility' },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">
            <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
            WCAG 2.2 AA Commitment
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Accessibility Statement
          </h1>
          <p className="mt-3 text-base leading-relaxed text-on-surface-variant">
            EverydayKit is engineered to align with Web Content Accessibility Guidelines (WCAG) 2.2
            Level AA across desktop and mobile devices.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="font-display text-lg font-bold text-on-surface">
            Implemented Accessibility Measures
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
            {[
              'Full keyboard operability across navigation, tool controls, file queue reordering (Up/Down buttons alongside drag-and-drop), dialogs, and downloads.',
              'Skip-to-main-content link and clear 2px high-contrast :focus-visible rings on every interactive control.',
              'Minimum 44 × 44 CSS-pixel touch targets on mobile and desktop interactive controls.',
              'Explicitly connected <label> elements, semantic heading hierarchy (one H1 per page), and ARIA live status announcements for file validation, progress, copy actions, and errors.',
              'Modal dialogs (Quick Find and Local Diagnostics) manage focus entry, trap Tab cycling, close on Escape, and restore focus to the triggering element.',
              'Honors prefers-reduced-motion user settings to disable transitions and animations.',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-on-surface-variant">
            Encountered an accessibility barrier? Please report it via our{' '}
            <Link to="/contact" className="font-semibold text-primary hover:underline">
              Contact &amp; Support page
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}

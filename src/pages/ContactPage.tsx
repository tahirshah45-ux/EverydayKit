import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function ContactPage() {
  const [topic, setTopic] = useState('Bug report');
  const [toolArea, setToolArea] = useState('General / All Tools');
  const [message, setMessage] = useState('');
  const [preparedReport, setPreparedReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePrepare = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const summary = [
      `Topic: ${topic}`,
      `Tool / Area: ${toolArea}`,
      `Viewport: ${typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown'}`,
      '---',
      message.trim(),
      '---',
      '(Reminder: Do not attach confidential PDFs, images, or personal credentials.)',
    ].join('\n');
    setPreparedReport(summary);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!preparedReport) return;
    try {
      await navigator.clipboard.writeText(preparedReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <>
      <SeoHead
        title="Contact & Support | EverydayKit"
        description="Report a bug, submit accessibility feedback, or ask a question about EverydayKit without sending files or personal data."
        path="/contact"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Support &amp; Feedback
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Contact EverydayKit
          </h1>
          <p className="mt-3 text-base leading-relaxed text-on-surface-variant">
            Because EverydayKit has no backend database or user-data collection server, the helper
            below formats a clean, privacy-safe support or bug report locally so you can paste it
            into your issue tracker or email client of choice.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form
            onSubmit={handlePrepare}
            className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 lg:col-span-2"
          >
            <div>
              <label
                htmlFor="contact-topic"
                className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
              >
                Topic
              </label>
              <select
                id="contact-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-medium text-on-surface"
              >
                <option>Bug report</option>
                <option>Accessibility feedback (WCAG 2.2 AA)</option>
                <option>Formula or conversion verification</option>
                <option>Privacy or security inquiry</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="contact-tool"
                className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
              >
                Affected Tool
              </label>
              <select
                id="contact-tool"
                value={toolArea}
                onChange={(e) => setToolArea(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-medium text-on-surface"
              >
                <option>General / All Tools</option>
                <option>Merge PDF Files</option>
                <option>Split PDF by Page Ranges</option>
                <option>Convert Images to PDF</option>
                <option>Resize &amp; Compress Images</option>
                <option>Percentage &amp; Discount Calculator</option>
                <option>Unit Converter</option>
                <option>Date Calculator</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
              >
                Description (do not include private files or secrets)
              </label>
              <textarea
                id="contact-message"
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what happened, expected behavior, and browser/OS version…"
                className="mt-1.5 w-full rounded-xl border border-outline-variant bg-surface-container-low/50 p-3 text-sm text-on-surface focus:border-primary focus:bg-surface-container-lowest"
              />
            </div>

            <button
              type="submit"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary hover:opacity-95"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Format Local Support Report
            </button>

            {preparedReport && (
              <div className="mt-4 space-y-3 rounded-xl border border-tertiary/35 bg-tertiary-container/10 p-4">
                <p className="text-xs font-bold text-tertiary">
                  Formatted locally (zero data transmitted):
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-container-lowest p-3 font-mono text-xs text-on-surface">
                  {preparedReport}
                </pre>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-tertiary px-4 text-xs font-bold text-on-tertiary hover:bg-tertiary-container"
                >
                  {copied ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  {copied ? 'Copied Report to Clipboard' : 'Copy Formatted Report'}
                </button>
              </div>
            )}
          </form>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
              <ShieldCheck className="h-5 w-5 text-tertiary" aria-hidden="true" />
              <h2 className="mt-2 font-display text-base font-bold text-on-surface">
                Zero Server Submission
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                This page does not transmit form data to a remote server. Operators deploying
                EverydayKit can connect their own public GitHub Issues URL or support email in{' '}
                <code className="font-mono">README.md</code>.
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 text-xs space-y-2">
              <h2 className="font-display text-sm font-bold text-on-surface">Helpful Links</h2>
              <ul className="space-y-1.5 text-primary font-semibold">
                <li>
                  <Link to="/privacy" className="hover:underline">
                    Privacy &amp; Local Processing Policy
                  </Link>
                </li>
                <li>
                  <Link to="/accessibility" className="hover:underline">
                    WCAG 2.2 AA Accessibility Statement
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

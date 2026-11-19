import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import SeoHead from '../components/SeoHead';

export default function NotFoundPage() {
  return (
    <>
      <SeoHead
        title="Page Not Found | EverydayKit"
        description="The requested page could not be found on EverydayKit. Browse all seven local browser tools."
        path="/404"
      />
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="rounded-lg bg-surface-container px-3 py-1 font-mono text-xs font-bold text-primary">
          404 • Route Not Found
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-on-surface sm:text-4xl">
          We couldn’t find that page.
        </h1>
        <p className="mt-3 text-sm text-on-surface-variant sm:text-base">
          The link may have moved or been mistyped. Every EverydayKit PDF, image, and calculator
          utility is available directly from the tools directory.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </Link>
          <Link
            to="/tools"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary hover:opacity-95"
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            Open Tools Directory
          </Link>
        </div>
      </div>
    </>
  );
}

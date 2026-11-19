import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Calculator,
  FileText,
  Home,
  Info,
  LayoutGrid,
  Menu,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import CommandSearchModal from './CommandSearchModal';
import ErrorLogModal from './ErrorLogModal';
import { TOOLS_CATALOG } from '../lib/toolsCatalog';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuBtnRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }
      if (
        e.key === '/' &&
        !searchOpen &&
        !logOpen &&
        !mobileMenuOpen &&
        document.activeElement &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        mobileMenuBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, logOpen, mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      requestAnimationFrame(() => mobileCloseBtnRef.current?.focus());
    }
  }, [mobileMenuOpen]);

  const isPdfActive =
    location.pathname.startsWith('/tools/merge-pdf') ||
    location.pathname.startsWith('/tools/split-pdf') ||
    location.pathname.startsWith('/tools/images-to-pdf') ||
    (location.pathname === '/tools' && location.search.includes('category=pdf'));

  const isImagesActive =
    location.pathname.startsWith('/tools/resize-compress-image') ||
    (location.pathname === '/tools' && location.search.includes('category=images'));

  const isCalcActive =
    location.pathname.startsWith('/tools/percentage-discount-calculator') ||
    location.pathname.startsWith('/tools/unit-converter') ||
    location.pathname.startsWith('/tools/date-calculator') ||
    (location.pathname === '/tools' && location.search.includes('category=calculators'));

  const pdfTools = TOOLS_CATALOG.filter((t) => t.category === 'pdf');
  const otherTools = TOOLS_CATALOG.filter((t) => t.category !== 'pdf');

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      {/* WCAG 2.2 AA Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-on-primary focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Local-Processing Privacy Strip (desktop & tablet; compact on mobile) */}
      <div className="border-b border-outline-variant/25 bg-surface-container-low px-4 py-1.5 text-center text-xs text-on-surface-variant">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-tertiary" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-on-surface">Local-first by design:</strong> Files
            and calculations run in your browser memory. Zero uploads.
          </span>
        </div>
      </div>

      {/* Primary Header */}
      <header className="sticky top-0 z-40 border-b border-outline-variant/25 bg-surface/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              to="/"
              className="flex min-h-[44px] items-center gap-2.5 rounded-lg pr-1 font-display text-lg font-extrabold tracking-tight text-on-surface hover:text-primary"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-xs">
                <Wrench className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>EverydayKit</span>
            </Link>

            <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
              <NavLink
                to="/tools"
                end
                className={({ isActive }) =>
                  `inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive && !location.search
                      ? 'bg-surface-container-low font-semibold text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low/70 hover:text-on-surface'
                  }`
                }
              >
                All Tools
              </NavLink>
              <Link
                to="/tools?category=pdf"
                className={`inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isPdfActive
                    ? 'bg-surface-container-low font-semibold text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low/70 hover:text-on-surface'
                }`}
              >
                PDF Suite
              </Link>
              <Link
                to="/tools?category=images"
                className={`inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isImagesActive
                    ? 'bg-surface-container-low font-semibold text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low/70 hover:text-on-surface'
                }`}
              >
                Image Tools
              </Link>
              <Link
                to="/tools?category=calculators"
                className={`inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isCalcActive
                    ? 'bg-surface-container-low font-semibold text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low/70 hover:text-on-surface'
                }`}
              >
                Calculators
              </Link>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-surface-container-low font-semibold text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low/70 hover:text-on-surface'
                  }`
                }
              >
                About
              </NavLink>
              <NavLink
                to="/privacy"
                className={({ isActive }) =>
                  `inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-surface-container-low font-semibold text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low/70 hover:text-on-surface'
                  }`
                }
              >
                Privacy
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Quick find tool (Command K or slash)"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 text-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-surface-container-lowest hover:text-on-surface sm:w-56 sm:justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
                <span className="hidden sm:inline">Quick find tool…</span>
                <span className="sm:hidden">Find</span>
              </span>
              <kbd className="hidden rounded border border-outline-variant/60 bg-surface-container-lowest px-1.5 py-0.5 font-mono text-[11px] text-on-surface-variant sm:inline">
                ⌘K
              </kbd>
            </button>

            <button
              ref={mobileMenuBtnRef}
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-on-surface hover:bg-surface-container-low lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-on-surface/40 backdrop-blur-xs lg:hidden"
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            className="flex h-full w-full max-w-xs flex-col bg-surface-container-lowest shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/30 px-4 py-3">
              <span className="font-display text-base font-extrabold text-on-surface">
                EverydayKit Menu
              </span>
              <button
                ref={mobileCloseBtnRef}
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile drawer links" className="flex-1 overflow-y-auto p-4">
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Utilities
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/tools"
                    className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                  >
                    All Tools Directory
                  </Link>
                </li>
                {TOOLS_CATALOG.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={tool.path}
                      className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-6 mb-2 px-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Trust &amp; Info
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/about"
                    className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    About EverydayKit
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    Privacy &amp; Local Guarantee
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    Contact &amp; Support
                  </Link>
                </li>
                <li>
                  <Link
                    to="/accessibility"
                    className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    Accessibility Statement
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/25 bg-surface-container-low pb-20 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-on-surface"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-on-primary">
                  <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                EverydayKit
              </Link>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Seven fast, private document, image, and everyday calculation tools that execute
                directly inside your browser. Zero uploads, zero accounts.
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-tertiary">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                100% client-side file &amp; formula processing
              </p>
            </div>

            <div>
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-on-surface">
                PDF Tools
              </h2>
              <ul className="mt-3 space-y-1.5">
                {pdfTools.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={tool.path}
                      className="inline-flex min-h-[36px] items-center text-sm text-on-surface-variant hover:text-primary"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-on-surface">
                Image &amp; Calculators
              </h2>
              <ul className="mt-3 space-y-1.5">
                {otherTools.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={tool.path}
                      className="inline-flex min-h-[36px] items-center text-sm text-on-surface-variant hover:text-primary"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-on-surface">
                Trust &amp; Support
              </h2>
              <ul className="mt-3 space-y-1.5">
                <li>
                  <Link
                    to="/about"
                    className="inline-flex min-h-[36px] items-center text-sm text-on-surface-variant hover:text-primary"
                  >
                    About EverydayKit
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="inline-flex min-h-[36px] items-center text-sm text-on-surface-variant hover:text-primary"
                  >
                    Privacy &amp; Ad Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="inline-flex min-h-[36px] items-center text-sm text-on-surface-variant hover:text-primary"
                  >
                    Contact &amp; Bug Reports
                  </Link>
                </li>
                <li>
                  <Link
                    to="/accessibility"
                    className="inline-flex min-h-[36px] items-center text-sm text-on-surface-variant hover:text-primary"
                  >
                    Accessibility Statement
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLogOpen(true)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                    Local Diagnostics Log
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-outline-variant/30 pt-6 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} EverydayKit. MIT Licensed open utility suite.</p>
            <p>All file transformations run locally in your browser without remote uploads.</p>
          </div>
        </div>
      </footer>

      {/* Compact Mobile Bottom Navigation Bar (56px height, >=44x44px touch targets) */}
      <nav
        aria-label="Mobile quick navigation"
        className="pb-safe fixed right-0 bottom-0 left-0 z-40 border-t border-outline-variant/30 bg-surface-container-lowest/95 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid h-14 max-w-md grid-cols-5">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                isActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
              }`
            }
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/tools"
            end
            className={({ isActive }) =>
              `flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                isActive && !location.search ? 'text-primary font-semibold' : 'text-on-surface-variant'
              }`
            }
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            <span>Tools</span>
          </NavLink>
          <Link
            to="/tools?category=pdf"
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              isPdfActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>PDF</span>
          </Link>
          <Link
            to="/tools?category=calculators"
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              isCalcActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <Calculator className="h-4 w-4" aria-hidden="true" />
            <span>Calc</span>
          </Link>
          <NavLink
            to="/privacy"
            className={({ isActive }) =>
              `flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                isActive ? 'text-primary font-semibold' : 'text-on-surface-variant'
              }`
            }
          >
            <Info className="h-4 w-4" aria-hidden="true" />
            <span>Privacy</span>
          </NavLink>
        </div>
      </nav>

      <CommandSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ErrorLogModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
}

import { Component, lazy, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ToolsDirectoryPage from './pages/ToolsDirectoryPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import AccessibilityPage from './pages/AccessibilityPage';
import NotFoundPage from './pages/NotFoundPage';

// Lazy-load all 7 dedicated tool pages so heavy PDF/image libraries load on demand
const MergePdfPage = lazy(() => import('./pages/tools/MergePdfPage'));
const SplitPdfPage = lazy(() => import('./pages/tools/SplitPdfPage'));
const ImagesToPdfPage = lazy(() => import('./pages/tools/ImagesToPdfPage'));
const ResizeCompressImagePage = lazy(() => import('./pages/tools/ResizeCompressImagePage'));
const PercentageDiscountPage = lazy(() => import('./pages/tools/PercentageDiscountPage'));
const UnitConverterPage = lazy(() => import('./pages/tools/UnitConverterPage'));
const DateCalculatorPage = lazy(() => import('./pages/tools/DateCalculatorPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function ToolLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-24 text-sm font-semibold text-on-surface-variant"
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      <span>Loading local tool workspace…</span>
    </div>
  );
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Kept strictly local; never transmitted remotely
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-extrabold text-on-surface">
            Something went wrong in this browser session
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            No files or inputs were uploaded. Reload the page or return to the tools directory to
            start fresh.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-5 text-sm font-bold text-on-primary"
          >
            Reload EverydayKit
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<ToolLoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tools" element={<ToolsDirectoryPage />} />
              <Route path="/tools/merge-pdf" element={<MergePdfPage />} />
              <Route path="/tools/split-pdf" element={<SplitPdfPage />} />
              <Route path="/tools/images-to-pdf" element={<ImagesToPdfPage />} />
              <Route path="/tools/resize-compress-image" element={<ResizeCompressImagePage />} />
              <Route
                path="/tools/percentage-discount-calculator"
                element={<PercentageDiscountPage />}
              />
              <Route path="/tools/unit-converter" element={<UnitConverterPage />} />
              <Route path="/tools/date-calculator" element={<DateCalculatorPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/accessibility" element={<AccessibilityPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

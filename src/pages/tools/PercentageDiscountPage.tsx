import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import ToolPageShell from '../../components/ToolPageShell';
import {
  calculateDiscount,
  calculateMarginMarkup,
  calculatePercentageChange,
  calculatePercentOf,
  calculateWhatPercent,
} from '../../lib/calculators';
import { triggerBlobDownload } from '../../lib/sanitize';
import { getToolById } from '../../lib/toolsCatalog';

type CalcMode = 'discount' | 'change' | 'basic' | 'margin';

const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 50, 70];

function formatMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PercentageDiscountPage() {
  const tool = getToolById('percentage-discount-calculator')!;

  const [mode, setMode] = useState<CalcMode>('discount');
  const [copiedMsg, setCopiedMsg] = useState('');

  // Mode 1: Discount & Sale
  const [priceStr, setPriceStr] = useState('129.99');
  const [discountStr, setDiscountStr] = useState('25');
  const [useExtraCoupon, setUseExtraCoupon] = useState(false);
  const [couponStr, setCouponStr] = useState('10');
  const [useTax, setUseTax] = useState(false);
  const [taxStr, setTaxStr] = useState('8.25');

  // Mode 2: Percentage Change
  const [origValStr, setOrigValStr] = useState('80');
  const [newValStr, setNewValStr] = useState('100');

  // Mode 3: Basic %
  const [basicSubMode, setBasicSubMode] = useState<'percentOf' | 'whatPercent'>('percentOf');
  const [basicA, setBasicA] = useState('15');
  const [basicB, setBasicB] = useState('240');

  // Mode 4: Margin & Markup
  const [costStr, setCostStr] = useState('60');
  const [revenueStr, setRevenueStr] = useState('90');

  const discountResult = useMemo(() => {
    return calculateDiscount({
      originalPrice: Number(priceStr),
      discountPercent: Number(discountStr),
      extraCouponPercent: useExtraCoupon ? Number(couponStr) : 0,
      taxPercent: useTax ? Number(taxStr) : 0,
    });
  }, [priceStr, discountStr, useExtraCoupon, couponStr, useTax, taxStr]);

  const changeResult = useMemo(() => {
    return calculatePercentageChange(Number(origValStr), Number(newValStr));
  }, [origValStr, newValStr]);

  const basicPercentOf = useMemo(
    () => calculatePercentOf(Number(basicA), Number(basicB)),
    [basicA, basicB]
  );

  const basicWhatPercent = useMemo(
    () => calculateWhatPercent(Number(basicA), Number(basicB)),
    [basicA, basicB]
  );

  const marginResult = useMemo(
    () => calculateMarginMarkup(Number(costStr), Number(revenueStr)),
    [costStr, revenueStr]
  );

  const buildSummaryText = (): string => {
    if (mode === 'discount' && discountResult.valid) {
      const lines = [
        'EverydayKit — Discount & Sale Breakdown',
        `Original Price: ${formatMoney(discountResult.originalPrice)}`,
        `Primary Discount (${discountStr}%): -${formatMoney(discountResult.primarySavings)}`,
      ];
      if (useExtraCoupon) {
        lines.push(`Extra Coupon (${couponStr}%): -${formatMoney(discountResult.couponSavings)}`);
      }
      if (useTax) {
        lines.push(`Sales Tax (${taxStr}%): +${formatMoney(discountResult.taxAmount)}`);
      }
      lines.push(
        `Total Savings: ${formatMoney(discountResult.totalSavings)} (${discountResult.effectiveDiscountPercent}% effective)`,
        `Final Price: ${formatMoney(discountResult.finalPrice)}`
      );
      return lines.join('\n');
    }
    if (mode === 'change' && changeResult.valid) {
      return [
        'EverydayKit — Percentage Change',
        `Original Value: ${changeResult.originalValue}`,
        `New Value: ${changeResult.newValue}`,
        `Absolute Difference: ${changeResult.absoluteChange >= 0 ? '+' : ''}${changeResult.absoluteChange}`,
        `Percentage Change: ${changeResult.percentChange >= 0 ? '+' : ''}${changeResult.percentChange}% (${changeResult.direction})`,
      ].join('\n');
    }
    if (mode === 'basic') {
      if (basicSubMode === 'percentOf' && basicPercentOf.valid) {
        return `${basicA}% of ${basicB} = ${basicPercentOf.result}`;
      }
      if (basicSubMode === 'whatPercent' && basicWhatPercent.valid) {
        return `${basicA} is ${basicWhatPercent.percent}% of ${basicB}`;
      }
    }
    if (mode === 'margin' && marginResult.valid) {
      return [
        'EverydayKit — Margin & Markup',
        `Cost: ${formatMoney(marginResult.cost)}`,
        `Selling Price: ${formatMoney(marginResult.revenue)}`,
        `Profit: ${formatMoney(marginResult.profit)}`,
        `Profit Margin: ${marginResult.marginPercent}%`,
        `Markup: ${marginResult.markupPercent}%`,
      ].join('\n');
    }
    return '';
  };

  const handleCopy = async () => {
    const text = buildSummaryText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsg('Copied summary to clipboard.');
      setTimeout(() => setCopiedMsg(''), 2500);
    } catch {
      setCopiedMsg('Clipboard unavailable in this browser context.');
    }
  };

  const handleExportReceipt = () => {
    const text = buildSummaryText();
    if (!text) return;
    const blob = new Blob([`${text}\n`], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, `everydaykit-${mode}-calculation.txt`);
  };

  const handleReset = () => {
    setPriceStr('129.99');
    setDiscountStr('25');
    setUseExtraCoupon(false);
    setCouponStr('10');
    setUseTax(false);
    setTaxStr('8.25');
    setOrigValStr('80');
    setNewValStr('100');
    setBasicSubMode('percentOf');
    setBasicA('15');
    setBasicB('240');
    setCostStr('60');
    setRevenueStr('90');
    setCopiedMsg('');
  };

  const adjustDiscount = (delta: number) => {
    const current = Number(discountStr);
    const next = Math.min(100, Math.max(0, (Number.isFinite(current) ? current : 0) + delta));
    setDiscountStr(String(next));
  };

  const hasValidationError =
    (mode === 'discount' && !discountResult.valid) ||
    (mode === 'change' && !changeResult.valid) ||
    (mode === 'basic' &&
      ((basicSubMode === 'percentOf' && !basicPercentOf.valid) ||
        (basicSubMode === 'whatPercent' && !basicWhatPercent.valid))) ||
    (mode === 'margin' && !marginResult.valid);

  const workedExamplesSection = (
    <section
      aria-labelledby="pct-worked-examples"
      className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6"
    >
      <h2 id="pct-worked-examples" className="font-display text-lg font-extrabold text-on-surface">
        Formulas &amp; Worked Examples
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">
            Stacked Retail Discounts
          </h3>
          <p className="mt-1 font-mono text-xs text-primary">
            Final = Price × (1 − d₁) × (1 − d₂)
          </p>
          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            Example: $100 item with 20% off + extra 10% coupon → $100 × 0.80 = $80, then $80 × 0.90
            = <strong>$72.00</strong> (28% effective discount).
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">Percentage Change (Δ%)</h3>
          <p className="mt-1 font-mono text-xs text-primary">
            Δ% = ((New − Old) / |Old|) × 100
          </p>
          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            Example: Growth from 80 to 100 → (20 / 80) × 100 = <strong>+25%</strong>. Drop from 100
            to 80 → (−20 / 100) × 100 = <strong>−20%</strong>.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">Margin vs. Markup</h3>
          <p className="mt-1 font-mono text-xs text-primary">
            Margin = Profit / Price • Markup = Profit / Cost
          </p>
          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            Example: Cost $60, Selling Price $90 → Profit $30. Margin = 30 / 90 ={' '}
            <strong>33.33%</strong>; Markup = 30 / 60 = <strong>50.00%</strong>.
          </p>
        </div>
      </div>
    </section>
  );

  return (
    <ToolPageShell
      tool={tool}
      suppressAds={hasValidationError}
      extraGuideContent={workedExamplesSection}
    >
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copiedMsg}
      </div>

      <div className="space-y-6">
        {/* Mode Tabs */}
        <div
          role="tablist"
          aria-label="Percentage calculation modes"
          className="grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-1.5 sm:grid-cols-4"
        >
          {(
            [
              { id: 'discount', label: 'Discount & Sale' },
              { id: 'change', label: 'Percentage Change' },
              { id: 'basic', label: 'Basic Percentage' },
              { id: 'margin', label: 'Margin & Markup' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={mode === tab.id}
              onClick={() => setMode(tab.id)}
              className={`min-h-[44px] rounded-xl px-3 text-xs font-bold transition-colors sm:text-sm ${
                mode === tab.id
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2-Column Calculator Surface */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Inputs */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6">
            {mode === 'discount' && (
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="discount-original-price"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Original Price ($)
                  </label>
                  <input
                    id="discount-original-price"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-lg font-bold text-on-surface tabular-nums focus:border-primary focus:bg-surface-container-lowest"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="discount-percent-input"
                      className="text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                    >
                      Discount Percentage (%)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustDiscount(-5)}
                        aria-label="Decrease discount by 5 percent"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-outline-variant/60 bg-surface-container-low hover:bg-surface-container"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustDiscount(5)}
                        aria-label="Increase discount by 5 percent"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-outline-variant/60 bg-surface-container-low hover:bg-surface-container"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <input
                    id="discount-percent-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.5"
                    value={discountStr}
                    onChange={(e) => setDiscountStr(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-lg font-bold text-on-surface tabular-nums focus:border-primary focus:bg-surface-container-lowest"
                  />
                  <input
                    type="range"
                    aria-label="Discount percentage slider"
                    min={0}
                    max={100}
                    value={Math.min(100, Math.max(0, Number(discountStr) || 0))}
                    onChange={(e) => setDiscountStr(e.target.value)}
                    className="mt-3 h-2 w-full cursor-pointer accent-primary"
                  />
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {DISCOUNT_PRESETS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountStr(String(pct))}
                        className={`min-h-[38px] rounded-lg px-3 font-mono text-xs font-bold transition-colors ${
                          Number(discountStr) === pct
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stackable Coupon Toggle */}
                <div className="space-y-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-3.5">
                  <label className="flex min-h-[36px] cursor-pointer items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-on-surface">
                      Add stackable extra coupon (%)
                    </span>
                    <input
                      type="checkbox"
                      checked={useExtraCoupon}
                      onChange={(e) => setUseExtraCoupon(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  {useExtraCoupon && (
                    <div>
                      <label htmlFor="extra-coupon-input" className="sr-only">
                        Extra coupon percentage
                      </label>
                      <input
                        id="extra-coupon-input"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="0.5"
                        value={couponStr}
                        onChange={(e) => setCouponStr(e.target.value)}
                        className="min-h-[44px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono text-sm font-bold text-on-surface tabular-nums"
                      />
                    </div>
                  )}
                </div>

                {/* Sales Tax Toggle */}
                <div className="space-y-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-3.5">
                  <label className="flex min-h-[36px] cursor-pointer items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-on-surface">
                      Include sales tax (%)
                    </span>
                    <input
                      type="checkbox"
                      checked={useTax}
                      onChange={(e) => setUseTax(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  {useTax && (
                    <div>
                      <label htmlFor="sales-tax-input" className="sr-only">
                        Sales tax percentage
                      </label>
                      <input
                        id="sales-tax-input"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="0.05"
                        value={taxStr}
                        onChange={(e) => setTaxStr(e.target.value)}
                        className="min-h-[44px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 font-mono text-sm font-bold text-on-surface tabular-nums"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {mode === 'change' && (
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="change-original-value"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Original Value (V₁)
                  </label>
                  <input
                    id="change-original-value"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={origValStr}
                    onChange={(e) => setOrigValStr(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-lg font-bold text-on-surface tabular-nums focus:border-primary focus:bg-surface-container-lowest"
                  />
                </div>
                <div>
                  <label
                    htmlFor="change-new-value"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    New Value (V₂)
                  </label>
                  <input
                    id="change-new-value"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={newValStr}
                    onChange={(e) => setNewValStr(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-lg font-bold text-on-surface tabular-nums focus:border-primary focus:bg-surface-container-lowest"
                  />
                </div>
                <p className="rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">
                  Formula: <span className="font-mono font-semibold text-on-surface">((V₂ − V₁) / |V₁|) × 100</span>
                </p>
              </div>
            )}

            {mode === 'basic' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-container-low p-1">
                  <button
                    type="button"
                    onClick={() => setBasicSubMode('percentOf')}
                    className={`min-h-[42px] rounded-lg text-xs font-bold ${
                      basicSubMode === 'percentOf'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    What is X% of Y?
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasicSubMode('whatPercent')}
                    className={`min-h-[42px] rounded-lg text-xs font-bold ${
                      basicSubMode === 'whatPercent'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    X is what % of Y?
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="basic-input-a"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    {basicSubMode === 'percentOf' ? 'Percentage (X %)' : 'Part Value (X)'}
                  </label>
                  <input
                    id="basic-input-a"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={basicA}
                    onChange={(e) => setBasicA(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-lg font-bold text-on-surface tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="basic-input-b"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    {basicSubMode === 'percentOf' ? 'Base Number (Y)' : 'Whole Value (Y)'}
                  </label>
                  <input
                    id="basic-input-b"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={basicB}
                    onChange={(e) => setBasicB(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-lg font-bold text-on-surface tabular-nums"
                  />
                </div>
              </div>
            )}

            {mode === 'margin' && (
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="margin-cost-input"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Unit Cost ($)
                  </label>
                  <input
                    id="margin-cost-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={costStr}
                    onChange={(e) => setCostStr(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-lg font-bold text-on-surface tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="margin-revenue-input"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Selling Price / Revenue ($)
                  </label>
                  <input
                    id="margin-revenue-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={revenueStr}
                    onChange={(e) => setRevenueStr(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-lg font-bold text-on-surface tabular-nums"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-outline-variant/25 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset Defaults
              </button>
            </div>
          </div>

          {/* Right: Live Result Card */}
          <div className="flex flex-col justify-between gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6">
            {mode === 'discount' && (
              <>
                {!discountResult.valid ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl bg-error-container/50 p-4 text-sm text-on-error-container"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
                    <span>{discountResult.error}</span>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-5 text-on-primary">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-primary-container">
                        Final Payable Price
                      </p>
                      <p className="mt-1 font-display text-4xl font-extrabold tracking-tight tabular-nums">
                        {formatMoney(discountResult.finalPrice)}
                      </p>
                      <p className="mt-2 inline-flex items-center rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold tabular-nums">
                        You Save {formatMoney(discountResult.totalSavings)} (
                        {discountResult.effectiveDiscountPercent}% off)
                      </p>
                    </div>

                    <dl className="divide-y divide-outline-variant/25 text-sm">
                      <div className="flex justify-between py-2.5">
                        <dt className="text-on-surface-variant">Original Price</dt>
                        <dd className="font-mono font-semibold text-on-surface tabular-nums">
                          {formatMoney(discountResult.originalPrice)}
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-on-surface-variant">
                          Primary Discount ({discountStr || 0}%)
                        </dt>
                        <dd className="font-mono font-semibold text-tertiary tabular-nums">
                          −{formatMoney(discountResult.primarySavings)}
                        </dd>
                      </div>
                      {useExtraCoupon && (
                        <div className="flex justify-between py-2.5">
                          <dt className="text-on-surface-variant">
                            Stacked Coupon ({couponStr || 0}% on {formatMoney(discountResult.subtotalAfterPrimary)})
                          </dt>
                          <dd className="font-mono font-semibold text-tertiary tabular-nums">
                            −{formatMoney(discountResult.couponSavings)}
                          </dd>
                        </div>
                      )}
                      {useTax && (
                        <div className="flex justify-between py-2.5">
                          <dt className="text-on-surface-variant">Sales Tax ({taxStr || 0}%)</dt>
                          <dd className="font-mono font-semibold text-on-surface tabular-nums">
                            +{formatMoney(discountResult.taxAmount)}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between py-2.5 font-bold">
                        <dt className="text-on-surface">Final Total</dt>
                        <dd className="font-mono text-primary tabular-nums">
                          {formatMoney(discountResult.finalPrice)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </>
            )}

            {mode === 'change' && (
              <>
                {!changeResult.valid ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl bg-error-container/50 p-4 text-sm text-on-error-container"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
                    <span>{changeResult.error}</span>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div
                      className={`rounded-2xl p-5 ${
                        changeResult.direction === 'decrease'
                          ? 'bg-error-container/60 text-on-error-container'
                          : 'bg-tertiary-container/15 text-on-surface'
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                        Percentage{' '}
                        {changeResult.direction === 'increase'
                          ? 'Increase'
                          : changeResult.direction === 'decrease'
                            ? 'Decrease'
                            : 'Change'}
                      </p>
                      <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
                        {changeResult.percentChange > 0 ? '+' : ''}
                        {changeResult.percentChange}%
                      </p>
                      <p className="mt-2 font-mono text-xs tabular-nums">
                        Absolute change: {changeResult.absoluteChange > 0 ? '+' : ''}
                        {changeResult.absoluteChange} • Multiplier: {changeResult.multiplier}×
                      </p>
                    </div>

                    <div className="rounded-xl bg-surface-container-low p-4 font-mono text-xs text-on-surface">
                      (({changeResult.newValue} − {changeResult.originalValue}) / |
                      {changeResult.originalValue}|) × 100 = {changeResult.percentChange}%
                    </div>
                  </div>
                )}
              </>
            )}

            {mode === 'basic' && (
              <div className="space-y-4">
                {basicSubMode === 'percentOf' ? (
                  basicPercentOf.valid ? (
                    <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-5 text-on-primary">
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-primary-container">
                        {basicA}% of {basicB}
                      </p>
                      <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
                        {basicPercentOf.result.toLocaleString('en-US', {
                          maximumFractionDigits: 6,
                        })}
                      </p>
                      <p className="mt-2 font-mono text-xs text-on-primary-container">
                        ({basicA} / 100) × {basicB} = {basicPercentOf.result}
                      </p>
                    </div>
                  ) : (
                    <div role="alert" className="rounded-xl bg-error-container/50 p-4 text-sm text-on-error-container">
                      {basicPercentOf.error}
                    </div>
                  )
                ) : basicWhatPercent.valid ? (
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-5 text-on-primary">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-primary-container">
                      {basicA} as a percentage of {basicB}
                    </p>
                    <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
                      {basicWhatPercent.percent.toLocaleString('en-US', {
                        maximumFractionDigits: 4,
                      })}
                      %
                    </p>
                    <p className="mt-2 font-mono text-xs text-on-primary-container">
                      ({basicA} / {basicB}) × 100 = {basicWhatPercent.percent}%
                    </p>
                  </div>
                ) : (
                  <div role="alert" className="rounded-xl bg-error-container/50 p-4 text-sm text-on-error-container">
                    {basicWhatPercent.error}
                  </div>
                )}
              </div>
            )}

            {mode === 'margin' && (
              <>
                {!marginResult.valid ? (
                  <div role="alert" className="rounded-xl bg-error-container/50 p-4 text-sm text-on-error-container">
                    {marginResult.error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-primary-fixed/50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-on-primary-fixed">
                          Gross Margin
                        </p>
                        <p className="mt-1 font-display text-3xl font-extrabold text-primary tabular-nums">
                          {marginResult.marginPercent}%
                        </p>
                      </div>
                      <div className="rounded-2xl bg-tertiary-container/15 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-tertiary">
                          Markup
                        </p>
                        <p className="mt-1 font-display text-3xl font-extrabold text-tertiary tabular-nums">
                          {marginResult.markupPercent}%
                        </p>
                      </div>
                    </div>
                    <dl className="divide-y divide-outline-variant/25 text-sm">
                      <div className="flex justify-between py-2.5">
                        <dt className="text-on-surface-variant">Gross Profit</dt>
                        <dd className="font-mono font-bold text-on-surface tabular-nums">
                          {formatMoney(marginResult.profit)}
                        </dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-on-surface-variant">Cost / Selling Price</dt>
                        <dd className="font-mono font-semibold text-on-surface tabular-nums">
                          {formatMoney(marginResult.cost)} → {formatMoney(marginResult.revenue)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/25 pt-4">
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={hasValidationError}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40"
              >
                {copiedMsg ? (
                  <Check className="h-4 w-4 text-tertiary" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copiedMsg ? 'Copied!' : 'Copy Summary'}
              </button>
              <button
                type="button"
                onClick={handleExportReceipt}
                disabled={hasValidationError}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-xs font-bold text-on-surface hover:bg-surface-container-low disabled:opacity-40"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export .txt
              </button>
            </div>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

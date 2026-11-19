import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  RotateCcw,
} from 'lucide-react';
import ToolPageShell from '../../components/ToolPageShell';
import {
  calculateDaysBetween,
  getTodayIsoLocal,
  shiftDateByDays,
} from '../../lib/calculators';
import { getToolById } from '../../lib/toolsCatalog';

type DateMode = 'between' | 'add' | 'subtract';

export default function DateCalculatorPage() {
  const tool = getToolById('date-calculator')!;
  const todayIso = useMemo(() => getTodayIsoLocal(), []);

  const [mode, setMode] = useState<DateMode>('between');
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(() => {
    const shifted = shiftDateByDays(todayIso, 30, 'add', false);
    return shifted.valid ? shifted.resultIso : todayIso;
  });
  const [includeEndDate, setIncludeEndDate] = useState(false);

  const [baseDate, setBaseDate] = useState(todayIso);
  const [offsetDaysStr, setOffsetDaysStr] = useState('45');
  const [businessDaysOnly, setBusinessDaysOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  const betweenResult = useMemo(
    () => calculateDaysBetween(startDate, endDate, includeEndDate),
    [startDate, endDate, includeEndDate]
  );

  const shiftResult = useMemo(() => {
    const parsedDays = /^\d+$/.test(offsetDaysStr.trim())
      ? Number.parseInt(offsetDaysStr.trim(), 10)
      : Number.NaN;
    return shiftDateByDays(
      baseDate,
      parsedDays,
      mode === 'subtract' ? 'subtract' : 'add',
      businessDaysOnly
    );
  }, [baseDate, offsetDaysStr, mode, businessDaysOnly]);

  const hasError = mode === 'between' ? !betweenResult.valid : !shiftResult.valid;

  const handleCopy = async () => {
    let summary = '';
    if (mode === 'between' && betweenResult.valid) {
      summary = [
        'EverydayKit — Days Between Dates',
        `Range: ${betweenResult.startIso} to ${betweenResult.endIso}${includeEndDate ? ' (inclusive)' : ''}`,
        `Total Days: ${betweenResult.totalDays}`,
        `Weeks & Days: ${betweenResult.weeks} week(s), ${betweenResult.remainingDays} day(s)`,
        `Business Days (Mon–Fri): ${betweenResult.businessDays}`,
        `Weekend Days (Sat–Sun): ${betweenResult.weekendDays}`,
      ].join('\n');
    } else if (mode !== 'between' && shiftResult.valid) {
      summary = [
        `EverydayKit — ${mode === 'add' ? 'Add' : 'Subtract'} Days`,
        `Start Date: ${shiftResult.baseIso}`,
        `Offset: ${mode === 'add' ? '+' : '−'}${offsetDaysStr} ${businessDaysOnly ? 'business' : 'calendar'} days`,
        `Target Date: ${shiftResult.resultHuman} (${shiftResult.resultIso})`,
      ].join('\n');
    }
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleReset = () => {
    setStartDate(todayIso);
    const plus30 = shiftDateByDays(todayIso, 30, 'add', false);
    setEndDate(plus30.valid ? plus30.resultIso : todayIso);
    setIncludeEndDate(false);
    setBaseDate(todayIso);
    setOffsetDaysStr('45');
    setBusinessDaysOnly(false);
    setCopied(false);
  };

  const workedExamples = (
    <section
      aria-labelledby="date-worked-examples"
      className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6"
    >
      <h2 id="date-worked-examples" className="font-display text-lg font-extrabold text-on-surface">
        Worked Calendar Examples
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">Leap Year Span</h3>
          <p className="mt-1 font-mono text-xs text-primary">2024-02-01 → 2024-03-01</p>
          <p className="mt-1.5 text-xs text-on-surface-variant">
            Equals <strong>29 days</strong> (vs. 28 days in non-leap year 2025), computed via
            exact UTC Gregorian midnight timestamps.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">Inclusive Counting</h3>
          <p className="mt-1 font-mono text-xs text-primary">Mon → Fri (+1 inclusive)</p>
          <p className="mt-1.5 text-xs text-on-surface-variant">
            Standard elapsed difference is 4 days; enabling <em>Include end date</em> counts all{' '}
            <strong>5 weekdays</strong>.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">Business-Day Deadlines</h3>
          <p className="mt-1 font-mono text-xs text-primary">Add 10 business days</p>
          <p className="mt-1.5 text-xs text-on-surface-variant">
            Automatically skips Saturdays and Sundays (10 business days = 14 calendar days when
            starting on a weekday).
          </p>
        </div>
      </div>
    </section>
  );

  return (
    <ToolPageShell tool={tool} suppressAds={hasError} extraGuideContent={workedExamples}>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copied ? 'Date calculation summary copied to clipboard.' : ''}
      </div>

      <div className="space-y-6">
        {/* Mode Tabs */}
        <div
          role="tablist"
          aria-label="Date calculator modes"
          className="grid grid-cols-1 gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-1.5 sm:grid-cols-3"
        >
          {(
            [
              { id: 'between', label: 'Days Between Dates' },
              { id: 'add', label: 'Add Days to Date' },
              { id: 'subtract', label: 'Subtract Days from Date' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={mode === tab.id}
              onClick={() => setMode(tab.id)}
              className={`min-h-[44px] rounded-xl px-3 text-sm font-bold transition-colors ${
                mode === tab.id
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6">
            {mode === 'between' ? (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="date-start-input"
                      className="text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                    >
                      Start Date
                    </label>
                    <button
                      type="button"
                      onClick={() => setStartDate(todayIso)}
                      className="min-h-[36px] px-2 text-xs font-semibold text-primary hover:underline"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    id="date-start-input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-base font-semibold text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="date-end-input"
                      className="text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                    >
                      End Date
                    </label>
                    <button
                      type="button"
                      onClick={() => setEndDate(todayIso)}
                      className="min-h-[36px] px-2 text-xs font-semibold text-primary hover:underline"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    id="date-end-input"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-base font-semibold text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                  />
                </div>

                <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2.5 text-sm font-medium text-on-surface">
                  <input
                    type="checkbox"
                    checked={includeEndDate}
                    onChange={(e) => setIncludeEndDate(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Include end date in count (+1 day)</span>
                </label>
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="date-base-input"
                      className="text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                    >
                      Starting Date
                    </label>
                    <button
                      type="button"
                      onClick={() => setBaseDate(todayIso)}
                      className="min-h-[36px] px-2 text-xs font-semibold text-primary hover:underline"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    id="date-base-input"
                    type="date"
                    value={baseDate}
                    onChange={(e) => setBaseDate(e.target.value)}
                    className="mt-1 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-base font-semibold text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                  />
                </div>

                <div>
                  <label
                    htmlFor="date-offset-days"
                    className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                  >
                    Number of Days to {mode === 'add' ? 'Add' : 'Subtract'} (0 – 36,500)
                  </label>
                  <input
                    id="date-offset-days"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={36500}
                    step={1}
                    value={offsetDaysStr}
                    onChange={(e) => setOffsetDaysStr(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-lg font-bold text-on-surface tabular-nums focus:border-primary focus:bg-surface-container-lowest"
                  />
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[7, 14, 30, 60, 90, 180, 365].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setOffsetDaysStr(String(preset))}
                        className={`min-h-[36px] rounded-lg px-2.5 font-mono text-xs font-bold ${
                          offsetDaysStr === String(preset)
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        {preset}d
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3.5 py-2.5 text-sm font-medium text-on-surface">
                  <input
                    type="checkbox"
                    checked={businessDaysOnly}
                    onChange={(e) => setBusinessDaysOnly(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Count business days only (Mon–Fri, skip weekends)</span>
                </label>
              </>
            )}

            <div className="border-t border-outline-variant/25 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset Dates
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col justify-between gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6">
            {mode === 'between' ? (
              !betweenResult.valid ? (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl bg-error-container/50 p-4 text-sm text-on-error-container"
                >
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
                  <span>{betweenResult.error}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-5 text-on-primary">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-primary-container">
                      Total Calendar Duration
                    </p>
                    <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
                      {betweenResult.totalDays.toLocaleString('en-US')}{' '}
                      <span className="text-xl font-bold text-on-primary-container">
                        day{betweenResult.totalDays === 1 ? '' : 's'}
                      </span>
                    </p>
                    {betweenResult.isInverted && (
                      <p className="mt-2 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium">
                        Note: End date is earlier than Start date; showing absolute span.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-surface-container-low p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                        Weeks &amp; Days
                      </p>
                      <p className="mt-1 font-mono text-base font-bold text-on-surface tabular-nums">
                        {betweenResult.weeks}w {betweenResult.remainingDays}d
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                        Years / Months / Days
                      </p>
                      <p className="mt-1 font-mono text-base font-bold text-on-surface tabular-nums">
                        {betweenResult.calendarBreakdown.years}y{' '}
                        {betweenResult.calendarBreakdown.months}m{' '}
                        {betweenResult.calendarBreakdown.days}d
                      </p>
                    </div>
                    <div className="rounded-xl bg-tertiary-container/12 p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-tertiary">
                        Business Days (Mon–Fri)
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-tertiary tabular-nums">
                        {betweenResult.businessDays.toLocaleString('en-US')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                        Weekend Days (Sat–Sun)
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-on-surface tabular-nums">
                        {betweenResult.weekendDays.toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : !shiftResult.valid ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl bg-error-container/50 p-4 text-sm text-on-error-container"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
                <span>{shiftResult.error}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-5 text-on-primary">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-primary-container">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    <span>Calculated Target Date</span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
                    {shiftResult.resultHuman}
                  </p>
                  <p className="mt-2 font-mono text-xs text-on-primary-container">
                    ISO: {shiftResult.resultIso} • Weekday: {shiftResult.resultWeekday}
                  </p>
                </div>

                <dl className="divide-y divide-outline-variant/25 text-sm">
                  <div className="flex justify-between py-2.5">
                    <dt className="text-on-surface-variant">Starting Date</dt>
                    <dd className="font-mono font-semibold text-on-surface">
                      {shiftResult.baseIso}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-on-surface-variant">Requested Shift</dt>
                    <dd className="font-mono font-semibold text-on-surface">
                      {mode === 'add' ? '+' : '−'}
                      {offsetDaysStr} {businessDaysOnly ? 'business' : 'calendar'} day(s)
                    </dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-on-surface-variant">Net Calendar Days</dt>
                    <dd className="font-mono font-bold text-primary tabular-nums">
                      {shiftResult.calendarDaysDelta >= 0 ? '+' : ''}
                      {shiftResult.calendarDaysDelta} day(s)
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <div className="border-t border-outline-variant/25 pt-4">
              <button
                type="button"
                disabled={hasError}
                onClick={() => void handleCopy()}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-tertiary" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? 'Copied Summary!' : 'Copy Date Calculation Summary'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ToolPageShell>
  );
}

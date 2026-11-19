import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Copy,
  RotateCcw,
} from 'lucide-react';
import ToolPageShell from '../../components/ToolPageShell';
import {
  convertUnitValue,
  formatConvertedNumber,
  UNIT_DEFINITIONS,
  type PrecisionMode,
  type UnitCategoryId,
} from '../../lib/calculators';
import { getToolById } from '../../lib/toolsCatalog';

const CATEGORY_DEFAULTS: Record<UnitCategoryId, { from: string; to: string; value: string; label: string }> = {
  length: { from: 'm', to: 'ft', value: '10', label: 'Length' },
  weight: { from: 'kg', to: 'lb', value: '5', label: 'Weight / Mass' },
  temperature: { from: 'c', to: 'f', value: '25', label: 'Temperature' },
  volume: { from: 'l', to: 'gal_us', value: '10', label: 'Volume' },
};

export default function UnitConverterPage() {
  const tool = getToolById('unit-converter')!;

  const [category, setCategory] = useState<UnitCategoryId>('length');
  const [fromId, setFromId] = useState('m');
  const [toId, setToId] = useState('ft');
  const [valueStr, setValueStr] = useState('10');
  const [precision, setPrecision] = useState<PrecisionMode>('4');
  const [copiedKind, setCopiedKind] = useState<'value' | 'formula' | null>(null);

  const units = UNIT_DEFINITIONS[category];
  const fromUnit = units.find((u) => u.id === fromId) ?? units[0];
  const toUnit = units.find((u) => u.id === toId) ?? units[1] ?? units[0];

  const numericValue = valueStr.trim() === '' ? Number.NaN : Number(valueStr);

  const conversion = useMemo(
    () => convertUnitValue(category, numericValue, fromUnit.id, toUnit.id),
    [category, numericValue, fromUnit.id, toUnit.id]
  );

  const allEquivalents = useMemo(() => {
    if (!conversion.valid) return [];
    return units.map((unit) => {
      const res = convertUnitValue(category, numericValue, fromUnit.id, unit.id);
      return {
        unit,
        formatted: res.valid ? formatConvertedNumber(res.value, precision) : '—',
      };
    });
  }, [category, numericValue, fromUnit.id, units, precision, conversion.valid]);

  const handleCategoryChange = (next: UnitCategoryId) => {
    const def = CATEGORY_DEFAULTS[next];
    setCategory(next);
    setFromId(def.from);
    setToId(def.to);
    setValueStr(def.value);
    setCopiedKind(null);
  };

  const handleSwap = () => {
    setFromId(toUnit.id);
    setToId(fromUnit.id);
  };

  const handleReset = () => {
    const def = CATEGORY_DEFAULTS[category];
    setFromId(def.from);
    setToId(def.to);
    setValueStr(def.value);
    setPrecision('4');
    setCopiedKind(null);
  };

  const copyText = async (text: string, kind: 'value' | 'formula') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKind(kind);
      setTimeout(() => setCopiedKind(null), 2200);
    } catch {
      // Clipboard unavailable
    }
  };

  const workedExamples = (
    <section
      aria-labelledby="unit-worked-examples"
      className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6"
    >
      <h2 id="unit-worked-examples" className="font-display text-lg font-extrabold text-on-surface">
        NIST SP 811 Reference Identities &amp; Examples
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">Length</h3>
          <p className="mt-1 font-mono text-xs text-primary">1 in = 2.54 cm (exact)</p>
          <p className="mt-1.5 text-xs text-on-surface-variant">
            1 ft = 0.3048 m • 1 mi = 1.609344 km • 1 nmi = 1,852 m.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">Weight / Mass</h3>
          <p className="mt-1 font-mono text-xs text-primary">1 lb = 0.45359237 kg</p>
          <p className="mt-1.5 text-xs text-on-surface-variant">
            1 kg ≈ 2.2046226 lb • 1 oz = 28.349523 g • 1 stone = 14 lb.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">Temperature</h3>
          <p className="mt-1 font-mono text-xs text-primary">°F = (°C × 9/5) + 32</p>
          <p className="mt-1.5 text-xs text-on-surface-variant">
            0 °C = 32 °F = 273.15 K • 100 °C = 212 °F • −40 °C = −40 °F.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low/70 p-4">
          <h3 className="font-display text-sm font-bold text-on-surface">Volume</h3>
          <p className="mt-1 font-mono text-xs text-primary">1 gal (US) = 3.7854118 L</p>
          <p className="mt-1.5 text-xs text-on-surface-variant">
            1 gal (UK) = 4.54609 L • 1 cup (US) ≈ 236.588 mL.
          </p>
        </div>
      </div>
    </section>
  );

  return (
    <ToolPageShell
      tool={tool}
      suppressAds={!conversion.valid}
      extraGuideContent={workedExamples}
    >
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copiedKind ? `Copied ${copiedKind} to clipboard.` : ''}
      </div>

      <div className="space-y-6">
        {/* Category Selector Tabs */}
        <div
          role="tablist"
          aria-label="Measurement categories"
          className="grid grid-cols-2 gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-1.5 sm:grid-cols-4"
        >
          {(Object.keys(CATEGORY_DEFAULTS) as UnitCategoryId[]).map((cat) => (
            <button
              key={cat}
              role="tab"
              type="button"
              aria-selected={category === cat}
              onClick={() => handleCategoryChange(cat)}
              className={`min-h-[44px] rounded-xl px-3 text-xs font-bold transition-colors sm:text-sm ${
                category === cat
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {CATEGORY_DEFAULTS[cat].label}
            </button>
          ))}
        </div>

        {/* 2-Column Converter Workspace */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input Column */}
          <div className="space-y-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6">
            <div>
              <label
                htmlFor="unit-input-value"
                className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
              >
                Input Value ({fromUnit.symbol})
              </label>
              <input
                id="unit-input-value"
                type="number"
                inputMode="decimal"
                step="any"
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                placeholder="Enter number…"
                className="mt-1.5 min-h-[52px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-4 font-mono text-2xl font-bold text-on-surface tabular-nums focus:border-primary focus:bg-surface-container-lowest"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
              <div>
                <label
                  htmlFor="unit-from-select"
                  className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                >
                  From Unit
                </label>
                <select
                  id="unit-from-select"
                  value={fromUnit.id}
                  onChange={(e) => setFromId(e.target.value)}
                  className="mt-1.5 min-h-[46px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-semibold text-on-surface"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSwap}
                aria-label={`Swap ${fromUnit.name} and ${toUnit.name}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low text-primary hover:bg-surface-container sm:w-11"
              >
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-bold sm:hidden">Swap Units</span>
              </button>

              <div>
                <label
                  htmlFor="unit-to-select"
                  className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                >
                  To Unit
                </label>
                <select
                  id="unit-to-select"
                  value={toUnit.id}
                  onChange={(e) => setToId(e.target.value)}
                  className="mt-1.5 min-h-[46px] w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-semibold text-on-surface"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Precision Selector */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Display Precision
              </span>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {(
                  [
                    { id: '2', label: '2 dec' },
                    { id: '4', label: '4 dec' },
                    { id: '6', label: '6 dec' },
                    { id: 'sci', label: 'Scientific' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={precision === p.id}
                    onClick={() => setPrecision(p.id)}
                    className={`min-h-[40px] rounded-lg font-mono text-xs font-bold transition-colors ${
                      precision === p.id
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-outline-variant/25 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset Category
              </button>
            </div>
          </div>

          {/* Output & Formula Proof Column */}
          <div className="flex flex-col justify-between gap-5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 sm:p-6">
            {!conversion.valid ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl bg-error-container/50 p-4 text-sm text-on-error-container"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
                <span>{conversion.error}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-container p-5 text-on-primary">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-primary-container">
                    Converted Result ({toUnit.name})
                  </p>
                  <p className="mt-1 break-all font-display text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                    {formatConvertedNumber(conversion.value, precision)}{' '}
                    <span className="text-xl font-bold text-on-primary-container">
                      {toUnit.symbol}
                    </span>
                  </p>
                  <p className="mt-2 font-mono text-xs text-on-primary-container">
                    {conversion.identityText}
                  </p>
                </div>

                {conversion.warning && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-error/30 bg-error-container/40 p-3.5 text-xs text-on-error-container"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" aria-hidden="true" />
                    <span>{conversion.warning}</span>
                  </div>
                )}

                <div className="space-y-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Formula &amp; Derivation
                  </p>
                  <p className="font-mono text-xs font-bold text-on-surface">
                    {conversion.formulaText}
                  </p>
                  <p className="font-mono text-xs text-on-surface-variant">
                    {conversion.expansionText}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-outline-variant/25 pt-4">
              <button
                type="button"
                disabled={!conversion.valid}
                onClick={() =>
                  void copyText(
                    `${formatConvertedNumber(conversion.value, precision)} ${toUnit.symbol}`,
                    'value'
                  )
                }
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40"
              >
                {copiedKind === 'value' ? (
                  <Check className="h-4 w-4 text-tertiary" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copiedKind === 'value' ? 'Copied Value' : 'Copy Value'}
              </button>
              <button
                type="button"
                disabled={!conversion.valid}
                onClick={() =>
                  void copyText(
                    `${valueStr} ${fromUnit.symbol} = ${formatConvertedNumber(conversion.value, precision)} ${toUnit.symbol} (${conversion.formulaText})`,
                    'formula'
                  )
                }
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-xs font-bold text-on-surface hover:bg-surface-container-low disabled:opacity-40"
              >
                {copiedKind === 'formula' ? (
                  <Check className="h-4 w-4 text-tertiary" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                Copy Derivation
              </button>
            </div>
          </div>
        </div>

        {/* Simultaneous Multi-Unit Reference Table */}
        {conversion.valid && (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
            <h2 className="font-display text-base font-bold text-on-surface">
              All {CATEGORY_DEFAULTS[category].label} Equivalents for {valueStr} {fromUnit.symbol}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {allEquivalents.map(({ unit, formatted }) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setToId(unit.id)}
                  className={`flex min-h-[56px] items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                    unit.id === toUnit.id
                      ? 'border-primary bg-primary-fixed/35'
                      : 'border-outline-variant/30 bg-surface-container-low/40 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-on-surface">{unit.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{unit.system}</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-bold text-primary tabular-nums">
                    {formatted} <span className="text-xs font-normal text-on-surface-variant">{unit.symbol}</span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}

/**
 * Pure deterministic calculation engines for:
 * 1. Percentage & Discount Calculator (Discount/Sale, Percentage Change, Basic %, Margin/Markup)
 * 2. Unit Converter (Length, Weight, Temperature, Volume — NIST SP 811 / BIPM SI)
 * 3. Date Calculator (Days Between, Add Days, Subtract Days — UTC Gregorian math)
 */

export const MAX_CALC_MAGNITUDE = 1e12;

export function roundHalfUp(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  const shifted = value * factor;
  const rounded = shifted >= 0 ? Math.floor(shifted + 0.5 + 1e-12) : Math.ceil(shifted - 0.5 - 1e-12);
  const res = rounded / factor;
  return Object.is(res, -0) ? 0 : res;
}

export function cleanFloat(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const cleaned = Number.parseFloat(value.toPrecision(12));
  return Object.is(cleaned, -0) ? 0 : cleaned;
}

/* ==========================================================================
   1. PERCENTAGE & DISCOUNT CALCULATOR
   ========================================================================== */

export interface DiscountCalcInput {
  originalPrice: number;
  discountPercent: number;
  extraCouponPercent?: number; // sequential stackable coupon
  taxPercent?: number;
}

export interface DiscountCalcResult {
  valid: boolean;
  error?: string;
  originalPrice: number;
  primarySavings: number;
  subtotalAfterPrimary: number;
  couponSavings: number;
  subtotalAfterDiscounts: number;
  taxAmount: number;
  finalPrice: number;
  totalSavings: number;
  effectiveDiscountPercent: number;
}

export function calculateDiscount(input: DiscountCalcInput): DiscountCalcResult {
  const { originalPrice, discountPercent, extraCouponPercent = 0, taxPercent = 0 } = input;

  if (!Number.isFinite(originalPrice) || originalPrice < 0 || originalPrice > MAX_CALC_MAGNITUDE) {
    return {
      valid: false,
      error: 'Enter an original price between 0 and 1,000,000,000,000.',
      originalPrice: 0,
      primarySavings: 0,
      subtotalAfterPrimary: 0,
      couponSavings: 0,
      subtotalAfterDiscounts: 0,
      taxAmount: 0,
      finalPrice: 0,
      totalSavings: 0,
      effectiveDiscountPercent: 0,
    };
  }
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return {
      valid: false,
      error: 'Enter a discount percentage between 0% and 100%.',
      originalPrice,
      primarySavings: 0,
      subtotalAfterPrimary: originalPrice,
      couponSavings: 0,
      subtotalAfterDiscounts: originalPrice,
      taxAmount: 0,
      finalPrice: originalPrice,
      totalSavings: 0,
      effectiveDiscountPercent: 0,
    };
  }
  if (!Number.isFinite(extraCouponPercent) || extraCouponPercent < 0 || extraCouponPercent > 100) {
    return {
      valid: false,
      error: 'Extra coupon percentage must be between 0% and 100%.',
      originalPrice,
      primarySavings: 0,
      subtotalAfterPrimary: originalPrice,
      couponSavings: 0,
      subtotalAfterDiscounts: originalPrice,
      taxAmount: 0,
      finalPrice: originalPrice,
      totalSavings: 0,
      effectiveDiscountPercent: 0,
    };
  }
  if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    return {
      valid: false,
      error: 'Sales tax percentage must be between 0% and 100%.',
      originalPrice,
      primarySavings: 0,
      subtotalAfterPrimary: originalPrice,
      couponSavings: 0,
      subtotalAfterDiscounts: originalPrice,
      taxAmount: 0,
      finalPrice: originalPrice,
      totalSavings: 0,
      effectiveDiscountPercent: 0,
    };
  }

  const primarySavingsRaw = (originalPrice * discountPercent) / 100;
  const subtotalAfterPrimaryRaw = originalPrice - primarySavingsRaw;
  const couponSavingsRaw = (subtotalAfterPrimaryRaw * extraCouponPercent) / 100;
  const subtotalAfterDiscountsRaw = subtotalAfterPrimaryRaw - couponSavingsRaw;
  const taxAmountRaw = (subtotalAfterDiscountsRaw * taxPercent) / 100;
  const finalPriceRaw = subtotalAfterDiscountsRaw + taxAmountRaw;
  const totalSavingsRaw = primarySavingsRaw + couponSavingsRaw;
  const effectiveDiscountPercent =
    originalPrice > 0 ? (totalSavingsRaw / originalPrice) * 100 : 0;

  return {
    valid: true,
    originalPrice: roundHalfUp(originalPrice, 2),
    primarySavings: roundHalfUp(primarySavingsRaw, 2),
    subtotalAfterPrimary: roundHalfUp(subtotalAfterPrimaryRaw, 2),
    couponSavings: roundHalfUp(couponSavingsRaw, 2),
    subtotalAfterDiscounts: roundHalfUp(subtotalAfterDiscountsRaw, 2),
    taxAmount: roundHalfUp(taxAmountRaw, 2),
    finalPrice: roundHalfUp(finalPriceRaw, 2),
    totalSavings: roundHalfUp(totalSavingsRaw, 2),
    effectiveDiscountPercent: roundHalfUp(effectiveDiscountPercent, 2),
  };
}

export interface PercentageChangeResult {
  valid: boolean;
  error?: string;
  originalValue: number;
  newValue: number;
  absoluteChange: number;
  percentChange: number;
  direction: 'increase' | 'decrease' | 'no-change';
  multiplier: number;
}

export function calculatePercentageChange(
  originalValue: number,
  newValue: number
): PercentageChangeResult {
  if (!Number.isFinite(originalValue) || !Number.isFinite(newValue)) {
    return {
      valid: false,
      error: 'Enter valid finite numbers for both Original Value and New Value.',
      originalValue: 0,
      newValue: 0,
      absoluteChange: 0,
      percentChange: 0,
      direction: 'no-change',
      multiplier: 0,
    };
  }
  if (Math.abs(originalValue) > MAX_CALC_MAGNITUDE || Math.abs(newValue) > MAX_CALC_MAGNITUDE) {
    return {
      valid: false,
      error: 'Values must be within ±1,000,000,000,000.',
      originalValue,
      newValue,
      absoluteChange: 0,
      percentChange: 0,
      direction: 'no-change',
      multiplier: 0,
    };
  }
  if (originalValue === 0) {
    return {
      valid: false,
      error: 'Percentage change is undefined when the original value is 0 (division by zero).',
      originalValue,
      newValue,
      absoluteChange: cleanFloat(newValue - originalValue),
      percentChange: 0,
      direction: 'no-change',
      multiplier: 0,
    };
  }

  const absoluteChange = cleanFloat(newValue - originalValue);
  const percentChange = cleanFloat((absoluteChange / Math.abs(originalValue)) * 100);
  const multiplier = cleanFloat(newValue / originalValue);
  const direction =
    percentChange > 0 ? 'increase' : percentChange < 0 ? 'decrease' : 'no-change';

  return {
    valid: true,
    originalValue,
    newValue,
    absoluteChange,
    percentChange,
    direction,
    multiplier,
  };
}

export function calculatePercentOf(percent: number, base: number): { valid: boolean; result: number; error?: string } {
  if (!Number.isFinite(percent) || !Number.isFinite(base)) {
    return { valid: false, result: 0, error: 'Enter valid numeric values.' };
  }
  return { valid: true, result: cleanFloat((percent / 100) * base) };
}

export function calculateWhatPercent(part: number, whole: number): { valid: boolean; percent: number; error?: string } {
  if (!Number.isFinite(part) || !Number.isFinite(whole)) {
    return { valid: false, percent: 0, error: 'Enter valid numeric values.' };
  }
  if (whole === 0) {
    return { valid: false, percent: 0, error: 'Total value cannot be 0 (division by zero).' };
  }
  return { valid: true, percent: cleanFloat((part / whole) * 100) };
}

export interface MarginMarkupResult {
  valid: boolean;
  error?: string;
  cost: number;
  revenue: number;
  profit: number;
  marginPercent: number;
  markupPercent: number;
}

export function calculateMarginMarkup(cost: number, revenue: number): MarginMarkupResult {
  if (!Number.isFinite(cost) || !Number.isFinite(revenue) || cost < 0 || revenue < 0) {
    return {
      valid: false,
      error: 'Enter non-negative numbers for Cost and Selling Price.',
      cost: 0,
      revenue: 0,
      profit: 0,
      marginPercent: 0,
      markupPercent: 0,
    };
  }
  if (cost === 0 && revenue === 0) {
    return {
      valid: false,
      error: 'Enter a cost or selling price greater than 0.',
      cost,
      revenue,
      profit: 0,
      marginPercent: 0,
      markupPercent: 0,
    };
  }

  const profit = roundHalfUp(revenue - cost, 2);
  const marginPercent = revenue > 0 ? roundHalfUp(((revenue - cost) / revenue) * 100, 2) : 0;
  const markupPercent = cost > 0 ? roundHalfUp(((revenue - cost) / cost) * 100, 2) : 0;

  return {
    valid: true,
    cost: roundHalfUp(cost, 2),
    revenue: roundHalfUp(revenue, 2),
    profit,
    marginPercent,
    markupPercent,
  };
}

/* ==========================================================================
   2. UNIT CONVERTER (Length, Weight, Temperature, Volume — NIST SP 811)
   ========================================================================== */

export type UnitCategoryId = 'length' | 'weight' | 'temperature' | 'volume';

export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  system: 'Metric (SI)' | 'Imperial / US' | 'Imperial (UK)' | 'Thermodynamic';
  /** Multiplicative factor to convert 1 unit -> base unit (m, kg, L). Unused for temperature. */
  toBase?: number;
}

export const UNIT_DEFINITIONS: Record<UnitCategoryId, UnitDefinition[]> = {
  length: [
    { id: 'mm', name: 'Millimeters', symbol: 'mm', system: 'Metric (SI)', toBase: 0.001 },
    { id: 'cm', name: 'Centimeters', symbol: 'cm', system: 'Metric (SI)', toBase: 0.01 },
    { id: 'm', name: 'Meters', symbol: 'm', system: 'Metric (SI)', toBase: 1 },
    { id: 'km', name: 'Kilometers', symbol: 'km', system: 'Metric (SI)', toBase: 1000 },
    { id: 'in', name: 'Inches', symbol: 'in', system: 'Imperial / US', toBase: 0.0254 },
    { id: 'ft', name: 'Feet', symbol: 'ft', system: 'Imperial / US', toBase: 0.3048 },
    { id: 'yd', name: 'Yards', symbol: 'yd', system: 'Imperial / US', toBase: 0.9144 },
    { id: 'mi', name: 'Statute Miles', symbol: 'mi', system: 'Imperial / US', toBase: 1609.344 },
    { id: 'nmi', name: 'Nautical Miles', symbol: 'nmi', system: 'Metric (SI)', toBase: 1852 },
  ],
  weight: [
    { id: 'mg', name: 'Milligrams', symbol: 'mg', system: 'Metric (SI)', toBase: 1e-6 },
    { id: 'g', name: 'Grams', symbol: 'g', system: 'Metric (SI)', toBase: 0.001 },
    { id: 'kg', name: 'Kilograms', symbol: 'kg', system: 'Metric (SI)', toBase: 1 },
    { id: 't', name: 'Metric Tonnes', symbol: 't', system: 'Metric (SI)', toBase: 1000 },
    { id: 'oz', name: 'Ounces', symbol: 'oz', system: 'Imperial / US', toBase: 0.028349523125 },
    { id: 'lb', name: 'Pounds', symbol: 'lb', system: 'Imperial / US', toBase: 0.45359237 },
    { id: 'st', name: 'Stone (UK)', symbol: 'st', system: 'Imperial (UK)', toBase: 6.35029318 },
  ],
  temperature: [
    { id: 'c', name: 'Celsius', symbol: '°C', system: 'Metric (SI)' },
    { id: 'f', name: 'Fahrenheit', symbol: '°F', system: 'Imperial / US' },
    { id: 'k', name: 'Kelvin', symbol: 'K', system: 'Thermodynamic' },
  ],
  volume: [
    { id: 'ml', name: 'Milliliters', symbol: 'mL', system: 'Metric (SI)', toBase: 0.001 },
    { id: 'l', name: 'Liters', symbol: 'L', system: 'Metric (SI)', toBase: 1 },
    { id: 'm3', name: 'Cubic Meters', symbol: 'm³', system: 'Metric (SI)', toBase: 1000 },
    { id: 'tsp', name: 'Teaspoons (US)', symbol: 'tsp', system: 'Imperial / US', toBase: 0.00492892159375 },
    { id: 'tbsp', name: 'Tablespoons (US)', symbol: 'tbsp', system: 'Imperial / US', toBase: 0.01478676478125 },
    { id: 'floz', name: 'Fluid Ounces (US)', symbol: 'fl oz', system: 'Imperial / US', toBase: 0.0295735295625 },
    { id: 'cup', name: 'Cups (US)', symbol: 'cup', system: 'Imperial / US', toBase: 0.2365882365 },
    { id: 'pt', name: 'Pints (US)', symbol: 'pt', system: 'Imperial / US', toBase: 0.473176473 },
    { id: 'qt', name: 'Quarts (US)', symbol: 'qt', system: 'Imperial / US', toBase: 0.946352946 },
    { id: 'gal_us', name: 'Gallons (US)', symbol: 'gal (US)', system: 'Imperial / US', toBase: 3.785411784 },
    { id: 'gal_uk', name: 'Gallons (UK)', symbol: 'gal (UK)', system: 'Imperial (UK)', toBase: 4.54609 },
  ],
};

export interface UnitConversionResult {
  valid: boolean;
  error?: string;
  warning?: string;
  value: number;
  identityText: string;
  formulaText: string;
  expansionText: string;
}

export function convertUnitValue(
  category: UnitCategoryId,
  value: number,
  fromId: string,
  toId: string
): UnitConversionResult {
  if (!Number.isFinite(value)) {
    return {
      valid: false,
      error: 'Enter a valid finite number (standard or scientific notation, e.g. 1250 or 1.5e3).',
      value: 0,
      identityText: '',
      formulaText: '',
      expansionText: '',
    };
  }

  const units = UNIT_DEFINITIONS[category];
  const fromUnit = units.find((u) => u.id === fromId);
  const toUnit = units.find((u) => u.id === toId);

  if (!fromUnit || !toUnit) {
    return {
      valid: false,
      error: 'Selected units do not belong to the active category.',
      value: 0,
      identityText: '',
      formulaText: '',
      expansionText: '',
    };
  }

  if (category === 'temperature') {
    let celsius: number;
    if (fromId === 'c') celsius = value;
    else if (fromId === 'f') celsius = ((value - 32) * 5) / 9;
    else celsius = value - 273.15;

    let warning: string | undefined;
    if (celsius < -273.15 - 1e-9) {
      warning =
        'Value is below absolute zero (−273.15°C / −459.67°F / 0 K). Mathematical conversion is shown below.';
    }

    let result: number;
    let formulaText: string;
    let identityText: string;
    let expansionText: string;

    if (fromId === toId) {
      result = value;
      identityText = `1 ${fromUnit.symbol} = 1 ${toUnit.symbol}`;
      formulaText = `T(${toUnit.symbol}) = T(${fromUnit.symbol})`;
      expansionText = `${value} = ${value}`;
    } else if (fromId === 'c' && toId === 'f') {
      result = cleanFloat((value * 9) / 5 + 32);
      identityText = '0 °C = 32 °F; Δ1 °C = Δ1.8 °F';
      formulaText = 'T(°F) = T(°C) × 9/5 + 32';
      expansionText = `(${value} × 1.8) + 32 = ${result}`;
    } else if (fromId === 'f' && toId === 'c') {
      result = cleanFloat(((value - 32) * 5) / 9);
      identityText = '32 °F = 0 °C; Δ1 °F = Δ5/9 °C';
      formulaText = 'T(°C) = (T(°F) − 32) × 5/9';
      expansionText = `(${value} − 32) × 5/9 = ${result}`;
    } else if (fromId === 'c' && toId === 'k') {
      result = cleanFloat(value + 273.15);
      identityText = '0 °C = 273.15 K';
      formulaText = 'T(K) = T(°C) + 273.15';
      expansionText = `${value} + 273.15 = ${result}`;
    } else if (fromId === 'k' && toId === 'c') {
      result = cleanFloat(value - 273.15);
      identityText = '273.15 K = 0 °C';
      formulaText = 'T(°C) = T(K) − 273.15';
      expansionText = `${value} − 273.15 = ${result}`;
    } else if (fromId === 'f' && toId === 'k') {
      result = cleanFloat(((value - 32) * 5) / 9 + 273.15);
      identityText = '32 °F = 273.15 K';
      formulaText = 'T(K) = (T(°F) − 32) × 5/9 + 273.15';
      expansionText = `((${value} − 32) × 5/9) + 273.15 = ${result}`;
    } else {
      result = cleanFloat(((value - 273.15) * 9) / 5 + 32);
      identityText = '273.15 K = 32 °F';
      formulaText = 'T(°F) = (T(K) − 273.15) × 9/5 + 32';
      expansionText = `((${value} − 273.15) × 1.8) + 32 = ${result}`;
    }

    return {
      valid: true,
      warning,
      value: result,
      identityText,
      formulaText,
      expansionText,
    };
  }

  const fromFactor = fromUnit.toBase ?? 1;
  const toFactor = toUnit.toBase ?? 1;
  const ratio = cleanFloat(fromFactor / toFactor);
  const result = cleanFloat((value * fromFactor) / toFactor);

  return {
    valid: true,
    value: result,
    identityText: `1 ${fromUnit.symbol} = ${ratio} ${toUnit.symbol}`,
    formulaText: `x(${toUnit.symbol}) = x(${fromUnit.symbol}) × ${ratio}`,
    expansionText: `${value} × ${ratio} = ${result}`,
  };
}

export type PrecisionMode = '2' | '4' | '6' | 'sci';

export function formatConvertedNumber(value: number, precision: PrecisionMode): string {
  if (!Number.isFinite(value)) return '—';
  if (precision === 'sci') {
    return value.toExponential(4);
  }
  const decimals = Number.parseInt(precision, 10);
  if (Math.abs(value) >= 1e12 || (value !== 0 && Math.abs(value) < Math.pow(10, -decimals))) {
    return value.toExponential(4);
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ==========================================================================
   3. DATE CALCULATOR (Days Between, Add Days, Subtract Days — UTC Gregorian)
   ========================================================================== */

const MS_PER_DAY = 86_400_000;
const MAX_OFFSET_DAYS = 36_500;

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function parseIsoDateUtc(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatIsoDateUtc(date: Date): string {
  const y = String(date.getUTCFullYear()).padStart(4, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatHumanDateUtc(date: Date): string {
  const weekday = WEEKDAY_NAMES[date.getUTCDay()];
  const month = MONTH_NAMES[date.getUTCMonth()];
  return `${weekday}, ${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function getTodayIsoLocal(): string {
  const now = new Date();
  const y = String(now.getFullYear()).padStart(4, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface DaysBetweenResult {
  valid: boolean;
  error?: string;
  startIso: string;
  endIso: string;
  isInverted: boolean;
  totalDays: number;
  weeks: number;
  remainingDays: number;
  businessDays: number;
  weekendDays: number;
  calendarBreakdown: { years: number; months: number; days: number };
}

function computeCalendarYmd(earlier: Date, later: Date): { years: number; months: number; days: number } {
  let years = later.getUTCFullYear() - earlier.getUTCFullYear();
  let months = later.getUTCMonth() - earlier.getUTCMonth();
  let days = later.getUTCDate() - earlier.getUTCDate();

  if (days < 0) {
    // Days in the month immediately before `later`
    const prevMonthLastDay = new Date(Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), 0)).getUTCDate();
    days += prevMonthLastDay;
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }
  return { years, months, days };
}

export function calculateDaysBetween(
  startIso: string,
  endIso: string,
  includeEndDate = false
): DaysBetweenResult {
  const start = parseIsoDateUtc(startIso);
  const end = parseIsoDateUtc(endIso);

  if (!start || !end) {
    return {
      valid: false,
      error: 'Select valid Start and End dates in YYYY-MM-DD format.',
      startIso,
      endIso,
      isInverted: false,
      totalDays: 0,
      weeks: 0,
      remainingDays: 0,
      businessDays: 0,
      weekendDays: 0,
      calendarBreakdown: { years: 0, months: 0, days: 0 },
    };
  }

  const isInverted = end.getTime() < start.getTime();
  const earlier = isInverted ? end : start;
  const later = isInverted ? start : end;

  const rawDiffDays = Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY);
  const totalDays = includeEndDate ? rawDiffDays + 1 : rawDiffDays;

  // Count business days (Mon-Fri) and weekend days across the interval
  let businessDays = 0;
  let weekendDays = 0;

  if (totalDays > 0) {
    // Fast O(1) full weeks + remainder days calculation
    const fullWeeks = Math.floor(totalDays / 7);
    businessDays = fullWeeks * 5;
    weekendDays = fullWeeks * 2;
    const rem = totalDays % 7;
    const startDow = earlier.getUTCDay();
    for (let i = 0; i < rem; i++) {
      const dow = (startDow + i) % 7;
      if (dow === 0 || dow === 6) weekendDays++;
      else businessDays++;
    }
  }

  const breakdownEnd = includeEndDate
    ? new Date(later.getTime() + MS_PER_DAY)
    : later;

  return {
    valid: true,
    startIso: formatIsoDateUtc(start),
    endIso: formatIsoDateUtc(end),
    isInverted,
    totalDays,
    weeks: Math.floor(totalDays / 7),
    remainingDays: totalDays % 7,
    businessDays,
    weekendDays,
    calendarBreakdown: computeCalendarYmd(earlier, breakdownEnd),
  };
}

export interface ShiftDateResult {
  valid: boolean;
  error?: string;
  baseIso: string;
  resultIso: string;
  resultHuman: string;
  resultWeekday: string;
  calendarDaysDelta: number;
}

export function shiftDateByDays(
  baseIso: string,
  days: number,
  direction: 'add' | 'subtract',
  businessDaysOnly = false
): ShiftDateResult {
  const base = parseIsoDateUtc(baseIso);
  if (!base) {
    return {
      valid: false,
      error: 'Select a valid starting date in YYYY-MM-DD format.',
      baseIso,
      resultIso: '',
      resultHuman: '',
      resultWeekday: '',
      calendarDaysDelta: 0,
    };
  }

  if (!Number.isInteger(days) || days < 0 || days > MAX_OFFSET_DAYS) {
    return {
      valid: false,
      error: `Enter a whole number of days between 0 and ${MAX_OFFSET_DAYS.toLocaleString('en-US')}.`,
      baseIso,
      resultIso: '',
      resultHuman: '',
      resultWeekday: '',
      calendarDaysDelta: 0,
    };
  }

  const step = direction === 'add' ? 1 : -1;
  let target: Date;

  if (!businessDaysOnly) {
    target = new Date(base.getTime() + step * days * MS_PER_DAY);
  } else {
    let remaining = days;
    let cursorMs = base.getTime();
    while (remaining > 0) {
      cursorMs += step * MS_PER_DAY;
      const dow = new Date(cursorMs).getUTCDay();
      if (dow !== 0 && dow !== 6) {
        remaining--;
      }
    }
    target = new Date(cursorMs);
  }

  const calendarDaysDelta = Math.round((target.getTime() - base.getTime()) / MS_PER_DAY);

  return {
    valid: true,
    baseIso: formatIsoDateUtc(base),
    resultIso: formatIsoDateUtc(target),
    resultHuman: formatHumanDateUtc(target),
    resultWeekday: WEEKDAY_NAMES[target.getUTCDay()],
    calendarDaysDelta,
  };
}

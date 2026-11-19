/**
 * Authoritative EverydayKit v1 tool catalog, SEO metadata, limits,
 * instructions, limitations, and FAQs.
 */

export type ToolCategory = 'pdf' | 'images' | 'calculators';

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  id: string;
  code: string;
  name: string;
  shortName: string;
  category: ToolCategory;
  categoryLabel: string;
  path: string;
  title: string;
  metaDescription: string;
  h1: string;
  summary: string;
  keywords: string[];
  supportedFormats: string[];
  limits: { label: string; value: string }[];
  howToSteps: string[];
  limitations: string[];
  faqs: ToolFaq[];
  relatedToolIds: string[];
  isFileTool: boolean;
}

export const TOOLS_CATALOG: ToolDefinition[] = [
  {
    id: 'merge-pdf',
    code: 'PDF-01',
    name: 'Merge PDF Files',
    shortName: 'Merge PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    path: '/tools/merge-pdf',
    title: 'Merge PDF Files Online Free — Local Browser Tool | EverydayKit',
    metaDescription:
      'Combine up to 20 PDF files (50 MB total) in any order directly in your browser. Zero uploads, private local processing, instant download.',
    h1: 'Merge PDF Files',
    summary:
      'Combine multiple PDF documents into a single ordered PDF file directly in your browser memory. Reorder files before merging with zero server uploads.',
    keywords: ['merge', 'pdf', 'combine', 'join', 'documents', 'order', 'pages', 'invoice'],
    supportedFormats: ['PDF (.pdf, application/pdf)'],
    limits: [
      { label: 'Maximum Files', value: '20 PDF files per merge' },
      { label: 'Total Size Limit', value: '50 MB combined' },
      { label: 'Minimum Files', value: '2 PDF files' },
      { label: 'Output Filename', value: 'merged-document.pdf (customizable)' },
    ],
    howToSteps: [
      'Select or drag and drop 2 to 20 PDF files from your device (up to 50 MB total).',
      'Review each file’s page count and size, then reorder the queue using the Up/Down buttons, Invert, or A–Z controls.',
      'Optionally customize the output filename and click Merge PDFs.',
      'Download the merged PDF directly from browser memory and click Reset to clear loaded files.',
    ],
    limitations: [
      'Password-protected or encrypted PDFs cannot be decrypted without removing the password first.',
      'Interactive AcroForm fields, digital signatures, and complex JavaScript actions may be flattened or omitted depending on source PDF structure.',
      'Very large or high-DPI scanned PDFs near the 50 MB limit require sufficient free device RAM.',
    ],
    faqs: [
      {
        question: 'Are my PDF files uploaded to a server when merging?',
        answer:
          'No. EverydayKit reads and merges your PDFs entirely inside your browser using a client-side Web Worker and pdf-lib. You can verify zero file uploads in your browser’s Network tab.',
      },
      {
        question: 'How many PDF files can I merge at once?',
        answer:
          'You can merge between 2 and 20 PDF files in a single job, with a combined size ceiling of 50 MB to keep browser memory responsive on both desktop and mobile devices.',
      },
      {
        question: 'Can I reorder files before merging?',
        answer:
          'Yes. Use the Up and Down buttons on each item (fully keyboard accessible), drag rows on desktop, or use the Invert Order and Sort A–Z controls.',
      },
      {
        question: 'What happens if one of my PDFs is password-protected or damaged?',
        answer:
          'EverydayKit validates every PDF header and structure locally before merging and shows a specific error identifying the affected file so you can remove or unlock it.',
      },
    ],
    relatedToolIds: ['split-pdf', 'images-to-pdf', 'resize-compress-image'],
    isFileTool: true,
  },
  {
    id: 'split-pdf',
    code: 'PDF-02',
    name: 'Split PDF by Page Ranges',
    shortName: 'Split PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    path: '/tools/split-pdf',
    title: 'Split PDF by Page Ranges Online Free — Private Local Tool | EverydayKit',
    metaDescription:
      'Extract specific pages or split a PDF into multiple documents or a ZIP archive directly in your browser. Up to 50 MB, zero uploads.',
    h1: 'Split PDF by Page Ranges',
    summary:
      'Extract specific pages or custom page ranges (such as 1-3, 5, 8-10) into one new PDF or separate PDFs packaged in a ZIP archive, processed locally in your browser.',
    keywords: ['split', 'pdf', 'extract', 'pages', 'ranges', 'separate', 'zip'],
    supportedFormats: ['PDF (.pdf, application/pdf)'],
    limits: [
      { label: 'Input File Count', value: '1 PDF file at a time' },
      { label: 'Maximum File Size', value: '50 MB' },
      { label: 'Range Syntax', value: 'Commas and hyphens (e.g. 1-3, 5, 8-10)' },
      { label: 'Output Formats', value: 'Single PDF (.pdf) or ZIP archive (.zip)' },
    ],
    howToSteps: [
      'Choose or drop one PDF file (up to 50 MB) from your device.',
      'Type page ranges (e.g., 1-4, 8, 12-15) or click page tiles in the page matrix to toggle pages.',
      'Choose whether to combine selected pages into one PDF, export each range as its own PDF in a ZIP, or split every page into a separate PDF in a ZIP.',
      'Click Split PDF to generate and download your result locally.',
    ],
    limitations: [
      'Password-protected PDFs must be unlocked before splitting.',
      'Page ranges cannot reference page numbers below 1 or above the document’s actual page count.',
      'ZIP export stores individual PDFs cleanly inside a standard ZIP archive for multi-file downloads.',
    ],
    faqs: [
      {
        question: 'How do I write page ranges?',
        answer:
          'Separate individual pages or spans with commas, and use hyphens for continuous ranges—for example, 1-3, 5, 8-10. EverydayKit validates your syntax immediately before processing.',
      },
      {
        question: 'Can I extract each range or every page into separate PDF files?',
        answer:
          'Yes. Select "Save each range as a separate PDF (ZIP)" or "Split every page into individual PDFs (ZIP)" to receive a single organized ZIP archive.',
      },
      {
        question: 'Does splitting change the original PDF file on my device?',
        answer:
          'Never. EverydayKit reads a copy of your file in memory and generates brand-new output bytes without modifying your original file.',
      },
      {
        question: 'What is the maximum PDF size for splitting?',
        answer:
          'EverydayKit supports PDF files up to 50 MB locally in the browser to prevent out-of-memory tab crashes.',
      },
    ],
    relatedToolIds: ['merge-pdf', 'images-to-pdf', 'resize-compress-image'],
    isFileTool: true,
  },
  {
    id: 'images-to-pdf',
    code: 'PDF-03',
    name: 'Convert Images to PDF',
    shortName: 'Images to PDF',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    path: '/tools/images-to-pdf',
    title: 'Convert JPG & PNG Images to PDF Free — Local Browser Tool | EverydayKit',
    metaDescription:
      'Turn up to 50 JPG or PNG images into a clean multi-page PDF with A4, US Letter, or Fit-to-Image sizing and margin controls. Zero uploads.',
    h1: 'Convert JPG and PNG Images to PDF',
    summary:
      'Combine JPG and PNG photos, receipts, or scanned pages into a formatted multi-page PDF with page size, orientation, margin, and ordering controls.',
    keywords: ['images', 'jpg', 'jpeg', 'png', 'pdf', 'convert', 'scan', 'photos', 'receipts'],
    supportedFormats: ['JPEG (.jpg, .jpeg)', 'PNG (.png)'],
    limits: [
      { label: 'Maximum Images', value: '50 images per PDF' },
      { label: 'Total Size Limit', value: '50 MB combined' },
      { label: 'Page Sizes', value: 'A4, US Letter, or Fit to Image' },
      { label: 'Margins', value: 'None (0 pt), Small (18 pt), Standard (36 pt)' },
    ],
    howToSteps: [
      'Select or drop up to 50 JPG or PNG images (50 MB total max).',
      'Reorder images in the exact sequence you want pages to appear.',
      'Choose page size (A4, US Letter, or Fit to Image), orientation (Auto, Portrait, or Landscape), and margins.',
      'Click Convert to PDF and download your generated PDF locally.',
    ],
    limitations: [
      'Only JPG/JPEG and PNG images are accepted for direct PDF embedding. Convert WebP images first with the Resize & Compress Image tool.',
      'Animated PNGs embed as static frames; CMYK JPEGs may render differently depending on viewer color profiles.',
      'Output file size reflects the embedded source images; compress large photos first if you need a smaller PDF.',
    ],
    faqs: [
      {
        question: 'Which image formats are supported?',
        answer:
          'JPG/JPEG and PNG files are supported and verified by file signature before conversion. If you have a WebP image, convert it to JPG or PNG using our Resize & Compress Image tool first.',
      },
      {
        question: 'How does Auto orientation work?',
        answer:
          'When Auto orientation is selected with A4 or US Letter, wide landscape images are placed on landscape pages and tall portrait images are placed on portrait pages.',
      },
      {
        question: 'Will my images lose quality when converted to PDF?',
        answer:
          'EverydayKit embeds your JPG and PNG image streams directly into the PDF pages without re-compressing them, preserving original sharpness.',
      },
      {
        question: 'Can I remove or reorder images before creating the PDF?',
        answer:
          'Yes. Each image card shows a local thumbnail preview, dimensions, file size, Up/Down reorder buttons, and a Remove button.',
      },
    ],
    relatedToolIds: ['resize-compress-image', 'merge-pdf', 'split-pdf'],
    isFileTool: true,
  },
  {
    id: 'resize-compress-image',
    code: 'IMG-01',
    name: 'Resize & Compress Images',
    shortName: 'Resize & Compress',
    category: 'images',
    categoryLabel: 'Image Tools',
    path: '/tools/resize-compress-image',
    title: 'Resize & Compress JPG, PNG & WebP Images Free — Local Tool | EverydayKit',
    metaDescription:
      'Resize images by pixel dimensions or percentage and compress JPG, PNG, or WebP files locally in your browser with live size comparison.',
    h1: 'Resize and Compress Images',
    summary:
      'Resize JPG, PNG, and WebP images by exact pixels or percentage scale, adjust compression quality, convert between formats, and compare before-and-after file sizes locally.',
    keywords: ['resize', 'compress', 'image', 'photo', 'jpg', 'png', 'webp', 'optimize', 'dimensions'],
    supportedFormats: ['JPEG (.jpg, .jpeg)', 'PNG (.png)', 'WebP (.webp)'],
    limits: [
      { label: 'Input File Count', value: '1 image at a time' },
      { label: 'Maximum File Size', value: '25 MB' },
      { label: 'Maximum Dimensions', value: '10,000 × 10,000 px (browser canvas safe cap)' },
      { label: 'Quality Range', value: '1% to 100% (JPG and WebP)' },
    ],
    howToSteps: [
      'Select or drag and drop a JPG, PNG, or WebP image (up to 25 MB).',
      'Choose target width/height in pixels or a percentage scale, with optional aspect-ratio lock and upscale prevention.',
      'Select the output format (JPG, PNG, or WebP) and adjust compression quality (for JPG and WebP).',
      'Click Process Image to inspect the exact before/after size comparison and download the optimized file.',
    ],
    limitations: [
      'PNG is a lossless format, so the quality slider applies only to JPG and WebP outputs; resizing dimensions still reduces PNG file size.',
      'Re-encoding through HTML5 Canvas strips EXIF metadata (such as camera model and GPS coordinates), which protects privacy.',
      'Transparent PNG or WebP backgrounds are filled with solid white when converted to JPG.',
    ],
    faqs: [
      {
        question: 'Why does compressing a PNG not use the quality slider?',
        answer:
          'PNG uses lossless compression. To reduce a PNG’s file size significantly, either reduce its pixel dimensions or export it as WebP or JPG.',
      },
      {
        question: 'Does this tool remove EXIF location metadata from photos?',
        answer:
          'Yes. Rendering the image through your browser’s Canvas API produces a fresh pixel stream without camera or GPS EXIF metadata.',
      },
      {
        question: 'What does "Prevent upscaling" do?',
        answer:
          'When enabled, EverydayKit keeps your requested dimensions at or below the image’s original width and height so photos are not stretched or blurred.',
      },
      {
        question: 'Are my photos uploaded anywhere during compression?',
        answer:
          'No. All decoding, resizing, and encoding run in your browser memory and temporary object URLs are revoked when you reset or leave the page.',
      },
    ],
    relatedToolIds: ['images-to-pdf', 'merge-pdf', 'split-pdf'],
    isFileTool: true,
  },
  {
    id: 'percentage-discount-calculator',
    code: 'CALC-01',
    name: 'Percentage & Discount Calculator',
    shortName: 'Percentage & Discount',
    category: 'calculators',
    categoryLabel: 'Calculators',
    path: '/tools/percentage-discount-calculator',
    title: 'Percentage, Discount & Percentage Change Calculator | EverydayKit',
    metaDescription:
      'Calculate sale discounts, stacked coupons, sales tax, percentage change, percentage of a number, and profit margin vs markup with clear formulas.',
    h1: 'Percentage and Discount Calculator',
    summary:
      'Calculate retail discounts, stacked coupons, sales tax, percentage change between two values, basic percentages, and profit margin vs. markup with transparent formulas.',
    keywords: ['percentage', 'discount', 'calculator', 'sale', 'change', 'tax', 'margin', 'markup'],
    supportedFormats: ['Numeric inputs (decimals and negative values where applicable)'],
    limits: [
      { label: 'Modes Included', value: 'Discount & Sale, Percentage Change, Basic %, Margin & Markup' },
      { label: 'Input Bounds', value: 'Finite real numbers up to ±1,000,000,000,000' },
      { label: 'Rounding', value: '2 decimals for currency; up to 4 decimals for percentages' },
      { label: 'Network Usage', value: 'Zero — runs instantaneously in browser memory' },
    ],
    howToSteps: [
      'Choose a calculation mode: Discount & Sale, Percentage Change, Basic Percentage, or Margin & Markup.',
      'Enter your values (or tap a quick preset percentage in Discount mode).',
      'Review the calculated result, savings or delta summary, and step-by-step mathematical formula.',
      'Use Copy Summary to copy the breakdown or Reset to clear back to defaults.',
    ],
    limitations: [
      'Percentage change is mathematically undefined when the starting value is 0; EverydayKit displays a clear validation message in that case.',
      'Currency outputs are formatted to 2 decimal places using standard commercial rounding.',
      'Stacked discounts are calculated sequentially (the retail standard), not by adding percentages together.',
    ],
    faqs: [
      {
        question: 'How are stacked discounts calculated?',
        answer:
          'Stacked discounts apply sequentially. For example, 20% off $100 leaves $80, and an additional 10% coupon takes $8 off $80 for a final price of $72 (an effective 28% total discount, not 30%).',
      },
      {
        question: 'What is the formula for percentage change?',
        answer:
          'Percentage change equals ((New Value − Original Value) / |Original Value|) × 100. Positive values indicate an increase and negative values indicate a decrease.',
      },
      {
        question: 'What is the difference between profit margin and markup?',
        answer:
          'Margin is profit divided by selling price: (Price − Cost) / Price. Markup is profit divided by cost: (Price − Cost) / Cost. A 50% markup equals a 33.33% profit margin.',
      },
      {
        question: 'Are my financial numbers saved or sent anywhere?',
        answer:
          'No. All arithmetic runs strictly in local browser memory with zero cookies, localStorage persistence, or network requests.',
      },
    ],
    relatedToolIds: ['unit-converter', 'date-calculator', 'merge-pdf'],
    isFileTool: false,
  },
  {
    id: 'unit-converter',
    code: 'CALC-02',
    name: 'Unit Converter',
    shortName: 'Unit Converter',
    category: 'calculators',
    categoryLabel: 'Calculators',
    path: '/tools/unit-converter',
    title: 'Unit Converter — Length, Weight, Temperature & Volume | EverydayKit',
    metaDescription:
      'Convert length, weight, temperature, and volume units between metric and imperial systems using NIST SP 811 standards with visible formulas.',
    h1: 'Unit Converter',
    summary:
      'Convert length, weight, temperature, and volume between metric and imperial standards with one-click unit swap, precision controls, and exact NIST SP 811 formulas.',
    keywords: ['unit', 'converter', 'length', 'weight', 'mass', 'temperature', 'volume', 'metric', 'imperial'],
    supportedFormats: ['Length (9 units)', 'Weight (7 units)', 'Temperature (°C, °F, K)', 'Volume (11 units)'],
    limits: [
      { label: 'Categories', value: 'Length, Weight, Temperature, Volume' },
      { label: 'Precision Options', value: '2, 4, or 6 decimal places, plus Scientific notation' },
      { label: 'Standards Basis', value: 'NIST SP 811 & BIPM SI definitions' },
      { label: 'Physical Guard', value: 'Warns on temperatures below absolute zero (0 K)' },
    ],
    howToSteps: [
      'Select a measurement category: Length, Weight, Temperature, or Volume.',
      'Enter a numeric value and choose your source and target units (or click Swap to reverse direction).',
      'Select your preferred decimal precision or scientific notation.',
      'Inspect the exact formula derivation and multi-unit reference table, or copy the result.',
    ],
    limitations: [
      'Uses the international foot (exactly 0.3048 m), following NIST’s retirement of the U.S. Survey Foot.',
      'Volume includes both US customary liquid gallons (3.785411784 L) and Imperial UK gallons (4.54609 L) labeled explicitly.',
      'Extreme exponents beyond IEEE-754 double precision limits (±1e308) are rejected with an actionable validation message.',
    ],
    faqs: [
      {
        question: 'Which conversion constants does EverydayKit use?',
        answer:
          'All factors follow NIST Special Publication 811 and BIPM SI definitions—for example, 1 inch is exactly 0.0254 meters, 1 pound is exactly 0.45359237 kilograms, and 0°C is 273.15 K.',
      },
      {
        question: 'Why are temperature conversions different from length or weight?',
        answer:
          'Temperature scales have different zero points, so EverydayKit applies affine equations such as °F = (°C × 9/5) + 32 and K = °C + 273.15 rather than simple multiplication.',
      },
      {
        question: 'What happens if I enter a temperature below absolute zero?',
        answer:
          'EverydayKit still shows the mathematical conversion if finite, while displaying a clear physics notice when a value falls below absolute zero (−273.15°C, −459.67°F, or 0 K).',
      },
      {
        question: 'Does the Unit Converter work offline?',
        answer:
          'Yes. Once the page is loaded, all unit tables and math formulas run locally in JavaScript with zero network requests.',
      },
    ],
    relatedToolIds: ['percentage-discount-calculator', 'date-calculator', 'resize-compress-image'],
    isFileTool: false,
  },
  {
    id: 'date-calculator',
    code: 'CALC-03',
    name: 'Date Calculator',
    shortName: 'Date Calculator',
    category: 'calculators',
    categoryLabel: 'Calculators',
    path: '/tools/date-calculator',
    title: 'Date Calculator — Days Between Dates, Add & Subtract Days | EverydayKit',
    metaDescription:
      'Calculate exact days, weeks, and business days between two dates, or add and subtract calendar or business days to find target deadlines.',
    h1: 'Date Calculator',
    summary:
      'Calculate exact duration between two calendar dates—including weeks, months, and Mon–Fri business days—or add and subtract days to project target deadlines locally.',
    keywords: ['date', 'calculator', 'days', 'between', 'add', 'subtract', 'business', 'deadline', 'calendar'],
    supportedFormats: ['ISO calendar dates (YYYY-MM-DD)', 'Integer day offsets (±36,500 days)'],
    limits: [
      { label: 'Modes Included', value: 'Days Between Dates, Add Days, Subtract Days' },
      { label: 'Day Offset Limit', value: '0 to 36,500 days (~100 years)' },
      { label: 'Business Days Rule', value: 'Monday–Friday (excludes Saturday & Sunday)' },
      { label: 'Calendar Arithmetic', value: 'UTC-normalized Gregorian calendar (leap-year & DST safe)' },
    ],
    howToSteps: [
      'Choose a mode: Days Between Dates, Add Days, or Subtract Days.',
      'Select your date(s) using the native accessible date picker or keyboard.',
      'Toggle inclusive end-date counting (in Between mode) or Business Days Only (in Add/Subtract modes).',
      'Review the exact breakdown (total days, weeks + days, business days, and target weekday) or copy the summary.',
    ],
    limitations: [
      'Business-day counts exclude Saturdays and Sundays only; public or regional bank holidays are not automatically excluded because holidays vary by jurisdiction.',
      'Calculations use the proleptic Gregorian calendar and normalize dates to UTC midnight so Daylight Saving Time changes never cause 23-hour or 25-hour off-by-one errors.',
    ],
    faqs: [
      {
        question: 'Why does Daylight Saving Time not cause off-by-one errors here?',
        answer:
          'EverydayKit parses your chosen YYYY-MM-DD calendar dates as UTC midnight timestamps, ensuring every calendar day counts as an exact 24-hour unit regardless of local DST transitions.',
      },
      {
        question: 'What does "Include end date (+1 day)" do?',
        answer:
          'By default, counting from Monday to Wednesday gives 2 days elapsed. Turning on "Include end date" counts both endpoints (Monday, Tuesday, and Wednesday = 3 inclusive days), which is common for leave or rental periods.',
      },
      {
        question: 'Are public holidays excluded from business days?',
        answer:
          'No. Business days count Monday through Friday and exclude Saturdays and Sundays. Because statutory holidays vary by country and region, adjust manually for local holidays.',
      },
      {
        question: 'Does the Date Calculator handle leap years automatically?',
        answer:
          'Yes. February 29 in leap years (such as 2024 and 2028) is handled automatically by exact Gregorian calendar rules.',
      },
    ],
    relatedToolIds: ['percentage-discount-calculator', 'unit-converter', 'merge-pdf'],
    isFileTool: false,
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS_CATALOG.find((t) => t.id === id);
}

export function getRelatedTools(ids: string[]): ToolDefinition[] {
  return ids
    .map((id) => getToolById(id))
    .filter((t): t is ToolDefinition => Boolean(t));
}

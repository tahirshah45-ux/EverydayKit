# EverydayKit Production Dependencies & Licenses

All production dependencies in `package.json` are pinned to exact verified versions with permissive open-source licenses compatible with MIT distribution. No server-side upload SDKs, analytics SDKs, AI SDKs, or ad-network SDKs are bundled.

## Runtime & Build Dependencies (Pinned)

| Package | Pinned Version | License | Purpose in EverydayKit |
| --- | --- | --- | --- |
| `react` | `19.3.1` | MIT | Core UI component library and hooks |
| `react-dom` | `19.3.1` | MIT | Browser DOM renderer for React |
| `react-router-dom` | `7.18.6` | MIT | Client-side routing across Home, Directory, all 7 dedicated tool pages, and info pages |
| `pdf-lib` | `1.17.1` | MIT | Lazy-loaded client-side PDF inspection, merging, page-range splitting, and JPG/PNG embedding inside the Web Worker |
| `fflate` | `0.8.3` | MIT | Lazy-loaded client-side ZIP packaging for multi-file Split PDF exports |
| `lucide-react` | `0.546.0` | ISC | Accessible inline SVG icons (works fully offline without external icon fonts) |
| `vite` | `8.3.8` | MIT | Frontend bundler, dev server, and module Web Worker build support |
| `@vitejs/plugin-react` | `6.3.0` | MIT | React JSX transform plugin for Vite |
| `@tailwindcss/vite` | `4.3.5` | MIT | Tailwind CSS v4 Vite integration for the design system tokens and responsive layout |

## Native Browser APIs Used (Zero External Dependencies)

- **Web Workers (`Worker`)**: Isolates heavy PDF merging, splitting, and image-to-PDF builds off the main UI thread.
- **HTML5 Canvas / `OffscreenCanvas` & `createImageBitmap`**: Performs JPG, PNG, and WebP resizing, format conversion, compression, and EXIF stripping locally.
- **File / Blob / Object URL APIs**: Reads local files, renders temporary previews, triggers local downloads, and revokes URLs on reset/unmount.
- **Clipboard API (`navigator.clipboard`)**: Copies calculator summaries, unit derivations, and locally formatted support reports on explicit user click.

## License Compatibility

All runtime dependencies use permissive **MIT** or **ISC** licenses, fully compatible with EverydayKit’s MIT license and commercial or open-source hosting.

/**
 * Isolated Ad-Provider Adapter for EverydayKit.
 *
 * Rules enforced by design:
 * 1. Provider-specific code stays strictly inside this adapter—never inside tool components.
 * 2. When no verified provider and valid slot ID are configured via environment variables,
 *    slots remain disabled (zero fake ads, zero invented IDs, zero revenue claims).
 * 3. Never accepts or forwards filenames, file contents, calculator values, dates, or results.
 */

export type VerifiedAdProvider = 'adsense' | 'gam';

export type AdSlotPlacement =
  | 'home-below-hero'
  | 'directory-between-groups'
  | 'tool-sidebar-desktop'
  | 'tool-below-result';

export interface AdSlotConfig {
  placement: AdSlotPlacement;
  provider: VerifiedAdProvider;
  clientId: string;
  slotId: string;
  format: 'horizontal' | 'rectangle';
  minHeightPx: number;
  label: 'Advertisement';
}

const VALID_PROVIDERS: ReadonlySet<string> = new Set(['adsense', 'gam']);

const SLOT_ENV_KEYS: Record<AdSlotPlacement, string> = {
  'home-below-hero': 'VITE_AD_SLOT_HOME_HERO',
  'directory-between-groups': 'VITE_AD_SLOT_DIRECTORY',
  'tool-sidebar-desktop': 'VITE_AD_SLOT_TOOL_SIDEBAR',
  'tool-below-result': 'VITE_AD_SLOT_TOOL_RESULT',
};

const SLOT_DIMENSIONS: Record<AdSlotPlacement, { format: 'horizontal' | 'rectangle'; minHeightPx: number }> = {
  'home-below-hero': { format: 'horizontal', minHeightPx: 90 },
  'directory-between-groups': { format: 'horizontal', minHeightPx: 90 },
  'tool-sidebar-desktop': { format: 'rectangle', minHeightPx: 250 },
  'tool-below-result': { format: 'horizontal', minHeightPx: 90 },
};

function readEnv(key: string): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return (env?.[key] ?? '').trim();
}

export function getConfiguredAdProvider(): VerifiedAdProvider | null {
  const raw = readEnv('VITE_AD_PROVIDER').toLowerCase();
  if (!VALID_PROVIDERS.has(raw)) return null;
  const clientId = readEnv('VITE_AD_CLIENT_ID');
  if (!clientId || clientId.startsWith('YOUR_') || clientId.startsWith('EXAMPLE_')) {
    return null;
  }
  return raw as VerifiedAdProvider;
}

export function isAdProviderConfigured(): boolean {
  return getConfiguredAdProvider() !== null;
}

/**
 * Returns a strict configuration object for a placement only when both a verified provider
 * and a real, non-placeholder slot ID are configured. Otherwise returns null (slot disabled).
 */
export function getAdSlotConfig(placement: AdSlotPlacement): AdSlotConfig | null {
  const provider = getConfiguredAdProvider();
  if (!provider) return null;

  const clientId = readEnv('VITE_AD_CLIENT_ID');
  const slotId = readEnv(SLOT_ENV_KEYS[placement]);
  if (!slotId || slotId.startsWith('YOUR_') || slotId.startsWith('EXAMPLE_')) {
    return null;
  }

  const dims = SLOT_DIMENSIONS[placement];
  return {
    placement,
    provider,
    clientId,
    slotId,
    format: dims.format,
    minHeightPx: dims.minHeightPx,
    label: 'Advertisement',
  };
}

/**
 * Mounts an isolated ad unit inside the provided DOM element when a verified provider is configured.
 * Strictly passes only static provider/slot identifiers—never any user or tool data.
 */
export function mountConfiguredAdUnit(container: HTMLElement, config: AdSlotConfig): () => void {
  container.innerHTML = '';

  if (config.provider === 'adsense') {
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle block w-full';
    ins.setAttribute('data-ad-client', config.clientId);
    ins.setAttribute('data-ad-slot', config.slotId);
    ins.setAttribute('data-ad-format', config.format === 'horizontal' ? 'horizontal' : 'rectangle');
    ins.setAttribute('data-full-width-responsive', 'true');
    container.appendChild(ins);

    const w = window as unknown as { adsbygoogle?: unknown[] };
    if (Array.isArray(w.adsbygoogle)) {
      try {
        w.adsbygoogle.push({});
      } catch {
        // Provider queue unavailable; fail silently without disrupting tool UI
      }
    }
  } else if (config.provider === 'gam') {
    const slotDiv = document.createElement('div');
    slotDiv.id = `ek-gam-${config.placement}`;
    slotDiv.setAttribute('data-gam-unit', config.slotId);
    container.appendChild(slotDiv);
  }

  return () => {
    container.innerHTML = '';
  };
}

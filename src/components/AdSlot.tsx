import { useEffect, useRef } from 'react';
import {
  getAdSlotConfig,
  mountConfiguredAdUnit,
  type AdSlotPlacement,
} from '../lib/adProvider';

interface AdSlotProps {
  placement: AdSlotPlacement;
  /** Suppress ad rendering during loading, error, empty-result, or modal states. */
  suppressed?: boolean;
  className?: string;
}

/**
 * Reusable, isolated ad-placement component.
 *
 * - Renders `null` when no verified ad provider or live slot ID is configured in env vars
 *   (no fake ads, no simulated rewarded ads, no placeholder cards in production).
 * - Renders `null` whenever `suppressed` is true (processing, error, empty-result, dialog states).
 * - Desktop sidebar placement hides automatically on mobile viewports.
 * - Reserves fixed vertical height to prevent Cumulative Layout Shift (CLS) when active.
 */
export default function AdSlot({ placement, suppressed = false, className = '' }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const config = suppressed ? null : getAdSlotConfig(placement);

  useEffect(() => {
    if (!config || !containerRef.current) return;
    return mountConfiguredAdUnit(containerRef.current, config);
  }, [config]);

  if (!config) {
    return null;
  }

  const isSidebar = placement === 'tool-sidebar-desktop';

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={`${isSidebar ? 'hidden lg:block' : 'block'} ${className}`}
    >
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          <span>{config.label}</span>
        </div>
        <div
          ref={containerRef}
          style={{ minHeight: `${config.minHeightPx}px` }}
          className="flex w-full items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest"
        />
      </div>
    </aside>
  );
}

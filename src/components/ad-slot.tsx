import { site } from "@/config/site";

/**
 * Reserved space for future Google AdSense placement. Until ads are enabled
 * (site.adsEnabled), renders nothing so no empty boxes or fake ad code ship.
 * When enabled it keeps a fixed height to avoid layout shift and stays far
 * from upload/process/download controls by construction (placement is
 * controlled by callers).
 */
export function AdSlot({ className = "" }: { className?: string }) {
  if (!site.adsEnabled) return null;
  return (
    <div
      aria-hidden="true"
      className={`flex min-h-[90px] items-center justify-center rounded-card border border-dashed border-border bg-surface text-xs text-muted ${className}`}
    >
      Advertisement
    </div>
  );
}
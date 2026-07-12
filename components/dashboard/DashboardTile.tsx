import Icon from "@/components/brand/Icon";
import type { DashboardTile as Tile } from "@/lib/placeholder-data";

/**
 * Kennzahl-Kachel für das Mitglieder-Dashboard.
 */
export default function DashboardTile({ tile }: { tile: Tile }) {
  return (
    <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border">
          <Icon name={tile.icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-aw-cream">{tile.value}</p>
      <p className="mt-1 text-sm font-medium text-aw-cream/90">{tile.label}</p>
      <p className="mt-1 text-xs text-aw-muted">{tile.hint}</p>
    </div>
  );
}

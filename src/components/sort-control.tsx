import { ArrowDown, ArrowUp } from "lucide-react";
import { t } from "@/lib/i18n";
import type { NodeSort, SortDirection } from "@/lib/schemas";

function getSortLabel(value: NodeSort) {
  if (value === "name") return t("sortName");
  if (value === "status") return t("sortStatus");
  if (value === "region") return t("colRegion");
  if (value === "uptime") return t("colUptime");
  if (value === "cpu") return t("cpu");
  if (value === "memory") return t("memory");
  if (value === "disk") return t("disk");
  return t("sortSpeed");
}

export function SortControl({
  value,
  direction,
  onChange,
  onDirectionChange,
}: {
  value: NodeSort;
  direction: SortDirection;
  onChange: (value: NodeSort) => void;
  onDirectionChange: (direction: SortDirection) => void;
}) {
  const DirectionIcon = direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="flex items-center gap-1.5">
      <label className="relative">
        <span className="sr-only">{t("sort")}</span>
        <select
          id="node-sort"
          value={value}
          onChange={(event) => onChange(event.target.value as NodeSort)}
          className="h-9 min-w-28 appearance-none rounded-lg border border-input bg-card px-2.5 py-2 text-xs font-medium shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {(
            [
              "name",
              "status",
              "region",
              "uptime",
              "cpu",
              "memory",
              "disk",
              "speed",
            ] as NodeSort[]
          ).map((sortValue) => (
            <option key={sortValue} value={sortValue}>
              {getSortLabel(sortValue)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-sm shadow-xs outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={
          direction === "asc" ? t("sortAscending") : t("sortDescending")
        }
        title={direction === "asc" ? t("sortAscending") : t("sortDescending")}
        onClick={() => onDirectionChange(direction === "asc" ? "desc" : "asc")}
      >
        <DirectionIcon
          key={direction}
          className="km-sort-icon size-4"
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}

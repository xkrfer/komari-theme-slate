import {
  ArrowDown,
  ArrowUp,
  CircleArrowDown,
  CircleArrowUp,
  Radio,
  Server,
} from "lucide-react";
import { formatBytes, formatSpeed } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { NodeRow } from "@/lib/nodes";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  tone,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  tone: "blue" | "green" | "red" | "neutral";
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "group h-28 min-w-0 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20",
    active && "border-data-accent bg-data-accent/5 ring-1 ring-data-accent/20",
    onClick && "cursor-pointer",
  );
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="km-metric mt-2 h-12 min-w-0 overflow-hidden text-2xl leading-7 font-semibold tracking-tight text-foreground">
          {value}
        </div>
      </div>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/50 text-muted-foreground",
          tone === "blue" && "border-data-accent/20 text-data-accent",
          tone === "green" && "border-status-online/20 text-status-online",
          tone === "red" && "border-status-offline/20 text-status-offline",
        )}
      >
        {icon}
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        aria-pressed={active}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export type StatusFilter = "all" | "online" | "offline";

export function StatsStrip({
  rows,
  statusFilter,
  onStatusFilterChange,
}: {
  rows: NodeRow[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
}) {
  const online = rows.filter((row) => row.online).length;
  const offline = rows.length - online;
  const totalUp = rows.reduce((sum, row) => sum + row.totalUp, 0);
  const totalDown = rows.reduce((sum, row) => sum + row.totalDown, 0);
  const netOut = rows.reduce((sum, row) => sum + row.netOut, 0);
  const netIn = rows.reduce((sum, row) => sum + row.netIn, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={t("totalServers")}
        value={rows.length}
        tone="blue"
        icon={<Server className="size-4" />}
        active={statusFilter === "all"}
        onClick={() => onStatusFilterChange("all")}
      />
      <StatCard
        label={t("onlineServers")}
        value={online}
        tone="green"
        icon={<Radio className="size-4" />}
        active={statusFilter === "online"}
        onClick={() => onStatusFilterChange("online")}
      />
      <StatCard
        label={t("offlineServers")}
        value={offline}
        tone="red"
        icon={<Radio className="size-4" />}
        active={statusFilter === "offline"}
        onClick={() => onStatusFilterChange("offline")}
      />
      <StatCard
        label={t("network")}
        value={
          <div className="space-y-1 pt-0.5">
            <div className="flex min-w-0 items-center gap-2 text-sm leading-5 font-semibold tracking-normal">
              <span className="inline-flex min-w-0 items-center text-data-accent">
                <ArrowUp className="size-3.5 shrink-0" />
                <span className="truncate">{formatBytes(totalUp)}</span>
              </span>
              <span className="inline-flex min-w-0 items-center text-violet-600 dark:text-violet-400">
                <ArrowDown className="size-3.5 shrink-0" />
                <span className="truncate">{formatBytes(totalDown)}</span>
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2 text-[11px] leading-4 font-medium tracking-normal text-foreground">
              <span className="inline-flex min-w-0 items-center gap-1">
                <CircleArrowUp className="size-3.5 shrink-0 fill-foreground text-background" />
                <span className="truncate">{formatSpeed(netOut)}</span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-1">
                <CircleArrowDown className="size-3.5 shrink-0 fill-foreground text-background" />
                <span className="truncate">{formatSpeed(netIn)}</span>
              </span>
            </div>
          </div>
        }
        tone="neutral"
        icon={<ArrowUp className="size-4" />}
      />
    </div>
  );
}

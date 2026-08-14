import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Cpu,
  HardDrive,
  MapPin,
  MemoryStick,
} from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatBytes, formatSpeed } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { NodeRow } from "@/lib/nodes";
import { regionToFlagEmoji } from "@/lib/region";
import { tagTone } from "@/lib/tag";
import { cn } from "@/lib/utils";

function expirationBadge(
  expiresAt: string | null,
  autoRenewal: boolean,
  now: number,
) {
  if (autoRenewal) {
    return {
      label: t("longTerm"),
      tone: "border-status-online/25 bg-status-online/10 text-status-online",
    };
  }
  if (!expiresAt) return null;
  const expires = Date.parse(expiresAt);
  if (!Number.isFinite(expires)) return null;
  const remaining = expires - now;
  if (remaining <= 0) {
    return {
      label: t("expired"),
      tone: "border-status-offline/25 bg-status-offline/12 text-status-offline",
    };
  }
  const days = Math.ceil(remaining / 86_400_000);
  if (days <= 1) {
    return {
      label: t("expiresSoon"),
      tone: "border-status-offline/25 bg-status-offline/12 text-status-offline",
    };
  }
  if (days <= 7) {
    return {
      label: t("expiresInDays").replace("{count}", String(days)),
      tone: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
    };
  }
  return {
    label: t("expiresInDays").replace("{count}", String(days)),
    tone: "border-data-accent/25 bg-data-accent/10 text-data-accent",
  };
}

function billingCycleLabel(days: number) {
  if (days >= 28 && days <= 31) return t("billingMonthly");
  if (days >= 180 && days <= 184) return t("billingHalfYearly");
  if (days >= 365 && days <= 366) return t("billingYearly");
  if (days >= 730 && days <= 731) return t("billingBiennially");
  if (days >= 1095 && days <= 1096) return t("billingTriennially");
  return t("billingDays").replace("{count}", String(days));
}

function renewalPriceBadge(
  price: number,
  currency: string,
  billingCycle: number,
) {
  if (!Number.isFinite(price) || price <= 0) return null;
  const digits = Number.isInteger(price) ? 0 : 2;
  const displayPrice = `${currency || "$"}${price.toFixed(digits)}`;
  const roundedCycle = Math.round(billingCycle);
  const cycle = billingCycleLabel(roundedCycle);
  const label =
    billingCycle > 0
      ? t("renewalPriceCycle")
          .replace("{price}", displayPrice)
          .replace("{cycle}", cycle)
      : t("renewalPrice").replace("{price}", displayPrice);
  return {
    label,
    tone: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  };
}

function progressTone(value: number | null) {
  if (value === null) return "";
  if (value >= 85) {
    return "[&_[data-slot=progress-indicator]]:bg-status-offline";
  }
  if (value >= 65) {
    return "[&_[data-slot=progress-indicator]]:bg-amber-500";
  }
  return "[&_[data-slot=progress-indicator]]:bg-status-online";
}

function UsageMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  detail: string;
}) {
  const displayValue = value === null ? "—" : `${value.toFixed(2)}%`;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span className="km-metric shrink-0 text-xs font-semibold text-foreground">
          {displayValue}
        </span>
      </div>
      <p className="km-metric mt-1 truncate text-[10px] text-muted-foreground">
        {detail}
      </p>
      <Progress
        value={value ?? 0}
        aria-label={`${label} ${displayValue}`}
        className={cn("mt-1.5 gap-0", progressTone(value))}
      />
    </div>
  );
}

type NodeCardOptions = {
  showTags: boolean;
  showPrice: boolean;
  showExpiration: boolean;
  showResourceTotals: boolean;
  showTraffic: boolean;
  showSwap: boolean;
};

export function NodeCards({
  rows,
  sortKey,
  options,
}: {
  rows: NodeRow[];
  sortKey: string;
  options: NodeCardOptions;
}) {
  const now = Date.now();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row, index) => {
        const flag = regionToFlagEmoji(row.region);
        const memoryTotal = row.status?.ram_total || row.client.mem_total;
        const diskTotal = row.status?.disk_total || row.client.disk_total;
        const swapTotal = row.status?.swap_total || row.client.swap_total;
        const ipTags = options.showTags ? row.ipTags : [];
        const tags = options.showTags ? row.tags : [];
        const expiration = options.showExpiration
          ? expirationBadge(row.client.expired_at, row.client.auto_renewal, now)
          : null;
        const renewalPrice = options.showPrice
          ? renewalPriceBadge(
              row.client.price,
              row.client.currency,
              row.client.billing_cycle,
            )
          : null;
        const reservedTags =
          ipTags.length + (expiration ? 1 : 0) + (renewalPrice ? 1 : 0);
        const visibleTagLimit = Math.max(0, 4 - reservedTags);
        const visibleTags = tags.slice(0, visibleTagLimit);
        const hiddenTagCount = tags.length - visibleTags.length;
        const allTagLabels = [
          ...ipTags,
          ...tags,
          ...(expiration ? [expiration.label] : []),
          ...(renewalPrice ? [renewalPrice.label] : []),
        ];
        return (
          <Link
            key={`${sortKey}:${row.uuid}`}
            to="/instance/$uuid"
            params={{ uuid: row.uuid }}
            className="km-sort-item block"
            style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}
          >
            <Card
              className={cn(
                "h-full gap-0 bg-card py-0 ring-border transition-colors hover:bg-muted/15 hover:ring-foreground/25",
                !row.online && "opacity-65",
              )}
            >
              <CardHeader className="px-4 py-4">
                <CardTitle className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-start gap-2.5">
                    <span
                      className="flex h-5 w-7 shrink-0 items-center justify-center text-lg leading-5"
                      role="img"
                      aria-label={row.region || t("colRegion")}
                    >
                      {flag ?? (
                        <MapPin className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {row.name}
                      </span>
                      <span className="mt-0.5 block min-h-3 truncate text-[10px] font-normal text-muted-foreground">
                        {row.group || "\u00a0"}
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium",
                      row.online
                        ? "border-status-online/20 bg-status-online/8 text-status-online"
                        : "border-status-offline/20 bg-status-offline/8 text-status-offline",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        row.online
                          ? "km-status-pulse bg-status-online"
                          : "bg-status-offline",
                      )}
                    />
                    {row.online ? t("online") : t("offline")}
                  </span>
                </CardTitle>
                <div
                  className="mt-1 flex h-5 min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden"
                  title={
                    allTagLabels.length > 0
                      ? allTagLabels.join(", ")
                      : undefined
                  }
                >
                  {ipTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn(
                        "h-5 px-1.5 text-[10px] font-medium",
                        tag === "IPv4"
                          ? "border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300"
                          : "border-violet-500/25 bg-violet-500/12 text-violet-700 dark:text-violet-300",
                      )}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {visibleTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn(
                        "h-5 max-w-28 px-1.5 text-[10px] font-normal",
                        tagTone(tag),
                      )}
                    >
                      <span className="truncate">{tag}</span>
                    </Badge>
                  ))}
                  {expiration ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 max-w-28 px-1.5 text-[10px] font-medium",
                        expiration.tone,
                      )}
                    >
                      <span className="truncate">{expiration.label}</span>
                    </Badge>
                  ) : null}
                  {renewalPrice ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 max-w-40 px-1.5 text-[10px] font-medium",
                        renewalPrice.tone,
                      )}
                    >
                      <span className="truncate">{renewalPrice.label}</span>
                    </Badge>
                  ) : null}
                  {hiddenTagCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground"
                    >
                      +{hiddenTagCount}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="px-4 py-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <UsageMetric
                    icon={Cpu}
                    label={t("cpu")}
                    value={row.cpuUsage}
                    detail={
                      row.online && row.client.cpu_cores > 0
                        ? `${row.client.cpu_cores} ${t("cores")}`
                        : "—"
                    }
                  />
                  <UsageMetric
                    icon={MemoryStick}
                    label={t("memory")}
                    value={row.memoryUsage}
                    detail={
                      !options.showResourceTotals
                        ? "\u00a0"
                        : row.online && memoryTotal > 0
                          ? `${formatBytes(row.status?.ram ?? 0)} / ${formatBytes(memoryTotal)}`
                          : "—"
                    }
                  />
                  <UsageMetric
                    icon={HardDrive}
                    label={t("disk")}
                    value={row.diskUsage}
                    detail={
                      !options.showResourceTotals
                        ? "\u00a0"
                        : row.online && diskTotal > 0
                          ? `${formatBytes(row.status?.disk ?? 0)} / ${formatBytes(diskTotal)}`
                          : "—"
                    }
                  />
                  {options.showSwap ? (
                    <UsageMetric
                      icon={ArrowLeftRight}
                      label={t("swap")}
                      value={row.swapUsage}
                      detail={
                        !options.showResourceTotals
                          ? "\u00a0"
                          : row.online && swapTotal > 0
                            ? `${formatBytes(row.status?.swap ?? 0)} / ${formatBytes(swapTotal)}`
                            : "—"
                      }
                    />
                  ) : null}
                </div>

                {options.showTraffic ? (
                  <>
                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 text-[10px] font-medium text-status-online">
                          <ArrowDown className="size-3.5" />
                          {t("download")}
                        </p>
                        <p className="km-metric mt-1 truncate text-base font-semibold text-foreground">
                          {formatSpeed(row.netIn)}
                        </p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="flex items-center justify-end gap-1 text-[10px] font-medium text-data-accent">
                          <ArrowUp className="size-3.5" />
                          {t("upload")}
                        </p>
                        <p className="km-metric mt-1 truncate text-base font-semibold text-foreground">
                          {formatSpeed(row.netOut)}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 text-[10px] font-medium text-status-online">
                          <ArrowDown className="size-3.5" />
                          {t("totalDownload")}
                        </p>
                        <p className="km-metric mt-1 truncate text-sm font-semibold text-foreground">
                          {formatBytes(row.totalDown)}
                        </p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="flex items-center justify-end gap-1 text-[10px] font-medium text-data-accent">
                          <ArrowUp className="size-3.5" />
                          {t("totalUpload")}
                        </p>
                        <p className="km-metric mt-1 truncate text-sm font-semibold text-foreground">
                          {formatBytes(row.totalUp)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

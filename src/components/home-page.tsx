import { AlertTriangle, ServerOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HomeLoading } from "@/components/home-loading";
import { NodeCards } from "@/components/node-cards";
import { NodeFilters } from "@/components/node-filters";
import { NodeMap } from "@/components/node-map";
import { NodeTable } from "@/components/node-table";
import {
  type NodeSort,
  SortControl,
  type SortDirection,
} from "@/components/sort-control";
import { StatsStrip, type StatusFilter } from "@/components/stats-strip";
import { ViewSwitcher } from "@/components/view-switcher";
import {
  useLiveStatus,
  useNodeStatus,
  useNodes,
  usePublicInfo,
  useRpcHealth,
} from "@/hooks/use-komari";
import { t } from "@/lib/i18n";
import { buildNodeRows } from "@/lib/nodes";
import { isRpcUnavailable } from "@/lib/rpc";
import type { HomeView } from "@/lib/schemas";
import { resolveHomeView, writeStoredView } from "@/lib/view";

export function HomePage() {
  const publicInfo = usePublicInfo();
  const nodes = useNodes();
  const status = useNodeStatus();
  const health = useRpcHealth();
  useLiveStatus();

  const managedView = publicInfo.data?.theme_settings.defaultView ?? "table";
  const [view, setView] = useState<HomeView>(() =>
    resolveHomeView(managedView),
  );
  const [group, setGroup] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<NodeSort>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    if (!localStorage.getItem("slate:view")) {
      setView(resolveHomeView(managedView));
    }
  }, [managedView]);

  useEffect(() => {
    if (health.isError && isRpcUnavailable(health.error)) {
      toast.error(t("rpcUnavailable"));
    }
  }, [health.error, health.isError]);

  const rows = useMemo(
    () => buildNodeRows(nodes.data ?? [], status.data),
    [nodes.data, status.data],
  );
  const groups = useMemo(
    () => [...new Set(rows.map((row) => row.group).filter(Boolean))],
    [rows],
  );
  const visible = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (view !== "map" && group && row.group !== group) {
        return false;
      }
      if (statusFilter === "online" && !row.online) {
        return false;
      }
      if (statusFilter === "offline" && row.online) {
        return false;
      }
      return true;
    });
    if (view === "map") {
      return filtered;
    }
    const direction = sortDirection === "asc" ? 1 : -1;
    const compareNullable = (a: number | null, b: number | null) => {
      if (a === null) return b === null ? 0 : 1;
      if (b === null) return -1;
      return (a - b) * direction;
    };
    return filtered.toSorted((a, b) => {
      if (sort === "name") {
        return a.name.localeCompare(b.name) * direction;
      }
      if (sort === "status") {
        return (Number(b.online) - Number(a.online)) * direction;
      }
      if (sort === "region") {
        return a.region.localeCompare(b.region) * direction;
      }
      if (sort === "uptime") {
        return compareNullable(a.uptime, b.uptime);
      }
      if (sort === "cpu") {
        return compareNullable(a.cpuUsage, b.cpuUsage);
      }
      if (sort === "memory") {
        return compareNullable(a.memoryUsage, b.memoryUsage);
      }
      if (sort === "disk") {
        return compareNullable(a.diskUsage, b.diskUsage);
      }
      return (a.netIn + a.netOut - (b.netIn + b.netOut)) * direction;
    });
  }, [group, rows, sort, sortDirection, statusFilter, view]);
  const error = nodes.isError || publicInfo.isError;
  const loading = nodes.isPending || publicInfo.isPending || status.isPending;

  return (
    <main className="km-page-home km-main mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:py-14">
      <section>
        <div className="mb-6">
          <p className="mb-1 text-sm font-semibold text-foreground">
            <span aria-hidden="true" className="mr-1.5">
              👋
            </span>
            {t("overview")}
          </p>
          <p className="text-sm text-muted-foreground">
            {publicInfo.data?.description || t("overviewFallback")}
          </p>
        </div>
        {loading ? (
          <HomeLoading />
        ) : (
          <>
            <StatsStrip
              rows={rows}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            <section className="mt-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    {t("nodes")}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t("nodeListDescription")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {view === "map" ? null : (
                    <>
                      <NodeFilters
                        groups={groups}
                        group={group}
                        onGroupChange={setGroup}
                      />
                      <SortControl
                        value={sort}
                        direction={sortDirection}
                        onChange={setSort}
                        onDirectionChange={setSortDirection}
                      />
                    </>
                  )}
                  <ViewSwitcher
                    value={view}
                    onChange={(next) => {
                      writeStoredView(next);
                      setView(next);
                    }}
                  />
                </div>
              </div>

              {error ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-destructive/25 bg-destructive/3 px-6 text-center">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-5" />
                  </span>
                  <p className="text-sm font-medium">{t("loadError")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("retryHint")}
                  </p>
                </div>
              ) : visible.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 text-center">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ServerOff className="size-5" />
                  </span>
                  <p className="text-sm font-medium">
                    {rows.length > 0 ? t("filteredEmpty") : t("noNodes")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("noNodesDescription")}
                  </p>
                </div>
              ) : view === "table" ? (
                <NodeTable
                  rows={visible}
                  sortKey={`${sort}:${sortDirection}`}
                />
              ) : view === "cards" ? (
                <NodeCards
                  rows={visible}
                  sortKey={`${sort}:${sortDirection}`}
                />
              ) : (
                <NodeMap rows={visible} />
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

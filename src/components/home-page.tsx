import { AlertTriangle, ServerOff } from "lucide-react";
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { HomeLoading } from "@/components/home-loading";
import { UptimeProvider } from "@/components/live-uptime";
import { NodeFilters } from "@/components/node-filters";
import { SortControl } from "@/components/sort-control";
import { StatsStrip, type StatusFilter } from "@/components/stats-strip";
import { ViewSwitcher } from "@/components/view-switcher";
import {
  useMe,
  useNodeStatus,
  useNodes,
  usePublicInfo,
  useRpcHealth,
} from "@/hooks/use-komari";
import { t } from "@/lib/i18n";
import { buildNodeRows } from "@/lib/nodes";
import { isRpcUnavailable } from "@/lib/rpc";
import type { HomeView, NodeSort, SortDirection } from "@/lib/schemas";
import {
  readStoredSort,
  readStoredSortDirection,
  writeStoredSort,
  writeStoredSortDirection,
} from "@/lib/sort";
import { readStoredView, resolveHomeView, writeStoredView } from "@/lib/view";

function loadNodeMap() {
  return import("@/components/node-map").then((module) => ({
    default: module.NodeMap,
  }));
}

const NodeCards = lazy(() =>
  import("@/components/node-cards").then((module) => ({
    default: module.NodeCards,
  })),
);
const NodeTable = lazy(() =>
  import("@/components/node-table").then((module) => ({
    default: module.NodeTable,
  })),
);
const NodeMap = lazy(loadNodeMap);

function NodeMapLoading() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-card shadow-xs"
      aria-hidden="true"
    >
      <div className="border-b border-border/70 px-4 py-3.5">
        <div className="km-skeleton h-5 w-28 rounded-md" />
      </div>
      <div className="bg-muted/15 px-2 py-3 sm:px-5 sm:py-4">
        <div className="km-skeleton h-80 w-full rounded-md sm:h-105 lg:h-120" />
      </div>
    </div>
  );
}

export function HomePage() {
  useLayoutEffect(() => {
    document.documentElement.classList.remove("prerender-home");
  }, []);

  const publicInfo = usePublicInfo();
  const nodes = useNodes();
  const status = useNodeStatus();
  const me = useMe();
  const health = useRpcHealth();

  const settings = publicInfo.data?.theme_settings;
  const managedView = settings?.defaultView ?? "table";
  const enableMap = settings?.enableMap ?? true;
  const managedSort = settings?.defaultSort ?? "name";
  const managedSortDirection = settings?.defaultSortDirection ?? "asc";
  const showUptime = settings?.showUptime ?? true;
  const uptimeRefreshSeconds = settings?.uptimeRefreshSeconds ?? 1;
  const [view, setView] = useState<HomeView>(() =>
    resolveHomeView(managedView, enableMap),
  );
  const [group, setGroup] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOverride, setSortOverride] = useState<NodeSort | null>(
    readStoredSort,
  );
  const [sortDirectionOverride, setSortDirectionOverride] =
    useState<SortDirection | null>(readStoredSortDirection);
  const sort = sortOverride ?? managedSort;
  const sortDirection = sortDirectionOverride ?? managedSortDirection;

  useEffect(() => {
    setView((currentView) => {
      if (currentView === "map" && !enableMap) {
        return resolveHomeView(managedView, false);
      }
      if (!readStoredView()) {
        return resolveHomeView(managedView, enableMap);
      }
      return currentView;
    });
  }, [enableMap, managedView]);

  useEffect(() => {
    if (health.isError && isRpcUnavailable(health.error)) {
      toast.error(t("rpcUnavailable"));
    }
  }, [health.error, health.isError]);

  const activeView = view === "map" && !enableMap ? "table" : view;
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
      if (activeView !== "map" && group && row.group !== group) {
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
    if (activeView === "map") {
      return filtered;
    }
    const direction = sortDirection === "asc" ? 1 : -1;
    const compareNullable = (a: number | null, b: number | null) => {
      if (a === null) return b === null ? 0 : 1;
      if (b === null) return -1;
      return (a - b) * direction;
    };
    return filtered.toSorted((a, b) => {
      if (statusFilter === "all" && a.online !== b.online) {
        return a.online ? -1 : 1;
      }
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
  }, [activeView, group, rows, sort, sortDirection, statusFilter]);
  const error = nodes.isError || publicInfo.isError;
  const loading = nodes.isPending || publicInfo.isPending || status.isPending;

  return (
    <UptimeProvider enabled={showUptime} intervalSeconds={uptimeRefreshSeconds}>
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
              {(settings?.showStats ?? true) ? (
                <StatsStrip
                  rows={rows}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
              ) : null}
              <section className={(settings?.showStats ?? true) ? "mt-10" : ""}>
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
                    {activeView === "map" ? null : (
                      <>
                        <NodeFilters
                          groups={groups}
                          group={group}
                          onGroupChange={setGroup}
                        />
                        <SortControl
                          value={sort}
                          direction={sortDirection}
                          onChange={(nextSort) => {
                            writeStoredSort(nextSort);
                            setSortOverride(nextSort);
                          }}
                          onDirectionChange={(nextDirection) => {
                            writeStoredSortDirection(nextDirection);
                            setSortDirectionOverride(nextDirection);
                          }}
                        />
                      </>
                    )}
                    <ViewSwitcher
                      value={activeView}
                      showMap={enableMap}
                      onMapIntent={() => {
                        void loadNodeMap();
                      }}
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
                ) : (
                  <Suspense
                    fallback={
                      activeView === "map" ? (
                        <NodeMapLoading />
                      ) : (
                        <HomeLoading />
                      )
                    }
                  >
                    {activeView === "table" ? (
                      <NodeTable
                        rows={visible}
                        sortKey={`${sort}:${sortDirection}`}
                        showUptime={showUptime}
                      />
                    ) : activeView === "cards" ? (
                      <NodeCards
                        rows={visible}
                        sortKey={`${sort}:${sortDirection}`}
                        options={{
                          showTags: settings?.showCardTags ?? true,
                          showPrice:
                            (settings?.showCardBilling ?? true) &&
                            (Boolean(me.data?.logged_in) ||
                              Boolean(settings?.guestShowPrice)),
                          showExpiration:
                            (settings?.showCardBilling ?? true) &&
                            (Boolean(me.data?.logged_in) ||
                              Boolean(settings?.guestShowExpiration)),
                          showResourceTotals:
                            settings?.showResourceTotals ?? true,
                          showTraffic: settings?.showCardTraffic ?? true,
                          showSwap: settings?.showCardSwap ?? true,
                          showUptime,
                        }}
                      />
                    ) : (
                      <NodeMap rows={visible} />
                    )}
                  </Suspense>
                )}
              </section>
            </>
          )}
        </section>
      </main>
    </UptimeProvider>
  );
}

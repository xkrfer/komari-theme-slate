import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { ArrowLeft, CircleAlert, MapPin } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLiveStatus, useNodeStatus, usePingTasks } from "@/hooks/use-komari";
import { getLoadRecords, getPingRecords, getRecentNodeStatus } from "@/lib/api";
import { formatBytes, formatSpeed } from "@/lib/format";
import { t } from "@/lib/i18n";
import { regionToFlagEmoji } from "@/lib/region";
import type {
  Client,
  LoadRecord,
  NodeStatus,
  PingRecord,
  PingTask,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

type TimeRange = "live" | "24" | "168" | "720";
type ChartRecord = LoadRecord | NodeStatus;

type SeriesDefinition = {
  name: string;
  color: string;
  values: Array<[number, number]>;
};

const RANGE_HOURS: Record<Exclude<TimeRange, "live">, number> = {
  "24": 24,
  "168": 168,
  "720": 720,
};

const CHART_COLORS = {
  blue: "#3478f6",
  violet: "#8757e8",
  pink: "#d657a8",
  green: "#20b486",
  rose: "#ef5b7d",
} as const;
const PING_COLORS = [
  "#3478f6",
  "#ef4777",
  "#8757e8",
  "#20b486",
  "#f59e0b",
  "#06b6d4",
] as const;

function percent(value: number, total: number) {
  return total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function formatPercentAxis(value: number) {
  return `${Math.round(value)}%`;
}

function formatInteger(value: number) {
  return String(Math.round(value));
}

function formatMilliseconds(value: number) {
  return `${Math.round(value)} ms`;
}

function median(values: number[]) {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function smoothPingPeaks(values: Array<[number, number]>) {
  const windowSize = 11;
  const alpha = 0.3;
  let history: number | undefined;

  return values.map(([time, value], index) => {
    if (index < windowSize - 1) return [time, value] as [number, number];

    const window = values
      .slice(index - windowSize + 1, index + 1)
      .map(([, windowValue]) => windowValue);
    const windowMedian = median(window);
    const deviations = window.map((windowValue) =>
      Math.abs(windowValue - windowMedian),
    );
    const medianDeviation = median(deviations) * 1.4826;
    const validValues = window.filter(
      (windowValue) =>
        Math.abs(windowValue - windowMedian) <= 3 * medianDeviation &&
        windowValue <= windowMedian * 3,
    );

    let processed = windowMedian;
    if (validValues.length > 0) {
      processed = validValues[0] ?? windowMedian;
      for (let validIndex = 1; validIndex < validValues.length; validIndex++) {
        processed =
          alpha * (validValues[validIndex] ?? processed) +
          (1 - alpha) * processed;
      }
    }

    history =
      history === undefined
        ? processed
        : alpha * processed + (1 - alpha) * history;
    return [time, history] as [number, number];
  });
}

const EMPTY_TEXT_VALUES = new Set(["none", "n/a", "null", "undefined", "-"]);

function hasText(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !EMPTY_TEXT_VALUES.has(normalized);
}

function formatDate(value: string | number | Date | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatUptime(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value) || value < 0) return "—";
  const days = Math.floor(value / 86_400);
  const hours = Math.floor((value % 86_400) / 3_600);
  const minutes = Math.floor((value % 3_600) / 60);
  const seconds = Math.floor(value % 60);
  return [
    days > 0 ? t("days").replace("{count}", String(days)) : null,
    hours > 0 || days > 0 ? t("hours").replace("{count}", String(hours)) : null,
    minutes > 0 || hours > 0 || days > 0
      ? t("minutes").replace("{count}", String(minutes))
      : null,
    t("seconds").replace("{count}", String(seconds)),
  ]
    .filter(Boolean)
    .join(" ");
}

function recordTime(record: ChartRecord, index: number) {
  const timestamp = Date.parse(record.time);
  return Number.isFinite(timestamp) ? timestamp : Date.now() + index * 1_000;
}

function makeSeries(
  records: ChartRecord[],
  name: string,
  color: string,
  select: (record: ChartRecord) => number,
): SeriesDefinition {
  return {
    name,
    color,
    values: records.map((record, index) => [
      recordTime(record, index),
      select(record),
    ]),
  };
}

function MonitoringChart({
  title,
  summary,
  series,
  maximum,
  axisLabel,
  tooltipValue,
  loading,
}: {
  title: string;
  summary: ReactNode;
  series: SeriesDefinition[];
  maximum?: number;
  axisLabel: (value: number) => string;
  tooltipValue: (value: number) => string;
  loading: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const styles = getComputedStyle(document.documentElement);
    const muted = styles.getPropertyValue("--muted-foreground").trim();
    const border = styles.getPropertyValue("--border").trim();
    const card = styles.getPropertyValue("--card").trim();
    const foreground = styles.getPropertyValue("--foreground").trim();
    const chart = echarts.init(host);
    chartRef.current = chart;
    chart.setOption({
      animationDuration: 420,
      animationEasing: "cubicOut",
      animationDurationUpdate: 320,
      animationEasingUpdate: "cubicOut",
      grid: { left: 4, right: 4, top: 14, bottom: 2, containLabel: true },
      tooltip: {
        trigger: "axis",
        confine: true,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: card,
        textStyle: { color: foreground, fontSize: 12 },
        valueFormatter: (value: unknown) => tooltipValue(Number(value)),
      },
      xAxis: {
        type: "time",
        boundaryGap: [0, "3%"],
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: muted,
          fontSize: 11,
          hideOverlap: true,
          showMaxLabel: false,
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: maximum,
        splitNumber: 2,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: muted,
          fontSize: 11,
          formatter: (value: number) => axisLabel(value),
        },
        splitLine: { lineStyle: { color: border, opacity: 0.75 } },
      },
    });

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(host);
    return () => {
      observer.disconnect();
      chartRef.current = null;
      chart.dispose();
    };
  }, [axisLabel, maximum, tooltipValue]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.setOption(
      {
        series: series.map((item) => ({
          id: item.name,
          name: item.name,
          type: "line",
          data: item.values,
          showSymbol: false,
          symbol: "none",
          smooth: 0.18,
          lineStyle: { color: item.color, width: 1.5 },
          itemStyle: { color: item.color },
          areaStyle: { color: item.color, opacity: 0.18 },
          emphasis: { disabled: true },
        })),
      },
      {
        lazyUpdate: true,
        replaceMerge: ["series"],
      },
    );
  }, [series]);

  const empty = !loading && series.every((item) => item.values.length === 0);

  return (
    <Card className="min-h-72 gap-0 py-0 shadow-xs ring-border">
      <CardHeader className="min-h-18 grid-cols-[1fr_auto] items-start gap-3 px-5 py-4">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {series.length > 1
              ? series.map((item) => (
                  <span
                    key={item.name}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: item.color }}
                    />
                    {item.name}
                  </span>
                ))
              : null}
          </div>
        </div>
        <div className="km-metric max-w-52 text-right text-xs leading-5 font-medium text-foreground">
          {summary}
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-4">
        <div className="relative h-46 w-full">
          {loading ? (
            <div className="km-skeleton absolute inset-0 z-10 rounded-lg" />
          ) : null}
          {empty ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
              <CircleAlert className="mb-2 size-4 text-muted-foreground/60" />
              <p className="text-xs font-medium text-muted-foreground">
                {t("noHistory")}
              </p>
            </div>
          ) : null}
          <div
            ref={ref}
            className={cn(
              "h-full w-full transition-opacity duration-200",
              (loading || empty) && "pointer-events-none opacity-0",
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  children,
  className,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs leading-5 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "km-metric mt-0.5 min-h-6 text-sm leading-6 font-medium text-foreground",
          valueClassName,
        )}
      >
        {children}
      </dd>
    </div>
  );
}

function AnimatedValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return <span className={cn("inline-block", className)}>{value}</span>;
}

function DetailGroup({
  title,
  children,
  className,
  loading = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}) {
  return (
    <Card className={cn("h-full gap-0 py-0 shadow-xs ring-border", className)}>
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn("p-4", loading && "min-h-40")}
        aria-busy={loading}
      >
        {loading ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-5" aria-hidden="true">
            <div className="space-y-2">
              <div className="km-skeleton h-3 w-12 rounded-sm" />
              <div className="km-skeleton h-5 w-20 rounded-sm" />
            </div>
            <div className="space-y-2">
              <div className="km-skeleton h-3 w-14 rounded-sm" />
              <div className="km-skeleton h-5 w-16 rounded-sm" />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="km-skeleton h-3 w-16 rounded-sm" />
              <div className="km-skeleton h-5 w-3/5 rounded-sm" />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="km-skeleton h-3 w-20 rounded-sm" />
              <div className="km-skeleton h-5 w-4/5 rounded-sm" />
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

type PingService = {
  taskId: string;
  name: string;
  color: string;
  average: number;
  loss: number;
  fluctuation: number;
  values: Array<[number, number]>;
};

function buildPingServices(records: PingRecord[], tasks: PingTask[]) {
  const taskById = new Map(tasks.map((task) => [String(task.id), task]));
  const grouped = new Map<string, PingRecord[]>();

  for (const record of records) {
    if (record.task_id === undefined) continue;
    const taskId = String(record.task_id);
    const group = grouped.get(taskId);
    if (group) group.push(record);
    else grouped.set(taskId, [record]);
  }

  return [...grouped.entries()].map(([taskId, taskRecords], index) => {
    const valid = taskRecords.filter(
      (record) => Number.isFinite(record.value) && record.value > 0,
    );
    const latency = valid.map((record) => record.value);
    const sum = latency.reduce((total, value) => total + value, 0);
    const average = latency.length > 0 ? sum / latency.length : 0;
    const variance =
      latency.length > 0
        ? latency.reduce((total, value) => total + (value - average) ** 2, 0) /
          latency.length
        : 0;
    return {
      taskId,
      name: taskById.get(taskId)?.name || `Ping ${taskId}`,
      color: PING_COLORS[index % PING_COLORS.length] ?? PING_COLORS[0],
      average,
      loss:
        taskRecords.length > 0
          ? ((taskRecords.length - valid.length) / taskRecords.length) * 100
          : 0,
      fluctuation: Math.sqrt(variance),
      values: valid.map((record, recordIndex) => [
        Number.isFinite(Date.parse(record.time))
          ? Date.parse(record.time)
          : Date.now() + recordIndex * 1_000,
        record.value,
      ]),
    } satisfies PingService;
  });
}

function PingChart({
  services,
  clipPeaks,
}: {
  services: PingService[];
  clipPeaks: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  const displayedServices = useMemo(() => {
    if (!clipPeaks) return services;
    return services.map((service) => ({
      ...service,
      values: smoothPingPeaks(service.values),
    }));
  }, [clipPeaks, services]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const styles = getComputedStyle(document.documentElement);
    const muted = styles.getPropertyValue("--muted-foreground").trim();
    const border = styles.getPropertyValue("--border").trim();
    const card = styles.getPropertyValue("--card").trim();
    const foreground = styles.getPropertyValue("--foreground").trim();
    const chart = echarts.init(host);
    chartRef.current = chart;
    chart.setOption({
      animationDuration: 360,
      animationDurationUpdate: 280,
      grid: { left: 8, right: 12, top: 18, bottom: 48, containLabel: true },
      tooltip: {
        trigger: "axis",
        confine: true,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: card,
        textStyle: { color: foreground, fontSize: 12 },
        valueFormatter: (value: unknown) => formatMilliseconds(Number(value)),
      },
      xAxis: {
        type: "time",
        boundaryGap: [0, "2%"],
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: muted, fontSize: 11, hideOverlap: true },
      },
      yAxis: {
        type: "value",
        min: 0,
        splitNumber: 4,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: muted,
          fontSize: 11,
          formatter: formatMilliseconds,
        },
        splitLine: { lineStyle: { color: border, opacity: 0.72 } },
      },
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(host);
    return () => {
      observer.disconnect();
      chartRef.current = null;
      chart.dispose();
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(
      {
        legend: {
          bottom: 0,
          left: "center",
          icon: "roundRect",
          itemWidth: 9,
          itemHeight: 9,
          textStyle: { fontSize: 11 },
          data: displayedServices.map((service) => service.name),
        },
        series: displayedServices.map((service) => ({
          id: service.taskId,
          name: service.name,
          type: "line",
          data: service.values,
          showSymbol: false,
          symbol: "none",
          smooth: false,
          lineStyle: { color: service.color, width: 1.35 },
          itemStyle: { color: service.color },
          emphasis: { disabled: true },
        })),
      },
      { lazyUpdate: true, replaceMerge: ["series"] },
    );
  }, [displayedServices]);

  return <div ref={ref} className="h-80 w-full sm:h-96" />;
}

function NetworkPanel({ client, range }: { client: Client; range: TimeRange }) {
  const [clipPeaks, setClipPeaks] = useState(false);
  const hours = range === "live" ? 1 : RANGE_HOURS[range];
  const tasksQuery = usePingTasks();
  const pingQuery = useQuery({
    queryKey: ["pingRecords", client.uuid, hours],
    queryFn: () => getPingRecords(client.uuid, hours),
    refetchInterval: range === "live" ? 5_000 : false,
  });
  const services = useMemo(
    () => buildPingServices(pingQuery.data ?? [], tasksQuery.data ?? []),
    [pingQuery.data, tasksQuery.data],
  );
  const loading = pingQuery.isPending || tasksQuery.isPending;

  return (
    <Card className="gap-0 py-0 shadow-xs ring-border">
      <div className="flex min-h-12 items-center justify-end border-b px-4">
        <label
          htmlFor="ping-peak-clipping"
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Switch
            id="ping-peak-clipping"
            checked={clipPeaks}
            onCheckedChange={setClipPeaks}
            aria-label={t("peakClipping")}
          />
          <span>{t("peakClipping")}</span>
        </label>
      </div>
      {loading ? (
        <div className="p-4">
          <div className="km-skeleton h-30 rounded-lg" />
          <div className="km-skeleton mt-4 h-80 rounded-lg" />
        </div>
      ) : services.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center text-center">
          <CircleAlert className="mb-2 size-4 text-muted-foreground/60" />
          <p className="text-sm font-medium text-muted-foreground">
            {t("noHistory")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid border-b md:grid-cols-[13rem_1fr]">
            <div className="flex flex-col justify-center border-b px-5 py-5 md:border-r md:border-b-0">
              <p className="truncate text-lg font-semibold">
                {client.name || client.uuid}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("monitoredServices").replace(
                  "{count}",
                  String(services.length),
                )}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service, index) => {
                const count = services.length;
                const smLastRowStart = count - (count % 2 || 2);
                const xlLastRowStart = count - (count % 3 || 3);
                return (
                  <div
                    key={service.taskId}
                    className={cn(
                      "min-w-0 px-5 py-4",
                      index < count - 1 && "border-b",
                      index >= smLastRowStart ? "sm:border-b-0" : "sm:border-b",
                      index % 2 === 0 && index < count - 1
                        ? "sm:border-r"
                        : "sm:border-r-0",
                      index >= xlLastRowStart ? "xl:border-b-0" : "xl:border-b",
                      index % 3 !== 2 && index < count - 1
                        ? "xl:border-r"
                        : "xl:border-r-0",
                    )}
                  >
                    <p className="truncate text-xs text-muted-foreground">
                      {service.name}
                    </p>
                    <p className="km-metric mt-1 text-xl font-semibold">
                      <AnimatedValue
                        value={`${service.average.toFixed(2)} ms`}
                      />
                    </p>
                    <div className="km-metric mt-1 flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
                      <span>
                        {t("packetLoss")} {service.loss.toFixed(1)}%
                      </span>
                      <span className="text-border" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        {t("fluctuation")} {service.fluctuation.toFixed(1)} ms
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <CardContent className="px-3 pt-3 pb-2 sm:px-5">
            <PingChart services={services} clipPeaks={clipPeaks} />
          </CardContent>
        </>
      )}
    </Card>
  );
}

export function InstanceDetail({ client }: { client: Client }) {
  const [range, setRange] = useState<TimeRange>("live");
  const statusQuery = useNodeStatus();
  useLiveStatus();
  const status = statusQuery.data?.[client.uuid];
  const historyQuery = useQuery({
    queryKey: ["load", client.uuid, range],
    queryFn: () =>
      range === "live"
        ? getRecentNodeStatus(client.uuid)
        : getLoadRecords(client.uuid, RANGE_HOURS[range]),
    refetchInterval: range === "live" ? 2_000 : false,
  });
  const records = historyQuery.data ?? [];
  const flag = regionToFlagEmoji(client.region);
  const regionLabel = client.region.trim() === flag ? "" : client.region.trim();
  const memoryTotal = status?.ram_total || client.mem_total;
  const diskTotal = status?.disk_total || client.disk_total;
  const reportTime = status?.time || records.at(-1)?.time;
  const load = status?.load ?? 0;
  const load5 = status?.load5 ?? 0;
  const load15 = status?.load15 ?? 0;

  const chartSeries = useMemo(
    () => ({
      cpu: [
        makeSeries(
          records,
          t("cpu"),
          CHART_COLORS.blue,
          (record) => record.cpu,
        ),
      ],
      memory: [
        makeSeries(records, t("memory"), CHART_COLORS.violet, (record) =>
          percent(record.ram, record.ram_total || client.mem_total),
        ),
        makeSeries(records, t("swap"), CHART_COLORS.pink, (record) =>
          percent(record.swap, record.swap_total || client.swap_total),
        ),
      ],
      disk: [
        makeSeries(records, t("disk"), CHART_COLORS.green, (record) =>
          percent(record.disk, record.disk_total || client.disk_total),
        ),
      ],
      process: [
        makeSeries(
          records,
          t("processes"),
          CHART_COLORS.rose,
          (record) => record.process,
        ),
      ],
      network: [
        makeSeries(
          records,
          t("upload"),
          CHART_COLORS.blue,
          (record) => record.net_out,
        ),
        makeSeries(
          records,
          t("download"),
          CHART_COLORS.violet,
          (record) => record.net_in,
        ),
      ],
      connections: [
        makeSeries(
          records,
          t("tcp"),
          CHART_COLORS.blue,
          (record) => record.connections,
        ),
        makeSeries(
          records,
          t("udp"),
          CHART_COLORS.violet,
          (record) => record.connections_udp,
        ),
      ],
    }),
    [client.disk_total, client.mem_total, client.swap_total, records],
  );

  const memoryUsage = percent(status?.ram ?? 0, memoryTotal);
  const diskUsage = percent(status?.disk ?? 0, diskTotal);

  return (
    <main className="km-page-instance mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:py-10">
      <section>
        <div className="flex items-center gap-3">
          <Button
            render={<Link to="/" />}
            nativeButton={false}
            variant="default"
            size="icon"
            className="size-8 rounded-full"
            aria-label={t("back")}
          >
            <ArrowLeft />
          </Button>
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {client.name || client.uuid}
          </h1>
        </div>

        <div className="mt-7 grid items-stretch gap-3 lg:auto-rows-fr lg:grid-cols-12">
          <DetailGroup
            title={t("overview")}
            className="lg:col-span-4"
            loading={statusQuery.isPending}
          >
            <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
              {status ? (
                <DetailItem label={t("status")}>
                  <Badge
                    className={cn(
                      "border-0",
                      status.online
                        ? "bg-status-online/12 text-status-online"
                        : "bg-status-offline/12 text-status-offline",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        status.online
                          ? "km-status-pulse bg-status-online"
                          : "bg-status-offline",
                      )}
                    />
                    {status.online ? t("online") : t("offline")}
                  </Badge>
                </DetailItem>
              ) : null}
              {regionLabel || flag ? (
                <DetailItem label={t("region")}>
                  <span className="inline-flex items-center gap-1.5">
                    {regionLabel}
                    {flag ? (
                      <span className="text-base" aria-hidden="true">
                        {flag}
                      </span>
                    ) : (
                      <MapPin className="size-3.5 text-muted-foreground" />
                    )}
                  </span>
                </DetailItem>
              ) : null}
              {status?.uptime !== undefined ? (
                <DetailItem
                  label={t("uptime")}
                  className="col-span-2"
                  valueClassName="whitespace-nowrap"
                >
                  <AnimatedValue value={formatUptime(status.uptime)} />
                </DetailItem>
              ) : null}
              {reportTime ? (
                <DetailItem
                  label={t("reportTime")}
                  className="col-span-2"
                  valueClassName="whitespace-nowrap"
                >
                  <AnimatedValue value={formatDate(reportTime)} />
                </DetailItem>
              ) : null}
            </dl>
          </DetailGroup>

          <DetailGroup
            title={t("hardware")}
            className="lg:col-span-4"
            loading={statusQuery.isPending}
          >
            <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
              {hasText(client.cpu_name) || client.cpu_cores > 0 ? (
                <DetailItem
                  label={t("cpuModel")}
                  className="col-span-2"
                  valueClassName="break-words"
                >
                  {hasText(client.cpu_name) ? client.cpu_name : null}
                  {hasText(client.cpu_name) && client.cpu_cores > 0
                    ? " · "
                    : null}
                  {client.cpu_cores > 0
                    ? `${client.cpu_cores} ${t("cores")}`
                    : null}
                </DetailItem>
              ) : null}
              {hasText(client.os) || hasText(client.kernel_version) ? (
                <DetailItem
                  label={t("os")}
                  className="col-span-2"
                  valueClassName="break-words"
                >
                  {hasText(client.os) ? (
                    <span className="block">{client.os}</span>
                  ) : null}
                  {hasText(client.kernel_version) ? (
                    <span className="mt-0.5 block text-xs leading-4 font-normal text-muted-foreground">
                      {t("kernelVersion")}: {client.kernel_version}
                    </span>
                  ) : null}
                </DetailItem>
              ) : null}
              {hasText(client.arch) ? (
                <DetailItem label={t("arch")}>{client.arch}</DetailItem>
              ) : null}
              {hasText(client.virtualization) ? (
                <DetailItem label={t("virtualization")}>
                  {client.virtualization}
                </DetailItem>
              ) : null}
              {hasText(client.gpu_name) ? (
                <DetailItem
                  label={t("gpu")}
                  className="col-span-2"
                  valueClassName="break-words"
                >
                  {client.gpu_name}
                </DetailItem>
              ) : null}
            </dl>
          </DetailGroup>

          <DetailGroup
            title={t("liveMetrics")}
            className="lg:col-span-4"
            loading={statusQuery.isPending}
          >
            <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
              {status ? (
                <DetailItem label={t("network")}>
                  <span className="grid gap-0.5 text-xs leading-5">
                    <span className="text-data-accent">
                      ↑ <AnimatedValue value={formatSpeed(status.net_out)} />
                    </span>
                    <span className="text-status-online">
                      ↓ <AnimatedValue value={formatSpeed(status.net_in)} />
                    </span>
                  </span>
                </DetailItem>
              ) : null}
              {status ? (
                <DetailItem label={t("totalTraffic")}>
                  <span className="grid gap-0.5 text-xs leading-5 text-muted-foreground">
                    <span>
                      ↑{" "}
                      <AnimatedValue value={formatBytes(status.net_total_up)} />
                    </span>
                    <span>
                      ↓{" "}
                      <AnimatedValue
                        value={formatBytes(status.net_total_down)}
                      />
                    </span>
                  </span>
                </DetailItem>
              ) : null}
              {client.mem_total > 0 ? (
                <DetailItem label={t("memory")}>
                  {formatBytes(client.mem_total)}
                </DetailItem>
              ) : null}
              {client.swap_total > 0 ? (
                <DetailItem label={t("swap")}>
                  {formatBytes(client.swap_total)}
                </DetailItem>
              ) : null}
              {client.disk_total > 0 ? (
                <DetailItem label={t("disk")}>
                  {formatBytes(client.disk_total)}
                </DetailItem>
              ) : null}
              {status ? (
                <DetailItem label={t("systemLoad")} className="col-span-2">
                  <span className="grid grid-cols-3 gap-x-3 whitespace-nowrap">
                    <span>
                      <span className="mr-1 text-xs font-normal text-muted-foreground">
                        1m
                      </span>
                      <AnimatedValue value={load.toFixed(2)} />
                    </span>
                    <span>
                      <span className="mr-1 text-xs font-normal text-muted-foreground">
                        5m
                      </span>
                      <AnimatedValue value={load5.toFixed(2)} />
                    </span>
                    <span>
                      <span className="mr-1 text-xs font-normal text-muted-foreground">
                        15m
                      </span>
                      <AnimatedValue value={load15.toFixed(2)} />
                    </span>
                  </span>
                </DetailItem>
              ) : null}
            </dl>
          </DetailGroup>
        </div>
      </section>

      <Tabs defaultValue="details" className="mt-10">
        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <TabsList>
            <TabsTrigger value="details">{t("details")}</TabsTrigger>
            <TabsTrigger value="network">{t("network")}</TabsTrigger>
          </TabsList>
          <Separator className="flex-1" />
        </div>

        <div className="mt-8 mb-4 overflow-x-auto">
          <div className="inline-flex h-10 min-w-max items-center rounded-lg bg-muted p-1 text-muted-foreground">
            {(["live", "24", "168", "720"] as TimeRange[]).map((value) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-md px-3 text-muted-foreground shadow-none hover:bg-background/55 hover:text-foreground",
                  range === value &&
                    "bg-background text-foreground shadow-xs hover:bg-background",
                )}
                aria-pressed={range === value}
                onClick={() => setRange(value)}
              >
                {value === "live" ? (
                  <span className="mr-1.5 size-1.5 rounded-full bg-status-online" />
                ) : null}
                {value === "live"
                  ? t("realtime")
                  : value === "24"
                    ? t("oneDay")
                    : value === "168"
                      ? t("sevenDays")
                      : t("thirtyDays")}
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="details">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <MonitoringChart
              title={t("cpu")}
              summary={
                <AnimatedValue value={formatPercent(status?.cpu ?? 0)} />
              }
              series={chartSeries.cpu}
              maximum={100}
              axisLabel={formatPercentAxis}
              tooltipValue={formatPercent}
              loading={historyQuery.isPending}
            />
            <MonitoringChart
              title={t("memory")}
              summary={
                <>
                  <AnimatedValue value={formatPercent(memoryUsage)} />
                  <br />
                  <span className="font-normal text-muted-foreground">
                    <AnimatedValue value={formatBytes(status?.ram ?? 0)} /> /{" "}
                    {formatBytes(memoryTotal)}
                  </span>
                </>
              }
              series={chartSeries.memory}
              maximum={100}
              axisLabel={formatPercentAxis}
              tooltipValue={formatPercent}
              loading={historyQuery.isPending}
            />
            <MonitoringChart
              title={t("disk")}
              summary={
                <>
                  <AnimatedValue value={formatPercent(diskUsage)} />
                  <br />
                  <span className="font-normal text-muted-foreground">
                    <AnimatedValue value={formatBytes(status?.disk ?? 0)} /> /{" "}
                    {formatBytes(diskTotal)}
                  </span>
                </>
              }
              series={chartSeries.disk}
              maximum={100}
              axisLabel={formatPercentAxis}
              tooltipValue={formatPercent}
              loading={historyQuery.isPending}
            />
            <MonitoringChart
              title={t("processes")}
              summary={<AnimatedValue value={String(status?.process ?? 0)} />}
              series={chartSeries.process}
              axisLabel={formatInteger}
              tooltipValue={formatInteger}
              loading={historyQuery.isPending}
            />
            <MonitoringChart
              title={t("network")}
              summary={
                <>
                  <span className="text-data-accent">
                    ↑{" "}
                    <AnimatedValue value={formatSpeed(status?.net_out ?? 0)} />
                  </span>
                  <br />
                  <span className="text-violet-500">
                    ↓ <AnimatedValue value={formatSpeed(status?.net_in ?? 0)} />
                  </span>
                </>
              }
              series={chartSeries.network}
              axisLabel={formatSpeed}
              tooltipValue={formatSpeed}
              loading={historyQuery.isPending}
            />
            <MonitoringChart
              title={t("connections")}
              summary={
                <>
                  <span>
                    {t("tcp")}{" "}
                    <AnimatedValue value={String(status?.connections ?? 0)} />
                  </span>
                  <br />
                  <span className="font-normal text-muted-foreground">
                    {t("udp")}{" "}
                    <AnimatedValue
                      value={String(status?.connections_udp ?? 0)}
                    />
                  </span>
                </>
              }
              series={chartSeries.connections}
              axisLabel={formatInteger}
              tooltipValue={formatInteger}
              loading={historyQuery.isPending}
            />
          </div>
        </TabsContent>
        <TabsContent value="network">
          <NetworkPanel client={client} range={range} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

import { Link } from "@tanstack/react-router";
import {
  getCoreRowModel,
  legacyCreateColumnHelper,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import { Server } from "lucide-react";
import { type ReactNode, useEffect, useMemo } from "react";
import { LiveUptime } from "@/components/live-uptime";
import { Progress } from "@/components/ui/progress";
import { formatSpeed } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { NodeRow } from "@/lib/nodes";
import { regionToFlagEmoji } from "@/lib/region";
import { cn } from "@/lib/utils";

const columnHelper = legacyCreateColumnHelper<NodeRow>();

const TABLE_COLUMNS_WITH_UPTIME = [
  { id: "name", width: "24%" },
  { id: "status", width: "6%" },
  { id: "system", width: "6%" },
  { id: "uptime", width: "9%" },
  { id: "cpu", width: "11%" },
  { id: "memory", width: "11%" },
  { id: "disk", width: "11%" },
  { id: "speed", width: "22%" },
] as const;

const TABLE_COLUMNS_WITHOUT_UPTIME = [
  { id: "name", width: "23%" },
  { id: "status", width: "6%" },
  { id: "system", width: "6%" },
  { id: "cpu", width: "14%" },
  { id: "memory", width: "14%" },
  { id: "disk", width: "14%" },
  { id: "speed", width: "23%" },
] as const;

const SYSTEM_ICON_MAPPINGS = [
  ["almalinux", "fl-almalinux"],
  ["alpine", "fl-alpine"],
  ["archcraft", "fl-archcraft"],
  ["archlabs", "fl-archlabs"],
  ["arcolinux", "fl-arcolinux"],
  ["arch", "fl-archlinux"],
  ["artix", "fl-artix"],
  ["centos", "fl-centos"],
  ["coreos", "fl-coreos"],
  ["debian", "fl-debian"],
  ["deepin", "fl-deepin"],
  ["devuan", "fl-devuan"],
  ["elementary", "fl-elementary"],
  ["endeavour", "fl-endeavour"],
  ["fedora", "fl-fedora"],
  ["freebsd", "fl-freebsd"],
  ["garuda", "fl-garuda"],
  ["gentoo", "fl-gentoo"],
  ["kali", "fl-kali-linux"],
  ["kubuntu", "fl-kubuntu"],
  ["linux mint", "fl-linuxmint"],
  ["mageia", "fl-mageia"],
  ["mandriva", "fl-mandriva"],
  ["manjaro", "fl-manjaro"],
  ["mx linux", "fl-mxlinux"],
  ["nixos", "fl-nixos"],
  ["nobara", "fl-nobara"],
  ["openbsd", "fl-openbsd"],
  ["opensuse", "fl-opensuse"],
  ["pop!_os", "fl-pop-os"],
  ["pop os", "fl-pop-os"],
  ["raspbian", "fl-raspberry-pi"],
  ["raspberry", "fl-raspberry-pi"],
  ["red hat", "fl-redhat"],
  ["redhat", "fl-redhat"],
  ["rocky", "fl-rocky-linux"],
  ["slackware", "fl-slackware"],
  ["solus", "fl-solus"],
  ["ubuntu", "fl-ubuntu"],
  ["void", "fl-void"],
  ["zorin", "fl-zorin"],
  ["darwin", "fl-apple"],
  ["macos", "fl-apple"],
  ["mac os", "fl-apple"],
] as const;

function systemIconClass(system: string) {
  const normalized = system.toLowerCase();
  return (
    SYSTEM_ICON_MAPPINGS.find(([name]) => normalized.includes(name))?.[1] ??
    "fl-tux"
  );
}

function UsageCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const tone =
    value >= 85
      ? "[&_[data-slot=progress-indicator]]:bg-status-offline"
      : value >= 65
        ? "[&_[data-slot=progress-indicator]]:bg-amber-500"
        : "[&_[data-slot=progress-indicator]]:bg-status-online";

  return (
    <div className="w-full min-w-16 max-w-24">
      <span className="block text-xs font-medium text-foreground">
        {value.toFixed(2)}%
      </span>
      <Progress
        value={value}
        aria-label={`${value.toFixed(2)}%`}
        className={cn("mt-1 gap-0", tone)}
      />
    </div>
  );
}

export function NodeTable({
  rows,
  sortKey,
  showUptime,
}: {
  rows: NodeRow[];
  sortKey: string;
  showUptime: boolean;
}) {
  useEffect(() => {
    const stylesheet = document.querySelector<HTMLLinkElement>(
      "#font-logos-stylesheet",
    );
    const href = stylesheet?.dataset.href;
    if (stylesheet && href && !stylesheet.hasAttribute("href")) {
      stylesheet.href = href;
    }
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("colName"),
        cell: (info) => {
          const flag = regionToFlagEmoji(info.row.original.region);
          return (
            <Link
              to="/instance/$uuid"
              params={{ uuid: info.row.original.uuid }}
              className="inline-flex min-w-0 items-center gap-2 font-medium text-foreground hover:text-data-accent"
            >
              <span
                className="flex size-5 shrink-0 items-center justify-center text-base"
                aria-hidden="true"
              >
                {flag ?? <Server className="size-3.5 text-muted-foreground" />}
              </span>
              <span className="truncate">{info.getValue()}</span>
            </Link>
          );
        },
      }),
      columnHelper.accessor("online", {
        header: t("colStatus"),
        cell: (info) => (
          <span
            className="inline-flex size-6 items-center justify-center"
            role="img"
            aria-label={info.getValue() ? t("online") : t("offline")}
            title={info.getValue() ? t("online") : t("offline")}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                info.getValue()
                  ? "km-status-pulse bg-status-online"
                  : "bg-status-offline",
              )}
            />
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.client.os, {
        id: "system",
        header: t("colSystem"),
        cell: (info) => {
          const system = info.getValue();
          return system ? (
            <span
              className="inline-flex size-6 items-center justify-center text-base text-muted-foreground"
              role="img"
              aria-label={system}
              title={system}
            >
              {system.toLowerCase().includes("windows") ? (
                <span
                  className="grid size-3.5 grid-cols-2 grid-rows-2 gap-px"
                  aria-hidden="true"
                >
                  <span className="bg-current" />
                  <span className="bg-current" />
                  <span className="bg-current" />
                  <span className="bg-current" />
                </span>
              ) : (
                <i
                  className={cn("fl-fw", systemIconClass(system))}
                  aria-hidden="true"
                />
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      }),
      ...(showUptime
        ? [
            columnHelper.accessor("uptime", {
              header: t("colUptime"),
              cell: (info) => (
                <LiveUptime
                  uptime={info.getValue()}
                  reportedAt={info.row.original.status?.time}
                  className="text-xs text-foreground"
                />
              ),
            }),
          ]
        : []),
      columnHelper.accessor("cpuUsage", {
        header: t("cpu"),
        cell: (info) => <UsageCell value={info.getValue()} />,
      }),
      columnHelper.accessor("memoryUsage", {
        header: t("memory"),
        cell: (info) => <UsageCell value={info.getValue()} />,
      }),
      columnHelper.accessor("diskUsage", {
        header: t("disk"),
        cell: (info) => <UsageCell value={info.getValue()} />,
      }),
      columnHelper.display({
        id: "speed",
        header: t("colSpeed"),
        cell: (info) => (
          <span className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 whitespace-nowrap">
            <span className="inline-flex min-w-0 items-center gap-1">
              <span className="shrink-0 text-status-online">↓</span>
              <span className="truncate">
                {formatSpeed(info.row.original.netIn)}
              </span>
            </span>
            <span className="text-border">/</span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <span className="shrink-0 text-data-accent">↑</span>
              <span className="truncate">
                {formatSpeed(info.row.original.netOut)}
              </span>
            </span>
          </span>
        ),
      }),
    ],
    [showUptime],
  );

  const table = useLegacyTable({
    data: rows,
    columns: columns as never,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-xs">
      <table className="km-ui-table w-full min-w-220 table-fixed text-left text-sm">
        <colgroup>
          {(showUptime
            ? TABLE_COLUMNS_WITH_UPTIME
            : TABLE_COLUMNS_WITHOUT_UPTIME
          ).map((column) => (
            <col key={column.id} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const label = header.isPlaceholder
                  ? null
                  : typeof header.column.columnDef.header === "function"
                    ? header.column.columnDef.header(header.getContext())
                    : header.column.columnDef.header;

                return (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-3 font-medium tracking-wide",
                      (header.column.id === "online" ||
                        header.column.id === "system") &&
                        "px-2 text-center",
                    )}
                  >
                    <span className="block truncate">{label}</span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={`${sortKey}:${row.original.uuid}`}
              className={cn(
                "km-sort-item km-ui-table-row border-t border-border transition-colors hover:bg-muted/35",
                !row.original.online && "[--km-sort-opacity:0.5]",
              )}
              style={{ animationDelay: `${Math.min(index, 10) * 18}ms` }}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    "km-metric overflow-hidden px-4 py-3.5 text-ellipsis whitespace-nowrap",
                    (cell.column.id === "online" ||
                      cell.column.id === "system") &&
                      "px-1 text-center [text-overflow:clip]",
                  )}
                >
                  {typeof cell.column.columnDef.cell === "function"
                    ? cell.column.columnDef.cell(cell.getContext())
                    : (cell.getValue() as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

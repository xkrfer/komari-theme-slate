import { useNavigate } from "@tanstack/react-router";
import { MapChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import countries from "@/data/countries-110m.json";
import { t } from "@/lib/i18n";
import type { NodeRow } from "@/lib/nodes";
import { regionToIsoNumeric } from "@/lib/region";

echarts.use([MapChart, TooltipComponent, CanvasRenderer]);

type GeoJson = {
  features: Array<{
    id?: string | number;
    properties?: { name?: string };
    geometry?: {
      type: "Polygon" | "MultiPolygon";
      coordinates: PolygonCoordinates | PolygonCoordinates[];
    };
  }>;
};

type Position = [number, number];
type LinearRing = Position[];
type PolygonCoordinates = LinearRing[];

function unwrapRing(ring: LinearRing) {
  if (ring.length < 4) return ring;
  const source = ring.slice(0, -1);
  const unwrapped: LinearRing = [[source[0]?.[0] ?? 0, source[0]?.[1] ?? 0]];
  for (const point of source.slice(1)) {
    const previous = unwrapped.at(-1)?.[0] ?? point[0];
    let longitude = point[0];
    while (longitude - previous > 180) longitude -= 360;
    while (longitude - previous < -180) longitude += 360;
    unwrapped.push([longitude, point[1]]);
  }
  const first = unwrapped[0];
  if (first) unwrapped.push([...first]);
  return unwrapped;
}

function clipRing(ring: LinearRing, boundary: number, keepGreater: boolean) {
  const source = ring.slice(0, -1);
  if (source.length < 3) return [];
  const output: LinearRing = [];
  const inside = (point: Position) =>
    keepGreater ? point[0] >= boundary : point[0] <= boundary;
  const intersection = (start: Position, end: Position): Position => {
    const ratio = (boundary - start[0]) / (end[0] - start[0]);
    return [boundary, start[1] + (end[1] - start[1]) * ratio];
  };
  let start = source.at(-1) as Position;
  for (const end of source) {
    const startInside = inside(start);
    const endInside = inside(end);
    if (endInside) {
      if (!startInside) output.push(intersection(start, end));
      output.push(end);
    } else if (startInside) {
      output.push(intersection(start, end));
    }
    start = end;
  }
  if (output.length < 3) return [];
  output.push([...(output[0] as Position)]);
  return output;
}

function splitPolygonAtAntimeridian(polygon: PolygonCoordinates) {
  const unwrapped = polygon.map(unwrapRing);
  const outer = unwrapped[0];
  if (!outer) return [];
  const longitudes = outer.map((point) => point[0]);
  const minimum = Math.min(...longitudes);
  const maximum = Math.max(...longitudes);
  const polygons: PolygonCoordinates[] = [];
  for (const shift of [-360, 0, 360]) {
    if (maximum + shift < -180 || minimum + shift > 180) continue;
    const shifted = unwrapped.map((ring) =>
      ring.map(
        ([longitude, latitude]) => [longitude + shift, latitude] as Position,
      ),
    );
    const clipped = shifted
      .map((ring) => clipRing(clipRing(ring, -180, true), 180, false))
      .filter((ring) => ring.length >= 4);
    if (clipped[0]) polygons.push(clipped);
  }
  return polygons;
}

const rawGeojson = feature(
  countries as never,
  (countries as { objects: { countries: unknown } }).objects.countries as never,
) as unknown as GeoJson;

const geojson: GeoJson = {
  ...rawGeojson,
  features: rawGeojson.features.flatMap((item) => {
    // Antarctica wraps the whole globe and adds no useful server location.
    if (String(item.id) === "010" || !item.geometry) return [];
    const source =
      item.geometry.type === "Polygon"
        ? [item.geometry.coordinates as PolygonCoordinates]
        : (item.geometry.coordinates as PolygonCoordinates[]);
    const coordinates = source.flatMap(splitPolygonAtAntimeridian);
    if (coordinates.length === 0) return [];
    return [
      {
        ...item,
        geometry:
          coordinates.length === 1
            ? {
                type: "Polygon" as const,
                coordinates: coordinates[0] as PolygonCoordinates,
              }
            : { type: "MultiPolygon" as const, coordinates },
      },
    ];
  }),
};

const featureIndex = new Map(
  geojson.features.map((item) => [String(item.id ?? ""), item]),
);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function NodeMap({ rows }: { rows: NodeRow[] }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [picks, setPicks] = useState<NodeRow[] | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; nodes: NodeRow[] }>();
    for (const row of rows) {
      const iso = regionToIsoNumeric(row.region);
      if (!iso) {
        continue;
      }
      const geoFeature = featureIndex.get(iso);
      if (!geoFeature) {
        continue;
      }
      const current = map.get(iso);
      if (current) {
        current.nodes.push(row);
      } else {
        map.set(iso, {
          name: geoFeature?.properties?.name ?? row.region,
          nodes: [row],
        });
      }
    }
    return map;
  }, [rows]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    echarts.registerMap("world", geojson as never);
    const useDarkTheme =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const chart = echarts.init(host);
    chartRef.current = chart;
    const palette = useDarkTheme
      ? {
          area: "#1c1917",
          border: "#44403c",
          foreground: "#fafaf9",
          card: "#0c0a09",
          highlight: "#22c55e",
          highlightHover: "#4ade80",
        }
      : {
          area: "#f1f0ef",
          border: "#e7e5e4",
          foreground: "#1c1917",
          card: "#ffffff",
          highlight: "#16a34a",
          highlightHover: "#15803d",
        };
    const regions = [...grouped.values()].map((item) => ({
      name: item.name,
      value: item.nodes.length,
      nodes: item.nodes,
      itemStyle: {
        areaColor: palette.highlight,
        borderColor: palette.highlight,
      },
      emphasis: {
        itemStyle: {
          areaColor: palette.highlightHover,
          borderColor: palette.highlightHover,
        },
      },
    }));
    chart.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: palette.card,
        borderColor: palette.border,
        textStyle: { color: palette.foreground },
        padding: 12,
        formatter: (params: {
          name?: string;
          data?: { nodes?: NodeRow[] };
        }) => {
          const nodes = params.data?.nodes;
          if (!nodes?.length) {
            return escapeHtml(params.name ?? "");
          }
          const count = t("serverCount").replace(
            "{count}",
            String(nodes.length),
          );
          const list = nodes
            .map(
              (node) =>
                `<div style="display:flex;align-items:center;gap:7px;margin-top:7px"><span style="width:7px;height:7px;border-radius:999px;background:${node.online ? "#22c55e" : "#ef4444"}"></span><span>${escapeHtml(node.name)}</span></div>`,
            )
            .join("");
          return `<div style="min-width:170px"><div style="font-size:14px;font-weight:600">${escapeHtml(params.name ?? "")}</div><div style="margin-top:2px;color:#78716c">${escapeHtml(count)}</div><div style="height:1px;background:${palette.border};margin:8px 0 2px"></div>${list}</div>`;
        },
      },
      series: [
        {
          type: "map",
          map: "world",
          roam: false,
          selectedMode: false,
          left: "5%",
          right: "5%",
          top: "6%",
          bottom: "6%",
          itemStyle: {
            areaColor: palette.area,
            borderColor: palette.border,
            borderWidth: 0.7,
          },
          emphasis: {
            label: { show: false },
            itemStyle: {
              areaColor: palette.area,
              borderColor: palette.border,
            },
          },
          data: regions,
        },
      ],
    });
    chart.on("click", (params) => {
      const nodes = (params.data as { nodes?: NodeRow[] } | undefined)?.nodes;
      if (!nodes || nodes.length === 0) {
        return;
      }
      if (nodes.length === 1) {
        const uuid = nodes[0]?.uuid;
        if (uuid) {
          void navigate({ to: "/instance/$uuid", params: { uuid } });
        }
        return;
      }
      setPicks(nodes);
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(host);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [grouped, navigate, theme]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
      <div className="border-b border-border/70 px-4 py-3.5">
        <p className="text-sm font-medium text-foreground">
          {t("mapDistribution").replace("{count}", String(grouped.size))}
        </p>
      </div>
      <div className="relative bg-muted/15 px-2 py-3 sm:px-5 sm:py-4">
        <div ref={hostRef} className="h-80 w-full sm:h-105 lg:h-120" />
        {picks ? (
          <div className="absolute inset-x-4 bottom-4 rounded-lg bg-popover p-3 shadow-md ring-1 ring-foreground/10 sm:inset-x-auto sm:right-6 sm:w-96">
            <p className="mb-2 text-sm font-medium">{t("pickNode")}</p>
            <div className="ui-scroll flex max-h-32 flex-wrap gap-2 pr-1">
              {picks.map((node) => (
                <Button
                  key={node.uuid}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigate({
                      to: "/instance/$uuid",
                      params: { uuid: node.uuid },
                    });
                  }}
                >
                  {node.name}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPicks(null)}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

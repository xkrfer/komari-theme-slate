import type { Client, NodeStatus } from "@/lib/schemas";

export type NodeRow = {
  uuid: string;
  name: string;
  region: string;
  group: string;
  tags: string[];
  ipTags: string[];
  online: boolean;
  traffic: number;
  trafficLimit: number;
  totalUp: number;
  totalDown: number;
  netIn: number;
  netOut: number;
  uptime: number | null;
  cpuUsage: number | null;
  memoryUsage: number | null;
  diskUsage: number | null;
  client: Client;
  status: NodeStatus | undefined;
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function usagePercent(used: number, total: number) {
  if (total <= 0) {
    return null;
  }
  return clampPercent((used / total) * 100);
}

function parseTags(tags: string) {
  return [
    ...new Set(
      tags
        .split(";")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

function reportedUptime(online: boolean, uptime: number | undefined) {
  if (!online || uptime === undefined || !Number.isFinite(uptime)) return null;
  return Math.max(0, uptime);
}

function ipTypeTags(ipv4: string, ipv6: string) {
  const tags: string[] = [];
  if (ipv4.trim()) tags.push("IPv4");
  if (ipv6.trim()) tags.push("IPv6");
  return tags;
}

export function buildNodeRows(
  nodes: Client[],
  statusMap: Record<string, NodeStatus> | undefined,
): NodeRow[] {
  const sorted = [...nodes].sort(
    (a, b) => (b.weight ?? 0) - (a.weight ?? 0) || a.name.localeCompare(b.name),
  );
  return sorted.map((client) => {
    const status = statusMap?.[client.uuid];
    const online = status?.online ?? false;
    const memoryTotal = status?.ram_total || client.mem_total;
    const diskTotal = status?.disk_total || client.disk_total;
    return {
      uuid: client.uuid,
      name: client.name || client.uuid,
      region: client.region || "",
      group: client.group || "",
      tags: parseTags(client.tags),
      ipTags: ipTypeTags(client.ipv4, client.ipv6),
      online,
      traffic: (status?.net_total_up ?? 0) + (status?.net_total_down ?? 0),
      trafficLimit: client.traffic_limit ?? 0,
      totalUp: status?.net_total_up ?? 0,
      totalDown: status?.net_total_down ?? 0,
      netIn: status?.net_in ?? 0,
      netOut: status?.net_out ?? 0,
      uptime: reportedUptime(online, status?.uptime),
      cpuUsage: online ? clampPercent(status?.cpu ?? 0) : null,
      memoryUsage: online ? usagePercent(status?.ram ?? 0, memoryTotal) : null,
      diskUsage: online ? usagePercent(status?.disk ?? 0, diskTotal) : null,
      client,
      status,
    };
  });
}

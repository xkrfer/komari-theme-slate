import type { PingMetricStat, PingTask } from "@/lib/schemas";

export type NodeLatency = {
  taskId: string;
  name: string;
  latest: number;
  average: number | null;
  minimum: number | null;
  maximum: number | null;
  p50: number | null;
  p99: number | null;
  loss: number | null;
  lossApproximate: boolean;
};

export function latencyDetailsForNode(
  uuid: string,
  status:
    | {
        ping?: Record<string, { latest?: number; avg?: number; name?: string }>;
      }
    | undefined,
  stats: PingMetricStat[],
  tasks: PingTask[],
): NodeLatency[] {
  const taskById = new Map(tasks.map((task) => [String(task.id), task]));
  const taskOrder = new Map(
    tasks.map((task, index) => [String(task.id), index]),
  );
  const merged = new Map<
    string,
    {
      latest?: number;
      average?: number;
      minimum?: number;
      maximum?: number;
      p50?: number;
      p99?: number;
      loss?: number;
      lossApproximate?: boolean;
      name?: string;
    }
  >();

  for (const item of stats) {
    if (item.entity_id !== uuid || item.task_id === undefined) continue;
    const taskId = String(item.task_id);
    merged.set(taskId, {
      latest: item.latest,
      average: item.avg,
      minimum: item.min,
      maximum: item.max,
      p50: item.p50,
      p99: item.p99,
      loss: item.loss,
      lossApproximate: item.loss_approximate,
      name: item.name || current?.name,
    });
  }

  for (const [taskId, item] of Object.entries(status?.ping ?? {})) {
    const current = merged.get(taskId);
    merged.set(taskId, {
      latest: item.latest ?? current?.latest,
      average: item.avg ?? current?.average,
      minimum: current?.minimum,
      maximum: current?.maximum,
      p50: current?.p50,
      p99: current?.p99,
      loss: current?.loss,
      lossApproximate: current?.lossApproximate,
      name: item.name,
    });
  }

  return [...merged.entries()]
    .flatMap(([taskId, item]) => {
      const latest = item.latest ?? item.average;
      if (latest === undefined || !Number.isFinite(latest)) return [];
      const average =
        item.average !== undefined && Number.isFinite(item.average)
          ? item.average
          : null;
      const task = taskById.get(taskId);
      return [
        {
          taskId,
          name: item.name || task?.name || `Ping ${taskId}`,
          latest,
          average,
          minimum:
            item.minimum !== undefined && Number.isFinite(item.minimum)
              ? item.minimum
              : null,
          maximum:
            item.maximum !== undefined && Number.isFinite(item.maximum)
              ? item.maximum
              : null,
          p50:
            item.p50 !== undefined && Number.isFinite(item.p50)
              ? item.p50
              : null,
          p99:
            item.p99 !== undefined && Number.isFinite(item.p99)
              ? item.p99
              : null,
          loss:
            item.loss !== undefined && Number.isFinite(item.loss)
              ? Math.min(100, Math.max(0, item.loss))
              : null,
          lossApproximate: item.lossApproximate ?? false,
        },
      ];
    })
    .toSorted((a, b) => {
      const aTask = taskById.get(a.taskId);
      const bTask = taskById.get(b.taskId);
      if (Boolean(aTask?.default_on) !== Boolean(bTask?.default_on)) {
        return aTask?.default_on ? -1 : 1;
      }
      return (
        (taskOrder.get(a.taskId) ?? Number.MAX_SAFE_INTEGER) -
          (taskOrder.get(b.taskId) ?? Number.MAX_SAFE_INTEGER) ||
        a.name.localeCompare(b.name)
      );
    });
}

export function latencyFromStatus(
  status:
    | { ping?: Record<string, { latest?: number; avg?: number }> }
    | undefined,
  tasks: PingTask[],
): number | null {
  const ping = status?.ping;
  if (!ping) {
    return null;
  }
  const entries = Object.entries(ping);
  if (entries.length === 0) {
    return null;
  }
  const defaultIds = new Set(
    tasks.filter((task) => task.default_on).map((task) => String(task.id)),
  );
  const preferred = defaultIds.size
    ? entries.filter(([taskId]) => defaultIds.has(taskId))
    : [];
  const pool = preferred.length > 0 ? preferred : entries;
  const values = pool
    .map(([, item]) => item.latest ?? item.avg)
    .filter(
      (item): item is number =>
        typeof item === "number" && Number.isFinite(item),
    );
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

export function latencyForNode(
  uuid: string,
  stats: PingMetricStat[],
  tasks: PingTask[],
): number | null {
  const nodeStats = stats.filter((item) => item.entity_id === uuid);
  if (nodeStats.length === 0) {
    return null;
  }

  const defaultIds = new Set(
    tasks.filter((task) => task.default_on).map((task) => String(task.id)),
  );
  const preferred = defaultIds.size
    ? nodeStats.filter((item) => defaultIds.has(String(item.task_id ?? "")))
    : [];
  const pool = preferred.length > 0 ? preferred : nodeStats;
  const values = pool
    .map((item) => item.latest ?? item.avg)
    .filter(
      (item): item is number =>
        typeof item === "number" && Number.isFinite(item),
    );

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

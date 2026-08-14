import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getMe,
  getNodes,
  getNodesLatestStatus,
  getPingMetricStats,
  getPublicInfo,
  getPublicPingTasks,
} from "@/lib/api";
import { rpcPing, rpcServerVersion } from "@/lib/rpc";
import { nodeStatusSchema } from "@/lib/schemas";

export const queryKeys = {
  publicInfo: ["publicInfo"] as const,
  me: ["me"] as const,
  nodes: ["nodes"] as const,
  status: ["nodesLatestStatus"] as const,
  pingTasks: ["pingTasks"] as const,
  pingStats: ["pingStats"] as const,
  serverVersion: ["serverVersion"] as const,
};

export function usePublicInfo() {
  return useQuery({
    queryKey: queryKeys.publicInfo,
    queryFn: getPublicInfo,
  });
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
  });
}

export function useNodes() {
  return useQuery({
    queryKey: queryKeys.nodes,
    queryFn: getNodes,
  });
}

export function useNodeStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: getNodesLatestStatus,
  });
}

export function usePingTasks() {
  return useQuery({
    queryKey: queryKeys.pingTasks,
    queryFn: getPublicPingTasks,
  });
}

export function usePingStats() {
  return useQuery({
    queryKey: queryKeys.pingStats,
    queryFn: getPingMetricStats,
  });
}

export function useRpcHealth() {
  return useQuery({
    queryKey: ["rpcPing"],
    queryFn: rpcPing,
    retry: 1,
  });
}

export function useServerVersion() {
  return useQuery({
    queryKey: queryKeys.serverVersion,
    queryFn: rpcServerVersion,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useLiveStatus(authenticated: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: number | null = null;
    let cancelled = false;
    let usingSocket = false;

    const applyResult = (result: unknown) => {
      if (!result || typeof result !== "object") {
        return;
      }
      const entries = Object.entries(result as Record<string, unknown>);
      const parsed = Object.fromEntries(
        entries.map(([uuid, value]) => [uuid, nodeStatusSchema.parse(value)]),
      );
      queryClient.setQueryData(queryKeys.status, parsed);
    };

    if (authenticated) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.status });
    }

    const poll = () => {
      if (timer !== null) {
        return;
      }
      timer = window.setInterval(() => {
        void getNodesLatestStatus()
          .then((data) => {
            queryClient.setQueryData(queryKeys.status, data);
          })
          .catch(() => undefined);
      }, 2000);
    };

    const stopTimer = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    if (import.meta.env.DEV) {
      poll();
      return () => {
        cancelled = true;
        stopTimer();
      };
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${window.location.host}/api/rpc2`);
      ws.addEventListener("open", () => {
        usingSocket = true;
        const send = () => {
          ws?.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: Date.now(),
              method: "common:getNodesLatestStatus",
              params: {},
            }),
          );
        };
        send();
        timer = window.setInterval(send, 2000);
      });
      ws.addEventListener("message", (event) => {
        try {
          const payload: unknown = JSON.parse(String(event.data));
          if (payload && typeof payload === "object" && "result" in payload) {
            applyResult((payload as { result: unknown }).result);
          }
        } catch {
          /* ignore malformed frames */
        }
      });
      ws.addEventListener("close", () => {
        if (cancelled) {
          return;
        }
        usingSocket = false;
        stopTimer();
        poll();
      });
      ws.addEventListener("error", () => {
        ws?.close();
      });
    } catch {
      poll();
    }

    const fallback = window.setTimeout(() => {
      if (!usingSocket && !cancelled) {
        poll();
      }
    }, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      stopTimer();
      ws?.close();
    };
  }, [authenticated, queryClient]);
}

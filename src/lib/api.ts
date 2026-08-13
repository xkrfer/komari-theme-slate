import { rpcCall } from "@/lib/rpc";
import {
  type Client,
  clientSchema,
  type LoadRecord,
  loadRecordSchema,
  type MeInfo,
  meInfoSchema,
  type NodeStatus,
  nodeStatusSchema,
  type PingMetricStat,
  type PingRecord,
  type PingTask,
  type PublicInfo,
  pingMetricStatsRespSchema,
  pingRecordSchema,
  pingTaskSchema,
  publicInfoSchema,
} from "@/lib/schemas";

function parseOrThrow<T>(
  schema: { parse: (value: unknown) => T },
  value: unknown,
): T {
  return schema.parse(value);
}

export async function getPublicInfo(): Promise<PublicInfo> {
  const result = await rpcCall<unknown>("common:getPublicInfo");
  return parseOrThrow(publicInfoSchema, result);
}

export async function getMe(): Promise<MeInfo> {
  const result = await rpcCall<unknown>("common:getMe");
  return parseOrThrow(meInfoSchema, result);
}

export async function getNodes(): Promise<Client[]> {
  const result = await rpcCall<unknown>("common:getNodes");
  if (Array.isArray(result)) {
    return result.map((item) => parseOrThrow(clientSchema, item));
  }
  if (result && typeof result === "object") {
    return Object.values(result).map((item) =>
      parseOrThrow(clientSchema, item),
    );
  }
  throw new Error("Unexpected nodes payload");
}

export async function getNodesLatestStatus(): Promise<
  Record<string, NodeStatus>
> {
  const result = await rpcCall<unknown>("common:getNodesLatestStatus");
  if (!result || typeof result !== "object") {
    throw new Error("Unexpected status payload");
  }
  const entries = Object.entries(result as Record<string, unknown>);
  return Object.fromEntries(
    entries.map(([uuid, value]) => [
      uuid,
      parseOrThrow(nodeStatusSchema, value),
    ]),
  );
}

export async function getPublicPingTasks(): Promise<PingTask[]> {
  const result = await rpcCall<unknown>("public:getPublicPingTasks");
  if (!Array.isArray(result)) {
    throw new Error("Unexpected ping tasks payload");
  }
  return result.map((item) => parseOrThrow(pingTaskSchema, item));
}

export async function getPingMetricStats(): Promise<PingMetricStat[]> {
  const result = await rpcCall<unknown>("public:getPingMetricStats", {
    hours: 1,
  });
  return parseOrThrow(pingMetricStatsRespSchema, result).stats;
}

export async function getLoadRecords(
  uuid: string,
  hours = 24,
): Promise<LoadRecord[]> {
  const result = await rpcCall<unknown>("public:getRecordsByUUID", {
    uuid,
    hours: String(hours),
    load_type: "all",
  });
  const records =
    result && typeof result === "object" && "records" in result
      ? (result as { records: unknown }).records
      : result;
  if (!Array.isArray(records)) {
    throw new Error("Unexpected load records payload");
  }
  return records.map((item) => parseOrThrow(loadRecordSchema, item));
}

export async function getRecentNodeStatus(uuid: string): Promise<NodeStatus[]> {
  const result = await rpcCall<unknown>("common:getNodeRecentStatus", { uuid });
  const records =
    result && typeof result === "object" && "records" in result
      ? (result as { records: unknown }).records
      : result;
  if (!Array.isArray(records)) {
    throw new Error("Unexpected recent status payload");
  }
  return records.map((item) => parseOrThrow(nodeStatusSchema, item));
}

export async function getPingRecords(
  uuid: string,
  hours = 24,
): Promise<PingRecord[]> {
  const result = await rpcCall<unknown>("public:getPingRecords", {
    uuid,
    hours: String(hours),
  });
  const records =
    result && typeof result === "object" && "records" in result
      ? (result as { records: unknown }).records
      : result;
  if (!Array.isArray(records)) {
    throw new Error("Unexpected ping records payload");
  }
  return records.map((item) => parseOrThrow(pingRecordSchema, item));
}

export class LoginError extends Error {
  needsTwoFactor: boolean;

  constructor(message: string, needsTwoFactor = false) {
    super(message);
    this.name = "LoginError";
    this.needsTwoFactor = needsTwoFactor;
  }
}

export async function login(
  username: string,
  password: string,
  totp = "",
): Promise<void> {
  const body: Record<string, string> = { username, password };
  if (totp) {
    body["2fa_code"] = totp;
  }
  const response = await fetch("/api/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  const message =
    payload && typeof payload === "object" && "message" in payload
      ? String((payload as { message?: string }).message ?? "")
      : "";
  const needsTwoFactor =
    response.status === 401 && message === "2FA code is required";
  if (!response.ok) {
    throw new LoginError(message || `HTTP ${response.status}`, needsTwoFactor);
  }
  if (
    payload &&
    typeof payload === "object" &&
    "status" in payload &&
    (payload as { status?: string }).status === "error"
  ) {
    throw new LoginError(message || "Login failed");
  }
}

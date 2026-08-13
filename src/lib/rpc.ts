export class RpcError extends Error {
  readonly code: number;

  constructor(message: string, code = -1) {
    super(message);
    this.name = "RpcError";
    this.code = code;
  }
}

export function isRpcUnavailable(error: unknown): boolean {
  if (error instanceof RpcError) {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof Error) {
    return /failed to fetch|network|404|rpc/i.test(error.message);
  }
  return false;
}

let rpcId = 1;

export async function rpcCall<T>(
  method: string,
  params: unknown = {},
): Promise<T> {
  const response = await fetch("/api/rpc2", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcId++,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new RpcError(`RPC HTTP ${response.status}`, response.status);
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new RpcError("Invalid RPC payload");
  }

  const body = payload as {
    error?: { code?: number; message?: string };
    result?: T;
  };

  if (body.error) {
    throw new RpcError(
      body.error.message ?? "RPC error",
      body.error.code ?? -1,
    );
  }

  return body.result as T;
}

export async function rpcPing(): Promise<string> {
  return rpcCall<string>("rpc.ping");
}

export type ServerVersion = {
  version: string;
  hash: string;
};

export async function rpcServerVersion(): Promise<ServerVersion> {
  const result = await rpcCall<unknown>("public:getVersion");
  if (!result || typeof result !== "object") {
    throw new RpcError("Invalid server version payload");
  }

  const version = "version" in result ? result.version : undefined;
  const hash = "hash" in result ? result.hash : undefined;
  if (typeof version !== "string" || typeof hash !== "string") {
    throw new RpcError("Invalid server version payload");
  }

  return { version, hash };
}

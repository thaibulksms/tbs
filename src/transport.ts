import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_INFO = { name: "@thaibulksms/tbs", version: "0.1.0" };

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

type ToolResult = {
  content: { type: string; text: string }[];
  isError?: boolean;
};

export interface McpHandlerOptions {
  tools: ToolDef[];
  onToolCall: (name: string, args: unknown) => Promise<ToolResult>;
}

function jsonRpcResponse(id: unknown, result: unknown) {
  return JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n";
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n";
}

export function createMcpHandler(opts: McpHandlerOptions) {
  let initialized = false;

  async function handleMessage(msg: Record<string, unknown>, write: (s: string) => void) {
    const { id, method, params } = msg as { id?: unknown; method?: string; params?: Record<string, unknown> };

    // Notifications (no id) — just acknowledge silently
    if (id === undefined) {
      if (method === "notifications/initialized") initialized = true;
      return;
    }

    // initialize — must be first request
    if (method === "initialize") {
      write(jsonRpcResponse(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      }));
      return;
    }

    // All other methods require initialization
    if (!initialized) {
      write(jsonRpcError(id, -32002, "Server not initialized"));
      return;
    }

    switch (method) {
      case "ping":
        write(jsonRpcResponse(id, {}));
        break;

      case "tools/list":
        write(jsonRpcResponse(id, { tools: opts.tools }));
        break;

      case "tools/call": {
        const toolName = (params as Record<string, unknown>)?.name as string;
        const toolArgs = (params as Record<string, unknown>)?.arguments ?? {};
        try {
          const result = await opts.onToolCall(toolName, toolArgs);
          write(jsonRpcResponse(id, result));
        } catch (e) {
          write(jsonRpcResponse(id, {
            content: [{ type: "text", text: String(e) }],
            isError: true,
          }));
        }
        break;
      }

      default:
        write(jsonRpcError(id, -32601, `Method not found: ${method}`));
    }
  }

  return {
    start(stdin: Readable, stdout: Writable) {
      const rl = createInterface({ input: stdin, crlfDelay: Infinity });
      const write = (s: string) => stdout.write(s);

      rl.on("line", (line: string) => {
        if (!line.trim()) return;
        try {
          const msg = JSON.parse(line) as Record<string, unknown>;
          handleMessage(msg, write).catch((e) => {
            console.error("[transport error]", e);
          });
        } catch {
          write(jsonRpcError(null, -32700, "Parse error"));
        }
      });

      rl.on("close", () => {
        // Only exit if this is the main process entry point (not in tests)
        if (stdin === process.stdin) process.exit(0);
      });
    },
  };
}

/** Convenience: start with process.stdin/stdout */
export function startServer(opts: McpHandlerOptions) {
  const handler = createMcpHandler(opts);
  handler.start(process.stdin, process.stdout);
  console.error("@thaibulksms/tbs running on stdio");
}

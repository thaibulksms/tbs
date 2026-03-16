import { describe, it } from "./compat.js";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { createMcpHandler } from "../src/transport.js";

function createTestStreams() {
  const output: string[] = [];
  const stdout = new Writable({
    write(chunk, _enc, cb) { output.push(chunk.toString()); cb(); },
  });
  return { output, stdout };
}

function sendLine(stdin: Readable, obj: unknown) {
  stdin.push(JSON.stringify(obj) + "\n");
}

describe("MCP transport", () => {
  it("responds to initialize with server info and capabilities", async () => {
    const { output, stdout } = createTestStreams();
    const stdin = new Readable({ read() {} });

    const handler = createMcpHandler({
      tools: [],
      onToolCall: async () => ({ content: [{ type: "text", text: "ok" }] }),
    });
    handler.start(stdin, stdout);

    sendLine(stdin, {
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0.1" } },
    });

    await new Promise((r) => setTimeout(r, 50));
    const resp = JSON.parse(output[0]);
    assert.equal(resp.id, 1);
    assert.equal(resp.result.protocolVersion, "2024-11-05");
    assert.equal(resp.result.serverInfo.name, "@thaibulksms/tbs");
    assert.ok(resp.result.capabilities.tools);

    stdin.push(null);
  });

  it("responds to tools/list with tool definitions", async () => {
    const { output, stdout } = createTestStreams();
    const stdin = new Readable({ read() {} });

    const tools = [{ name: "test_tool", description: "A test", inputSchema: { type: "object", properties: {} } }];
    const handler = createMcpHandler({
      tools,
      onToolCall: async () => ({ content: [{ type: "text", text: "ok" }] }),
    });
    handler.start(stdin, stdout);

    sendLine(stdin, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
    sendLine(stdin, { jsonrpc: "2.0", method: "notifications/initialized" });
    sendLine(stdin, { jsonrpc: "2.0", id: 2, method: "tools/list" });

    await new Promise((r) => setTimeout(r, 50));
    const resp = JSON.parse(output[output.length - 1]);
    assert.equal(resp.id, 2);
    assert.equal(resp.result.tools[0].name, "test_tool");

    stdin.push(null);
  });

  it("dispatches tools/call to onToolCall", async () => {
    const { output, stdout } = createTestStreams();
    const stdin = new Readable({ read() {} });

    const handler = createMcpHandler({
      tools: [{ name: "echo", description: "Echo", inputSchema: { type: "object", properties: { msg: { type: "string" } } } }],
      onToolCall: async (name, args) => ({
        content: [{ type: "text", text: `${name}:${(args as Record<string, string>).msg}` }],
      }),
    });
    handler.start(stdin, stdout);

    sendLine(stdin, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
    sendLine(stdin, { jsonrpc: "2.0", method: "notifications/initialized" });
    sendLine(stdin, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "echo", arguments: { msg: "hello" } } });

    await new Promise((r) => setTimeout(r, 50));
    const resp = JSON.parse(output[output.length - 1]);
    assert.equal(resp.id, 2);
    assert.equal(resp.result.content[0].text, "echo:hello");

    stdin.push(null);
  });

  it("responds to ping with empty result", async () => {
    const { output, stdout } = createTestStreams();
    const stdin = new Readable({ read() {} });

    const handler = createMcpHandler({ tools: [], onToolCall: async () => ({ content: [] }) });
    handler.start(stdin, stdout);

    sendLine(stdin, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
    sendLine(stdin, { jsonrpc: "2.0", method: "notifications/initialized" });
    sendLine(stdin, { jsonrpc: "2.0", id: 5, method: "ping" });

    await new Promise((r) => setTimeout(r, 50));
    const resp = JSON.parse(output[output.length - 1]);
    assert.equal(resp.id, 5);
    assert.deepEqual(resp.result, {});

    stdin.push(null);
  });
});

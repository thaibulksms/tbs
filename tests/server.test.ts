import { describe, it, afterEach } from "./compat.js";
import assert from "node:assert/strict";

process.env.THAIBULKSMS_API_KEY = "test-key";
process.env.THAIBULKSMS_API_SECRET = "test-secret";
process.env.THAIBULKSMS_OTP_KEY = "otp-key";
process.env.THAIBULKSMS_OTP_SECRET = "otp-secret";

import { handleToolCall, TOOLS } from "../src/server.js";

function mockFetch(status: number, body: unknown) {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
  return () => { globalThis.fetch = original; };
}

let restoreFetch: (() => void) | undefined;
afterEach(() => { restoreFetch?.(); restoreFetch = undefined; });

describe("TOOLS array", () => {
  it("has 8 tools defined", () => {
    assert.equal(TOOLS.length, 8);
  });

  it("each tool has name, description, inputSchema", () => {
    for (const t of TOOLS) {
      assert.ok(t.name);
      assert.ok(t.description);
      assert.ok(t.inputSchema);
    }
  });
});

describe("handleToolCall", () => {
  it("send_sms rejects invalid phone", async () => {
    const r = await handleToolCall("send_sms", { recipient: "12345", message: "Hi" });
    assert.ok(r.isError);
  });

  it("send_sms succeeds with valid phone", async () => {
    restoreFetch = mockFetch(200, {
      remaining_credit: 99, used_credit: 1,
      data: [{ msisdn: "+66812345678", id: "uuid-1" }], error: [],
    });
    const r = await handleToolCall("send_sms", { recipient: "+66812345678", message: "Hi", sender: "Demo" });
    assert.equal(r.isError, undefined);
  });

  it("send_sms normalizes domestic number", async () => {
    restoreFetch = mockFetch(200, { remaining_credit: 99, data: [], error: [] });
    const r = await handleToolCall("send_sms", { recipient: "0812345678", message: "Hi" });
    assert.equal(r.isError, undefined);
  });

  it("send_email rejects invalid recipient", async () => {
    const r = await handleToolCall("send_email", { mail_from: "a@b.com", to: "bad", subject: "Hi", template_uuid: "uuid" });
    assert.ok(r.isError);
  });

  it("send_email rejects missing template_uuid", async () => {
    const r = await handleToolCall("send_email", { mail_from: "a@b.com", to: "a@b.com", subject: "Hi" });
    assert.ok(r.isError);
  });

  it("send_email succeeds", async () => {
    restoreFetch = mockFetch(200, { status: "sent" });
    const r = await handleToolCall("send_email", { mail_from: "a@b.com", to: "a@b.com", subject: "Hi", template_uuid: "uuid-123" });
    assert.equal(r.isError, undefined);
  });

  it("check_sms_credit succeeds", async () => {
    restoreFetch = mockFetch(200, { remaining_credit: 500 });
    const r = await handleToolCall("check_sms_credit", {});
    assert.equal(r.isError, undefined);
  });

  it("check_email_credit succeeds", async () => {
    restoreFetch = mockFetch(200, { remaining_credit: 1000 });
    const r = await handleToolCall("check_email_credit", {});
    assert.equal(r.isError, undefined);
  });

  it("request_otp rejects invalid phone", async () => {
    const r = await handleToolCall("request_otp", { msisdn: "bad" });
    assert.ok(r.isError);
  });

  it("request_otp succeeds", async () => {
    restoreFetch = mockFetch(200, { token: "otp-123" });
    const r = await handleToolCall("request_otp", { msisdn: "+66812345678" });
    assert.equal(r.isError, undefined);
  });

  it("verify_otp succeeds", async () => {
    restoreFetch = mockFetch(200, { status: "verified" });
    const r = await handleToolCall("verify_otp", { token: "tok", pin: "1234" });
    assert.equal(r.isError, undefined);
  });

  it("request_email_otp rejects invalid email", async () => {
    const r = await handleToolCall("request_email_otp", { recipient_email: "bad", template_uuid: "uuid" });
    assert.ok(r.isError);
  });

  it("request_email_otp rejects missing template", async () => {
    const r = await handleToolCall("request_email_otp", { recipient_email: "a@b.com" });
    assert.ok(r.isError);
  });

  it("request_email_otp succeeds", async () => {
    restoreFetch = mockFetch(200, { token: "email-otp-tok", ref_no: "ABC12", status: "waiting" });
    const r = await handleToolCall("request_email_otp", { recipient_email: "a@b.com", template_uuid: "uuid-123" });
    assert.equal(r.isError, undefined);
  });

  it("verify_email_otp succeeds", async () => {
    restoreFetch = mockFetch(200, { status: "verified", message: "Verified success" });
    const r = await handleToolCall("verify_email_otp", { token: "email-otp-tok", otp_code: "123456" });
    assert.equal(r.isError, undefined);
  });

  it("unknown tool returns error", async () => {
    const r = await handleToolCall("nonexistent", {});
    assert.ok(r.isError);
  });
});

import { describe, it, afterEach } from "./compat.js";
import assert from "node:assert/strict";
import { ThaiBulkClient } from "../src/client.js";

function mockFetch(status: number, body: unknown) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
  return () => { globalThis.fetch = original; };
}

function captureFetch() {
  const calls: { url: string; init: RequestInit }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: url.toString(), init: init ?? {} });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = original; } };
}

const client = new ThaiBulkClient("test-key", "test-secret", "otp-key", "otp-secret");

let restore: (() => void) | undefined;
afterEach(() => { restore?.(); restore = undefined; });

describe("sendSms", () => {
  it("sends POST to /sms with basic auth and form body", async () => {
    const cap = captureFetch();
    restore = cap.restore;
    await client.sendSms({ msisdn: "+66812345678", message: "Hi", sender: "Demo" });
    assert.equal(cap.calls.length, 1);
    assert.equal(cap.calls[0].url, "https://api-v2.thaibulksms.com/sms");
    assert.equal(cap.calls[0].init.method, "POST");
    const headers = cap.calls[0].init.headers as Record<string, string>;
    assert.ok(headers?.["Authorization"]?.startsWith("Basic "));
  });

  it("returns parsed JSON on success", async () => {
    restore = mockFetch(200, {
      remaining_credit: 99, used_credit: 1,
      data: [{ msisdn: "+66812345678", id: "uuid-1", used_credit: 1 }],
      error: [],
    });
    const result = await client.sendSms({ msisdn: "+66812345678", message: "Hi", sender: "Demo" });
    assert.equal(result.remaining_credit, 99);
  });

  it("throws on HTTP error", async () => {
    restore = mockFetch(401, { error: "Unauthorized" });
    await assert.rejects(
      () => client.sendSms({ msisdn: "+66812345678", message: "Hi", sender: "Demo" }),
      { message: /401/ },
    );
  });
});

describe("checkSmsCredit", () => {
  it("returns credit balance", async () => {
    restore = mockFetch(200, { remaining_credit: 500 });
    const result = await client.checkSmsCredit();
    assert.equal(result.remaining_credit, 500);
  });
});

describe("sendEmail", () => {
  it("returns response on success", async () => {
    restore = mockFetch(200, { status: "sent", id: "email-uuid" });
    const result = await client.sendEmail({ mail_from: "a@b.com", mail_to: "c@d.com", subject: "Hi", template_uuid: "uuid-123" });
    assert.equal(result.status, "sent");
  });
});

describe("checkEmailCredit", () => {
  it("returns credit balance", async () => {
    restore = mockFetch(200, { remaining_credit: 1000 });
    const result = await client.checkEmailCredit();
    assert.equal(result.remaining_credit, 1000);
  });
});

describe("requestOtp", () => {
  it("returns token on success", async () => {
    restore = mockFetch(200, { token: "otp-123", status: "success" });
    const result = await client.requestOtp("+66812345678");
    assert.equal(result.token, "otp-123");
  });
});

describe("verifyOtp", () => {
  it("returns verified status", async () => {
    restore = mockFetch(200, { status: "verified" });
    const result = await client.verifyOtp("otp-123", "1234");
    assert.equal(result.status, "verified");
  });

  it("throws on invalid PIN", async () => {
    restore = mockFetch(400, { error: "Invalid PIN" });
    await assert.rejects(() => client.verifyOtp("otp-123", "0000"), { message: /400/ });
  });
});

describe("requestEmailOtp", () => {
  it("returns token on success", async () => {
    restore = mockFetch(200, { token: "email-tok", ref_no: "ABC", status: "waiting" });
    const result = await client.requestEmailOtp({ template_uuid: "uuid-123", recipient_email: "a@b.com" });
    assert.equal(result.token, "email-tok");
  });
});

describe("verifyEmailOtp", () => {
  it("returns verified status", async () => {
    restore = mockFetch(200, { status: "verified", message: "Verified success" });
    const result = await client.verifyEmailOtp("email-tok", "123456");
    assert.equal(result.status, "verified");
  });

  it("throws on invalid code", async () => {
    restore = mockFetch(400, { code: "invalid_request", message: "OTP invalid" });
    await assert.rejects(() => client.verifyEmailOtp("email-tok", "000000"), { message: /400/ });
  });
});

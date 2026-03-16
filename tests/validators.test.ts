import { describe, it } from "./compat.js";
import assert from "node:assert/strict";
import {
  validateThaiMobile,
  normalizeThaiMobile,
  validateEmail,
} from "../src/validators.js";

describe("validateThaiMobile", () => {
  it("accepts E.164 format", () => {
    assert.equal(validateThaiMobile("+66812345678"), true);
    assert.equal(validateThaiMobile("+66912345678"), true);
    assert.equal(validateThaiMobile("+66612345678"), true);
  });

  it("accepts domestic format", () => {
    assert.equal(validateThaiMobile("0812345678"), true);
  });

  it("rejects invalid prefix", () => {
    assert.equal(validateThaiMobile("+66112345678"), false);
  });

  it("rejects too short", () => {
    assert.equal(validateThaiMobile("+6681234567"), false);
  });

  it("rejects non-numeric", () => {
    assert.equal(validateThaiMobile("abc"), false);
  });
});

describe("normalizeThaiMobile", () => {
  it("converts domestic to E.164", () => {
    assert.equal(normalizeThaiMobile("0812345678"), "+66812345678");
  });

  it("passes through E.164", () => {
    assert.equal(normalizeThaiMobile("+66812345678"), "+66812345678");
  });

  it("throws on invalid", () => {
    assert.throws(() => normalizeThaiMobile("invalid"), /Invalid/);
  });
});

describe("validateEmail", () => {
  it("accepts valid email", () => {
    assert.equal(validateEmail("user@example.com"), true);
  });

  it("rejects missing @", () => {
    assert.equal(validateEmail("userexample.com"), false);
  });

  it("rejects header injection \\r\\n", () => {
    assert.equal(validateEmail("user@example.com\r\nBcc: evil@evil.com"), false);
  });

  it("rejects encoded newline %0a", () => {
    assert.equal(validateEmail("user@example.com%0aevil"), false);
  });
});

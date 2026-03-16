import { describe, it, afterEach } from "./compat.js";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, chmodSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("profile storage", () => {
  let tempDir: string;

  const setup = () => {
    tempDir = mkdtempSync(join(tmpdir(), "tbs-test-"));
    return tempDir;
  };

  afterEach(() => {
    try { rmSync(tempDir, { recursive: true }); } catch { /* ok */ }
  });

  it("can write and read a JSON profile", () => {
    const dir = setup();
    const path = join(dir, "test.json");
    const data = { apiKey: "k", apiSecret: "s", created: new Date().toISOString() };
    writeFileSync(path, JSON.stringify(data), { mode: 0o600 });

    const content = JSON.parse(readFileSync(path, "utf-8"));
    assert.equal(content.apiKey, "k");
    assert.equal(content.apiSecret, "s");
  });

  it("sets file permissions to 0600", () => {
    const dir = setup();
    const path = join(dir, "perm.json");
    writeFileSync(path, "{}", { mode: 0o600 });
    chmodSync(path, 0o600);

    const stats = statSync(path);
    assert.equal(stats.mode & 0o777, 0o600);
  });
});

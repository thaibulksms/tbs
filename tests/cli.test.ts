import { describe, it } from "./compat.js";
import assert from "node:assert/strict";
import { parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  it("parses positional args", () => {
    const { args, flags } = parseArgs(["0812345678", "Hello world"]);
    assert.deepEqual(args, ["0812345678", "Hello world"]);
    assert.deepEqual(flags, {});
  });

  it("parses --flag value pairs", () => {
    const { args, flags } = parseArgs(["0812345678", "Hi", "--sender", "OTP_SMS"]);
    assert.deepEqual(args, ["0812345678", "Hi"]);
    assert.equal(flags.sender, "OTP_SMS");
  });

  it("parses boolean flags", () => {
    const { args, flags } = parseArgs(["--json"]);
    assert.deepEqual(args, []);
    assert.equal(flags.json, true);
  });

  it("parses mixed args and flags", () => {
    const { args, flags } = parseArgs(["0812345678", "Test", "--sender", "Demo", "--json", "--profile", "prod"]);
    assert.deepEqual(args, ["0812345678", "Test"]);
    assert.equal(flags.sender, "Demo");
    assert.equal(flags.json, true);
    assert.equal(flags.profile, "prod");
  });

  it("handles empty input", () => {
    const { args, flags } = parseArgs([]);
    assert.deepEqual(args, []);
    assert.deepEqual(flags, {});
  });
});

// Cross-runtime test shim: exports describe/it/afterEach that work in both Node.js and Bun.
// - Node.js: re-exports from node:test
// - Bun: re-exports from bun:test (bun test runner requires this)

const isBun = typeof globalThis.Bun !== "undefined";

let describe: typeof import("node:test").describe;
let it: typeof import("node:test").it;
let afterEach: typeof import("node:test").afterEach;

if (isBun) {
  // Dynamic import to avoid Node.js trying to resolve bun:test
  const bunTest = await import("bun:test");
  describe = bunTest.describe as unknown as typeof describe;
  it = bunTest.it as unknown as typeof it;
  afterEach = bunTest.afterEach as unknown as typeof afterEach;
} else {
  const nodeTest = await import("node:test");
  describe = nodeTest.describe;
  it = nodeTest.it;
  afterEach = nodeTest.afterEach;
}

export { describe, it, afterEach };

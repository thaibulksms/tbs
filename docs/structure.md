# Project Structure

## Source (`src/` — 936 lines total)

### `index.ts` (23 lines) — Entry point
- Routes CLI commands via `switch(cmd)`: login, send, email, credit, otp, verify, email-otp, email-verify, profiles, help
- No args (`undefined`) → starts MCP stdio transport
- `serve` → same as no args (hidden alias)

### `cli.ts` (369 lines) — CLI command handlers
- `parseArgs(argv)` — hand-rolled arg parser, returns `{ args, flags }`
- `cmdLogin(flags)` — prompts for key/secret, verifies via `/credit`, saves to `~/.config/tbs/`
- `cmdCredit(flags)` — calls `checkSmsCredit()` + `checkEmailCredit()`
- `cmdSend(args, flags)` — validates phone, sends SMS via `sendSms()`
- `cmdEmail(args, flags)` — requires `--from` and `--template` flags
- `cmdOtp(args, flags)` — sends SMS OTP
- `cmdVerify(args, flags)` — verifies SMS OTP PIN
- `cmdEmailOtp(args, flags)` — sends email OTP, requires `--template`
- `cmdEmailVerify(args, flags)` — verifies email OTP code
- `cmdProfiles()` — lists `~/.config/tbs/*.json`
- `cmdHelp(args)` — progressive help: no args = command list, with arg = per-command detail

### `client.ts` (131 lines) — HTTP client
- `ThaiBulkClient(apiKey, apiSecret, otpKey?, otpSecret?)` — constructor builds Basic Auth header
- `request(url, init)` — private, adds Auth + Accept headers, throws on non-ok
- `postJson(url, body)` — private, plain POST without Auth header (for SMS OTP)
- SMS: `sendSms()` uses `application/x-www-form-urlencoded` to `api-v2.thaibulksms.com/sms`
- SMS: `checkSmsCredit()` → `GET /credit`
- Email: `sendEmail()` uses JSON to `email-api.thaibulksms.com/email/v1/send_template`
  - `mail_from` sent as `{ email }` object, `mail_to` sent as `{ email }` object (not array)
- Email: `checkEmailCredit()` → `GET /email/v1/credit` (returns `credit_remain`, not `remaining_credit`)
- Email OTP: `requestEmailOtp()` → `POST /email/v1/otp/send` (Basic Auth)
- Email OTP: `verifyEmailOtp()` → `POST /email/v1/otp/verify` (Basic Auth)
- SMS OTP: `requestOtp()` → `POST otp.thaibulksms.com/v2/otp/request` (key/secret in body, NO Basic Auth)
- SMS OTP: `verifyOtp()` → `POST /v2/otp/verify` (key/secret in body, NO Basic Auth)

### `server.ts` (203 lines) — MCP tool definitions + handlers
- `TOOLS` — array of 8 tool definitions with raw JSON Schema `inputSchema` and `annotations`
- `handleToolCall(name, args)` — dispatcher, returns `{ content, isError? }`
- `ok(data)` / `err(message)` — response helpers
- Tool annotations: `destructiveHint: true` for send/otp tools, `readOnlyHint: true` for credit, `idempotentHint: true` for verify

### `transport.ts` (119 lines) — MCP JSON-RPC stdio transport
- Replaces 26MB `@modelcontextprotocol/sdk` (91 packages) with ~80 lines of logic
- `createMcpHandler(opts)` — returns `{ start(stdin, stdout) }`
- Handles: `initialize`, `notifications/initialized`, `tools/list`, `tools/call`, `ping`
- Protocol version: `2024-11-05`
- Line-delimited JSON-RPC over stdin/stdout via `node:readline`
- Won't `process.exit()` in test mode (only when `stdin === process.stdin`)

### `profile.ts` (72 lines) — Credential storage
- `saveProfile(name, apiKey, apiSecret)` — writes to `~/.config/tbs/<name>.json`, chmod 0600
- `loadProfile(name)` — reads JSON, returns `{ apiKey, apiSecret, created }`
- `listProfiles()` — returns filenames without `.json`
- `getCredentials(profileFlag?)` — 3-tier precedence: `--profile` flag > env vars > default profile

### `validators.ts` (19 lines) — Input validation
- `validateThaiMobile(number)` — regex: `+66[689]XXXXXXXX` or `0[689]XXXXXXXX`
- `normalizeThaiMobile(number)` — converts `08x` → `+668x`, throws on invalid
- `validateEmail(email)` — rejects `\r\n`, `%0a`, `%0d` (header injection)

## Tests (`tests/` — 530 lines, 53 tests)

### `compat.ts` — Cross-runtime shim
- Detects Bun via `typeof globalThis.Bun`, imports `bun:test` or `node:test` accordingly
- Exports `describe`, `it`, `afterEach`

### Test files
- `validators.test.ts` (63 lines) — phone/email validation, pure unit tests
- `client.test.ts` (128 lines) — all 8 client methods, mocked `globalThis.fetch`
- `server.test.ts` (130 lines) — all 8 tool handlers + TOOLS array validation, mocked fetch
- `transport.test.ts` (109 lines) — MCP protocol: initialize, tools/list, tools/call, ping using `Readable`/`Writable` streams
- `cli.test.ts` (37 lines) — `parseArgs()` unit tests
- `profile.test.ts` (39 lines) — file I/O with temp directories

## Config files
- `package.json` — `@thaibulksms/tbs`, bin: `tbs`, zero deps, Node >=18
- `tsconfig.json` — strict, ESM, Node16 module resolution
- `.mcp.json` — Claude Code / OpenClaw MCP config (uses `${VAR}`)
- `.env` — test credentials (gitignored)
- `.env.example` — credential template
- `.gitignore` — excludes: node_modules, dist, .env, CLAUDE.md, package-lock.json, docs/plan*, docs/research/

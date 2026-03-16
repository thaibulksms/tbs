# @thaibulksms/tbs

Zero-dependency MCP & CLI for [ThaiBulkSMS](https://www.thaibulksms.com) and [ThaiBulkMail](https://www.thaibulkmail.com) APIs.

[![npm](https://img.shields.io/npm/v/@thaibulksms/tbs)](https://www.npmjs.com/package/@thaibulksms/tbs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3%2B-orange.svg)](https://bun.sh/)

> [README ภาษาไทย](README-th.md) | [คู่มือติดตั้ง (Thai)](docs/setup-th.md)

## Install

```bash
npm install -g @thaibulksms/tbs
```

## Quick Start

```bash
# 1. Save credentials (from developer.thaibulksms.com)
tbs login

# 2. Use it
tbs send 0812345678 "Hello" --sender OTP_SMS     # Send SMS
tbs email a@b.com "Subject" --from s@d.com --template <uuid>  # Send email
tbs credit                                       # Check balance
tbs otp 0812345678                               # SMS OTP
tbs email-otp a@b.com --template <uuid>          # Email OTP
```

No install needed with `npx`:
```bash
npx @thaibulksms/tbs login
npx @thaibulksms/tbs send 0812345678 "Hello"
```

## Add to AI Agent (MCP)

### Claude Code

```bash
claude mcp add thaibulksms \
  -e THAIBULKSMS_API_KEY=xxx \
  -e THAIBULKSMS_API_SECRET=xxx \
  -e THAIBULKSMS_OTP_KEY=xxx \
  -e THAIBULKSMS_OTP_SECRET=xxx \
  -- npx -y @thaibulksms/tbs
```

Or `.mcp.json` (project-scoped, commit to git):
```json
{
  "mcpServers": {
    "thaibulksms": {
      "command": "npx",
      "args": ["-y", "@thaibulksms/tbs"],
      "env": {
        "THAIBULKSMS_API_KEY": "${THAIBULKSMS_API_KEY}",
        "THAIBULKSMS_API_SECRET": "${THAIBULKSMS_API_SECRET}",
        "THAIBULKSMS_OTP_KEY": "${THAIBULKSMS_OTP_KEY}",
        "THAIBULKSMS_OTP_SECRET": "${THAIBULKSMS_OTP_SECRET}"
      }
    }
  }
}
```

### Gemini CLI

```bash
gemini mcp add thaibulksms -- npx -y @thaibulksms/tbs
```

### OpenCode

```json
{
  "mcp": {
    "thaibulksms": {
      "type": "local",
      "command": ["npx", "-y", "@thaibulksms/tbs"],
      "environment": {
        "THAIBULKSMS_API_KEY": "{env:THAIBULKSMS_API_KEY}",
        "THAIBULKSMS_API_SECRET": "{env:THAIBULKSMS_API_SECRET}",
        "THAIBULKSMS_OTP_KEY": "{env:THAIBULKSMS_OTP_KEY}",
        "THAIBULKSMS_OTP_SECRET": "{env:THAIBULKSMS_OTP_SECRET}"
      },
      "enabled": true
    }
  }
}
```

### OpenClaw

OpenClaw reads `.mcp.json` (same as Claude Code). Drop the `.mcp.json` file in your project root — OpenClaw picks it up automatically.

### Claude Desktop

Config: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "thaibulksms": {
      "command": "npx",
      "args": ["-y", "@thaibulksms/tbs"],
      "env": {
        "THAIBULKSMS_API_KEY": "your_key",
        "THAIBULKSMS_API_SECRET": "your_secret",
        "THAIBULKSMS_OTP_KEY": "your_otp_key",
        "THAIBULKSMS_OTP_SECRET": "your_otp_secret"
      }
    }
  }
}
```

Then ask your agent: **"Check my SMS credit balance"**

---

## CLI Commands

```
tbs login                          Save API credentials
tbs credit                         Check SMS + email credit
tbs send <to> <message>            Send SMS
tbs email <to> <subject>           Send email (template)
tbs otp <to>                       Request SMS OTP
tbs verify <token> <pin>           Verify SMS OTP
tbs email-otp <to>                 Request email OTP
tbs email-verify <token> <code>    Verify email OTP
tbs profiles                       List saved profiles
tbs help <command>                 Per-command help
```

### Flags

| Flag | Description | Commands |
|------|-------------|----------|
| `--sender <id>` | SMS sender ID (default: `SMS.`) | `send` |
| `--from <email>` | Sender email address | `email` |
| `--template <uuid>` | Template UUID | `email`, `email-otp` |
| `--json` | Machine-readable output | all |
| `--profile <name>` | Use specific profile | all |

### Examples

```bash
tbs send 0812345678 "Hello" --sender OTP_SMS
tbs send 0812345678 "Hello" --json
tbs email user@example.com "Subject" --from sender@domain.com --template <uuid>
tbs credit --json
tbs otp 0812345678
tbs verify <token> 1234
tbs email-otp user@example.com --template <uuid>
tbs email-verify <token> 733923
tbs login --profile production
tbs credit --profile production
```

## MCP Tools (8)

| Tool | Description |
|------|-------------|
| `send_sms` | Send SMS to one Thai mobile number |
| `send_email` | Send email via ThaiBulkMail template |
| `check_sms_credit` | Check SMS credit balance |
| `check_email_credit` | Check email credit balance |
| `request_otp` | Send OTP PIN via SMS |
| `verify_otp` | Verify SMS OTP PIN |
| `request_email_otp` | Send OTP code via email |
| `verify_email_otp` | Verify email OTP code |

## Credentials & Setup

### API Keys

| What | Where to get it |
|------|----------------|
| SMS/Email API Key & Secret | [Dashboard > Developer Settings](https://dashboard.thaibulksms.com/developer-settings/) |
| SMS OTP Key & Secret | [OTP Manager](https://otp-manager.thaibulksms.com/otp) |
| SMS Sender Name | [Dashboard > Sender Name](https://dashboard.thaibulksms.com/sender-name/) (must register before use) |
| Email Template | [Dashboard > Email Templates](https://dashboard.thaibulksms.com/email-template-management/) (create and copy template UUID) |
| Email OTP Template | [Dashboard > Email OTP](https://dashboard.thaibulksms.com/email-otp/create/) (create and copy template UUID) |

### Environment Variables

| Variable | For | Required |
|----------|-----|:--------:|
| `THAIBULKSMS_API_KEY` | SMS, Email | Yes |
| `THAIBULKSMS_API_SECRET` | SMS, Email | Yes |
| `THAIBULKSMS_OTP_KEY` | SMS OTP | For OTP |
| `THAIBULKSMS_OTP_SECRET` | SMS OTP | For OTP |

**Precedence:** `--profile` flag > env vars > `~/.config/tbs/default.json`

SMS/Email use HTTP Basic Auth. SMS OTP uses separate key/secret in request body. Email OTP uses the same Basic Auth as email.

## Architecture

```
src/
  index.ts        Entry point — CLI commands or MCP (no args)
  cli.ts          Twilio-style CLI handlers
  profile.ts      Credential storage (~/.config/tbs/, chmod 0600)
  transport.ts    MCP JSON-RPC stdio transport (~80 lines)
  server.ts       MCP tool definitions (raw JSON Schema) + handlers
  client.ts       ThaiBulk HTTP client (fetch + Basic Auth)
  validators.ts   Phone/email validation (pure regex)
```

**Zero runtime dependencies.** No `@modelcontextprotocol/sdk` (26MB, 91 packages). Just ~80 lines of JSON-RPC stdio transport using Node.js built-ins.

## Development

```bash
npm install            # Dev deps only
npm test               # Node.js
npm run test:bun       # Bun
npm run build          # Compile
```

## Security

- Credentials in `~/.config/tbs/` (chmod 0600) or env vars — never hardcoded
- Single-recipient only — no bulk sends
- Thai mobile validation, email header injection prevention
- Human-in-the-loop for destructive MCP tools
- Zero runtime deps = zero supply chain risk

## Links

- npm: [npmjs.com/package/@thaibulksms/tbs](https://www.npmjs.com/package/@thaibulksms/tbs)
- GitHub: [github.com/thaibulksms/tbs](https://github.com/thaibulksms/tbs)
- API Docs: [developer.thaibulksms.com](https://developer.thaibulksms.com)

## License

[MIT](LICENSE)

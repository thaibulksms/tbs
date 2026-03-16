# Setup Guide

> [คู่มือภาษาไทย](setup-th.md) | [npm](https://www.npmjs.com/package/@thaibulksms/tbs) | [GitHub](https://github.com/thaibulksms/tbs)

## 1. Get API Credentials

1. Go to [developer.thaibulksms.com](https://developer.thaibulksms.com)
2. Sign up or log in
3. **Settings > API Key** — copy API Key and Secret
4. **Settings > OTP** — copy OTP Key and Secret (for SMS OTP only)

## 2. Install & Login

```bash
npm install -g @thaibulksms/tbs
tbs login
```

Or without install:
```bash
npx @thaibulksms/tbs login
```

Multiple profiles:
```bash
tbs login --profile staging
tbs login --profile production
tbs profiles
```

## 3. CLI Usage

```bash
tbs credit                                                     # Check balance
tbs send 0812345678 "Hello" --sender OTP_SMS                   # Send SMS
tbs email a@b.com "Subject" --from s@d.com --template <uuid>   # Send email
tbs otp 0812345678                                             # SMS OTP
tbs verify <token> <pin>                                       # Verify SMS OTP
tbs email-otp a@b.com --template <uuid>                        # Email OTP
tbs email-verify <token> <code>                                # Verify email OTP
```

All commands support `--json` and `--profile <name>`.

## 4. MCP (for AI Agents)

### Claude Code

```bash
claude mcp add \
  -e THAIBULKSMS_API_KEY=xxx \
  -e THAIBULKSMS_API_SECRET=xxx \
  -e THAIBULKSMS_OTP_KEY=xxx \
  -e THAIBULKSMS_OTP_SECRET=xxx \
  thaibulksms -- npx -y @thaibulksms/tbs
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

### Claude Desktop

Config: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%APPDATA%\Claude\` (Windows), `~/.config/Claude/` (Linux)

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

### Gemini CLI

```bash
gemini mcp add thaibulksms -- npx -y @thaibulksms/tbs
```

### OpenCode

Add to `opencode.json`:
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

## 5. Verify

CLI: `tbs credit`

AI Agent: "Check my SMS credit balance"

## Credentials

| Variable | For | Required |
|----------|-----|:--------:|
| `THAIBULKSMS_API_KEY` | SMS, Email | Yes |
| `THAIBULKSMS_API_SECRET` | SMS, Email | Yes |
| `THAIBULKSMS_OTP_KEY` | SMS OTP | For OTP |
| `THAIBULKSMS_OTP_SECRET` | SMS OTP | For OTP |

| Agent | Env syntax | Config |
|-------|-----------|--------|
| Claude Code | `${VAR}` | `.mcp.json` |
| Claude Desktop | literal | `claude_desktop_config.json` |
| Gemini CLI | `$VAR` | `~/.gemini/settings.json` |
| OpenCode | `{env:VAR}` | `opencode.json` |

## Troubleshooting

| Error | Fix |
|-------|-----|
| "No credentials found" | `tbs login` |
| "HTTP 401" | Wrong key/secret |
| "HTTP 403" | IP whitelist — add IP in dashboard |
| "OTP credentials not configured" | Set `THAIBULKSMS_OTP_KEY`/`OTP_SECRET` |
| Tool not showing | Restart agent |

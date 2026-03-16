# @thaibulksms/tbs

MCP และ CLI สำหรับ [ThaiBulkSMS](https://www.thaibulksms.com) และ [ThaiBulkMail](https://www.thaibulkmail.com) API — ไม่มี dependency ใดๆ

[![npm](https://img.shields.io/npm/v/@thaibulksms/tbs)](https://www.npmjs.com/package/@thaibulksms/tbs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3%2B-orange.svg)](https://bun.sh/)

> [English README](README.md) | [คู่มือติดตั้งฉบับเต็ม](docs/setup-th.md)

## ติดตั้ง

```bash
npm install -g @thaibulksms/tbs
```

## เริ่มต้นใช้งาน

```bash
# 1. บันทึก credentials (จาก developer.thaibulksms.com)
tbs login

# 2. ใช้งาน
tbs send 0812345678 "สวัสดี" --sender SMS.        # ส่ง SMS
tbs email a@b.com "หัวข้อ" --from s@d.com --template <uuid>  # ส่งอีเมล
tbs credit                                        # ดูเครดิตคงเหลือ
tbs otp 0812345678                                # ส่ง SMS OTP
tbs email-otp a@b.com --template <uuid>           # ส่ง Email OTP
```

ใช้ผ่าน `npx` ได้โดยไม่ต้องติดตั้ง:
```bash
npx @thaibulksms/tbs login
npx @thaibulksms/tbs send 0812345678 "สวัสดี"
```

## เพิ่มเข้า AI Agent (MCP)

### Claude Code

```bash
claude mcp add thaibulksms \
  -e THAIBULKSMS_API_KEY=xxx \
  -e THAIBULKSMS_API_SECRET=xxx \
  -e THAIBULKSMS_OTP_KEY=xxx \
  -e THAIBULKSMS_OTP_SECRET=xxx \
  -- npx -y @thaibulksms/tbs
```

หรือสร้างไฟล์ `.mcp.json` ที่ root ของโปรเจกต์:
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

### Claude Desktop

Config: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%APPDATA%\Claude\` (Windows), `~/.config/Claude/` (Linux)

```json
{
  "mcpServers": {
    "thaibulksms": {
      "command": "npx",
      "args": ["-y", "@thaibulksms/tbs"],
      "env": {
        "THAIBULKSMS_API_KEY": "ใส่_api_key",
        "THAIBULKSMS_API_SECRET": "ใส่_api_secret",
        "THAIBULKSMS_OTP_KEY": "ใส่_otp_key",
        "THAIBULKSMS_OTP_SECRET": "ใส่_otp_secret"
      }
    }
  }
}
```

จากนั้นพิมพ์ใน agent: **"ตรวจสอบเครดิต SMS ของฉัน"**

---

## คำสั่ง CLI

```
tbs login                          บันทึก API credentials
tbs credit                         ตรวจสอบเครดิต SMS + อีเมล
tbs send <to> <message>            ส่ง SMS
tbs email <to> <subject>           ส่งอีเมล (ใช้เทมเพลต)
tbs otp <to>                       ส่งรหัส OTP ทาง SMS
tbs verify <token> <pin>           ยืนยัน SMS OTP
tbs email-otp <to>                 ส่งรหัส OTP ทางอีเมล
tbs email-verify <token> <code>    ยืนยัน Email OTP
tbs profiles                       ดูรายชื่อ profiles
tbs help <command>                 ดูวิธีใช้แต่ละคำสั่ง
```

### Flags

| Flag | คำอธิบาย | ใช้กับ |
|------|---------|--------|
| `--sender <id>` | Sender ID สำหรับ SMS (default: `SMS.`) | `send` |
| `--from <email>` | อีเมลผู้ส่ง | `email` |
| `--template <uuid>` | Template UUID | `email`, `email-otp` |
| `--json` | แสดงผลแบบ JSON | ทุกคำสั่ง |
| `--profile <name>` | ใช้ profile ที่ระบุ | ทุกคำสั่ง |

### ตัวอย่างการใช้งาน

```bash
tbs send 0812345678 "สวัสดี" --sender SMS.
tbs send 0812345678 "Hello" --json
tbs email user@example.com "หัวข้อ" --from sender@domain.com --template <uuid>
tbs credit --json
tbs otp 0812345678
tbs verify <token> 1234
tbs email-otp user@example.com --template <uuid>
tbs email-verify <token> 733923
tbs login --profile production
tbs credit --profile production
```

## MCP Tools (8 เครื่องมือ)

| Tool | คำอธิบาย |
|------|---------|
| `send_sms` | ส่ง SMS ไปยังเบอร์มือถือไทย |
| `send_email` | ส่งอีเมลผ่านเทมเพลต ThaiBulkMail |
| `check_sms_credit` | ตรวจสอบเครดิต SMS |
| `check_email_credit` | ตรวจสอบเครดิตอีเมล |
| `request_otp` | ส่งรหัส OTP ทาง SMS |
| `verify_otp` | ยืนยัน SMS OTP |
| `request_email_otp` | ส่งรหัส OTP ทางอีเมล |
| `verify_email_otp` | ยืนยัน Email OTP |

## Credentials และการตั้งค่า

### API Keys

| รายการ | ตั้งค่าที่ |
|--------|----------|
| SMS/Email API Key & Secret | [Dashboard > Developer Settings](https://dashboard.thaibulksms.com/developer-settings/) |
| SMS OTP Key & Secret | [OTP Manager](https://otp-manager.thaibulksms.com/otp) |
| ชื่อผู้ส่ง SMS (Sender Name) | [Dashboard > Sender Name](https://dashboard.thaibulksms.com/sender-name/) (ต้องลงทะเบียนก่อนใช้งาน) |
| Email Template | [Dashboard > Email Templates](https://dashboard.thaibulksms.com/email-template-management/) (สร้างและคัดลอก template UUID) |
| Email OTP Template | [Dashboard > Email OTP](https://dashboard.thaibulksms.com/email-otp/create/) (สร้างและคัดลอก template UUID) |

### ตัวแปร Environment

| ตัวแปร | สำหรับ | จำเป็น |
|--------|-------|:------:|
| `THAIBULKSMS_API_KEY` | SMS, Email | ใช่ |
| `THAIBULKSMS_API_SECRET` | SMS, Email | ใช่ |
| `THAIBULKSMS_OTP_KEY` | SMS OTP | เฉพาะ OTP |
| `THAIBULKSMS_OTP_SECRET` | SMS OTP | เฉพาะ OTP |

**ลำดับความสำคัญ:** `--profile` flag > env vars > `~/.config/tbs/default.json`

SMS/Email ใช้ HTTP Basic Auth, SMS OTP ใช้ key/secret แยกต่างหากส่งใน request body, Email OTP ใช้ Basic Auth เดียวกับ Email

## โครงสร้างโปรเจกต์

```
src/
  index.ts        จุดเริ่มต้น — CLI หรือ MCP (ไม่มี args)
  cli.ts          CLI handlers แบบ Twilio-style
  profile.ts      เก็บ credentials (~/.config/tbs/, chmod 0600)
  transport.ts    MCP JSON-RPC stdio transport (~80 บรรทัด)
  server.ts       MCP tool definitions (raw JSON Schema) + handlers
  client.ts       ThaiBulk HTTP client (fetch + Basic Auth)
  validators.ts   ตรวจสอบเบอร์โทร/อีเมล (pure regex)
```

**ไม่มี runtime dependency** — ไม่ใช้ `@modelcontextprotocol/sdk` (26MB, 91 แพ็คเกจ) แต่เขียน JSON-RPC stdio transport เองแค่ ~80 บรรทัด ใช้แค่ Node.js built-in

## ความปลอดภัย

- Credentials เก็บใน `~/.config/tbs/` (chmod 0600) หรือ env vars — ไม่ hardcode
- ส่งได้ทีละ 1 ผู้รับ — ไม่มีการส่งแบบ bulk
- ตรวจสอบเบอร์มือถือไทย, ป้องกัน header injection ในอีเมล
- AI agent ต้องขอยืนยันก่อนส่ง (Human-in-the-loop)
- ไม่มี runtime dependency = ไม่มีความเสี่ยง supply chain attack

## Links

- npm: [npmjs.com/package/@thaibulksms/tbs](https://www.npmjs.com/package/@thaibulksms/tbs)
- GitHub: [github.com/thaibulksms/tbs](https://github.com/thaibulksms/tbs)
- API Docs: [developer.thaibulksms.com](https://developer.thaibulksms.com)

## License

[MIT](LICENSE)

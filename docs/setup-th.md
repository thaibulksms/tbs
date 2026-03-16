# คู่มือการติดตั้งและใช้งาน

> [English Guide](setup.md) | [npm](https://www.npmjs.com/package/@thaibulksms/tbs) | [GitHub](https://github.com/thaibulksms/tbs)

## 1. รับ API Credentials

1. ไปที่ [developer.thaibulksms.com](https://developer.thaibulksms.com)
2. สมัครสมาชิกหรือเข้าสู่ระบบ
3. **ตั้งค่า > API Key** — คัดลอก API Key และ Secret
4. **ตั้งค่า > OTP** — คัดลอก OTP Key และ Secret (สำหรับ SMS OTP)

## 2. ติดตั้งและ Login

```bash
npm install -g @thaibulksms/tbs
tbs login
```

หรือใช้โดยไม่ต้องติดตั้ง:
```bash
npx @thaibulksms/tbs login
```

สร้างหลาย profile:
```bash
tbs login --profile staging
tbs login --profile production
tbs profiles
```

## 3. ใช้งาน CLI

```bash
tbs credit                                                     # ตรวจสอบเครดิต
tbs send 0812345678 "สวัสดี" --sender OTP_SMS                    # ส่ง SMS
tbs email a@b.com "หัวข้อ" --from s@d.com --template <uuid>     # ส่งอีเมล
tbs otp 0812345678                                              # ส่ง SMS OTP
tbs verify <token> <pin>                                        # ยืนยัน SMS OTP
tbs email-otp a@b.com --template <uuid>                         # ส่ง Email OTP
tbs email-verify <token> <code>                                 # ยืนยัน Email OTP
```

ทุกคำสั่งรองรับ `--json` และ `--profile <name>`

## 4. MCP (สำหรับ AI Agent)

### Claude Code

```bash
claude mcp add \
  -e THAIBULKSMS_API_KEY=xxx \
  -e THAIBULKSMS_API_SECRET=xxx \
  -e THAIBULKSMS_OTP_KEY=xxx \
  -e THAIBULKSMS_OTP_SECRET=xxx \
  thaibulksms -- npx -y @thaibulksms/tbs
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

### Claude Desktop

แก้ไข config: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%APPDATA%\Claude\` (Windows), `~/.config/Claude/` (Linux)

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

### Gemini CLI

```bash
gemini mcp add thaibulksms -- npx -y @thaibulksms/tbs
```

### OpenCode

เพิ่มใน `opencode.json`:
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

## 5. ทดสอบ

CLI: `tbs credit`

AI Agent: พิมพ์ "ตรวจสอบเครดิต SMS ของฉัน"

## MCP Tools (8 เครื่องมือ)

| Tool | คำอธิบาย |
|------|---------|
| `send_sms` | ส่ง SMS ไปยังเบอร์มือถือไทย |
| `send_email` | ส่งอีเมลผ่านเทมเพลต |
| `check_sms_credit` | ตรวจสอบเครดิต SMS |
| `check_email_credit` | ตรวจสอบเครดิตอีเมล |
| `request_otp` | ส่งรหัส OTP ทาง SMS |
| `verify_otp` | ยืนยัน SMS OTP |
| `request_email_otp` | ส่งรหัส OTP ทางอีเมล |
| `verify_email_otp` | ยืนยัน Email OTP |

## Credentials

| ตัวแปร | สำหรับ | จำเป็น |
|--------|-------|:------:|
| `THAIBULKSMS_API_KEY` | SMS, Email | ใช่ |
| `THAIBULKSMS_API_SECRET` | SMS, Email | ใช่ |
| `THAIBULKSMS_OTP_KEY` | SMS OTP | เฉพาะ OTP |
| `THAIBULKSMS_OTP_SECRET` | SMS OTP | เฉพาะ OTP |

| Agent | รูปแบบ | ไฟล์ Config |
|-------|--------|------------|
| Claude Code | `${VAR}` | `.mcp.json` |
| Claude Desktop | ค่าจริง | `claude_desktop_config.json` |
| Gemini CLI | `$VAR` | `~/.gemini/settings.json` |
| OpenCode | `{env:VAR}` | `opencode.json` |

## แก้ปัญหา

| ข้อผิดพลาด | วิธีแก้ |
|-----------|--------|
| "No credentials found" | รัน `tbs login` |
| "HTTP 401" | API key/secret ไม่ถูกต้อง |
| "HTTP 403" | เปิด IP whitelist — เพิ่ม IP ใน dashboard |
| "OTP credentials not configured" | ตั้งค่า `THAIBULKSMS_OTP_KEY`/`OTP_SECRET` |
| Tool ไม่แสดง | รีสตาร์ท agent |

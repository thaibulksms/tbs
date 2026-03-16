import { ThaiBulkClient } from "./client.js";
import {
  validateThaiMobile,
  normalizeThaiMobile,
  validateEmail,
} from "./validators.js";

function getEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function getClient(): ThaiBulkClient {
  return new ThaiBulkClient(
    getEnv("THAIBULKSMS_API_KEY"),
    getEnv("THAIBULKSMS_API_SECRET"),
    process.env.THAIBULKSMS_OTP_KEY,
    process.env.THAIBULKSMS_OTP_SECRET,
  );
}

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: true;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(message: string): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
}

// ── Tool definitions (raw JSON Schema) ───────────────────

export const TOOLS = [
  {
    name: "send_sms",
    description: "Send a single SMS via ThaiBulkSMS. Requires user confirmation before sending.",
    inputSchema: {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Thai mobile number in E.164 (+66XXXXXXXXX) or domestic (0XXXXXXXXX) format" },
        message: { type: "string", description: "SMS text content" },
        sender: { type: "string", description: "Registered sender ID", default: "SMS." },
      },
      required: ["recipient", "message"],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: "check_sms_credit",
    description: "Check remaining SMS credit balance on ThaiBulkSMS.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "send_email",
    description: "Send email via ThaiBulkMail using a template. Requires user confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        mail_from: { type: "string", description: "Sender email address (must be verified in ThaiBulkMail)" },
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject line" },
        template_uuid: { type: "string", description: "Template UUID from ThaiBulkMail dashboard" },
      },
      required: ["mail_from", "to", "subject", "template_uuid"],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: "check_email_credit",
    description: "Check remaining email credit balance on ThaiBulkMail.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "request_otp",
    description: "Request an OTP code via SMS to a Thai mobile number.",
    inputSchema: {
      type: "object",
      properties: {
        msisdn: { type: "string", description: "Thai mobile number in E.164 or domestic format" },
      },
      required: ["msisdn"],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: "verify_otp",
    description: "Verify an OTP PIN against a token from a previous request_otp call.",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token returned by request_otp" },
        pin: { type: "string", description: "PIN code entered by the user" },
      },
      required: ["token", "pin"],
    },
    annotations: { idempotentHint: true },
  },
  {
    name: "request_email_otp",
    description: "Send an OTP code via email using a ThaiBulkMail OTP template.",
    inputSchema: {
      type: "object",
      properties: {
        recipient_email: { type: "string", description: "Email address to send OTP to" },
        template_uuid: { type: "string", description: "Email OTP template UUID from ThaiBulkMail dashboard" },
      },
      required: ["recipient_email", "template_uuid"],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: "verify_email_otp",
    description: "Verify an email OTP code against a token from a previous request_email_otp call.",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token returned by request_email_otp" },
        otp_code: { type: "string", description: "OTP code received via email" },
      },
      required: ["token", "otp_code"],
    },
    annotations: { idempotentHint: true },
  },
];

// ── Tool handlers ────────────────────────────────────────

type Args = Record<string, string>;

const HANDLERS: Record<string, (a: Args) => Promise<ToolResult>> = {
  async send_sms(a) {
    const { recipient, message, sender = "SMS." } = a;
    if (!validateThaiMobile(recipient)) return err(`Invalid Thai mobile number: ${recipient}`);
    const msisdn = normalizeThaiMobile(recipient);
    console.error(`[SMS] to=${msisdn} sender=${sender} len=${message.length}`);
    try { return ok(await getClient().sendSms({ msisdn, message, sender })); }
    catch (e) { return err(String(e)); }
  },

  async check_sms_credit() {
    try { return ok(await getClient().checkSmsCredit()); }
    catch (e) { return err(String(e)); }
  },

  async send_email(a) {
    const { mail_from, to, subject, template_uuid } = a;
    if (!validateEmail(to)) return err(`Invalid recipient email: ${to}`);
    if (!validateEmail(mail_from)) return err(`Invalid sender email: ${mail_from}`);
    if (!template_uuid) return err("template_uuid is required. Create one at ThaiBulkMail dashboard.");
    console.error(`[EMAIL] from=${mail_from} to=${to} subject=${subject.slice(0, 50)}`);
    try { return ok(await getClient().sendEmail({ mail_from, mail_to: to, subject, template_uuid })); }
    catch (e) { return err(String(e)); }
  },

  async check_email_credit() {
    try { return ok(await getClient().checkEmailCredit()); }
    catch (e) { return err(String(e)); }
  },

  async request_otp(a) {
    if (!validateThaiMobile(a.msisdn)) return err(`Invalid Thai mobile number: ${a.msisdn}`);
    const normalized = normalizeThaiMobile(a.msisdn);
    console.error(`[OTP] request msisdn=${normalized}`);
    try { return ok(await getClient().requestOtp(normalized)); }
    catch (e) { return err(String(e)); }
  },

  async verify_otp(a) {
    console.error(`[OTP] verify token=${(a.token || "").slice(0, 8)}...`);
    try { return ok(await getClient().verifyOtp(a.token, a.pin)); }
    catch (e) { return err(String(e)); }
  },

  async request_email_otp(a) {
    const { recipient_email, template_uuid } = a;
    if (!validateEmail(recipient_email)) return err(`Invalid email: ${recipient_email}`);
    if (!template_uuid) return err("template_uuid is required. Create an OTP template at ThaiBulkMail dashboard.");
    console.error(`[EMAIL_OTP] to=${recipient_email}`);
    try { return ok(await getClient().requestEmailOtp({ template_uuid, recipient_email })); }
    catch (e) { return err(String(e)); }
  },

  async verify_email_otp(a) {
    console.error(`[EMAIL_OTP] verify token=${(a.token || "").slice(0, 8)}...`);
    try { return ok(await getClient().verifyEmailOtp(a.token, a.otp_code)); }
    catch (e) { return err(String(e)); }
  },
};

// ── Public dispatcher ────────────────────────────────────

export async function handleToolCall(name: string, args: unknown): Promise<ToolResult> {
  const handler = HANDLERS[name];
  if (!handler) return err(`Unknown tool: ${name}`);
  return handler(args as Args);
}

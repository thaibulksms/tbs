import { createInterface } from "node:readline";
import { ThaiBulkClient } from "./client.js";
import { validateThaiMobile, normalizeThaiMobile, validateEmail } from "./validators.js";
import { saveProfile, listProfiles, getCredentials } from "./profile.js";

// ── Arg parser ───────────────────────────────────────────

interface Parsed {
  args: string[];
  flags: Record<string, string | true>;
}

export function parseArgs(argv: string[]): Parsed {
  const args: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      args.push(a);
    }
  }
  return { args, flags };
}

// ── Helpers ──────────────────────────────────────────────

function getClient(profileFlag?: string): ThaiBulkClient | null {
  const creds = getCredentials(typeof profileFlag === "string" ? profileFlag : undefined);
  if (!creds) return null;
  return new ThaiBulkClient(
    creds.apiKey,
    creds.apiSecret,
    process.env.THAIBULKSMS_OTP_KEY,
    process.env.THAIBULKSMS_OTP_SECRET,
  );
}

function die(msg: string): never {
  console.error(msg);
  process.exit(1);
}

// ── Commands ─────────────────────────────────────────────

export async function cmdLogin(flags: Record<string, string | true>) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

  const profileName = typeof flags.profile === "string" ? flags.profile : "default";

  console.log("\nGet credentials at: https://developer.thaibulksms.com");
  console.log("  Sign up / Log in > Settings > API Key\n");

  const apiKey = (await ask("API Key: ")).trim();
  const apiSecret = (await ask("API Secret: ")).trim();
  rl.close();

  if (!apiKey || !apiSecret) die("\nBoth API key and secret are required.");

  console.log("\nVerifying...");
  const auth = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  try {
    const resp = await fetch("https://api-v2.thaibulksms.com/credit", {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    if (!resp.ok) {
      const body = await resp.text();
      die(`Authentication failed (HTTP ${resp.status}): ${body}`);
    }
    const data = (await resp.json()) as Record<string, unknown>;
    const credit = data.remaining_credit as Record<string, number> | number;
    if (typeof credit === "object") {
      console.log(`OK! SMS credit: ${credit.standard ?? 0} standard, ${credit.corporate ?? 0} corporate`);
    } else {
      console.log(`OK! SMS credit: ${credit}`);
    }
  } catch (e) {
    die(`Connection error: ${e}`);
  }

  saveProfile(profileName, apiKey, apiSecret);
  console.log(`\nProfile "${profileName}" saved to ~/.config/tbs/${profileName}.json`);
}

export async function cmdCredit(flags: Record<string, string | true>) {
  const client = getClient(flags.profile as string);
  if (!client) process.exit(1);

  const json = flags.json === true;
  try {
    const sms = await client.checkSmsCredit();
    const email = await client.checkEmailCredit();
    if (json) {
      console.log(JSON.stringify({ sms: sms.remaining_credit, email: email.credit_remain ?? email.remaining_credit }));
    } else {
      const sc = sms.remaining_credit as Record<string, number> | number;
      const ec = email.credit_remain ?? email.remaining_credit;
      if (typeof sc === "object") {
        console.log(`SMS:   ${sc.standard ?? 0} standard, ${sc.corporate ?? 0} corporate`);
      } else {
        console.log(`SMS:   ${sc}`);
      }
      console.log(`Email: ${ec}`);
    }
  } catch (e) {
    die(`Error: ${e}`);
  }
}

export async function cmdSend(args: string[], flags: Record<string, string | true>) {
  const [to, ...msgParts] = args;
  const message = msgParts.join(" ");
  if (!to || !message) die("Usage: tbs send <to> <message> [--sender ID]");

  if (!validateThaiMobile(to)) die(`Invalid Thai mobile number: ${to}`);
  const msisdn = normalizeThaiMobile(to);
  const sender = typeof flags.sender === "string" ? flags.sender : "SMS.";

  const client = getClient(flags.profile as string);
  if (!client) process.exit(1);

  try {
    const result = await client.sendSms({ msisdn, message, sender });
    if (flags.json === true) {
      console.log(JSON.stringify(result));
    } else {
      const list = result.phone_number_list as Array<Record<string, unknown>>;
      const id = list?.[0]?.message_id ?? "unknown";
      console.log(`Sent! ID: ${id}`);
      console.log(`Credit used: ${result.total_use_credit} (${result.credit_type})`);
      console.log(`Remaining: ${result.remaining_credit}`);
    }
  } catch (e) {
    die(`Error: ${e}`);
  }
}

export async function cmdEmail(args: string[], flags: Record<string, string | true>) {
  const [to, subject] = args;
  const templateUuid = typeof flags.template === "string" ? flags.template : undefined;
  const mailFrom = typeof flags.from === "string" ? flags.from : undefined;

  if (!to || !subject || !templateUuid || !mailFrom) {
    die("Usage: tbs email <to> <subject> --from <sender> --template <uuid>\n\nCreate templates at: https://app.thaibulkmail.com");
  }

  if (!validateEmail(to)) die(`Invalid recipient email: ${to}`);
  if (!validateEmail(mailFrom)) die(`Invalid sender email: ${mailFrom}`);

  const client = getClient(flags.profile as string);
  if (!client) process.exit(1);

  try {
    const result = await client.sendEmail({ mail_from: mailFrom, mail_to: to, subject, template_uuid: templateUuid });
    if (flags.json === true) {
      console.log(JSON.stringify(result));
    } else {
      console.log(`Sent! ID: ${result.message_id ?? "ok"}`);
      console.log(`Credit used: ${result.credit_used} (${result.credit_type})`);
      console.log(`Remaining: ${result.credit_remain}`);
    }
  } catch (e) {
    die(`Error: ${e}`);
  }
}

export async function cmdOtp(args: string[], flags: Record<string, string | true>) {
  const [to] = args;
  if (!to) die("Usage: tbs otp <to>");

  if (!validateThaiMobile(to)) die(`Invalid Thai mobile number: ${to}`);
  const msisdn = normalizeThaiMobile(to);

  const client = getClient(flags.profile as string);
  if (!client) process.exit(1);

  try {
    const result = await client.requestOtp(msisdn);
    if (flags.json === true) {
      console.log(JSON.stringify(result));
    } else {
      console.log(`OTP sent! Token: ${result.token}`);
      console.log(`Use: tbs verify ${result.token} <pin>`);
    }
  } catch (e) {
    die(`Error: ${e}`);
  }
}

export async function cmdVerify(args: string[], flags: Record<string, string | true>) {
  const [token, pin] = args;
  if (!token || !pin) die("Usage: tbs verify <token> <pin>");

  const client = getClient(flags.profile as string);
  if (!client) process.exit(1);

  try {
    const result = await client.verifyOtp(token, pin);
    if (flags.json === true) {
      console.log(JSON.stringify(result));
    } else {
      console.log(result.status === "verified" ? "Verified!" : `Status: ${result.status}`);
    }
  } catch (e) {
    die(`Error: ${e}`);
  }
}

export async function cmdEmailOtp(args: string[], flags: Record<string, string | true>) {
  const [to] = args;
  const templateUuid = typeof flags.template === "string" ? flags.template : undefined;

  if (!to || !templateUuid) {
    die("Usage: tbs email-otp <to> --template <uuid>\n\nCreate an OTP template at: https://app.thaibulkmail.com");
  }

  if (!validateEmail(to)) die(`Invalid email: ${to}`);

  const client = getClient(flags.profile as string);
  if (!client) process.exit(1);

  try {
    const result = await client.requestEmailOtp({ template_uuid: templateUuid, recipient_email: to });
    if (flags.json === true) {
      console.log(JSON.stringify(result));
    } else {
      console.log(`Email OTP sent! Token: ${result.token}`);
      console.log(`Ref: ${result.ref_no}`);
      console.log(`Use: tbs email-verify ${result.token} <otp_code>`);
    }
  } catch (e) {
    die(`Error: ${e}`);
  }
}

export async function cmdEmailVerify(args: string[], flags: Record<string, string | true>) {
  const [token, otpCode] = args;
  if (!token || !otpCode) die("Usage: tbs email-verify <token> <otp_code>");

  const client = getClient(flags.profile as string);
  if (!client) process.exit(1);

  try {
    const result = await client.verifyEmailOtp(token, otpCode);
    if (flags.json === true) {
      console.log(JSON.stringify(result));
    } else {
      console.log(result.status === "success" ? "Verified!" : `Status: ${result.status}`);
    }
  } catch (e) {
    die(`Error: ${e}`);
  }
}

export function cmdProfiles() {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    console.log("No profiles. Run: tbs login");
    return;
  }
  for (const p of profiles) {
    console.log(p === "default" ? `  ${p} (active)` : `  ${p}`);
  }
}

export function cmdHelp(args: string[]) {
  const [topic] = args;
  const help: Record<string, string> = {
    login: `Save API credentials.

Usage: tbs login [--profile <name>]

Prompts for API Key and Secret, verifies against ThaiBulkSMS API,
saves to ~/.config/tbs/<name>.json (default: "default").

Get credentials at: https://developer.thaibulksms.com`,

    credit: `Check SMS and email credit balance.

Usage: tbs credit [--json] [--profile <name>]`,

    send: `Send SMS to a Thai mobile number.

Usage: tbs send <to> <message> [--sender <id>] [--json] [--profile <name>]

Arguments:
  to       Thai mobile number (0812345678 or +66812345678)
  message  SMS text content

Options:
  --sender <id>     Sender ID (default: SMS.)
  --json            Output raw JSON
  --profile <name>  Use specific profile`,

    email: `Send email via ThaiBulkMail template.

Usage: tbs email <to> <subject> --from <sender> --template <uuid> [--json] [--profile <name>]

Arguments:
  to       Recipient email address
  subject  Email subject line

Options:
  --from <email>       Sender email (must be verified in ThaiBulkMail)
  --template <uuid>    Template UUID from ThaiBulkMail dashboard
  --json               Output raw JSON
  --profile <name>     Use specific profile

Create templates at: https://app.thaibulkmail.com`,

    otp: `Request an OTP code via SMS.

Usage: tbs otp <to> [--json] [--profile <name>]

Returns a token. Verify with: tbs verify <token> <pin>`,

    verify: `Verify an SMS OTP PIN.

Usage: tbs verify <token> <pin> [--json] [--profile <name>]`,

    "email-otp": `Request an OTP code via email.

Usage: tbs email-otp <to> --template <uuid> [--json] [--profile <name>]

Returns a token. Verify with: tbs email-verify <token> <otp_code>
Create OTP templates at: https://app.thaibulkmail.com`,

    "email-verify": `Verify an email OTP code.

Usage: tbs email-verify <token> <otp_code> [--json] [--profile <name>]`,

    profiles: `List saved credential profiles.

Usage: tbs profiles

Profiles are stored in ~/.config/tbs/`,
  };

  if (topic && help[topic]) {
    console.log(help[topic]);
    return;
  }

  console.log(`tbs — ThaiBulkSMS/ThaiBulkMail CLI & MCP

Commands:
  login                    Save API credentials
  credit                   Check SMS and email credit
  send <to> <msg>          Send SMS
  email <to> <subject>     Send email (template)
  otp <to>                 Request SMS OTP
  verify <tok> <pin>       Verify SMS OTP
  email-otp <to>           Request email OTP
  email-verify <tok> <code> Verify email OTP
  profiles                 List saved profiles
  help <command>           Per-command help

MCP: npx @thaibulksms/tbs
Docs: https://github.com/thaibulksms/tbs`);
}

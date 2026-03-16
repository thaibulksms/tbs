import { mkdirSync, writeFileSync, readFileSync, readdirSync, chmodSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = join(homedir(), ".config", "tbs");

interface Profile {
  apiKey: string;
  apiSecret: string;
  created: string;
}

function ensureDir() {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

function profilePath(name: string): string {
  return join(CONFIG_DIR, `${name}.json`);
}

export function saveProfile(name: string, apiKey: string, apiSecret: string): void {
  ensureDir();
  const path = profilePath(name);
  const data: Profile = { apiKey, apiSecret, created: new Date().toISOString() };
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
  try { chmodSync(path, 0o600); } catch { /* windows */ }
}

export function loadProfile(name = "default"): Profile | null {
  const path = profilePath(name);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Profile;
  } catch {
    return null;
  }
}

export function listProfiles(): string[] {
  ensureDir();
  return readdirSync(CONFIG_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

/**
 * Resolve credentials with Twilio-style precedence:
 * 1. --profile flag
 * 2. Environment variables
 * 3. Default profile
 */
export function getCredentials(profileFlag?: string): { apiKey: string; apiSecret: string } | null {
  // 1. Explicit profile flag
  if (profileFlag) {
    const p = loadProfile(profileFlag);
    if (p) return { apiKey: p.apiKey, apiSecret: p.apiSecret };
    console.error(`Profile "${profileFlag}" not found. Run: tbs login --profile ${profileFlag}`);
    return null;
  }

  // 2. Environment variables
  const envKey = process.env.THAIBULKSMS_API_KEY;
  const envSecret = process.env.THAIBULKSMS_API_SECRET;
  if (envKey && envSecret) return { apiKey: envKey, apiSecret: envSecret };

  // 3. Default profile
  const def = loadProfile("default");
  if (def) return { apiKey: def.apiKey, apiSecret: def.apiSecret };

  console.error("No credentials found. Run: tbs login");
  return null;
}

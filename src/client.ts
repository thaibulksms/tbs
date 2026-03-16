const SMS_BASE = "https://api-v2.thaibulksms.com";
const EMAIL_BASE = "https://email-api.thaibulksms.com";
const OTP_BASE = "https://otp.thaibulksms.com";

export class ThaiBulkClient {
  private authHeader: string;
  private otpKey?: string;
  private otpSecret?: string;

  constructor(apiKey: string, apiSecret: string, otpKey?: string, otpSecret?: string) {
    this.authHeader = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    this.otpKey = otpKey;
    this.otpSecret = otpSecret;
  }

  private async request(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
    const resp = await fetch(url, {
      ...init,
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        ...init?.headers,
      },
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
    }
    return resp.json() as Promise<Record<string, unknown>>;
  }

  /** Plain POST with JSON body (no auth header — for OTP endpoints) */
  private async postJson(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
    }
    return resp.json() as Promise<Record<string, unknown>>;
  }

  async sendSms(params: {
    msisdn: string;
    message: string;
    sender: string;
    force?: string;
    scheduled_delivery?: string;
    shorten_url?: string;
    callback_url?: string;
    tag?: string;
  }): Promise<Record<string, unknown>> {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null) body.set(k, v);
    }
    return this.request(`${SMS_BASE}/sms`, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }

  async checkSmsCredit(): Promise<Record<string, unknown>> {
    return this.request(`${SMS_BASE}/credit`);
  }

  async sendEmail(params: {
    mail_from: string;
    mail_from_name?: string;
    mail_to: string;
    subject: string;
    template_uuid: string;
    payload?: Record<string, string>;
  }): Promise<Record<string, unknown>> {
    return this.request(`${EMAIL_BASE}/email/v1/send_template`, {
      method: "POST",
      body: JSON.stringify({
        mail_from: { email: params.mail_from, ...(params.mail_from_name ? { name: params.mail_from_name } : {}) },
        mail_to: { email: params.mail_to },
        subject: params.subject,
        template_uuid: params.template_uuid,
        ...(params.payload ? { payload: params.payload } : {}),
      }),
      headers: { "Content-Type": "application/json" },
    });
  }

  async checkEmailCredit(): Promise<Record<string, unknown>> {
    return this.request(`${EMAIL_BASE}/email/v1/credit`);
  }

  async requestEmailOtp(params: {
    template_uuid: string;
    recipient_email: string;
  }): Promise<Record<string, unknown>> {
    return this.request(`${EMAIL_BASE}/email/v1/otp/send`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Content-Type": "application/json" },
    });
  }

  async verifyEmailOtp(token: string, otp_code: string): Promise<Record<string, unknown>> {
    return this.request(`${EMAIL_BASE}/email/v1/otp/verify`, {
      method: "POST",
      body: JSON.stringify({ token, otp_code }),
      headers: { "Content-Type": "application/json" },
    });
  }

  async requestOtp(msisdn: string): Promise<Record<string, unknown>> {
    if (!this.otpKey || !this.otpSecret) throw new Error("OTP credentials not configured. Set THAIBULKSMS_OTP_KEY and THAIBULKSMS_OTP_SECRET.");
    return this.postJson(`${OTP_BASE}/v2/otp/request`, {
      key: this.otpKey,
      secret: this.otpSecret,
      msisdn,
    });
  }

  async verifyOtp(token: string, pin: string): Promise<Record<string, unknown>> {
    if (!this.otpKey || !this.otpSecret) throw new Error("OTP credentials not configured. Set THAIBULKSMS_OTP_KEY and THAIBULKSMS_OTP_SECRET.");
    return this.postJson(`${OTP_BASE}/v2/otp/verify`, {
      key: this.otpKey,
      secret: this.otpSecret,
      token,
      pin,
    });
  }
}

const E164_RE = /^\+66[689]\d{8}$/;
const DOMESTIC_RE = /^0[689]\d{8}$/;
const HEADER_INJECTION_RE = /[\r\n]|%0[aAdD]/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateThaiMobile(number: string): boolean {
  return E164_RE.test(number) || DOMESTIC_RE.test(number);
}

export function normalizeThaiMobile(number: string): string {
  if (E164_RE.test(number)) return number;
  if (DOMESTIC_RE.test(number)) return "+66" + number.slice(1);
  throw new Error(`Invalid Thai mobile number: ${number}`);
}

export function validateEmail(email: string): boolean {
  if (HEADER_INJECTION_RE.test(email)) return false;
  return EMAIL_RE.test(email);
}

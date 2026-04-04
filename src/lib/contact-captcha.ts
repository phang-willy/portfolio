import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { normalizeCaptchaInput } from "@/lib/contact-schema";

export const CONTACT_CAPTCHA_CHARSET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*-_=+?";

const CAPTCHA_TTL_MS = 15 * 60 * 1000;
const DEFAULT_CODE_LENGTH = 8;

function getCaptchaSecret(): string {
  const fromEnv = process.env.CONTACT_CAPTCHA_SECRET?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const brevo = process.env.BREVO_API_KEY?.trim();
  if (brevo) {
    return brevo;
  }
  throw new Error(
    "CONTACT_CAPTCHA_SECRET or BREVO_API_KEY is required for captcha.",
  );
}

export function generateContactCaptchaCode(
  length = DEFAULT_CODE_LENGTH,
): string {
  const charset = CONTACT_CAPTCHA_CHARSET;
  let out = "";
  for (let i = 0; i < length; i++) {
    out += charset[randomInt(charset.length)]!;
  }
  return out;
}

export function createSignedCaptchaToken(code: string): string {
  const exp = Date.now() + CAPTCHA_TTL_MS;
  const payload = JSON.stringify({ c: code, e: exp });
  const secret = getCaptchaSecret();
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  return `${payloadB64}.${sig}`;
}

export function readCaptchaFromToken(
  token: string,
): { code: string; exp: number } | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) {
    return null;
  }

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const secret = getCaptchaSecret();
  const expectedSig = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(payload) as { c?: unknown; e?: unknown };
    if (typeof data.c !== "string" || typeof data.e !== "number") {
      return null;
    }
    if (Date.now() > data.e) {
      return null;
    }
    return { code: data.c, exp: data.e };
  } catch {
    return null;
  }
}

export function captchaAnswerMatches(
  expectedCode: string,
  userInput: string,
): boolean {
  const a = Buffer.from(expectedCode, "utf8");
  const b = Buffer.from(normalizeCaptchaInput(userInput), "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

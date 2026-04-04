import { checkRateLimit, type RateLimitResult } from "@/lib/rate-limit";

const POST_BODY_MAX_BYTES = 48 * 1024;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

export function assertPostBodySizeAllowed(request: Request): boolean {
  const raw = request.headers.get("content-length");
  if (!raw) {
    return true;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return true;
  }
  return n <= POST_BODY_MAX_BYTES;
}

/**
 * Si CONTACT_ALLOWED_ORIGINS est défini (URLs séparées par des virgules),
 * seules les requêtes POST dont le header Origin correspond sont acceptées.
 * Sans variable : pas de contrôle (compat dev / outils).
 */
export function isContactPostOriginAllowed(request: Request): boolean {
  const raw = process.env.CONTACT_ALLOWED_ORIGINS?.trim();
  if (!raw) {
    return true;
  }

  const allowed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  return allowed.some((base) => origin === base || origin.startsWith(base));
}

export type ContactRatePreset = "post" | "status" | "captcha";

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

function parseWindowMs(raw: string | undefined, fallback: number): number {
  const n = parsePositiveInt(raw, fallback);
  return Math.max(1000, n);
}

export function getContactRateLimit(preset: ContactRatePreset): {
  max: number;
  windowMs: number;
} {
  switch (preset) {
    case "post":
      return {
        max: parsePositiveInt(process.env.CONTACT_RATE_LIMIT_POST_MAX, 12),
        windowMs: parseWindowMs(
          process.env.CONTACT_RATE_LIMIT_POST_WINDOW_MS,
          900_000,
        ),
      };
    case "status":
      return {
        max: parsePositiveInt(process.env.CONTACT_RATE_LIMIT_STATUS_MAX, 120),
        windowMs: parseWindowMs(
          process.env.CONTACT_RATE_LIMIT_STATUS_WINDOW_MS,
          60_000,
        ),
      };
    case "captcha":
      return {
        max: parsePositiveInt(process.env.CONTACT_RATE_LIMIT_CAPTCHA_MAX, 45),
        windowMs: parseWindowMs(
          process.env.CONTACT_RATE_LIMIT_CAPTCHA_WINDOW_MS,
          60_000,
        ),
      };
    default:
      return { max: 60, windowMs: 60_000 };
  }
}

export function rateLimitContact(
  request: Request,
  preset: ContactRatePreset,
): RateLimitResult {
  const ip = getClientIp(request);
  const { max, windowMs } = getContactRateLimit(preset);
  const key = `contact:${preset}:${ip}`;
  return checkRateLimit(key, max, windowMs);
}

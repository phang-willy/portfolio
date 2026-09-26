import { timingSafeEqual } from "node:crypto";

export function sitemapRequestAllowed(
  provided: string | null,
  expected: string | undefined,
): { ok: true } | { ok: false; status: 401 | 503 } {
  const token = expected?.trim() ?? "";
  if (!token) {
    return { ok: false, status: 503 };
  }
  if (!provided || !tokensMatch(provided, token)) {
    return { ok: false, status: 401 };
  }
  return { ok: true };
}

function tokensMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

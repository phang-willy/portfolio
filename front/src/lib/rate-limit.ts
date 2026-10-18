type Bucket = {
  count: number;
  windowStart: number;
};

const store = new Map<string, Bucket>();

function pruneExpired(maxWindowMs: number) {
  const now = Date.now();
  const cutoff = now - maxWindowMs * 2;
  for (const [key, bucket] of store.entries()) {
    if (bucket.windowStart < cutoff) {
      store.delete(key);
    }
  }
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * Fenêtre fixe par clé (ex. par IP). Non partagée entre instances serverless.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  if (max < 1 || windowMs < 1000) {
    return { ok: true };
  }

  pruneExpired(windowMs);

  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (bucket.count >= max) {
    const retryAfterMs = windowMs - (now - bucket.windowStart);
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

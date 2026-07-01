// Simple in-memory fixed-window rate limiter. Adequate as an extra layer on top
// of Supabase's own auth rate limiting. Note: memory is per-instance, so on a
// multi-instance/serverless deployment this limits per instance, not globally —
// a shared store (e.g. Upstash/Redis) would be needed for strict global limits.

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

function prune(now: number) {
  if (store.size < 5000) return;
  store.forEach((b, k) => {
    if (now > b.resetAt) store.delete(k);
  });
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  prune(now);
  const b = store.get(key);
  if (!b || now > b.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

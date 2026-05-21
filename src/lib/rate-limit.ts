const buckets = new Map<string, { timestamps: number[]; blockedUntil?: number }>();

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export function isRateLimited(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  if (bucket.blockedUntil && now < bucket.blockedUntil) return true;
  if (bucket.blockedUntil && now >= bucket.blockedUntil) {
    bucket.blockedUntil = undefined;
    bucket.timestamps = [];
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < config.windowMs);

  if (bucket.timestamps.length >= config.max) {
    bucket.blockedUntil = now + config.windowMs;
    return true;
  }

  bucket.timestamps.push(now);
  return false;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

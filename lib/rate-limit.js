import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const memoryStore = new Map();

function memoryLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = memoryStore.get(key) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count += 1;
  memoryStore.set(key, entry);
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.reset,
  };
}

function hasUpstash() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

let checkLimiter = null;
let authLimiter = null;

function getCheckLimiter() {
  if (!hasUpstash()) return null;
  if (!checkLimiter) {
    checkLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "vmt:check",
    });
  }
  return checkLimiter;
}

function getAuthLimiter() {
  if (!hasUpstash()) return null;
  if (!authLimiter) {
    authLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "15 m"),
      prefix: "vmt:auth",
    });
  }
  return authLimiter;
}

export async function rateLimitCheck(ip) {
  const limiter = getCheckLimiter();
  if (limiter) {
    const result = await limiter.limit(ip);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[rate-limit] Upstash non configuré — fallback mémoire (non partagé entre instances). Voir docs/DEPLOY.md"
    );
  }
  return memoryLimit(`check:${ip}`, 10, 60 * 60 * 1000);
}

export async function rateLimitAuth(ip) {
  const limiter = getAuthLimiter();
  if (limiter) {
    const result = await limiter.limit(ip);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  }
  return memoryLimit(`auth:${ip}`, 20, 15 * 60 * 1000);
}

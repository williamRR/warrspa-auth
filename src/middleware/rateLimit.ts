import { FastifyRequest, FastifyReply } from "fastify";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_LIMIT = 100;
const DEFAULT_WINDOW_MS = 60 * 1000;

export function rateLimit(options: { limit?: number; windowMs?: number } = {}) {
  const limit = options.limit || DEFAULT_LIMIT;
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = (request as any).tenantId || request.ip;
    const key = `rate:${tenantId}:${request.method}:${request.url}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, limit - entry.count);
    const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);

    reply.header("X-RateLimit-Limit", limit);
    reply.header("X-RateLimit-Remaining", remaining);
    reply.header("X-RateLimit-Reset", resetTimeSeconds);

    if (entry.count > limit) {
      return reply.status(429).send({
        error: "rate_limit_exceeded",
        message: "Too many requests",
        retry_after: resetTimeSeconds,
      });
    }
  };
}

export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupRateLimitStore, 60 * 1000);

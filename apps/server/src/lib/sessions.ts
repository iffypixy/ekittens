import { randomBytes } from "node:crypto";
import type { UserId } from "@ekittens/contract";
import type Redis from "ioredis";

/**
 * Server-side sessions backed by Redis. The browser holds only a signed,
 * HttpOnly cookie carrying the opaque session id; the userId lives in Redis.
 * Used by both HTTP routes and the WebSocket handshake. Cross-cutting infra,
 * not a bounded context.
 */
const key = (sid: string): string => `session:${sid}`;

/** A dedicated high-entropy session token (256-bit), distinct from public ids. */
const newToken = (): string => randomBytes(32).toString("base64url");

export interface SessionStore {
  create(userId: UserId): Promise<string>;
  userId(sid: string): Promise<UserId | undefined>;
  destroy(sid: string): Promise<void>;
}

export const createSessionStore = (redis: Redis, ttlSeconds: number): SessionStore => ({
  async create(userId) {
    const sid = newToken();
    await redis.set(key(sid), userId, "EX", ttlSeconds);
    return sid;
  },
  async userId(sid) {
    const value = await redis.get(key(sid));
    if (value === null) return undefined;
    // Sliding expiry: each authenticated request refreshes the inactivity window.
    await redis.expire(key(sid), ttlSeconds);
    return value as UserId;
  },
  async destroy(sid) {
    await redis.del(key(sid));
  },
});

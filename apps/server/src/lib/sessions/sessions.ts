import type { UserId } from "@ekittens/contract";
import { newId } from "@ekittens/lib";
import type Redis from "ioredis";

/**
 * Server-side sessions backed by Redis. The browser holds only a signed,
 * HttpOnly cookie carrying the opaque session id; the userId lives in Redis.
 * Used by both HTTP routes and the WebSocket handshake. Cross-cutting infra,
 * not a bounded context.
 */
const key = (sid: string): string => `session:${sid}`;

export interface SessionStore {
  create(userId: UserId): Promise<string>;
  userId(sid: string): Promise<UserId | undefined>;
  destroy(sid: string): Promise<void>;
}

export const createSessionStore = (redis: Redis, ttlSeconds: number): SessionStore => ({
  async create(userId) {
    const sid = newId();
    await redis.set(key(sid), userId, "EX", ttlSeconds);
    return sid;
  },
  async userId(sid) {
    const value = await redis.get(key(sid));
    return value === null ? undefined : (value as UserId);
  },
  async destroy(sid) {
    await redis.del(key(sid));
  },
});

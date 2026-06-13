import { randomBytes } from "node:crypto";
import type { UserId } from "@ekittens/contract";
import type Redis from "ioredis";

const key = (sid: string): string => `session:${sid}`;

/** A dedicated high-entropy session token (256-bit), distinct from public ids. */
const newToken = (): string => randomBytes(32).toString("base64url");

/** Port: server-side sessions. The browser holds only a signed, HttpOnly cookie. */
export interface SessionStore {
  create(userId: UserId): Promise<string>;
  userId(sid: string): Promise<UserId | undefined>;
  destroy(sid: string): Promise<void>;
}

/**
 * Sessions backed by Redis, used by both HTTP routes and the WebSocket
 * handshake. Cross-cutting infra, not a bounded context.
 */
export class RedisSessionStore implements SessionStore {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSeconds: number,
  ) {}

  async create(userId: UserId): Promise<string> {
    const sid = newToken();
    await this.redis.set(key(sid), userId, "EX", this.ttlSeconds);
    return sid;
  }

  async userId(sid: string): Promise<UserId | undefined> {
    const value = await this.redis.get(key(sid));
    if (value === null) return undefined;
    // Sliding expiry: each authenticated request refreshes the inactivity window.
    await this.redis.expire(key(sid), this.ttlSeconds);
    return value as UserId;
  }

  async destroy(sid: string): Promise<void> {
    await this.redis.del(key(sid));
  }
}

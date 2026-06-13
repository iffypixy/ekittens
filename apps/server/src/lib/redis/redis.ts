import Redis from "ioredis";

/** Create a Redis client. The caller owns its lifecycle (quit on shutdown). */
export const createRedis = (url: string): Redis => new Redis(url, { lazyConnect: false });

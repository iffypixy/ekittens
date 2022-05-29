import Redis from "ioredis";

// @todo: replace it with redis module
export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

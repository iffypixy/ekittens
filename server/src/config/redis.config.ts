import {registerAs} from "@nestjs/config";

export const redisConfig = registerAs("redis", () => {
  const env = process.env;

  return {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
  };
});

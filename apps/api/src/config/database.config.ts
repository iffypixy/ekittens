import {registerAs} from "@nestjs/config";

export const databaseConfig = registerAs("db", () => {
  const env = process.env;

  return {
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT, 10),
    name: env.DB_NAME,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    synchronize: JSON.parse(env.DB_SYNCHRONIZE.toLowerCase()),
  };
});

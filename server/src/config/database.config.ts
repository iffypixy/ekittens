import {registerAs} from "@nestjs/config";

export const databaseConfig = registerAs("database", () => {
  const env = process.env;

  return {
    host: env.DATABASE_HOST,
    port: parseInt(env.DATABASE_PORT, 10),
    name: env.DATABASE_NAME,
    username: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    synchronize: JSON.parse(env.DATABASE_SYNCHRONIZE),
  };
});

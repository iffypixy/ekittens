import { buildApp } from "./app.ts";
import { loadConfig } from "./lib/config/config.ts";
import { createDatabase } from "./lib/db/db.ts";
import { createRedis } from "./lib/redis/redis.ts";
import { createSessionStore } from "./lib/sessions/sessions.ts";
import { createUsersRepository } from "./services/users/repository.ts";
import { createUsersService } from "./services/users/service.ts";

/** Composition root: wire infra + services, then listen. */
const main = async (): Promise<void> => {
  const config = loadConfig();
  const { db } = createDatabase(config.DATABASE_URL);
  const redis = createRedis(config.REDIS_URL);

  const sessions = createSessionStore(redis, config.SESSION_TTL_SECONDS);
  const users = createUsersService(createUsersRepository(db));

  const app = await buildApp({ config, sessions, users });
  await app.listen({ host: config.HOST, port: config.PORT });
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

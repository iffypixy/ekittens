import { randomInt } from "node:crypto";
import { systemClock } from "@ekittens/lib";
import { buildApp } from "./app.ts";
import { loadConfig } from "./lib/config/config.ts";
import { createDatabase } from "./lib/db/db.ts";
import { createRedis } from "./lib/redis/redis.ts";
import { realScheduler } from "./lib/scheduler/scheduler.ts";
import { createSessionStore } from "./lib/sessions/sessions.ts";
import { createMatchesService } from "./services/matches/service.ts";
import { createMatchmaking } from "./services/matchmaking/service.ts";
import { createUsersRepository } from "./services/users/repository.ts";
import { createUsersService } from "./services/users/service.ts";
import { createHub } from "./ws/hub.ts";

/** Composition root: wire infra + services, then listen. */
const main = async (): Promise<void> => {
  const config = loadConfig();
  const { db } = createDatabase(config.DATABASE_URL);
  const redis = createRedis(config.REDIS_URL);

  const sessions = createSessionStore(redis, config.SESSION_TTL_SECONDS);
  const users = createUsersService(createUsersRepository(db));
  const hub = createHub();

  const matches = createMatchesService({
    publish: (userId, message) => hub.send(userId, message),
    scheduler: realScheduler,
    clock: systemClock,
    seed: () => randomInt(2 ** 31),
  });

  const matchmaking = createMatchmaking({
    createMatch: (players) => {
      matches.create(players);
    },
  });

  const app = await buildApp({ config, sessions, users, hub, matches, matchmaking });
  await app.listen({ host: config.HOST, port: config.PORT });
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

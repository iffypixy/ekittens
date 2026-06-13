import { randomInt } from "node:crypto";
import { systemClock } from "@ekittens/lib";
import { buildApp } from "./app.ts";
import { loadConfig } from "./lib/config.ts";
import { createDatabase } from "./lib/db.ts";
import { createRedis } from "./lib/redis.ts";
import { realScheduler } from "./lib/scheduler.ts";
import { createSessionStore } from "./lib/sessions.ts";
import { createMatchesService } from "./services/matches/service.ts";
import { createMatchmaking } from "./services/matchmaking/service.ts";
import { createPresence } from "./services/presence/service.ts";
import { createRatingsRepository } from "./services/ratings/repository.ts";
import { createRatingsService } from "./services/ratings/service.ts";
import { createRelationshipsRepository } from "./services/relationships/repository.ts";
import { createRelationshipsService } from "./services/relationships/service.ts";
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
  const relationships = createRelationshipsService(createRelationshipsRepository(db));
  const ratings = createRatingsService(createRatingsRepository(db));
  const presence = createPresence();
  const hub = createHub();

  const matches = createMatchesService({
    publish: (userId, message) => hub.send(userId, message),
    scheduler: realScheduler,
    clock: systemClock,
    seed: () => randomInt(2 ** 31),
    isOnline: (userId) => hub.isOnline(userId),
    setStatus: (userId, status) => presence.set(userId, status),
    onEnd: (result) => {
      ratings.recordResult(result.ranking).catch((error: unknown) => {
        console.error("failed to record match result", error);
      });
    },
  });

  const matchmaking = createMatchmaking({
    createMatch: (players) => {
      matches.create(players);
    },
    isAvailable: (userId) => matches.matchOf(userId) === undefined,
  });

  const app = await buildApp({
    config,
    sessions,
    users,
    relationships,
    ratings,
    presence,
    hub,
    matches,
    matchmaking,
  });
  await app.listen({ host: config.HOST, port: config.PORT });
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

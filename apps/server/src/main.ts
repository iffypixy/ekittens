import { randomInt } from "node:crypto";
import { systemClock } from "@ekittens/lib";
import { buildApp } from "./app.ts";
import { loadConfig } from "./lib/config.ts";
import { createDatabase } from "./lib/db.ts";
import { createRedis } from "./lib/redis.ts";
import { realScheduler } from "./lib/scheduler.ts";
import { RedisSessionStore } from "./lib/sessions.ts";
import { MatchesService } from "./services/matches/service.ts";
import { MatchmakingService } from "./services/matchmaking/service.ts";
import { PresenceService } from "./services/presence/service.ts";
import { DrizzleRatingsRepository } from "./services/ratings/repository.ts";
import { RatingsService } from "./services/ratings/service.ts";
import { DrizzleRelationshipsRepository } from "./services/relationships/repository.ts";
import { RelationshipsService } from "./services/relationships/service.ts";
import { DrizzleUsersRepository } from "./services/users/repository.ts";
import { UsersService } from "./services/users/service.ts";
import { Hub } from "./ws/hub.ts";

/** Composition root: wire infra + services, then listen. */
const main = async (): Promise<void> => {
  const config = loadConfig();
  const { db } = createDatabase(config.DATABASE_URL);
  const redis = createRedis(config.REDIS_URL);

  const sessions = new RedisSessionStore(redis, config.SESSION_TTL_SECONDS);
  const users = new UsersService(new DrizzleUsersRepository(db));
  const relationships = new RelationshipsService(new DrizzleRelationshipsRepository(db));
  const ratings = new RatingsService(new DrizzleRatingsRepository(db));
  const presence = new PresenceService();
  const hub = new Hub();

  const matches = new MatchesService({
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

  const matchmaking = new MatchmakingService({
    createMatch: (players) => matches.create(players),
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

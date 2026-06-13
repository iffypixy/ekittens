import type { UserId } from "@ekittens/contract";
import type { Timestamp } from "@ekittens/lib";
import type { FastifyInstance, InjectOptions } from "fastify";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app.ts";
import type { Config } from "../../lib/config.ts";
import { type DatabaseHandle, createDatabase } from "../../lib/db.ts";
import { runMigrations } from "../../lib/migrate.ts";
import { inertScheduler } from "../../lib/scheduler.ts";
import { SessionStore } from "../../lib/sessions.ts";
import { Hub } from "../../ws/hub.ts";
import { MatchesService } from "../matches/service.ts";
import { MatchmakingService } from "../matchmaking/service.ts";
import { PresenceService } from "../presence/service.ts";
import { RatingsRepository } from "../ratings/repository.ts";
import { RatingsService } from "../ratings/service.ts";
import { RelationshipsRepository } from "../relationships/repository.ts";
import { RelationshipsService } from "../relationships/service.ts";
import { UsersRepository } from "./repository.ts";
import { UsersService } from "./service.ts";

/** In-memory sessions so the auth flow can be tested without Redis. */
class FakeSessionStore extends SessionStore {
  private readonly store = new Map<string, UserId>();
  private counter = 0;

  constructor() {
    super(undefined as never, 0);
  }

  override async create(userId: UserId): Promise<string> {
    const sid = `sid-${this.counter++}`;
    this.store.set(sid, userId);
    return sid;
  }

  override async userId(sid: string): Promise<UserId | undefined> {
    return this.store.get(sid);
  }

  override async destroy(sid: string): Promise<void> {
    this.store.delete(sid);
  }
}

interface InjectResult {
  statusCode: number;
  cookies: { name: string; value: string }[];
  json(): unknown;
}

const cookieHeader = (result: { cookies: { name: string; value: string }[] }): string => {
  const sid = result.cookies.find((cookie) => cookie.name === "sid");
  if (!sid) throw new Error("expected a sid cookie");
  return `sid=${sid.value}`;
};

describe("authentication", () => {
  let container: StartedTestContainer;
  let handle: DatabaseHandle;
  let app: FastifyInstance;

  beforeAll(async () => {
    container = await new GenericContainer("postgres:16-alpine")
      .withEnvironment({ POSTGRES_USER: "test", POSTGRES_PASSWORD: "test", POSTGRES_DB: "test" })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
      .start();

    const url = `postgres://test:test@${container.getHost()}:${container.getMappedPort(5432)}/test`;
    await runMigrations(url);
    handle = createDatabase(url);

    const config: Config = {
      NODE_ENV: "test",
      HOST: "0.0.0.0",
      PORT: 0,
      DATABASE_URL: url,
      REDIS_URL: "redis://unused",
      SESSION_SECRET: "test-secret-at-least-16-characters",
      SESSION_TTL_SECONDS: 3600,
      CORS_ORIGIN: "http://localhost",
    };
    const users = new UsersService(new UsersRepository(handle.db));
    const hub = new Hub();
    const matches = new MatchesService({
      publish: () => {},
      scheduler: inertScheduler,
      clock: { now: () => 0 as Timestamp },
      seed: () => 1,
      isOnline: () => true,
    });
    const matchmaking = new MatchmakingService({ createMatch: () => {} });
    const relationships = new RelationshipsService(new RelationshipsRepository(handle.db));
    const ratings = new RatingsService(new RatingsRepository(handle.db));
    const presence = new PresenceService();
    app = await buildApp({
      config,
      sessions: new FakeSessionStore(),
      users,
      relationships,
      ratings,
      presence,
      hub,
      matches,
      matchmaking,
    });
  });

  afterAll(async () => {
    await app?.close();
    await handle?.pool.end();
    await container?.stop();
  });

  const inject = (options: InjectOptions): Promise<InjectResult> =>
    app.inject(options) as unknown as Promise<InjectResult>;

  it("creates a guest, sets a session cookie, and resolves /users/me", async () => {
    const created = await inject({
      method: "POST",
      url: "/auth/guest",
      payload: { handle: "Tester" },
    });
    expect(created.statusCode).toBe(200);
    const guest = created.json() as { id: string; isGuest: boolean; handle: string };
    expect(guest.isGuest).toBe(true);
    expect(guest.handle).toBe("Tester");

    const me = await inject({
      method: "GET",
      url: "/users/me",
      headers: { cookie: cookieHeader(created) },
    });
    expect(me.statusCode).toBe(200);
    expect((me.json() as { id: string }).id).toBe(guest.id);
  });

  it("rejects an invalid guest handle", async () => {
    const bad = await inject({ method: "POST", url: "/auth/guest", payload: { handle: "!" } });
    expect(bad.statusCode).toBe(400);
  });

  it("upgrades a guest to a registered account in place (same id)", async () => {
    const guestRes = await inject({
      method: "POST",
      url: "/auth/guest",
      payload: { handle: "Upgrader" },
    });
    const guest = guestRes.json() as { id: string };

    const registered = await inject({
      method: "POST",
      url: "/auth/register",
      headers: { cookie: cookieHeader(guestRes) },
      payload: { username: "upgrader1", password: "supersecret" },
    });
    expect(registered.statusCode).toBe(200);
    const account = registered.json() as { id: string; isGuest: boolean; username: string };
    expect(account.id).toBe(guest.id); // same id keeps rating and history
    expect(account.isGuest).toBe(false);
    expect(account.username).toBe("upgrader1");
  });

  it("logs in with correct credentials and rejects wrong ones", async () => {
    await inject({
      method: "POST",
      url: "/auth/register",
      payload: { username: "loginuser", password: "correcthorse" },
    });

    const ok = await inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "loginuser", password: "correcthorse" },
    });
    expect(ok.statusCode).toBe(200);

    const bad = await inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "loginuser", password: "wrongpassword" },
    });
    expect(bad.statusCode).toBe(401);
  });

  it("rejects a duplicate username", async () => {
    await inject({
      method: "POST",
      url: "/auth/register",
      payload: { username: "dupe", password: "password1" },
    });
    const second = await inject({
      method: "POST",
      url: "/auth/register",
      payload: { username: "dupe", password: "password2" },
    });
    expect(second.statusCode).toBe(409);
  });
});

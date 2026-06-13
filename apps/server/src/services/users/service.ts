import type { GameError, UserId } from "@ekittens/contract";
import { gameError } from "@ekittens/contract";
import { type Result, err, newId, ok } from "@ekittens/lib";
import { hash, verify } from "@node-rs/argon2";
import type { UsersRepository } from "./repository.ts";
import type { UserRow } from "./schema.ts";

export interface PublicUser {
  readonly id: UserId;
  readonly handle: string;
  readonly username: string | null;
  readonly avatarUrl: string | null;
  readonly isGuest: boolean;
}

const toPublic = (row: UserRow): PublicUser => ({
  id: row.id as UserId,
  handle: row.handle,
  username: row.username,
  avatarUrl: row.avatarUrl,
  isGuest: row.isGuest,
});

const HANDLE = /^[A-Za-z0-9_]{2,24}$/;
const USERNAME = /^[A-Za-z0-9_]{3,24}$/;
const MIN_PASSWORD = 8;

export interface UsersService {
  createGuest(handle: string): Promise<Result<PublicUser, GameError>>;
  register(input: {
    userId?: UserId;
    username: string;
    password: string;
    handle?: string;
  }): Promise<Result<PublicUser, GameError>>;
  login(input: { username: string; password: string }): Promise<Result<PublicUser, GameError>>;
  byId(id: UserId): Promise<PublicUser | undefined>;
  remove(id: UserId): Promise<void>;
}

export const createUsersService = (repo: UsersRepository): UsersService => ({
  async createGuest(handle) {
    if (!HANDLE.test(handle)) return err(gameError("validation-failed", "invalid handle"));
    const row = await repo.insert({ id: newId(), handle, isGuest: true });
    return ok(toPublic(row));
  },

  async register({ userId, username, password, handle }) {
    if (!USERNAME.test(username)) return err(gameError("validation-failed", "invalid username"));
    if (password.length < MIN_PASSWORD)
      return err(gameError("validation-failed", "password too short"));

    const existing = await repo.byUsername(username);
    if (existing && existing.id !== userId) return err(gameError("conflict", "username taken"));

    const passwordHash = await hash(password);

    if (userId !== undefined) {
      // Guest → registered upgrade, in place (same id keeps rating + history).
      const patch = handle === undefined ? {} : { handle };
      const updated = await repo.update(userId, {
        username,
        passwordHash,
        isGuest: false,
        ...patch,
      });
      if (!updated) return err(gameError("not-found"));
      return ok(toPublic(updated));
    }

    const row = await repo.insert({
      id: newId(),
      handle: handle ?? username,
      username,
      passwordHash,
      isGuest: false,
    });
    return ok(toPublic(row));
  },

  async login({ username, password }) {
    const row = await repo.byUsername(username);
    if (!row || row.passwordHash === null) {
      return err(gameError("unauthorized", "invalid credentials"));
    }
    const valid = await verify(row.passwordHash, password);
    if (!valid) return err(gameError("unauthorized", "invalid credentials"));
    return ok(toPublic(row));
  },

  async byId(id) {
    const row = await repo.byId(id);
    return row ? toPublic(row) : undefined;
  },

  async remove(id) {
    await repo.remove(id);
  },
});

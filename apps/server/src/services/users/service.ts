import type { GameError, UserId } from "@ekittens/contract";
import { gameError } from "@ekittens/contract";
import { type Result, err, newId, ok } from "@ekittens/lib";
import { hash, verify } from "@node-rs/argon2";
import type { UsersRepository } from "./repository.ts";
import type { UserRow } from "./schema.ts";

export interface PublicUser {
  id: UserId;
  handle: string;
  username: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
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

export interface RegisterInput {
  userId?: UserId;
  username: string;
  password: string;
  handle?: string;
}

export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async createGuest(handle: string): Promise<Result<PublicUser, GameError>> {
    if (!HANDLE.test(handle)) return err(gameError("validation-failed", "invalid handle"));
    const row = await this.repo.insert({ id: newId(), handle, isGuest: true });
    return ok(toPublic(row));
  }

  async register({
    userId,
    username,
    password,
    handle,
  }: RegisterInput): Promise<Result<PublicUser, GameError>> {
    if (!USERNAME.test(username)) return err(gameError("validation-failed", "invalid username"));
    if (password.length < MIN_PASSWORD)
      return err(gameError("validation-failed", "password too short"));

    const existing = await this.repo.byUsername(username);
    if (existing && existing.id !== userId) return err(gameError("conflict", "username taken"));

    const passwordHash = await hash(password);

    if (userId !== undefined) {
      // Guest → registered upgrade, in place (same id keeps rating + history).
      const patch = handle === undefined ? {} : { handle };
      const updated = await this.repo.update(userId, {
        username,
        passwordHash,
        isGuest: false,
        ...patch,
      });
      if (!updated) return err(gameError("not-found"));
      return ok(toPublic(updated));
    }

    const row = await this.repo.insert({
      id: newId(),
      handle: handle ?? username,
      username,
      passwordHash,
      isGuest: false,
    });
    return ok(toPublic(row));
  }

  async login({
    username,
    password,
  }: { username: string; password: string }): Promise<Result<PublicUser, GameError>> {
    const row = await this.repo.byUsername(username);
    if (!row || row.passwordHash === null)
      return err(gameError("unauthorized", "invalid credentials"));
    const valid = await verify(row.passwordHash, password);
    if (!valid) return err(gameError("unauthorized", "invalid credentials"));
    return ok(toPublic(row));
  }

  async byId(id: UserId): Promise<PublicUser | undefined> {
    const row = await this.repo.byId(id);
    return row ? toPublic(row) : undefined;
  }

  async remove(id: UserId): Promise<void> {
    await this.repo.remove(id);
  }
}

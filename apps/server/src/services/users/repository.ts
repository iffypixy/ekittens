import { eq } from "drizzle-orm";
import type { Database } from "../../lib/db.ts";
import { type NewUserRow, type UserRow, users } from "./schema.ts";

export interface UsersRepository {
  insert(row: NewUserRow): Promise<UserRow>;
  byId(id: string): Promise<UserRow | undefined>;
  byUsername(username: string): Promise<UserRow | undefined>;
  update(id: string, patch: Partial<NewUserRow>): Promise<UserRow | undefined>;
  remove(id: string): Promise<void>;
}

export const createUsersRepository = (db: Database): UsersRepository => ({
  async insert(row) {
    const [inserted] = await db.insert(users).values(row).returning();
    if (!inserted) throw new Error("users.insert returned no row");
    return inserted;
  },
  async byId(id) {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  },
  async byUsername(username) {
    const [row] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return row;
  },
  async update(id, patch) {
    const [row] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
    return row;
  },
  async remove(id) {
    await db.delete(users).where(eq(users.id, id));
  },
});

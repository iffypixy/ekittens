import { eq } from "drizzle-orm";
import type { Database } from "../../lib/db.ts";
import { type NewUserRow, type UserRow, users } from "./schema.ts";

export class UsersRepository {
  constructor(private readonly db: Database) {}

  async insert(row: NewUserRow): Promise<UserRow> {
    const [inserted] = await this.db.insert(users).values(row).returning();
    if (!inserted) throw new Error("users.insert returned no row");
    return inserted;
  }

  async byId(id: string): Promise<UserRow | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  }

  async byUsername(username: string): Promise<UserRow | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return row;
  }

  async update(id: string, patch: Partial<NewUserRow>): Promise<UserRow | undefined> {
    const [row] = await this.db.update(users).set(patch).where(eq(users.id, id)).returning();
    return row;
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}

import { boolean, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * The `users` table, owned solely by the users service. A guest has a `handle`
 * only; registering fills `username` + `passwordHash` in place (same row/id), so
 * rating and history carry over. Rating lives in the ratings service's own table.
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 10 }).primaryKey(),
  handle: varchar("handle", { length: 24 }).notNull(),
  username: varchar("username", { length: 24 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  isGuest: boolean("is_guest").notNull().default(true),
  gamesPlayed: integer("games_played").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

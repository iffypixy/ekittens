import { doublePrecision, integer, varchar } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

/**
 * Per-user OpenSkill rating — owned solely by the ratings service (a separate
 * table from `users`, never a column on it). `ordinal` is the conservative
 * mu − 3·sigma, persisted so the leaderboard can sort cheaply.
 */
export const playerRatings = pgTable("player_ratings", {
  userId: varchar("user_id", { length: 10 }).primaryKey(),
  mu: doublePrecision("mu").notNull(),
  sigma: doublePrecision("sigma").notNull(),
  ordinal: doublePrecision("ordinal").notNull(),
  gamesPlayed: integer("games_played").notNull().default(0),
});

export type RatingRow = typeof playerRatings.$inferSelect;

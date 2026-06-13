import { desc, eq } from "drizzle-orm";
import type { Database } from "../../lib/db/db.ts";
import { type RatingRow, playerRatings } from "./schema.ts";

export interface RatingsRepository {
  byId(userId: string): Promise<RatingRow | undefined>;
  upsert(row: RatingRow): Promise<void>;
  top(limit: number): Promise<RatingRow[]>;
}

export const createRatingsRepository = (db: Database): RatingsRepository => ({
  async byId(userId) {
    const [row] = await db
      .select()
      .from(playerRatings)
      .where(eq(playerRatings.userId, userId))
      .limit(1);
    return row;
  },
  async upsert(row) {
    await db
      .insert(playerRatings)
      .values(row)
      .onConflictDoUpdate({
        target: playerRatings.userId,
        set: { mu: row.mu, sigma: row.sigma, ordinal: row.ordinal, gamesPlayed: row.gamesPlayed },
      });
  },
  async top(limit) {
    return db.select().from(playerRatings).orderBy(desc(playerRatings.ordinal)).limit(limit);
  },
});

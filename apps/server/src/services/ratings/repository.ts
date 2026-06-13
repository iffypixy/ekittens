import { desc, eq } from "drizzle-orm";
import type { Database } from "../../lib/db.ts";
import { type RatingRow, playerRatings } from "./schema.ts";

export class RatingsRepository {
  constructor(private readonly db: Database) {}

  async byId(userId: string): Promise<RatingRow | undefined> {
    const [row] = await this.db
      .select()
      .from(playerRatings)
      .where(eq(playerRatings.userId, userId))
      .limit(1);
    return row;
  }

  async upsert(row: RatingRow): Promise<void> {
    await this.db
      .insert(playerRatings)
      .values(row)
      .onConflictDoUpdate({
        target: playerRatings.userId,
        set: { mu: row.mu, sigma: row.sigma, ordinal: row.ordinal, gamesPlayed: row.gamesPlayed },
      });
  }

  async top(limit: number): Promise<RatingRow[]> {
    return this.db.select().from(playerRatings).orderBy(desc(playerRatings.ordinal)).limit(limit);
  }
}

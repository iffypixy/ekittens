import type { PlayerId, UserId } from "@ekittens/contract";
import { describe, expect, it } from "vitest";
import { RatingsRepository } from "./repository.ts";
import type { RatingRow } from "./schema.ts";
import { RatingsService } from "./service.ts";

/** In-memory ratings store so the service can be tested without a database. */
class FakeRatingsRepository extends RatingsRepository {
  private readonly rows = new Map<string, RatingRow>();

  constructor() {
    super(undefined as never);
  }

  override async byId(userId: string): Promise<RatingRow | undefined> {
    return this.rows.get(userId);
  }

  override async upsert(row: RatingRow): Promise<void> {
    this.rows.set(row.userId, row);
  }

  override async top(limit: number): Promise<RatingRow[]> {
    return [...this.rows.values()].sort((a, b) => b.ordinal - a.ordinal).slice(0, limit);
  }
}

describe("ratings", () => {
  it("raises the winner above the loser and counts the game", async () => {
    const ratings = new RatingsService(new FakeRatingsRepository());
    await ratings.recordResult(["winner", "loser"] as PlayerId[]);
    const winner = await ratings.standing("winner" as UserId);
    const loser = await ratings.standing("loser" as UserId);
    expect(winner.ordinal).toBeGreaterThan(loser.ordinal);
    expect(winner.gamesPlayed).toBe(1);
  });

  it("orders the leaderboard by conservative rating after a 3-player match", async () => {
    const ratings = new RatingsService(new FakeRatingsRepository());
    await ratings.recordResult(["a", "b", "c"] as PlayerId[]); // a beat b beat c
    const board = await ratings.leaderboard(10);
    expect(board.map((entry) => entry.userId)).toEqual(["a", "b", "c"]);
  });

  it("ignores degenerate single-player results", async () => {
    const ratings = new RatingsService(new FakeRatingsRepository());
    await ratings.recordResult(["solo"] as PlayerId[]);
    expect((await ratings.standing("solo" as UserId)).gamesPlayed).toBe(0);
  });
});

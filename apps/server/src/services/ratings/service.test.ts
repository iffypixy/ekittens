import type { PlayerId, UserId } from "@ekittens/contract";
import { describe, expect, it } from "vitest";
import type { RatingsRepository } from "./repository.ts";
import type { RatingRow } from "./schema.ts";
import { createRatingsService } from "./service.ts";

const fakeRepo = (): RatingsRepository => {
  const rows = new Map<string, RatingRow>();
  return {
    async byId(userId) {
      return rows.get(userId);
    },
    async upsert(row) {
      rows.set(row.userId, row);
    },
    async top(limit) {
      return [...rows.values()].sort((a, b) => b.ordinal - a.ordinal).slice(0, limit);
    },
  };
};

describe("ratings (OpenSkill)", () => {
  it("raises the winner above the loser and counts the game", async () => {
    const ratings = createRatingsService(fakeRepo());
    await ratings.recordResult(["winner", "loser"] as PlayerId[]);
    const winner = await ratings.standing("winner" as UserId);
    const loser = await ratings.standing("loser" as UserId);
    expect(winner.ordinal).toBeGreaterThan(loser.ordinal);
    expect(winner.gamesPlayed).toBe(1);
  });

  it("orders the leaderboard by conservative rating after a 3-player match", async () => {
    const ratings = createRatingsService(fakeRepo());
    await ratings.recordResult(["a", "b", "c"] as PlayerId[]); // a > b > c
    const board = await ratings.leaderboard(10);
    expect(board.map((entry) => entry.userId)).toEqual(["a", "b", "c"]);
  });

  it("ignores degenerate single-player results", async () => {
    const ratings = createRatingsService(fakeRepo());
    await ratings.recordResult(["solo"] as PlayerId[]);
    expect((await ratings.standing("solo" as UserId)).gamesPlayed).toBe(0);
  });
});

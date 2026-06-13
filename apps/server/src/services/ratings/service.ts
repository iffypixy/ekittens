import type { PlayerId, UserId } from "@ekittens/contract";
import { ordinal, rate, rating } from "openskill";
import type { RatingsRepository } from "./repository.ts";

export interface Standing {
  readonly userId: UserId;
  readonly mu: number;
  readonly sigma: number;
  readonly ordinal: number;
  readonly gamesPlayed: number;
}

export interface RatingsService {
  /** Update every player's rating from a match's finishing order (winner first). */
  recordResult(ranking: readonly PlayerId[]): Promise<void>;
  standing(userId: UserId): Promise<Standing>;
  leaderboard(limit: number): Promise<Standing[]>;
}

const DEFAULT = rating();

export const createRatingsService = (repo: RatingsRepository): RatingsService => {
  const load = async (id: string): Promise<Standing> => {
    const row = await repo.byId(id);
    if (row) {
      return {
        userId: row.userId as UserId,
        mu: row.mu,
        sigma: row.sigma,
        ordinal: row.ordinal,
        gamesPlayed: row.gamesPlayed,
      };
    }
    return {
      userId: id as UserId,
      mu: DEFAULT.mu,
      sigma: DEFAULT.sigma,
      ordinal: ordinal(DEFAULT),
      gamesPlayed: 0,
    };
  };

  return {
    async recordResult(ranking) {
      if (ranking.length < 2) return;
      const standings = await Promise.all(ranking.map((id) => load(id)));
      const teams = standings.map((standing) => [
        rating({ mu: standing.mu, sigma: standing.sigma }),
      ]);
      const ranks = ranking.map((_, index) => index + 1); // winner first → rank 1 (lower is better)
      const updated = rate(teams, { rank: ranks });

      await Promise.all(
        ranking.map((id, index) => {
          const next = updated[index]?.[0];
          if (!next) return Promise.resolve();
          return repo.upsert({
            userId: id,
            mu: next.mu,
            sigma: next.sigma,
            ordinal: ordinal(next),
            gamesPlayed: (standings[index]?.gamesPlayed ?? 0) + 1,
          });
        }),
      );
    },

    async standing(userId) {
      return load(userId);
    },

    async leaderboard(limit) {
      const rows = await repo.top(limit);
      return rows.map((row) => ({
        userId: row.userId as UserId,
        mu: row.mu,
        sigma: row.sigma,
        ordinal: row.ordinal,
        gamesPlayed: row.gamesPlayed,
      }));
    },
  };
};

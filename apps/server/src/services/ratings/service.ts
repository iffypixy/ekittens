import type { PlayerId, UserId } from "@ekittens/contract";
import { ordinal, rate, rating } from "openskill";
import type { RatingsRepository } from "./repository.ts";

export interface Standing {
  userId: UserId;
  mu: number;
  sigma: number;
  ordinal: number;
  gamesPlayed: number;
}

const DEFAULT = rating();

export class RatingsService {
  constructor(private readonly repo: RatingsRepository) {}

  private async load(id: string): Promise<Standing> {
    const row = await this.repo.byId(id);
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
  }

  /** Update every player's rating from a match's finishing order (winner first). */
  async recordResult(ranking: readonly PlayerId[]): Promise<void> {
    if (ranking.length < 2) return;
    const standings = await Promise.all(ranking.map((id) => this.load(id)));
    const teams = standings.map((standing) => [rating({ mu: standing.mu, sigma: standing.sigma })]);
    const ranks = ranking.map((_, index) => index + 1); // winner first → rank 1 (lower is better)
    const updated = rate(teams, { rank: ranks });

    await Promise.all(
      ranking.map((id, index) => {
        const next = updated[index]?.[0];
        if (!next) return Promise.resolve();
        return this.repo.upsert({
          userId: id,
          mu: next.mu,
          sigma: next.sigma,
          ordinal: ordinal(next),
          gamesPlayed: (standings[index]?.gamesPlayed ?? 0) + 1,
        });
      }),
    );
  }

  async standing(userId: UserId): Promise<Standing> {
    return this.load(userId);
  }

  async leaderboard(limit: number): Promise<Standing[]> {
    const rows = await this.repo.top(limit);
    return rows.map((row) => ({
      userId: row.userId as UserId,
      mu: row.mu,
      sigma: row.sigma,
      ordinal: row.ordinal,
      gamesPlayed: row.gamesPlayed,
    }));
  }
}

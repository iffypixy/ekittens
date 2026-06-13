import type { PlayerId } from "@ekittens/contract";
import { MAX_PLAYERS, MIN_PLAYERS } from "@ekittens/engine";

/**
 * Minimal public matchmaking: a queue that forms a table once enough players
 * are waiting. (Rating-banded widening is the documented later refinement; for
 * now it forms a table of MIN..MAX players as soon as MIN are queued.)
 */
export interface MatchmakingService {
  join(userId: PlayerId): void;
  leave(userId: PlayerId): void;
  readonly size: number;
}

export interface MatchmakingDeps {
  readonly createMatch: (players: readonly PlayerId[]) => void;
}

export const createMatchmaking = (deps: MatchmakingDeps): MatchmakingService => {
  const queue = new Set<PlayerId>();

  const tryForm = (): void => {
    if (queue.size < MIN_PLAYERS) return;
    const players = [...queue].slice(0, MAX_PLAYERS);
    for (const player of players) queue.delete(player);
    deps.createMatch(players);
  };

  return {
    join(userId) {
      queue.add(userId);
      tryForm();
    },
    leave(userId) {
      queue.delete(userId);
    },
    get size() {
      return queue.size;
    },
  };
};

import type { PlayerId } from "@ekittens/contract";
import { MAX_PLAYERS, MIN_PLAYERS } from "@ekittens/engine";

export interface MatchmakingDeps {
  createMatch: (players: readonly PlayerId[]) => void;
  /** Whether a user may queue, false if they are already in a match. */
  isAvailable?: (userId: PlayerId) => boolean;
}

/**
 * Minimal public matchmaking: a queue that forms a table once enough players
 * are waiting. (Rating-banded widening is the documented later refinement; for
 * now it forms a table of MIN..MAX players as soon as MIN are queued.)
 */
export class MatchmakingService {
  private readonly queue = new Set<PlayerId>();

  constructor(private readonly deps: MatchmakingDeps) {}

  join(userId: PlayerId): void {
    if (this.deps.isAvailable !== undefined && !this.deps.isAvailable(userId)) return;
    this.queue.add(userId);
    this.tryForm();
  }

  leave(userId: PlayerId): void {
    this.queue.delete(userId);
  }

  get size(): number {
    return this.queue.size;
  }

  private tryForm(): void {
    if (this.queue.size < MIN_PLAYERS) return;
    const players = [...this.queue].slice(0, MAX_PLAYERS);
    for (const player of players) this.queue.delete(player);
    this.deps.createMatch(players);
  }
}

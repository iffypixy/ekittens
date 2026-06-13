import type {
  Command,
  CommandWire,
  DomainEvent,
  MatchId,
  PlayerId,
  ServerMessage,
} from "@ekittens/contract";
import { gameError } from "@ekittens/contract";
import { type MatchState, apply, isOver, project, start, timeout } from "@ekittens/engine";
import { type Clock, type Rng, newId, seededRng } from "@ekittens/lib";
import type { Cancel, Scheduler } from "../../lib/scheduler.ts";
import type { Activity } from "../presence/service.ts";

export interface MatchResult {
  matchId: MatchId;
  players: readonly PlayerId[];
  winner: PlayerId;
  /** Finishing order, best first (winner, then reverse elimination order). */
  ranking: readonly PlayerId[];
}

export interface MatchesDeps {
  publish: (userId: PlayerId, message: ServerMessage) => void;
  scheduler: Scheduler;
  clock: Clock;
  seed: () => number;
  /** Whether a user currently has a live connection (used to abandon dead matches). */
  isOnline: (userId: PlayerId) => boolean;
  setStatus?: (userId: PlayerId, status: Activity) => void;
  onEnd?: (result: MatchResult) => void;
}

interface LiveMatch {
  id: MatchId;
  state: MatchState;
  players: readonly PlayerId[];
  rng: Rng;
  cancelTimer: Cancel | undefined;
}

const PHASE_DELAY_MS: Record<string, number> = {
  "waiting-for-action": 30_000,
  defusing: 12_000,
  "inserting-exploding-kitten": 12_000,
  "awaiting-favor": 15_000,
  "picking-from-discard": 15_000,
};

export class MatchesService {
  private readonly matches = new Map<MatchId, LiveMatch>();
  private readonly playerMatch = new Map<PlayerId, MatchId>();

  constructor(private readonly deps: MatchesDeps) {}

  create(playerIds: readonly PlayerId[]): MatchId {
    const id = newId<"MatchId">();
    const rng = seededRng(this.deps.seed());
    const match: LiveMatch = {
      id,
      state: start(playerIds, rng),
      players: [...playerIds],
      rng,
      cancelTimer: undefined,
    };
    this.matches.set(id, match);
    for (const player of playerIds) {
      this.playerMatch.set(player, id);
      this.deps.setStatus?.(player, "in-match");
      this.deps.publish(player, { type: "match:start", matchId: id });
    }
    this.broadcast(match, []);
    this.reschedule(match);
    return id;
  }

  submit(matchId: MatchId, userId: PlayerId, wire: CommandWire): void {
    const match = this.matches.get(matchId);
    if (!match) {
      this.deps.publish(userId, { type: "match:error", matchId, error: gameError("not-found") });
      return;
    }
    if (!match.players.includes(userId)) {
      this.deps.publish(userId, { type: "match:error", matchId, error: gameError("forbidden") });
      return;
    }
    const command = { ...wire, by: userId } as Command;
    const outcome = apply(match.state, command, { rng: match.rng, now: this.deps.clock.now() });
    if (!outcome.ok) {
      this.deps.publish(userId, { type: "match:error", matchId, error: outcome.error });
      return;
    }
    this.commit(match, outcome.value.state, outcome.value.events);
  }

  /** The match a user is currently playing in, if any. */
  matchOf(userId: PlayerId): MatchId | undefined {
    return this.playerMatch.get(userId);
  }

  /** Re-send a reconnecting user their current match view, if they are in one. */
  resume(userId: PlayerId): void {
    const matchId = this.playerMatch.get(userId);
    if (matchId === undefined) return;
    const match = this.matches.get(matchId);
    if (!match) return;
    this.deps.publish(userId, { type: "match:view", matchId, view: project(match.state, userId) });
  }

  /** A user's socket dropped, abandon their match if everyone has left. */
  onDisconnect(userId: PlayerId): void {
    const matchId = this.playerMatch.get(userId);
    if (matchId === undefined) return;
    const match = this.matches.get(matchId);
    if (!match) return;
    if (!match.players.some((player) => this.deps.isOnline(player))) this.release(match);
  }

  has(matchId: MatchId): boolean {
    return this.matches.has(matchId);
  }

  private broadcast(match: LiveMatch, events: readonly DomainEvent[]): void {
    for (const player of match.players) {
      this.deps.publish(player, {
        type: "match:view",
        matchId: match.id,
        view: project(match.state, player),
      });
    }
    for (const event of events) {
      if (event.type === "future-seen") {
        this.deps.publish(event.by, { type: "match:event", matchId: match.id, event });
      } else {
        for (const player of match.players) {
          this.deps.publish(player, { type: "match:event", matchId: match.id, event });
        }
      }
    }
  }

  private release(match: LiveMatch): void {
    match.cancelTimer?.();
    match.cancelTimer = undefined;
    this.matches.delete(match.id);
    for (const player of match.players) {
      if (this.playerMatch.get(player) === match.id) this.playerMatch.delete(player);
      this.deps.setStatus?.(player, "online");
    }
  }

  private reschedule(match: LiveMatch): void {
    match.cancelTimer?.();
    match.cancelTimer = undefined;
    const phase = match.state.phase;
    if (phase.tag === "game-over") return;
    const delay =
      phase.tag === "nope-window"
        ? Math.max(0, (phase.deadline as number) - this.deps.clock.now())
        : (PHASE_DELAY_MS[phase.tag] ?? 30_000);
    match.cancelTimer = this.deps.scheduler.schedule(delay, () => this.onTimeout(match.id));
  }

  private finish(match: LiveMatch): void {
    if (match.state.phase.tag !== "game-over") return;
    const winner = match.state.phase.winner;
    const ranking = [winner, ...[...match.state.out].reverse()];
    this.deps.onEnd?.({ matchId: match.id, players: match.players, winner, ranking });
    this.release(match);
  }

  private commit(match: LiveMatch, state: MatchState, events: readonly DomainEvent[]): void {
    match.state = state;
    this.broadcast(match, events);
    if (isOver(state)) {
      this.finish(match);
      return;
    }
    this.reschedule(match);
  }

  private onTimeout(matchId: MatchId): void {
    const match = this.matches.get(matchId);
    if (!match || isOver(match.state)) return;
    // Abandon a match in which every player has disconnected.
    if (!match.players.some((player) => this.deps.isOnline(player))) {
      this.release(match);
      return;
    }
    const outcome = timeout(match.state, { rng: match.rng, now: this.deps.clock.now() });
    if (outcome.ok) this.commit(match, outcome.value.state, outcome.value.events);
  }
}

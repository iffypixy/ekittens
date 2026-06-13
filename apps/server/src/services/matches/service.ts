import type {
  Command,
  CommandWire,
  DomainEvent,
  GameError,
  MatchId,
  MatchView,
  PlayerId,
} from "@ekittens/contract";
import { gameError } from "@ekittens/contract";
import { type MatchState, apply, isOver, project, start, timeout } from "@ekittens/engine";
import { type Clock, type Rng, type Timestamp, newId, seededRng } from "@ekittens/lib";
import type { Cancel, Scheduler } from "../../lib/scheduler/scheduler.ts";

export type ServerMessage =
  | { readonly type: "match:start"; readonly matchId: MatchId }
  | { readonly type: "match:view"; readonly matchId: MatchId; readonly view: MatchView }
  | { readonly type: "match:event"; readonly matchId: MatchId; readonly event: DomainEvent }
  | { readonly type: "match:error"; readonly matchId: MatchId; readonly error: GameError };

export interface MatchResult {
  readonly matchId: MatchId;
  readonly players: readonly PlayerId[];
  readonly winner: PlayerId;
  /** Finishing order, best first (winner, then reverse elimination order). */
  readonly ranking: readonly PlayerId[];
}

export interface MatchesDeps {
  readonly publish: (userId: PlayerId, message: ServerMessage) => void;
  readonly scheduler: Scheduler;
  readonly clock: Clock;
  readonly seed: () => number;
  readonly onEnd?: (result: MatchResult) => void;
}

interface LiveMatch {
  readonly id: MatchId;
  state: MatchState;
  readonly players: readonly PlayerId[];
  readonly spectators: Set<PlayerId>;
  readonly rng: Rng;
  cancelTimer: Cancel | undefined;
}

const PHASE_DELAY_MS: Record<string, number> = {
  "waiting-for-action": 30_000,
  defusing: 12_000,
  "inserting-exploding-kitten": 12_000,
  "awaiting-favor": 15_000,
  "picking-from-discard": 15_000,
};

export interface MatchesService {
  create(playerIds: readonly PlayerId[]): MatchId;
  submit(matchId: MatchId, userId: PlayerId, command: CommandWire): void;
  spectate(matchId: MatchId, userId: PlayerId): void;
  viewFor(matchId: MatchId, userId: PlayerId): MatchView | undefined;
  has(matchId: MatchId): boolean;
}

export const createMatchesService = (deps: MatchesDeps): MatchesService => {
  const matches = new Map<MatchId, LiveMatch>();

  const viewers = (match: LiveMatch): PlayerId[] => [...match.players, ...match.spectators];

  const broadcast = (match: LiveMatch, events: readonly DomainEvent[]): void => {
    for (const viewer of viewers(match)) {
      deps.publish(viewer, {
        type: "match:view",
        matchId: match.id,
        view: project(match.state, viewer),
      });
    }
    for (const event of events) {
      if (event.type === "future-seen") {
        deps.publish(event.by, { type: "match:event", matchId: match.id, event });
      } else {
        for (const viewer of viewers(match)) {
          deps.publish(viewer, { type: "match:event", matchId: match.id, event });
        }
      }
    }
  };

  const reschedule = (match: LiveMatch): void => {
    match.cancelTimer?.();
    match.cancelTimer = undefined;
    const phase = match.state.phase;
    if (phase.tag === "game-over") return;
    const delay =
      phase.tag === "nope-window"
        ? Math.max(0, (phase.deadline as number) - deps.clock.now())
        : (PHASE_DELAY_MS[phase.tag] ?? 30_000);
    match.cancelTimer = deps.scheduler.schedule(delay, () => onTimeout(match.id));
  };

  const finish = (match: LiveMatch): void => {
    if (match.state.phase.tag !== "game-over") return;
    const winner = match.state.phase.winner;
    const ranking = [winner, ...[...match.state.out].reverse()];
    deps.onEnd?.({ matchId: match.id, players: match.players, winner, ranking });
    match.cancelTimer?.();
    matches.delete(match.id);
  };

  const commit = (match: LiveMatch, state: MatchState, events: readonly DomainEvent[]): void => {
    match.state = state;
    broadcast(match, events);
    if (isOver(state)) {
      finish(match);
      return;
    }
    reschedule(match);
  };

  const onTimeout = (matchId: MatchId): void => {
    const match = matches.get(matchId);
    if (!match || isOver(match.state)) return;
    const outcome = timeout(match.state, { rng: match.rng, now: deps.clock.now() });
    if (outcome.ok) commit(match, outcome.value.state, outcome.value.events);
  };

  return {
    create(playerIds) {
      const id = newId<"MatchId">();
      const rng = seededRng(deps.seed());
      const match: LiveMatch = {
        id,
        state: start(playerIds, rng),
        players: [...playerIds],
        spectators: new Set(),
        rng,
        cancelTimer: undefined,
      };
      matches.set(id, match);
      for (const player of playerIds) deps.publish(player, { type: "match:start", matchId: id });
      broadcast(match, []);
      reschedule(match);
      return id;
    },

    submit(matchId, userId, wire) {
      const match = matches.get(matchId);
      if (!match) {
        deps.publish(userId, { type: "match:error", matchId, error: gameError("not-found") });
        return;
      }
      if (!match.players.includes(userId)) {
        deps.publish(userId, { type: "match:error", matchId, error: gameError("forbidden") });
        return;
      }
      const command = { ...wire, by: userId } as Command;
      const outcome = apply(match.state, command, { rng: match.rng, now: deps.clock.now() });
      if (!outcome.ok) {
        deps.publish(userId, { type: "match:error", matchId, error: outcome.error });
        return;
      }
      commit(match, outcome.value.state, outcome.value.events);
    },

    spectate(matchId, userId) {
      const match = matches.get(matchId);
      if (!match || match.players.includes(userId)) return;
      match.spectators.add(userId);
      deps.publish(userId, { type: "match:view", matchId, view: project(match.state, userId) });
    },

    viewFor(matchId, userId) {
      const match = matches.get(matchId);
      return match ? project(match.state, userId) : undefined;
    },

    has(matchId) {
      return matches.has(matchId);
    },
  };
};

/** The current epoch-ms timestamp helper for callers wiring a real clock. */
export type { Timestamp };

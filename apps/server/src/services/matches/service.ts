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

export interface MatchesService {
  create(playerIds: readonly PlayerId[]): MatchId;
  submit(matchId: MatchId, userId: PlayerId, command: CommandWire): void;
  /** The match a user is currently playing in, if any. */
  matchOf(userId: PlayerId): MatchId | undefined;
  /** Re-send a reconnecting user their current match view, if they are in one. */
  resume(userId: PlayerId): void;
  /** A user's socket dropped — abandon their match if everyone has left. */
  onDisconnect(userId: PlayerId): void;
  has(matchId: MatchId): boolean;
}

export const createMatchesService = (deps: MatchesDeps): MatchesService => {
  const matches = new Map<MatchId, LiveMatch>();
  const playerMatch = new Map<PlayerId, MatchId>();

  const broadcast = (match: LiveMatch, events: readonly DomainEvent[]): void => {
    for (const player of match.players) {
      deps.publish(player, {
        type: "match:view",
        matchId: match.id,
        view: project(match.state, player),
      });
    }
    for (const event of events) {
      if (event.type === "future-seen") {
        deps.publish(event.by, { type: "match:event", matchId: match.id, event });
      } else {
        for (const player of match.players) {
          deps.publish(player, { type: "match:event", matchId: match.id, event });
        }
      }
    }
  };

  const release = (match: LiveMatch): void => {
    match.cancelTimer?.();
    match.cancelTimer = undefined;
    matches.delete(match.id);
    for (const player of match.players) {
      if (playerMatch.get(player) === match.id) playerMatch.delete(player);
      deps.setStatus?.(player, "online");
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
    release(match);
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
    // Abandon a match in which every player has disconnected.
    if (!match.players.some((player) => deps.isOnline(player))) {
      release(match);
      return;
    }
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
        rng,
        cancelTimer: undefined,
      };
      matches.set(id, match);
      for (const player of playerIds) {
        playerMatch.set(player, id);
        deps.setStatus?.(player, "in-match");
        deps.publish(player, { type: "match:start", matchId: id });
      }
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

    matchOf(userId) {
      return playerMatch.get(userId);
    },

    resume(userId) {
      const matchId = playerMatch.get(userId);
      if (matchId === undefined) return;
      const match = matches.get(matchId);
      if (!match) return;
      deps.publish(userId, { type: "match:view", matchId, view: project(match.state, userId) });
    },

    onDisconnect(userId) {
      const matchId = playerMatch.get(userId);
      if (matchId === undefined) return;
      const match = matches.get(matchId);
      if (!match) return;
      if (!match.players.some((player) => deps.isOnline(player))) release(match);
    },

    has(matchId) {
      return matches.has(matchId);
    },
  };
};

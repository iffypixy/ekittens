import type { Card } from "./cards.ts";
import type { PlayerId } from "./ids.ts";

/** What a viewer is allowed to know about an opponent: counts, never contents. */
export interface OpponentView {
  readonly id: PlayerId;
  readonly handCount: number;
}

export type MatchViewPhase =
  | "waiting-for-action"
  | "nope-window"
  | "awaiting-favor"
  | "picking-from-discard"
  | "defusing"
  | "inserting-exploding-kitten"
  | "game-over";

/**
 * The single wire shape a client ever receives for a match — the authoritative
 * state projected for one viewer (player or spectator). Hidden information is
 * removed *here*, so devtools cheating is impossible by construction
 *. The server never serialises full `MatchState`.
 */
export interface MatchView {
  /** The viewer's own hand — absent for spectators (a viewer with no seat). */
  readonly self?: { readonly id: PlayerId; readonly hand: readonly Card[] };
  readonly opponents: readonly OpponentView[];
  readonly drawPileCount: number;
  readonly discardTop?: Card;
  readonly turn: PlayerId;
  readonly pendingTurns: number;
  readonly phase: MatchViewPhase;
  /** Eliminated players, in elimination order (a partial finishing order). */
  readonly out: readonly PlayerId[];
  readonly winner?: PlayerId;
  /** During `awaiting-favor`, the player who must give a card (public info). */
  readonly awaitingFrom?: PlayerId;
  /** Deadline (epoch ms) for the active timed phase (nope-window / turn), if any. */
  readonly deadline?: number;
}

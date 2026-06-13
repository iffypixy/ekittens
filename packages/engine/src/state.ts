import type { Card, CardName, PlayerId } from "@ekittens/contract";
import type { Timestamp } from "@ekittens/lib";

export interface Player {
  readonly id: PlayerId;
  readonly hand: readonly Card[];
}

/**
 * An action that has been played and is now pending resolution inside the
 * nope-window. If it survives (even parity) its effect is applied; if noped
 * (odd parity) it is discarded.
 */
export type PendingAction =
  | { readonly kind: "attack" }
  | { readonly kind: "skip" }
  | { readonly kind: "shuffle" }
  | { readonly kind: "see-the-future" }
  | { readonly kind: "favor"; readonly target: PlayerId }
  | { readonly kind: "combo-pair"; readonly target: PlayerId }
  | { readonly kind: "combo-triple"; readonly target: PlayerId; readonly named: CardName }
  | { readonly kind: "combo-five" };

/**
 * The match phase, a discriminated union where each variant carries only the
 * fields valid in that phase, so illegal states are unrepresentable
 *.
 */
export type Phase =
  | { readonly tag: "waiting-for-action" }
  | {
      readonly tag: "nope-window";
      readonly pending: PendingAction;
      readonly actor: PlayerId;
      /** Even = action stands, odd = currently noped. */
      readonly parity: number;
      readonly eligible: readonly PlayerId[];
      readonly responded: readonly PlayerId[];
      readonly deadline: Timestamp;
    }
  | { readonly tag: "awaiting-favor"; readonly from: PlayerId; readonly to: PlayerId }
  | { readonly tag: "picking-from-discard"; readonly actor: PlayerId }
  | { readonly tag: "defusing"; readonly actor: PlayerId; readonly kitten: Card }
  | { readonly tag: "inserting-exploding-kitten"; readonly actor: PlayerId; readonly kitten: Card }
  | { readonly tag: "game-over"; readonly winner: PlayerId };

/** The full authoritative match state. Never serialised to a client (see `project`). */
export interface MatchState {
  /** Fixed seat order. Eliminated players remain in the array; aliveness is `out`. */
  readonly players: readonly Player[];
  /** Eliminated players, in elimination order, a (reverse) finishing order. */
  readonly out: readonly PlayerId[];
  /** The draw pile; index 0 is the top (next to be drawn). */
  readonly drawPile: readonly Card[];
  /** The discard pile; the last element is the visible top. */
  readonly discard: readonly Card[];
  /** Whose turn it is. */
  readonly turn: PlayerId;
  /** Turns the active player must still take (≥1; >1 after an Attack). */
  readonly pendingTurns: number;
  readonly phase: Phase;
}

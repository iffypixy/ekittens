import type { CardId, CardName } from "../cards/cards.ts";
import type { PlayerId } from "../ids/ids.ts";

/**
 * Game commands — the inputs to the engine reducer. Every command carries `by`
 * (the issuing player) so the engine can authorize it. These are the domain
 * shapes; the WS boundary parses untrusted wire payloads (zod) into them.
 */

export interface DrawCard {
  readonly type: "draw-card";
  readonly by: PlayerId;
}

export interface PlayCard {
  readonly type: "play-card";
  readonly by: PlayerId;
  /** The card being played (for a cat-combo, the first of the group). */
  readonly card: CardId;
  /** Extra matching cat cards forming a combo (2 = pair, 3 = three-of-a-kind, 5 = distinct). */
  readonly combo?: readonly CardId[];
  /** Target player — for Favor and the cat-combo steals. */
  readonly target?: PlayerId;
  /** Named card — for the three-of-a-kind combo. */
  readonly named?: CardName;
}

export interface PlayDefuse {
  readonly type: "play-defuse";
  readonly by: PlayerId;
  readonly card: CardId;
}

export interface InsertExplodingKitten {
  readonly type: "insert-exploding-kitten";
  readonly by: PlayerId;
  /** Index in the draw pile to slip the kitten back into (0 = top). */
  readonly position: number;
}

export interface PlayNope {
  readonly type: "nope";
  readonly by: PlayerId;
  readonly card: CardId;
}

export interface PassNope {
  readonly type: "pass-nope";
  readonly by: PlayerId;
}

/** The target's response to a Favor — choosing which card to give. */
export interface GiveCard {
  readonly type: "give-card";
  readonly by: PlayerId;
  readonly card: CardId;
}

/** The five-distinct combo — the actor takes a chosen card from the discard pile. */
export interface PickFromDiscard {
  readonly type: "pick-from-discard";
  readonly by: PlayerId;
  readonly card: CardId;
}

export type Command =
  | DrawCard
  | PlayCard
  | PlayDefuse
  | InsertExplodingKitten
  | PlayNope
  | PassNope
  | GiveCard
  | PickFromDiscard;

export type CommandType = Command["type"];

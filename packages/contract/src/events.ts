import type { Card, CardName } from "./cards.ts";
import type { PlayerId } from "./ids.ts";

/**
 * Domain events emitted by the engine alongside each new state. They are
 * **animation / notification hints only**, the authoritative truth is always
 * the projected `MatchView`. `future-seen` is private to its `by` player.
 */
export type DomainEvent =
  | { readonly type: "card-drawn"; readonly by: PlayerId }
  | { readonly type: "card-played"; readonly by: PlayerId; readonly card: CardName }
  | { readonly type: "exploded"; readonly player: PlayerId }
  | { readonly type: "defused"; readonly by: PlayerId }
  | { readonly type: "noped"; readonly by: PlayerId; readonly cancelled: boolean }
  | { readonly type: "favor"; readonly from: PlayerId; readonly to: PlayerId }
  | { readonly type: "stolen"; readonly from: PlayerId; readonly to: PlayerId }
  | { readonly type: "future-seen"; readonly by: PlayerId; readonly cards: readonly Card[] }
  | { readonly type: "turn-changed"; readonly turn: PlayerId }
  | { readonly type: "player-out"; readonly player: PlayerId }
  | { readonly type: "match-ended"; readonly winner: PlayerId };

export type DomainEventType = DomainEvent["type"];

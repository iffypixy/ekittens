import type { Card, CardId, DomainEvent, GameError, PlayerId } from "@ekittens/contract";
import { type Result, err, ok } from "@ekittens/lib";
import type { MatchState, Player } from "../state/state.ts";

/** The reducer's return type: a new state plus emitted events, or a game error. */
export type Outcome = Result<
  { readonly state: MatchState; readonly events: readonly DomainEvent[] },
  GameError
>;

export const succeed = (state: MatchState, events: readonly DomainEvent[] = []): Outcome =>
  ok({ state, events });

export const fail = (error: GameError): Outcome => err(error);

export const isAlive = (state: MatchState, id: PlayerId): boolean => !state.out.includes(id);

export const findPlayer = (state: MatchState, id: PlayerId): Player | undefined =>
  state.players.find((player) => player.id === id);

export const cardInHand = (player: Player, card: CardId): Card | undefined =>
  player.hand.find((held) => held.id === card);

/** The next alive player after `from`, walking the fixed seat order. */
export const nextTurn = (state: MatchState, from: PlayerId): PlayerId => {
  const ids = state.players.map((player) => player.id);
  const start = ids.indexOf(from);
  for (let step = 1; step <= ids.length; step++) {
    const candidate = ids[(start + step) % ids.length] as PlayerId;
    if (isAlive(state, candidate)) return candidate;
  }
  // Unreachable while the game is live (≥1 alive); the caller guards game-over.
  return from;
};

/** Replace a player's hand, returning a new players array. */
export const withHand = (
  players: readonly Player[],
  id: PlayerId,
  hand: readonly Card[],
): readonly Player[] => players.map((player) => (player.id === id ? { ...player, hand } : player));

export const removeFromHand = (
  hand: readonly Card[],
  cards: readonly CardId[],
): readonly Card[] => {
  const remove = new Set(cards);
  return hand.filter((held) => !remove.has(held.id));
};

/**
 * End the active player's current turn. With pending turns remaining (an Attack
 * stack) the same player keeps the turn; otherwise it passes to the next alive
 * player. Returns the new `turn`/`pendingTurns` plus a turn-changed event when
 * the seat changes.
 */
export const endTurn = (
  state: MatchState,
): {
  readonly turn: PlayerId;
  readonly pendingTurns: number;
  readonly events: readonly DomainEvent[];
} => {
  if (state.pendingTurns > 1) {
    return { turn: state.turn, pendingTurns: state.pendingTurns - 1, events: [] };
  }
  const turn = nextTurn(state, state.turn);
  return { turn, pendingTurns: 1, events: [{ type: "turn-changed", turn }] };
};

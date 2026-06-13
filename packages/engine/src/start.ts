import type { PlayerId } from "@ekittens/contract";
import { type Rng, invariant } from "@ekittens/lib";
import { MAX_PLAYERS, MIN_PLAYERS, deal } from "./deck.ts";
import type { MatchState } from "./state.ts";

/** Create the initial state for a Base-game match. Deterministic given `rng`. */
export const start = (playerIds: readonly PlayerId[], rng: Rng): MatchState => {
  invariant(
    playerIds.length >= MIN_PLAYERS && playerIds.length <= MAX_PLAYERS,
    `a match needs ${MIN_PLAYERS} to ${MAX_PLAYERS} players`,
  );
  invariant(new Set(playerIds).size === playerIds.length, "player ids must be unique");

  const { hands, drawPile } = deal(playerIds.length, rng);
  const players = playerIds.map((id, index) => ({ id, hand: hands[index] ?? [] }));
  const first = playerIds[0];
  invariant(first !== undefined, "a match needs at least one player");

  return {
    players,
    out: [],
    drawPile,
    discard: [],
    turn: first,
    pendingTurns: 1,
    phase: { tag: "waiting-for-action" },
  };
};

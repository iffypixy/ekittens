import type { MatchView, PlayerId } from "@ekittens/contract";
import type { MatchState } from "./state.ts";

/**
 * Project the authoritative state into the redacted view a single viewer is
 * allowed to see. A `viewer` of `undefined` is a spectator (no seat): they get
 * only public information — counts and sizes, never any hand or deck order. This
 * is the sole wire shape; full `MatchState` is never serialised
 * (ENGINEERING_RULES #12).
 */
export const project = (state: MatchState, viewer: PlayerId | undefined): MatchView => {
  const self =
    viewer !== undefined ? state.players.find((player) => player.id === viewer) : undefined;

  const opponents = state.players
    .filter((player) => player.id !== viewer)
    .map((player) => ({ id: player.id, handCount: player.hand.length }));

  const discardTop = state.discard[state.discard.length - 1];
  const winner = state.phase.tag === "game-over" ? state.phase.winner : undefined;
  const awaitingFrom = state.phase.tag === "awaiting-favor" ? state.phase.from : undefined;
  const deadline = state.phase.tag === "nope-window" ? (state.phase.deadline as number) : undefined;

  return {
    self: self ? { id: self.id, hand: self.hand } : undefined,
    opponents,
    drawPileCount: state.drawPile.length,
    discardTop,
    turn: state.turn,
    pendingTurns: state.pendingTurns,
    phase: state.phase.tag,
    out: state.out,
    winner,
    awaitingFrom,
    deadline,
  };
};

import type { Card, CardId, CardName, PlayerId } from "@ekittens/contract";
import { describe, expect, it } from "vitest";
import { project } from "./project.ts";
import type { MatchState } from "./state.ts";

const pid = (value: string): PlayerId => value as PlayerId;
const card = (name: CardName, id: string): Card => ({ id: id as CardId, name });

const state: MatchState = {
  players: [
    { id: pid("A"), hand: [card("skip", "a1"), card("nope", "a2")] },
    { id: pid("B"), hand: [card("attack", "b1")] },
    { id: pid("C"), hand: [] },
  ],
  out: [pid("C")],
  drawPile: [card("exploding-kitten", "k1"), card("favor", "k2")],
  discard: [card("shuffle", "d1")],
  turn: pid("A"),
  pendingTurns: 1,
  phase: { tag: "waiting-for-action" },
};

describe("what each viewer can see of a match", () => {
  it("shows a player their own hand in full", () => {
    const view = project(state, pid("A"));
    expect(view.self?.id).toBe(pid("A"));
    expect(view.self?.hand.map((card) => card.id)).toEqual(["a1", "a2"]);
  });

  it("reveals only counts for opponents, never their cards", () => {
    const view = project(state, pid("A"));
    expect(view.opponents).toEqual([
      { id: pid("B"), handCount: 1 },
      { id: pid("C"), handCount: 0 },
    ]);
    // The serialised view contains no opponent card ids.
    expect(JSON.stringify(view)).not.toContain("b1");
  });

  it("never leaks the draw pile order, only its size", () => {
    const view = project(state, pid("A"));
    expect(view.drawPileCount).toBe(2);
    expect(JSON.stringify(view)).not.toContain("k1"); // the kitten's position is hidden
  });

  it("shows the discard top and public match facts", () => {
    const view = project(state, pid("A"));
    expect(view.discardTop?.id).toBe("d1");
    expect(view.turn).toBe(pid("A"));
    expect(view.out).toEqual([pid("C")]);
  });

  it("gives a spectator only public info, no hand at all", () => {
    const view = project(state, undefined);
    expect(view.self).toBeUndefined();
    expect(view.opponents).toHaveLength(3);
    expect(JSON.stringify(view)).not.toMatch(/a1|a2|b1|k1/); // no hidden cards anywhere
  });
});

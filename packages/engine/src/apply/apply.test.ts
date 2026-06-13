import type { Card, CardId, CardName, Command, PlayerId } from "@ekittens/contract";
import { type Timestamp, seededRng } from "@ekittens/lib";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { start } from "../start/start.ts";
import type { MatchState } from "../state/state.ts";
import { type Deps, apply, timeout } from "./apply.ts";

const NOW = 0 as Timestamp;
const pid = (value: string): PlayerId => value as PlayerId;
const card = (name: CardName, id: string): Card => ({ id: id as CardId, name });

const must = <T>(value: T | undefined, message = "unexpected nullish"): T => {
  if (value === undefined) throw new Error(message);
  return value;
};

// ── invariants ────────────────────────────────────────────────────────────

const heldKitten = (state: MatchState): readonly Card[] =>
  state.phase.tag === "defusing" || state.phase.tag === "inserting-exploding-kitten"
    ? [state.phase.kitten]
    : [];

const allCards = (state: MatchState): readonly Card[] => [
  ...state.players.flatMap((player) => player.hand),
  ...state.drawPile,
  ...state.discard,
  ...heldKitten(state),
];

const aliveIds = (state: MatchState): PlayerId[] =>
  state.players.map((player) => player.id).filter((id) => !state.out.includes(id));

const checkInvariants = (state: MatchState, total: number): void => {
  const cards = allCards(state);
  expect(cards).toHaveLength(total); // card conservation
  expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length); // no duplication
  expect(state.pendingTurns).toBeGreaterThanOrEqual(1);
  expect(aliveIds(state).length).toBeGreaterThanOrEqual(1);
  if (state.phase.tag !== "game-over") {
    expect(aliveIds(state)).toContain(state.turn); // turn is always an alive player
  }
};

// ── a random *legal* driver, biased toward drawing so games terminate ───────

const chooseCommand = (
  state: MatchState,
  rng: { float(): number; int(n: number): number },
): Command | undefined => {
  const phase = state.phase;
  switch (phase.tag) {
    case "waiting-for-action": {
      const actor = must(state.players.find((p) => p.id === state.turn));
      if (state.drawPile.length === 0) {
        const any = actor.hand.find((c) => c.name === "skip" || c.name === "attack");
        return any ? { type: "play-card", by: state.turn, card: any.id } : undefined;
      }
      const skip = actor.hand.find((c) => c.name === "skip");
      if (skip && rng.float() < 0.15) return { type: "play-card", by: state.turn, card: skip.id };
      return { type: "draw-card", by: state.turn };
    }
    case "nope-window": {
      const responder = must(phase.eligible.find((id) => !phase.responded.includes(id)));
      const player = must(state.players.find((p) => p.id === responder));
      const nope = player.hand.find((c) => c.name === "nope");
      if (nope && rng.float() < 0.1) return { type: "nope", by: responder, card: nope.id };
      return { type: "pass-nope", by: responder };
    }
    case "awaiting-favor": {
      const giver = must(state.players.find((p) => p.id === phase.from));
      const chosen = giver.hand[rng.int(giver.hand.length)];
      return chosen ? { type: "give-card", by: phase.from, card: chosen.id } : undefined;
    }
    case "picking-from-discard": {
      const chosen = state.discard[rng.int(state.discard.length)];
      return chosen ? { type: "pick-from-discard", by: phase.actor, card: chosen.id } : undefined;
    }
    case "defusing": {
      const actor = must(state.players.find((p) => p.id === phase.actor));
      const defuse = must(actor.hand.find((c) => c.name === "defuse"));
      return { type: "play-defuse", by: phase.actor, card: defuse.id };
    }
    case "inserting-exploding-kitten":
      return {
        type: "insert-exploding-kitten",
        by: phase.actor,
        position: rng.int(state.drawPile.length + 1),
      };
    case "game-over":
      return undefined;
    default:
      return undefined;
  }
};

describe("engine / apply — properties", () => {
  it("preserves all invariants across a full random game and terminates", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 0, max: 2 ** 31 }),
        (players, seed) => {
          const rng = seededRng(seed);
          const ids = Array.from({ length: players }, (_, i) => pid(`P${i}`));
          let state = start(ids, rng);
          const total = 51 + players;
          checkInvariants(state, total);

          for (let step = 0; step < 5000; step++) {
            if (state.phase.tag === "game-over") break;
            const command = chooseCommand(state, rng);
            if (command === undefined) break;
            const outcome = apply(state, command, { rng, now: NOW });
            expect(outcome.ok).toBe(true);
            if (!outcome.ok) break;
            state = outcome.value.state;
            checkInvariants(state, total);
          }

          expect(state.phase.tag).toBe("game-over");
        },
      ),
      { numRuns: 60 },
    );
  });
});

// ── deterministic example scenarios ─────────────────────────────────────────

const twoPlayer = (overrides: Partial<MatchState>): MatchState => ({
  players: [
    { id: pid("A"), hand: [] },
    { id: pid("B"), hand: [] },
  ],
  out: [],
  drawPile: [],
  discard: [],
  turn: pid("A"),
  pendingTurns: 1,
  phase: { tag: "waiting-for-action" },
  ...overrides,
});

const deps: Deps = { rng: seededRng(1), now: NOW };

describe("engine / apply — scenarios", () => {
  it("Skip ends the turn without drawing", () => {
    const state = twoPlayer({
      players: [
        { id: pid("A"), hand: [card("skip", "s1")] },
        { id: pid("B"), hand: [] },
      ],
      drawPile: [card("attack", "d1")],
    });
    const out = apply(state, { type: "play-card", by: pid("A"), card: "s1" as CardId }, deps);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value.state.turn).toBe(pid("B"));
    expect(out.value.state.drawPile).toHaveLength(1); // did not draw
  });

  it("Attack passes the turn and gives the next player two turns", () => {
    const state = twoPlayer({
      players: [
        { id: pid("A"), hand: [card("attack", "a1")] },
        { id: pid("B"), hand: [] },
      ],
    });
    const out = apply(state, { type: "play-card", by: pid("A"), card: "a1" as CardId }, deps);
    expect(out.ok && out.value.state.turn).toBe(pid("B"));
    expect(out.ok && out.value.state.pendingTurns).toBe(2);
  });

  it("Favor makes the target hand a card to the actor", () => {
    const state = twoPlayer({
      players: [
        { id: pid("A"), hand: [card("favor", "f1")] },
        { id: pid("B"), hand: [card("tacocat", "t1")] },
      ],
    });
    const played = apply(
      state,
      { type: "play-card", by: pid("A"), card: "f1" as CardId, target: pid("B") },
      deps,
    );
    expect(played.ok).toBe(true);
    if (!played.ok) return;
    expect(played.value.state.phase.tag).toBe("awaiting-favor");
    const given = apply(
      played.value.state,
      { type: "give-card", by: pid("B"), card: "t1" as CardId },
      deps,
    );
    expect(given.ok).toBe(true);
    if (!given.ok) return;
    const a = must(given.value.state.players.find((p) => p.id === pid("A")));
    expect(a.hand.map((c) => c.id)).toContain("t1");
    expect(given.value.state.turn).toBe(pid("A")); // actor's turn continues
  });

  it("Nope cancels an action; the actor keeps the turn", () => {
    const state = twoPlayer({
      players: [
        { id: pid("A"), hand: [card("skip", "s1")] },
        { id: pid("B"), hand: [card("nope", "n1")] },
      ],
      drawPile: [card("attack", "d1")],
    });
    const played = apply(state, { type: "play-card", by: pid("A"), card: "s1" as CardId }, deps);
    expect(played.ok).toBe(true);
    if (!played.ok) return;
    expect(played.value.state.phase.tag).toBe("nope-window");
    const noped = apply(
      played.value.state,
      { type: "nope", by: pid("B"), card: "n1" as CardId },
      deps,
    );
    expect(noped.ok).toBe(true);
    if (!noped.ok) return;
    expect(noped.value.state.phase.tag).toBe("waiting-for-action");
    expect(noped.value.state.turn).toBe(pid("A")); // skip was cancelled, still A's turn
  });

  it("drawing an Exploding Kitten with no Defuse eliminates and ends a 2-player game", () => {
    const state = twoPlayer({
      players: [
        { id: pid("A"), hand: [] },
        { id: pid("B"), hand: [] },
      ],
      drawPile: [card("exploding-kitten", "k1"), card("attack", "d1")],
    });
    const out = apply(state, { type: "draw-card", by: pid("A") }, deps);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value.state.phase).toEqual({ tag: "game-over", winner: pid("B") });
    expect(out.value.state.out).toEqual([pid("A")]);
  });

  it("Defuse + reinsert survives the kitten and passes the turn", () => {
    const state = twoPlayer({
      players: [
        { id: pid("A"), hand: [card("defuse", "df1")] },
        { id: pid("B"), hand: [] },
      ],
      drawPile: [card("exploding-kitten", "k1")],
    });
    const drew = apply(state, { type: "draw-card", by: pid("A") }, deps);
    expect(drew.ok).toBe(true);
    if (!drew.ok) return;
    expect(drew.value.state.phase.tag).toBe("defusing");
    const defused = apply(
      drew.value.state,
      { type: "play-defuse", by: pid("A"), card: "df1" as CardId },
      deps,
    );
    expect(defused.ok).toBe(true);
    if (!defused.ok) return;
    expect(defused.value.state.phase.tag).toBe("inserting-exploding-kitten");
    const inserted = apply(
      defused.value.state,
      { type: "insert-exploding-kitten", by: pid("A"), position: 0 },
      deps,
    );
    expect(inserted.ok).toBe(true);
    if (!inserted.ok) return;
    expect(inserted.value.state.drawPile[0]?.name).toBe("exploding-kitten");
    expect(inserted.value.state.turn).toBe(pid("B")); // turn passed
    expect(aliveIds(inserted.value.state)).toHaveLength(2); // nobody out
  });

  it("rejects acting out of turn", () => {
    const state = twoPlayer({
      players: [
        { id: pid("A"), hand: [] },
        { id: pid("B"), hand: [] },
      ],
      drawPile: [card("attack", "d1")],
    });
    const out = apply(state, { type: "draw-card", by: pid("B") }, deps);
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error.code).toBe("not-your-turn");
  });

  it("timeout auto-draws for an AFK active player", () => {
    const state = twoPlayer({
      players: [
        { id: pid("A"), hand: [] },
        { id: pid("B"), hand: [] },
      ],
      drawPile: [card("attack", "d1"), card("skip", "d2")],
    });
    const out = timeout(state, deps);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value.state.turn).toBe(pid("B")); // A drew, turn passed
  });

  it("a cat-card pair steals a random card from the target", () => {
    const state = twoPlayer({
      players: [
        { id: pid("A"), hand: [card("tacocat", "t1"), card("tacocat", "t2")] },
        { id: pid("B"), hand: [card("skip", "x1")] },
      ],
    });
    const out = apply(
      state,
      {
        type: "play-card",
        by: pid("A"),
        card: "t1" as CardId,
        combo: ["t2" as CardId],
        target: pid("B"),
      },
      deps,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const a = must(out.value.state.players.find((p) => p.id === pid("A")));
    const b = must(out.value.state.players.find((p) => p.id === pid("B")));
    expect(a.hand.map((c) => c.id)).toContain("x1");
    expect(b.hand).toHaveLength(0);
    expect(out.value.state.turn).toBe(pid("A"));
  });

  it("a five-distinct combo lets the actor take a card from the discard", () => {
    const state = twoPlayer({
      players: [
        {
          id: pid("A"),
          hand: [
            card("tacocat", "c1"),
            card("cattermelon", "c2"),
            card("beard-cat", "c3"),
            card("hairy-potato-cat", "c4"),
            card("rainbow-ralphing-cat", "c5"),
          ],
        },
        { id: pid("B"), hand: [] },
      ],
      discard: [card("attack", "old1")],
    });
    const played = apply(
      state,
      {
        type: "play-card",
        by: pid("A"),
        card: "c1" as CardId,
        combo: ["c2", "c3", "c4", "c5"] as CardId[],
      },
      deps,
    );
    expect(played.ok).toBe(true);
    if (!played.ok) return;
    expect(played.value.state.phase.tag).toBe("picking-from-discard");
    const picked = apply(
      played.value.state,
      { type: "pick-from-discard", by: pid("A"), card: "old1" as CardId },
      deps,
    );
    expect(picked.ok).toBe(true);
    if (!picked.ok) return;
    const a = must(picked.value.state.players.find((p) => p.id === pid("A")));
    expect(a.hand.map((c) => c.id)).toContain("old1");
  });
});

import type { Card, CardId, CardName, Command, DomainEvent, PlayerId } from "@ekittens/contract";
import { type Timestamp, seededRng } from "@ekittens/lib";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type Deps, apply, timeout } from "./apply.ts";
import { project } from "./project.ts";
import { start } from "./start.ts";
import type { MatchState } from "./state.ts";

const NOW = 0 as Timestamp;
const pid = (value: string): PlayerId => value as PlayerId;
const card = (name: CardName, id: string): Card => ({ id: id as CardId, name });

const must = <T>(value: T | undefined, message = "unexpected nullish"): T => {
  if (value === undefined) throw new Error(message);
  return value;
};

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
  expect(cards).toHaveLength(total); // card conservation — none created or destroyed
  expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length); // no duplication
  expect(state.pendingTurns).toBeGreaterThanOrEqual(1);
  expect(aliveIds(state).length).toBeGreaterThanOrEqual(1);
  if (state.phase.tag !== "game-over") {
    expect(aliveIds(state)).toContain(state.turn); // the turn is always a live player
  }
};

// A referee that picks any *legal* move for the current position (drives the game;
// makes no assertions). Biased toward drawing so games terminate.
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
    default:
      return undefined;
  }
};

describe("engine / apply — properties", () => {
  it("preserves all invariants across a full random game and always terminates", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 0, max: 2 ** 31 }),
        (players, seed) => {
          const rng = seededRng(seed);
          const ids = Array.from({ length: players }, (_, index) => pid(`P${index}`));
          let state = start(ids, rng);
          const total = 51 + players; // total cards in play for a Base game of N players
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

          expect(state.phase.tag).toBe("game-over"); // a winner always emerges
        },
      ),
      { numRuns: 60 },
    );
  });
});

//
// Each scenario sets up a valid position, issues commands through the public
// `apply`, and then asserts ONLY what a participant can actually observe — the
// projected `MatchView` (`project`) and the emitted events. Hidden effects (the
// deck order) are verified by their observable consequence, never by peeking.

const deps: Deps = { rng: seededRng(1), now: NOW };

/** A valid 2-player position; tests override the hands / deck they care about. */
const position = (overrides: Partial<MatchState>): MatchState => ({
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

/** What `player` sees right now — the only window the tests look through. */
const seenBy = (state: MatchState, player: string) => project(state, pid(player));

/** Apply a command that the rules say must succeed; return its `{ state, events }`. */
const act = (
  state: MatchState,
  command: Command,
): { state: MatchState; events: readonly DomainEvent[] } => {
  const outcome = apply(state, command, deps);
  if (!outcome.ok) throw new Error(`expected the move to be legal, got ${outcome.error.code}`);
  return outcome.value;
};

describe("engine / apply — observable behaviour", () => {
  it("Skip ends your turn without drawing", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [card("skip", "s1")] },
        { id: pid("B"), hand: [] },
      ],
      drawPile: [card("attack", "d1")],
    });
    const { state: after } = act(state, { type: "play-card", by: pid("A"), card: "s1" as CardId });
    const view = seenBy(after, "A");
    expect(view.turn).toBe(pid("B")); // turn passed
    expect(view.drawPileCount).toBe(1); // never drew
  });

  it("Attack ends your turn and forces the next player to take two turns", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [card("attack", "a1")] },
        { id: pid("B"), hand: [] },
      ],
    });
    const { state: after } = act(state, { type: "play-card", by: pid("A"), card: "a1" as CardId });
    const view = seenBy(after, "B");
    expect(view.turn).toBe(pid("B"));
    expect(view.pendingTurns).toBe(2);
  });

  it("Favor: the target chooses which card to give", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [card("favor", "f1")] },
        { id: pid("B"), hand: [card("tacocat", "t1"), card("skip", "k1")] },
      ],
    });
    const played = act(state, {
      type: "play-card",
      by: pid("A"),
      card: "f1" as CardId,
      target: pid("B"),
    });
    expect(seenBy(played.state, "B").phase).toBe("awaiting-favor");
    expect(seenBy(played.state, "B").awaitingFrom).toBe(pid("B"));

    const given = act(played.state, { type: "give-card", by: pid("B"), card: "k1" as CardId });
    const a = seenBy(given.state, "A");
    expect(a.self?.hand.map((c) => c.name)).toContain("skip"); // received the chosen card
    expect(a.turn).toBe(pid("A")); // the actor's turn continues
  });

  it("Nope cancels an action and the actor keeps their turn", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [card("skip", "s1")] },
        { id: pid("B"), hand: [card("nope", "n1")] },
      ],
      drawPile: [card("attack", "d1")],
    });
    const played = act(state, { type: "play-card", by: pid("A"), card: "s1" as CardId });
    expect(seenBy(played.state, "B").phase).toBe("nope-window");

    const noped = act(played.state, { type: "nope", by: pid("B"), card: "n1" as CardId });
    const view = seenBy(noped.state, "A");
    expect(view.phase).toBe("waiting-for-action");
    expect(view.turn).toBe(pid("A")); // the skip was cancelled — still A's turn
  });

  it("A Nope can be Yup'd: a counter-nope lets the action go through", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [card("skip", "s1"), card("nope", "an")] },
        { id: pid("B"), hand: [card("nope", "bn")] },
      ],
      drawPile: [card("attack", "d1")],
    });
    const played = act(state, { type: "play-card", by: pid("A"), card: "s1" as CardId });
    const bNoped = act(played.state, { type: "nope", by: pid("B"), card: "bn" as CardId });
    expect(seenBy(bNoped.state, "A").phase).toBe("nope-window"); // still contested

    const aYup = act(bNoped.state, { type: "nope", by: pid("A"), card: "an" as CardId });
    expect(seenBy(aYup.state, "A").turn).toBe(pid("B")); // two nopes cancel → skip stands → turn passes
  });

  it("Drawing an Exploding Kitten with no Defuse eliminates you and ends a 2-player game", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [] },
        { id: pid("B"), hand: [] },
      ],
      drawPile: [card("exploding-kitten", "k1"), card("attack", "d1")],
    });
    const { state: after } = act(state, { type: "draw-card", by: pid("A") });
    const view = seenBy(after, "B");
    expect(view.phase).toBe("game-over");
    expect(view.winner).toBe(pid("B"));
    expect(view.out).toContain(pid("A"));
  });

  it("Defuse + reinsert: you survive, and the kitten is genuinely back in the deck", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [card("defuse", "df1")] },
        { id: pid("B"), hand: [] },
      ],
      drawPile: [card("exploding-kitten", "k1")],
    });
    const drew = act(state, { type: "draw-card", by: pid("A") });
    expect(seenBy(drew.state, "A").phase).toBe("defusing");

    const defused = act(drew.state, { type: "play-defuse", by: pid("A"), card: "df1" as CardId });
    expect(seenBy(defused.state, "A").phase).toBe("inserting-exploding-kitten");

    const inserted = act(defused.state, {
      type: "insert-exploding-kitten",
      by: pid("A"),
      position: 0,
    });
    expect(seenBy(inserted.state, "B").out).not.toContain(pid("A")); // A survived
    expect(seenBy(inserted.state, "B").turn).toBe(pid("B")); // turn passed

    // Consequence proves the kitten was reinserted: B draws it next and (no defuse) explodes.
    const bDraws = act(inserted.state, { type: "draw-card", by: pid("B") });
    expect(seenBy(bDraws.state, "A").phase).toBe("game-over");
    expect(seenBy(bDraws.state, "A").winner).toBe(pid("A"));
  });

  it("See the Future reveals the top three cards to the actor only", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [card("see-the-future", "sf1")] },
        { id: pid("B"), hand: [] },
      ],
      drawPile: [
        card("attack", "c1"),
        card("skip", "c2"),
        card("favor", "c3"),
        card("shuffle", "c4"),
      ],
    });
    const { state: after, events } = act(state, {
      type: "play-card",
      by: pid("A"),
      card: "sf1" as CardId,
    });

    const peek = events.find((event) => event.type === "future-seen");
    expect(peek).toBeDefined();
    if (peek?.type !== "future-seen") return;
    expect(peek.by).toBe(pid("A")); // private to the actor
    expect(peek.cards.map((c) => c.name)).toEqual(["attack", "skip", "favor"]); // the top three

    expect(seenBy(after, "A").turn).toBe(pid("A")); // does not end the turn
    expect(seenBy(after, "A").drawPileCount).toBe(4); // deck untouched
  });

  it("A cat-card pair steals a card from the target", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [card("tacocat", "t1"), card("tacocat", "t2")] },
        { id: pid("B"), hand: [card("skip", "x1")] },
      ],
    });
    const { state: after } = act(state, {
      type: "play-card",
      by: pid("A"),
      card: "t1" as CardId,
      combo: ["t2" as CardId],
      target: pid("B"),
    });
    const a = seenBy(after, "A");
    expect(a.self?.hand).toHaveLength(1); // played two cats, stole one
    expect(a.opponents.find((opponent) => opponent.id === pid("B"))?.handCount).toBe(0); // B lost a card
    expect(a.turn).toBe(pid("A"));
  });

  it("A five-distinct combo lets the actor take a chosen card from the discard", () => {
    const state = position({
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
    const played = act(state, {
      type: "play-card",
      by: pid("A"),
      card: "c1" as CardId,
      combo: ["c2", "c3", "c4", "c5"] as CardId[],
    });
    expect(seenBy(played.state, "A").phase).toBe("picking-from-discard");

    const picked = act(played.state, {
      type: "pick-from-discard",
      by: pid("A"),
      card: "old1" as CardId,
    });
    expect(seenBy(picked.state, "A").self?.hand.map((c) => c.name)).toContain("attack");
  });

  it("rejects acting out of turn", () => {
    const state = position({ drawPile: [card("attack", "d1")] });
    const outcome = apply(state, { type: "draw-card", by: pid("B") }, deps);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error.code).toBe("not-your-turn");
  });

  it("rejects a matching non-cat 'pair' — only cat cards form pairs", () => {
    const state = position({
      players: [
        { id: pid("A"), hand: [card("skip", "s1"), card("skip", "s2")] },
        { id: pid("B"), hand: [card("tacocat", "t1")] },
      ],
    });
    const outcome = apply(
      state,
      {
        type: "play-card",
        by: pid("A"),
        card: "s1" as CardId,
        combo: ["s2" as CardId],
        target: pid("B"),
      },
      deps,
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error.code).toBe("invalid-combo");
  });

  it("times out an AFK active player by auto-drawing for them", () => {
    const state = position({ drawPile: [card("attack", "d1"), card("skip", "d2")] });
    const outcome = timeout(state, deps);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(seenBy(outcome.value.state, "B").turn).toBe(pid("B")); // A drew, turn passed
  });
});

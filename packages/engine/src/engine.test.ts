import {type Result, expect as unwrap, isErr, isOk} from "@ekittens/lib/result";
import {describe, expect, it} from "vitest";

import {
  type Card,
  type CardId,
  type CardInstance,
  type Command,
  type Event,
  type GameConfig,
  type GameError,
  type GameId,
  type GameState,
  type Phase,
  type PlayerId,
  checkInvariants,
  createGame,
  defaultRecipe,
  reduce,
  redact,
} from "./index";

function pid(s: string): PlayerId {
  return s as PlayerId;
}
function gid(s: string): GameId {
  return s as GameId;
}
function cid(s: string): CardId {
  return s as CardId;
}
function ci(name: Card, id: string): CardInstance {
  return {id: cid(id), name};
}
function players(n: number): PlayerId[] {
  return Array.from({length: n}, (_, i) => pid(`p${i}`));
}
function recipe(n: number, seed: number): GameConfig {
  return defaultRecipe(players(n), seed);
}
function newGame(n: number, seed: number): GameState {
  return unwrap(createGame(recipe(n, seed), gid("g")), "createGame");
}

/** Build an exact scenario, bypassing the deal. */
function makeGame(spec: {
  players: ReadonlyArray<{id: string; hand: CardInstance[]; marks?: string[]}>;
  drawPile?: CardInstance[];
  active?: string;
  direction?: "forward" | "backward";
  pendingTurns?: number;
  phase?: Phase;
}): GameState {
  const ids = spec.players.length >= 2 ? spec.players.map((p) => pid(p.id)) : [pid("p0"), pid("p1")];

  // Tally the cards actually present so the conservation invariant holds.
  const phaseCards: CardInstance[] = [];
  const phase = spec.phase;
  if (phase && "card" in phase) phaseCards.push(phase.card);
  if (phase && "cards" in phase) phaseCards.push(...phase.cards);
  const tally: Partial<Record<Card, number>> = {};
  for (const card of [...spec.players.flatMap((p) => p.hand), ...(spec.drawPile ?? []), ...phaseCards])
    tally[card.name] = (tally[card.name] ?? 0) + 1;

  const state = {
    id: "test",
    config: {...defaultRecipe(ids, 0), cards: tally},
    players: spec.players.map((p) => ({id: pid(p.id), hand: p.hand, marks: (p.marks ?? []).map(cid)})),
    defeated: [],
    spectators: [],
    drawPile: spec.drawPile ?? [],
    discardPile: [],
    removed: [],
    turn: {
      active: pid(spec.active ?? spec.players[0]!.id),
      direction: spec.direction ?? "forward",
      pendingTurns: spec.pendingTurns ?? 1,
    },
    phase: spec.phase ?? {kind: "awaiting-action"},
    rng: {seed: 0},
    outcome: {status: "ongoing"},
  };
  return state as unknown as GameState;
}

function handOf(game: GameState, player: string): readonly CardInstance[] {
  return game.players.find((p) => p.id === pid(player))?.hand ?? [];
}
function run(game: GameState, command: Command): {state: GameState; events: readonly Event[]} {
  const result = reduce(game, command);
  if (!isOk(result)) throw new Error(`expected ok, got ${JSON.stringify(result.error)}`);
  return result.value;
}
function fail(result: Result<unknown, GameError>): GameError {
  if (isOk(result)) throw new Error("expected an error");
  return result.error;
}
function names(cards: readonly {name: string}[]): string[] {
  return cards.map((c) => c.name);
}

describe("createGame", () => {
  it("is deterministic for the same recipe + seed", () => {
    expect(newGame(4, 7)).toEqual(newGame(4, 7));
  });

  it("varies with the seed", () => {
    expect(newGame(4, 1).drawPile).not.toEqual(newGame(4, 2).drawPile);
  });

  it("deals every player a full hand with the right number of defuses", () => {
    const game = newGame(5, 3);
    for (const player of game.players) {
      expect(player.hand).toHaveLength(8);
      expect(player.hand.filter((c) => c.name === "defuse")).toHaveLength(1);
    }
  });

  it("conserves cards: unique ids, nothing duplicated", () => {
    const game = newGame(4, 9);
    const ids = [...game.players.flatMap((p) => p.hand), ...game.drawPile].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps exploding kittens out of opening hands", () => {
    const game = newGame(4, 11);
    for (const player of game.players)
      expect(player.hand.some((c) => c.name === "exploding-kitten")).toBe(false);
    expect(game.drawPile.filter((c) => c.name === "exploding-kitten")).toHaveLength(3);
  });

  it("starts player 0 on a fresh awaiting-action turn", () => {
    const game = newGame(3, 5);
    expect(game.turn).toEqual({active: game.players[0]!.id, direction: "forward", pendingTurns: 1});
    expect(game.phase.kind).toBe("awaiting-action");
    expect(game.outcome.status).toBe("ongoing");
  });

  it("rejects too few exploding kittens", () => {
    const bad: GameConfig = {...recipe(4, 0), cards: {...recipe(4, 0).cards, "exploding-kitten": 0}};
    expect(isErr(createGame(bad, gid("g")))).toBe(true);
  });

  it("rejects more than one imploding kitten", () => {
    const bad: GameConfig = {...recipe(4, 0), cards: {...recipe(4, 0).cards, "imploding-kitten-closed": 2}};
    expect(isErr(createGame(bad, gid("g")))).toBe(true);
  });

  it("rejects a recipe that cannot deal full hands", () => {
    expect(isErr(createGame({...recipe(2, 0), handSize: 40}, gid("g")))).toBe(true);
  });
});

describe("drawing", () => {
  it("a normal card goes to hand and ends the turn", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}],
      drawPile: [ci("skip", "s"), ci("attack", "a")],
    });
    const {state, events} = run(game, {type: "draw-card", by: pid("p0")});
    expect(names(handOf(state, "p0"))).toEqual(["skip"]);
    expect(state.turn.active).toBe(pid("p1"));
    expect(events.some((e) => e.type === "card-drawn")).toBe(true);
  });

  it("an exploding kitten with no defuse eliminates and ends a 2-player game", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}],
      drawPile: [ci("exploding-kitten", "ek")],
    });
    const {state} = run(game, {type: "draw-card", by: pid("p0")});
    expect(state.outcome.status).toBe("ended");
    if (state.outcome.status === "ended") {
      expect(state.outcome.winner).toBe(pid("p1"));
      expect(state.outcome.finishOrder).toEqual([pid("p1"), pid("p0")]);
    }
  });

  it("an exploding kitten with a defuse opens the defuse → insert flow", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("defuse", "d0")]}, {id: "p1", hand: []}],
      drawPile: [ci("exploding-kitten", "ek"), ci("skip", "s")],
    });
    const afterDraw = run(game, {type: "draw-card", by: pid("p0")});
    expect(afterDraw.state.phase.kind).toBe("defusing");

    const afterDefuse = run(afterDraw.state, {type: "provide-defuse", by: pid("p0"), card: cid("d0")});
    expect(afterDefuse.state.phase.kind).toBe("inserting-exploding-kitten");
    expect(handOf(afterDefuse.state, "p0")).toHaveLength(0);

    const afterInsert = run(afterDefuse.state, {type: "insert-exploding-kitten", by: pid("p0"), position: 1});
    expect(afterInsert.state.phase.kind).toBe("awaiting-action");
    expect(names(afterInsert.state.drawPile)).toEqual(["skip", "exploding-kitten"]);
    expect(afterInsert.state.turn.active).toBe(pid("p1"));
  });

  it("the streaking kitten shields against an exploding kitten", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("streaking-kitten", "sk")]}, {id: "p1", hand: []}],
      drawPile: [ci("exploding-kitten", "ek")],
    });
    const {state} = run(game, {type: "draw-card", by: pid("p0")});
    expect(state.phase.kind).toBe("awaiting-action");
    expect(names(handOf(state, "p0")).sort()).toEqual(["exploding-kitten", "streaking-kitten"]);
    expect(state.turn.active).toBe(pid("p1"));
  });

  it("the imploding kitten is drawn closed, reinserted open, and then lethal", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}],
      drawPile: [ci("imploding-kitten-closed", "ik")],
    });
    const afterDraw = run(game, {type: "draw-card", by: pid("p0")});
    expect(afterDraw.state.phase.kind).toBe("inserting-imploding-kitten");

    const afterInsert = run(afterDraw.state, {type: "insert-imploding-kitten", by: pid("p0"), position: 0});
    expect(names(afterInsert.state.drawPile)).toEqual(["imploding-kitten-open"]);
    expect(afterInsert.state.turn.active).toBe(pid("p1"));

    const afterImplode = run(afterInsert.state, {type: "draw-card", by: pid("p1")});
    expect(afterImplode.state.outcome.status).toBe("ended");
    if (afterImplode.state.outcome.status === "ended")
      expect(afterImplode.state.outcome.winner).toBe(pid("p0"));
  });

  it("draw-from-the-bottom takes the bottom card", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("draw-from-the-bottom", "b")]}, {id: "p1", hand: []}],
      drawPile: [ci("skip", "top"), ci("attack", "bottom")],
    });
    const {state} = run(game, {type: "play-card", by: pid("p0"), card: cid("b")});
    expect(names(handOf(state, "p0"))).toEqual(["attack"]);
    expect(state.turn.active).toBe(pid("p1"));
  });
});

describe("turn control", () => {
  function attacker(): GameState {
    return makeGame({
      players: [
        {id: "p0", hand: [ci("attack", "a0")]},
        {id: "p1", hand: [ci("attack", "a1")]},
        {id: "p2", hand: []},
      ],
      drawPile: [ci("skip", "s")],
    });
  }

  it("attack passes the turn and stacks 2 → 4", () => {
    const r1 = run(attacker(), {type: "play-card", by: pid("p0"), card: cid("a0")});
    expect(r1.state.turn.active).toBe(pid("p1"));
    expect(r1.state.turn.pendingTurns).toBe(2);

    const r2 = run(r1.state, {type: "play-card", by: pid("p1"), card: cid("a1")});
    expect(r2.state.turn.active).toBe(pid("p2"));
    expect(r2.state.turn.pendingTurns).toBe(4);
  });

  it("skip ends one turn; under attack it only burns one", () => {
    const single = makeGame({players: [{id: "p0", hand: [ci("skip", "s")]}, {id: "p1", hand: []}]});
    expect(run(single, {type: "play-card", by: pid("p0"), card: cid("s")}).state.turn.active).toBe(pid("p1"));

    const attacked = makeGame({
      players: [{id: "p0", hand: [ci("skip", "s")]}, {id: "p1", hand: []}],
      pendingTurns: 2,
    });
    const result = run(attacked, {type: "play-card", by: pid("p0"), card: cid("s")});
    expect(result.state.turn.active).toBe(pid("p0"));
    expect(result.state.turn.pendingTurns).toBe(1);
  });

  it("super-skip ends all turns at once", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("super-skip", "ss")]}, {id: "p1", hand: []}],
      pendingTurns: 3,
    });
    const result = run(game, {type: "play-card", by: pid("p0"), card: cid("ss")});
    expect(result.state.turn.active).toBe(pid("p1"));
    expect(result.state.turn.pendingTurns).toBe(1);
  });

  it("reverse flips direction and skips (3 players)", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("reverse", "r")]}, {id: "p1", hand: []}, {id: "p2", hand: []}],
    });
    const result = run(game, {type: "play-card", by: pid("p0"), card: cid("r")});
    expect(result.state.turn.direction).toBe("backward");
    expect(result.state.turn.active).toBe(pid("p2"));
  });

  it("reverse acts as a plain skip with 2 players", () => {
    const game = makeGame({players: [{id: "p0", hand: [ci("reverse", "r")]}, {id: "p1", hand: []}]});
    expect(run(game, {type: "play-card", by: pid("p0"), card: cid("r")}).state.turn.active).toBe(pid("p1"));
  });

  it("personal-attack gives you 3 turns and keeps the turn", () => {
    const game = makeGame({players: [{id: "p0", hand: [ci("personal-attack", "pa")]}, {id: "p1", hand: []}]});
    const result = run(game, {type: "play-card", by: pid("p0"), card: cid("pa")});
    expect(result.state.turn.active).toBe(pid("p0"));
    expect(result.state.turn.pendingTurns).toBe(3);
  });

  it("targeted-attack sends the turns to the chosen player", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("targeted-attack", "ta")]}, {id: "p1", hand: []}, {id: "p2", hand: []}],
    });
    const result = run(game, {type: "play-card", by: pid("p0"), card: cid("ta"), target: pid("p2")});
    expect(result.state.turn.active).toBe(pid("p2"));
    expect(result.state.turn.pendingTurns).toBe(2);
  });
});

describe("deck manipulation & peeks", () => {
  it("see-the-future reveals the top cards without changing state", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("see-the-future-3x", "f")]}, {id: "p1", hand: []}],
      drawPile: [ci("skip", "a"), ci("attack", "b"), ci("shuffle", "c"), ci("bury", "d")],
    });
    const {state, events} = run(game, {type: "play-card", by: pid("p0"), card: cid("f")});
    const revealed = events.find((e) => e.type === "future-revealed");
    expect(revealed && revealed.type === "future-revealed" && names(revealed.cards)).toEqual([
      "skip",
      "attack",
      "shuffle",
    ]);
    expect(state.turn.active).toBe(pid("p0"));
    expect(state.drawPile).toHaveLength(4);
  });

  it("alter-the-future reorders the top three", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("alter-the-future-3x", "alt")]}, {id: "p1", hand: []}],
      drawPile: [ci("skip", "x"), ci("attack", "y"), ci("shuffle", "z"), ci("bury", "w")],
    });
    const afterPlay = run(game, {type: "play-card", by: pid("p0"), card: cid("alt")});
    expect(afterPlay.state.phase.kind).toBe("altering-future");

    const afterOrder = run(afterPlay.state, {
      type: "submit-future-order",
      by: pid("p0"),
      order: [cid("z"), cid("y"), cid("x")],
    });
    expect(names(afterOrder.state.drawPile)).toEqual(["shuffle", "attack", "skip", "bury"]);
    expect(afterOrder.state.turn.active).toBe(pid("p0"));
  });

  it("catomic-bomb stacks every exploding kitten on top and ends the turn", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("catomic-bomb", "cb")]}, {id: "p1", hand: []}],
      drawPile: [ci("skip", "s"), ci("exploding-kitten", "e1"), ci("attack", "a"), ci("exploding-kitten", "e2")],
    });
    const {state} = run(game, {type: "play-card", by: pid("p0"), card: cid("cb")});
    expect(names(state.drawPile.slice(0, 2))).toEqual(["exploding-kitten", "exploding-kitten"]);
    expect(state.drawPile).toHaveLength(4);
    expect(state.turn.active).toBe(pid("p1"));
  });

  it("swap-top-and-bottom exchanges the ends", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("swap-top-and-bottom", "sw")]}, {id: "p1", hand: []}],
      drawPile: [ci("skip", "top"), ci("attack", "mid"), ci("bury", "bot")],
    });
    const {state} = run(game, {type: "play-card", by: pid("p0"), card: cid("sw")});
    expect(names(state.drawPile)).toEqual(["bury", "attack", "skip"]);
    expect(state.turn.active).toBe(pid("p0"));
  });

  it("bury reinserts the top card at the chosen spot and ends the turn", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("bury", "b")]}, {id: "p1", hand: []}],
      drawPile: [ci("skip", "a"), ci("attack", "b2"), ci("shuffle", "c")],
    });
    const afterPlay = run(game, {type: "play-card", by: pid("p0"), card: cid("b")});
    expect(afterPlay.state.phase.kind).toBe("burying-card");

    const afterBury = run(afterPlay.state, {type: "bury-card", by: pid("p0"), position: 2});
    expect(names(afterBury.state.drawPile)).toEqual(["attack", "shuffle", "skip"]);
    expect(afterBury.state.turn.active).toBe(pid("p1"));
  });

  it("mark exposes one of the target's cards to everyone", () => {
    const game = makeGame({
      players: [
        {id: "p0", hand: [ci("mark", "m")]},
        {id: "p1", hand: [ci("skip", "s1"), ci("attack", "a1")]},
      ],
    });
    const {state} = run(game, {type: "play-card", by: pid("p0"), card: cid("m"), target: pid("p1")});
    const target = state.players.find((p) => p.id === pid("p1"))!;
    expect(target.marks).toHaveLength(1);

    const targetPublic = redact(state, pid("p0")).players.find((p) => p.id === pid("p1"))!;
    expect(targetPublic.revealed).toHaveLength(1);
    expect(target.marks[0]).toBe(targetPublic.revealed[0]!.id);
  });
});

describe("leaving the game", () => {
  it("timeout eliminates the active player", () => {
    const game = makeGame({players: [{id: "p0", hand: []}, {id: "p1", hand: []}]});
    const {state} = run(game, {type: "timeout"});
    expect(state.outcome.status).toBe("ended");
    if (state.outcome.status === "ended") expect(state.outcome.winner).toBe(pid("p1"));
  });

  it("timeout while defusing detonates the kitten, tracked in removed", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("defuse", "d")]}, {id: "p1", hand: []}, {id: "p2", hand: []}],
      phase: {kind: "defusing", card: ci("exploding-kitten", "ek")},
    });
    const {state, events} = run(game, {type: "timeout"});
    expect(events.some((e) => e.type === "player-exploded")).toBe(true);
    expect(state.defeated[0]?.reason).toBe("exploded-by-ek");
    expect(state.removed.some((c) => c.id === cid("ek"))).toBe(true);
    expect(isOk(checkInvariants(state))).toBe(true);
  });

  it("a normal explosion moves the kitten to removed (conservation holds)", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}, {id: "p2", hand: []}],
      drawPile: [ci("exploding-kitten", "ek")],
    });
    const {state} = run(game, {type: "draw-card", by: pid("p0")});
    expect(state.removed.some((c) => c.id === cid("ek"))).toBe(true);
    expect(isOk(checkInvariants(state))).toBe(true);
  });

  it("conceding mid-phase returns the held card to the deck (conservation)", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}, {id: "p2", hand: []}],
      phase: {kind: "inserting-exploding-kitten", card: ci("exploding-kitten", "ek")},
      drawPile: [ci("skip", "s")],
    });
    const {state} = run(game, {type: "concede", by: pid("p0")});
    expect(state.defeated[0]?.reason).toBe("left-game");
    expect(state.drawPile.some((c) => c.id === cid("ek"))).toBe(true);
    expect(isOk(checkInvariants(state))).toBe(true);
  });

  it("concede removes a player as left-game and can end the game", () => {
    const game = makeGame({players: [{id: "p0", hand: []}, {id: "p1", hand: []}]});
    const {state} = run(game, {type: "concede", by: pid("p0")});
    expect(state.outcome.status).toBe("ended");
    if (state.outcome.status === "ended") expect(state.outcome.winner).toBe(pid("p1"));
  });
});

describe("rejected commands", () => {
  function scenario(): GameState {
    return makeGame({players: [{id: "p0", hand: [ci("defuse", "d"), ci("skip", "s")]}, {id: "p1", hand: []}]});
  }

  it("rejects acting out of turn", () => {
    expect(fail(reduce(scenario(), {type: "draw-card", by: pid("p1")})).type).toBe("not-your-turn");
  });

  it("rejects playing a card you do not hold", () => {
    expect(fail(reduce(scenario(), {type: "play-card", by: pid("p0"), card: cid("ghost")})).type).toBe(
      "card-not-in-hand",
    );
  });

  it("rejects playing an unplayable card (defuse)", () => {
    expect(fail(reduce(scenario(), {type: "play-card", by: pid("p0"), card: cid("d")})).type).toBe(
      "card-not-playable",
    );
  });

  it("rejects a resolve command in the wrong phase", () => {
    expect(fail(reduce(scenario(), {type: "insert-exploding-kitten", by: pid("p0"), position: 0})).type).toBe(
      "wrong-phase",
    );
  });

  it("rejects drawing in a follow-up phase", () => {
    const inPhase = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}],
      phase: {kind: "inserting-imploding-kitten", card: ci("imploding-kitten-open", "ik")},
    });
    expect(fail(reduce(inPhase, {type: "draw-card", by: pid("p0")})).type).toBe("wrong-phase");
  });

  it("rejects an out-of-range insert position", () => {
    const inPhase = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}],
      phase: {kind: "inserting-imploding-kitten", card: ci("imploding-kitten-open", "ik")},
      drawPile: [ci("skip", "s")],
    });
    expect(fail(reduce(inPhase, {type: "insert-imploding-kitten", by: pid("p0"), position: 5})).type).toBe(
      "invalid-position",
    );
  });

  it("rejects a future order that is not a permutation of the revealed cards", () => {
    const inPhase = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}],
      phase: {kind: "altering-future", cards: [ci("skip", "a"), ci("attack", "b")]},
    });
    expect(
      fail(reduce(inPhase, {type: "submit-future-order", by: pid("p0"), order: [cid("a"), cid("ghost")]})).type,
    ).toBe("invalid-future-order");
  });

  it("rejects targeting yourself", () => {
    const ta = makeGame({players: [{id: "p0", hand: [ci("targeted-attack", "ta")]}, {id: "p1", hand: []}]});
    expect(
      fail(reduce(ta, {type: "play-card", by: pid("p0"), card: cid("ta"), target: pid("p0")})).type,
    ).toBe("illegal-target");
  });

  it("rejects targeted-attack with no target", () => {
    const ta = makeGame({players: [{id: "p0", hand: [ci("targeted-attack", "ta")]}, {id: "p1", hand: []}]});
    expect(fail(reduce(ta, {type: "play-card", by: pid("p0"), card: cid("ta")})).type).toBe("missing-target");
  });

  it("rejects marking an empty hand", () => {
    const mark = makeGame({players: [{id: "p0", hand: [ci("mark", "m")]}, {id: "p1", hand: []}]});
    expect(
      fail(reduce(mark, {type: "play-card", by: pid("p0"), card: cid("m"), target: pid("p1")})).type,
    ).toBe("illegal-target");
  });

  it("rejects a concede from someone not in the game", () => {
    expect(fail(reduce(scenario(), {type: "concede", by: pid("ghost")})).type).toBe("illegal-target");
  });

  it("rejects any command once the game is over", () => {
    const ended = makeGame({players: [{id: "p0", hand: []}, {id: "p1", hand: []}]});
    const over = run(ended, {type: "concede", by: pid("p0")}).state;
    expect(isErr(reduce(over, {type: "draw-card", by: pid("p1")}))).toBe(true);
  });

  it("does not mutate the input game", () => {
    const before = scenario();
    const snapshot = JSON.stringify(before);
    reduce(before, {type: "play-card", by: pid("p0"), card: cid("s")});
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe("redaction", () => {
  it("hides other hands but shows counts; spectators see no hand", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("skip", "a"), ci("attack", "b")]}, {id: "p1", hand: [ci("bury", "c")]}],
    });
    const fromP0 = redact(game, pid("p0"));
    expect(fromP0.self?.hand).toHaveLength(2);
    expect(fromP0.players.find((p) => p.id === pid("p1"))!.handCount).toBe(1);
    expect(fromP0.players.find((p) => p.id === pid("p1"))!.revealed).toHaveLength(0);
    expect(redact(game, null).self).toBeNull();
  });

  it("shows an alter peek only to the active player", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}],
      phase: {kind: "altering-future", cards: [ci("skip", "x")]},
    });
    expect(redact(game, pid("p0")).peek).toHaveLength(1);
    expect(redact(game, pid("p1")).peek).toBeNull();
  });

  it("shows a share peek to the active and the shared player only", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}, {id: "p2", hand: []}],
      phase: {kind: "sharing-future", cards: [ci("skip", "x")], sharedWith: pid("p1")},
    });
    expect(redact(game, pid("p0")).peek).toHaveLength(1);
    expect(redact(game, pid("p1")).peek).toHaveLength(1);
    expect(redact(game, pid("p2")).peek).toBeNull();
  });
});

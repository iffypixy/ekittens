import {type Result, err, ok} from "@ekittens/lib/result";
import {int, rng, shuffle} from "@ekittens/lib/rng";
import {match} from "ts-pattern";
import type {z} from "zod";

import {
  type Card,
  type CardId,
  type CardInstance,
  type Command,
  type DefeatReason,
  type Event,
  type GameConfig,
  type GameError,
  type GameId,
  type GameState,
  type GameStateSchema,
  type Outcome,
  type Phase,
  type PhaseKind,
  type Player,
  type PlayerId,
  type TurnState,
  CardSchema,
  isPlayable,
  peekDepth,
} from "./model";

function countOf(config: GameConfig, name: Card): number {
  return config.cards[name] ?? 0;
}

/** Kittens are not dealt; they are shuffled into the deck after the deal. */
function isSetAside(name: Card): boolean {
  return name === "exploding-kitten" || name === "imploding-kitten-closed";
}

/** A reasonable default deck scaled to the player count. The counts are tunable. */
export function defaultRecipe(players: readonly PlayerId[], seed: number): GameConfig {
  const n = players.length;
  return {
    players: [...players],
    seed,
    handSize: 8,
    defusesPerPlayer: 1,
    cards: {
      "exploding-kitten": Math.max(1, n - 1),
      "imploding-kitten-closed": 1,
      "imploding-kitten-open": 0,
      defuse: n + 2,
      "streaking-kitten": 2,
      attack: 4,
      "targeted-attack": 3,
      "personal-attack": 2,
      skip: 4,
      "super-skip": 2,
      reverse: 4,
      shuffle: 4,
      "swap-top-and-bottom": 2,
      "catomic-bomb": 1,
      "see-the-future-3x": 5,
      "see-the-future-5x": 2,
      "alter-the-future-3x": 4,
      "share-the-future-3x": 3,
      "draw-from-the-bottom": 4,
      mark: 2,
      bury: 4,
    },
  };
}

function validateConfig(config: GameConfig): GameError | null {
  const players = config.players.length;
  if (players < 2 || players > 10)
    return {type: "invalid-config", reason: `need 2 to 10 players, got ${players}`};

  const ek = countOf(config, "exploding-kitten");
  if (ek < 1 || ek > players - 1)
    return {type: "invalid-config", reason: `exploding kittens must be 1..${players - 1}, got ${ek}`};

  if (countOf(config, "imploding-kitten-closed") > 1)
    return {type: "invalid-config", reason: "at most one imploding kitten"};
  if (countOf(config, "imploding-kitten-open") !== 0)
    return {type: "invalid-config", reason: "the imploding kitten must start closed"};

  if (config.defusesPerPlayer > config.handSize)
    return {type: "invalid-config", reason: "defusesPerPlayer exceeds handSize"};

  const totalDefuse = countOf(config, "defuse");
  if (totalDefuse < config.defusesPerPlayer * players)
    return {type: "invalid-config", reason: "not enough defuse cards to deal every hand"};

  const dealablePool = CardSchema.options.reduce(
    (sum, name) => (name === "defuse" || isSetAside(name) ? sum : sum + countOf(config, name)),
    0,
  );
  if (dealablePool < players * (config.handSize - config.defusesPerPlayer))
    return {type: "invalid-config", reason: "not enough cards to deal every hand"};

  return null;
}

/** Builds and deals a Game. Deterministic: the same recipe and seed always produce the same Game. */
export function createGame(config: GameConfig, id: GameId): Result<GameState, GameError> {
  const invalid = validateConfig(config);
  if (invalid) return err(invalid);

  let counter = 0;
  const mint = (name: Card): CardInstance => ({id: `card-${counter++}` as CardId, name});

  const exploding: CardInstance[] = [];
  const setAsideImploding: CardInstance[] = [];
  const defuses: CardInstance[] = [];
  const pool: CardInstance[] = [];

  for (const name of CardSchema.options) {
    for (let i = 0; i < countOf(config, name); i++) {
      const card = mint(name);
      if (name === "exploding-kitten") exploding.push(card);
      else if (name === "imploding-kitten-closed") setAsideImploding.push(card);
      else if (name === "defuse") defuses.push(card);
      else pool.push(card);
    }
  }

  let rngState = rng(config.seed);

  const playerCount = config.players.length;
  const handDefuseCount = config.defusesPerPlayer * playerCount;
  const handDefuses = defuses.slice(0, handDefuseCount);
  const pileDefuses = defuses.slice(handDefuseCount);

  const shuffledPool = shuffle(pool, rngState);
  rngState = shuffledPool.state;
  const poolCards = [...shuffledPool.items];

  const extraPerHand = config.handSize - config.defusesPerPlayer;
  const players: Player[] = config.players.map((playerId, idx) => {
    const myDefuses = handDefuses.slice(
      idx * config.defusesPerPlayer,
      (idx + 1) * config.defusesPerPlayer,
    );
    const myExtra = poolCards.splice(0, extraPerHand);
    return {id: playerId, hand: [...myDefuses, ...myExtra], marks: []};
  });

  const drawBase = [...poolCards, ...pileDefuses, ...exploding, ...setAsideImploding];
  const shuffledDraw = shuffle(drawBase, rngState);
  rngState = shuffledDraw.state;

  const first = config.players[0];
  if (!first) return err({type: "invalid-config", reason: "no players"});

  return ok({
    id,
    config,
    players,
    defeated: [],
    spectators: [],
    drawPile: shuffledDraw.items,
    discardPile: [],
    removed: [],
    turn: {active: first, direction: "forward", pendingTurns: 1},
    phase: {kind: "awaiting-action"},
    rng: rngState,
    outcome: {status: "ongoing"},
  });
}

/** Another player as seen by a viewer: a hand count plus any marked cards. */
export type PublicPlayer = {
  readonly id: PlayerId;
  readonly handCount: number;
  readonly revealed: readonly CardInstance[];
};

export type PublicDefeated = {
  readonly id: PlayerId;
  readonly reason: DefeatReason;
};

/** What one viewer is allowed to see. */
export type PlayerView = {
  readonly id: GameId;
  /** The viewer's own hand; null for a spectator. */
  readonly self: Player | null;
  readonly players: readonly PublicPlayer[];
  readonly defeated: readonly PublicDefeated[];
  readonly spectators: readonly PlayerId[];
  readonly drawCount: number;
  readonly discardPile: readonly CardInstance[];
  readonly turn: TurnState;
  readonly phase: PhaseKind;
  /** Top cards a peek has revealed to this viewer. */
  readonly peek: readonly CardInstance[] | null;
  readonly outcome: Outcome;
};

function peekFor(game: GameState, viewer: PlayerId | null): readonly CardInstance[] | null {
  if (viewer === null) return null;
  return match(game.phase)
    .with({kind: "altering-future"}, (phase) => (viewer === game.turn.active ? phase.cards : null))
    .with({kind: "sharing-future"}, (phase) =>
      viewer === game.turn.active || viewer === phase.sharedWith ? phase.cards : null,
    )
    .otherwise(() => null);
}

/** What `viewer` is allowed to see; a null viewer is a spectator. */
export function redact(game: GameState, viewer: PlayerId | null): PlayerView {
  const self = viewer ? (game.players.find((p) => p.id === viewer) ?? null) : null;
  return {
    id: game.id,
    self,
    players: game.players.map((p) => ({
      id: p.id,
      handCount: p.hand.length,
      revealed: p.hand.filter((c) => p.marks.includes(c.id)),
    })),
    defeated: game.defeated.map((p) => ({id: p.id, reason: p.reason})),
    spectators: game.spectators,
    drawCount: game.drawPile.length,
    discardPile: game.discardPile,
    turn: game.turn,
    phase: game.phase.kind,
    peek: peekFor(game, viewer),
    outcome: game.outcome,
  };
}

/** What the current phase asks the active player to do, if anything. */
export type Resolve =
  | {readonly kind: "none"}
  | {readonly kind: "defuse"; readonly defuses: readonly CardId[]}
  | {readonly kind: "insert"; readonly maxPosition: number}
  | {readonly kind: "reorder"; readonly cards: readonly CardInstance[]}
  | {readonly kind: "bury"; readonly maxPosition: number};

/** The moves on offer to a player now. Not an enumerated command list; reduce decides legality. */
export type AvailableActions = {
  readonly canConcede: boolean;
  readonly draw: boolean;
  readonly playable: readonly CardId[];
  readonly resolve: Resolve;
};

const NO_ACTIONS: AvailableActions = {canConcede: false, draw: false, playable: [], resolve: {kind: "none"}};

export function availableActions(game: GameState, player: PlayerId): AvailableActions {
  if (game.outcome.status === "ended") return NO_ACTIONS;
  const me = game.players.find((p) => p.id === player);
  if (!me) return NO_ACTIONS;
  if (game.turn.active !== player) return {...NO_ACTIONS, canConcede: true};

  return match(game.phase)
    .with({kind: "awaiting-action"}, (): AvailableActions => ({
      canConcede: true,
      draw: true,
      playable: me.hand.filter((c) => isPlayable(c.name)).map((c) => c.id),
      resolve: {kind: "none"},
    }))
    .with({kind: "defusing"}, (): AvailableActions => ({
      canConcede: true,
      draw: false,
      playable: [],
      resolve: {kind: "defuse", defuses: me.hand.filter((c) => c.name === "defuse").map((c) => c.id)},
    }))
    .with({kind: "inserting-exploding-kitten"}, {kind: "inserting-imploding-kitten"}, (): AvailableActions => ({
      canConcede: true,
      draw: false,
      playable: [],
      resolve: {kind: "insert", maxPosition: game.drawPile.length},
    }))
    .with({kind: "altering-future"}, {kind: "sharing-future"}, (phase): AvailableActions => ({
      canConcede: true,
      draw: false,
      playable: [],
      resolve: {kind: "reorder", cards: phase.cards},
    }))
    .with({kind: "burying-card"}, (): AvailableActions => ({
      canConcede: true,
      draw: false,
      playable: [],
      resolve: {kind: "bury", maxPosition: game.drawPile.length},
    }))
    .exhaustive();
}

/** Returns the list of broken invariants instead of throwing, so tests can report them. */
export function checkInvariants(game: GameState): Result<void, readonly string[]> {
  const violations: string[] = [];

  const seen = new Set<string>();
  const everyCard: CardInstance[] = [
    ...game.players.flatMap((p) => p.hand),
    ...game.defeated.flatMap((p) => p.hand),
    ...game.drawPile,
    ...game.discardPile,
    ...game.removed,
  ];
  const phase = game.phase;
  if ("card" in phase) everyCard.push(phase.card);
  if ("cards" in phase) everyCard.push(...phase.cards);
  for (const card of everyCard) {
    if (seen.has(card.id)) violations.push(`duplicate card id ${card.id}`);
    seen.add(card.id);
  }

  const minted = Object.values(game.config.cards).reduce((a, b) => a + b, 0);
  if (everyCard.length !== minted)
    violations.push(`card count ${everyCard.length} differs from minted ${minted}`);

  const implodings = everyCard.filter(
    (c) => c.name === "imploding-kitten-open" || c.name === "imploding-kitten-closed",
  ).length;
  if (implodings > 1) violations.push(`expected at most one imploding kitten, found ${implodings}`);

  for (const p of game.players) {
    const handIds = new Set(p.hand.map((c) => c.id));
    for (const mark of p.marks)
      if (!handIds.has(mark)) violations.push(`player ${p.id} marks missing card ${mark}`);
  }

  if (game.outcome.status === "ongoing") {
    if (game.players.length < 1) violations.push("ongoing game has no players");
    if (!game.players.some((p) => p.id === game.turn.active))
      violations.push("active player is not in the game");
    if (game.turn.pendingTurns < 1) violations.push("pendingTurns must be at least one");
    if (game.players.length === 1) violations.push("one player left but game not ended");
  } else {
    if (game.players.length !== 1) violations.push("ended game must have exactly one player");
    if (game.players[0]?.id !== game.outcome.winner) violations.push("winner is not the survivor");
  }

  return violations.length === 0 ? ok(undefined) : err(violations);
}

type Draft = z.infer<typeof GameStateSchema>;
type DraftPlayer = Draft["players"][number];
type PlayCommand = Extract<Command, {type: "play-card"}>;
type Step = Result<{state: GameState; events: readonly Event[]}, GameError>;

// A deep clone, so the input game is never mutated; the state is plain JSON.
function clone(game: GameState): Draft {
  return JSON.parse(JSON.stringify(game)) as Draft;
}
function seal(draft: Draft): GameState {
  return draft as unknown as GameState;
}

function nextSeatId(
  seats: readonly {readonly id: PlayerId}[],
  currentId: PlayerId,
  direction: "forward" | "backward",
): PlayerId {
  const idx = seats.findIndex((p) => p.id === currentId);
  const n = seats.length;
  const step = direction === "forward" ? 1 : -1;
  return seats[(((idx + step) % n) + n) % n]!.id;
}

function handCount(player: DraftPlayer, name: Card): number {
  return player.hand.filter((c) => c.name === name).length;
}

function activePlayer(draft: Draft): DraftPlayer {
  return draft.players.find((p) => p.id === draft.turn.active)!;
}

function endTurn(draft: Draft, events: Event[]): void {
  if (draft.turn.pendingTurns > 1) draft.turn.pendingTurns -= 1;
  else passTurn(draft, events);
}

function passTurn(draft: Draft, events: Event[]): void {
  const next = nextSeatId(draft.players, draft.turn.active, draft.turn.direction);
  draft.turn.active = next;
  draft.turn.pendingTurns = 1;
  events.push({type: "turn-changed", active: next, pendingTurns: 1});
}

/** When a phase is abandoned, the cards it was holding go back on top of the deck. */
function returnHeldPhaseCards(draft: Draft): void {
  const phase = draft.phase;
  if (phase.kind === "awaiting-action") return;
  if ("card" in phase) draft.drawPile.unshift(phase.card);
  else draft.drawPile.unshift(...phase.cards);
}

function eliminate(draft: Draft, playerId: PlayerId, reason: DefeatReason, events: Event[]): void {
  const idx = draft.players.findIndex((p) => p.id === playerId);
  if (idx < 0) return;

  const wasActive = draft.turn.active === playerId;
  const next = draft.players.length > 1 ? nextSeatId(draft.players, playerId, draft.turn.direction) : null;

  const [player] = draft.players.splice(idx, 1);
  draft.defeated.push({...player!, reason});
  events.push({type: "player-defeated", player: playerId, reason});

  if (draft.players.length === 1) {
    returnHeldPhaseCards(draft);
    const winner = draft.players[0]!.id;
    const finishOrder = [winner, ...[...draft.defeated].reverse().map((p) => p.id)];
    draft.outcome = {status: "ended", winner, finishOrder};
    draft.turn.active = winner;
    draft.turn.pendingTurns = 1;
    draft.phase = {kind: "awaiting-action"};
    events.push({type: "game-ended", winner, finishOrder});
    return;
  }

  if (wasActive && next) {
    returnHeldPhaseCards(draft);
    draft.turn.active = next;
    draft.turn.pendingTurns = 1;
    draft.phase = {kind: "awaiting-action"};
    events.push({type: "turn-changed", active: next, pendingTurns: 1});
  }
  // A non-active player leaving mid-phase leaves the active player's turn untouched.
}

/** Draw one card and resolve it. The draw ends the turn unless it opens a follow-up phase. */
function performDraw(draft: Draft, fromBottom: boolean, events: Event[]): void {
  if (draft.drawPile.length === 0) {
    // If you must draw but the deck is empty, you are out.
    eliminate(draft, draft.turn.active, "could-not-draw", events);
    return;
  }

  const card = fromBottom ? draft.drawPile.pop()! : draft.drawPile.shift()!;
  const active = activePlayer(draft);
  events.push({type: "card-drawn", by: active.id, card});

  if (card.name === "imploding-kitten-closed") {
    draft.phase = {kind: "inserting-imploding-kitten", card: {id: card.id, name: "imploding-kitten-open"}};
    return;
  }
  if (card.name === "imploding-kitten-open") {
    events.push({type: "player-exploded", player: active.id, by: "ik"});
    draft.removed.push(card);
    eliminate(draft, active.id, "exploded-by-ik", events);
    return;
  }
  if (card.name === "exploding-kitten") {
    const shielded = handCount(active, "streaking-kitten") > handCount(active, "exploding-kitten");
    if (shielded) {
      active.hand.push(card);
      endTurn(draft, events);
      return;
    }
    if (active.hand.some((c) => c.name === "defuse")) {
      draft.phase = {kind: "defusing", card};
      return;
    }
    events.push({type: "player-exploded", player: active.id, by: "ek"});
    draft.removed.push(card);
    eliminate(draft, active.id, "exploded-by-ek", events);
    return;
  }

  active.hand.push(card);
  endTurn(draft, events);
}

function applyCardEffect(draft: Draft, name: Card, command: PlayCommand, events: Event[]): GameError | null {
  const active = activePlayer(draft);
  const attackGive = (): number => (draft.turn.pendingTurns === 1 ? 2 : draft.turn.pendingTurns + 2);

  return match(name)
    .with("attack", () => {
      const give = attackGive();
      const next = nextSeatId(draft.players, active.id, draft.turn.direction);
      draft.turn.active = next;
      draft.turn.pendingTurns = give;
      events.push({type: "turn-changed", active: next, pendingTurns: give});
      return null;
    })
    .with("targeted-attack", () => {
      if (!command.target) return {type: "missing-target"} satisfies GameError;
      if (command.target === active.id || !draft.players.some((p) => p.id === command.target))
        return {type: "illegal-target", player: command.target} satisfies GameError;
      const give = attackGive();
      draft.turn.active = command.target;
      draft.turn.pendingTurns = give;
      events.push({type: "turn-changed", active: command.target, pendingTurns: give});
      return null;
    })
    .with("personal-attack", () => {
      // A self-attack: take three turns in a row.
      draft.turn.pendingTurns += 2;
      events.push({type: "turn-changed", active: active.id, pendingTurns: draft.turn.pendingTurns});
      return null;
    })
    .with("skip", () => {
      endTurn(draft, events);
      return null;
    })
    .with("super-skip", () => {
      passTurn(draft, events);
      return null;
    })
    .with("reverse", () => {
      // With two players, reverse is just a skip.
      if (draft.players.length > 2) {
        draft.turn.direction = draft.turn.direction === "forward" ? "backward" : "forward";
        events.push({type: "direction-reversed", direction: draft.turn.direction});
      }
      endTurn(draft, events);
      return null;
    })
    .with("shuffle", () => {
      const shuffled = shuffle(draft.drawPile, draft.rng);
      draft.drawPile = [...shuffled.items];
      draft.rng = {seed: shuffled.state.seed};
      events.push({type: "deck-reordered", by: active.id});
      return null;
    })
    .with("swap-top-and-bottom", () => {
      const n = draft.drawPile.length;
      if (n >= 2) {
        const top = draft.drawPile[0]!;
        draft.drawPile[0] = draft.drawPile[n - 1]!;
        draft.drawPile[n - 1] = top;
      }
      events.push({type: "deck-reordered", by: active.id});
      return null;
    })
    .with("catomic-bomb", () => {
      const kittens = draft.drawPile.filter((c) => c.name === "exploding-kitten");
      const rest = draft.drawPile.filter((c) => c.name !== "exploding-kitten");
      const shuffled = shuffle(rest, draft.rng);
      draft.rng = {seed: shuffled.state.seed};
      draft.drawPile = [...kittens, ...shuffled.items];
      events.push({type: "deck-reordered", by: active.id});
      // End your turn without drawing.
      endTurn(draft, events);
      return null;
    })
    .with("see-the-future-3x", "see-the-future-5x", () => {
      const depth = peekDepth(name)!;
      events.push({type: "future-revealed", to: active.id, cards: draft.drawPile.slice(0, depth)});
      return null;
    })
    .with("alter-the-future-3x", () => {
      const top = draft.drawPile.splice(0, Math.min(3, draft.drawPile.length));
      draft.phase = {kind: "altering-future", cards: top};
      return null;
    })
    .with("share-the-future-3x", () => {
      const top = draft.drawPile.splice(0, Math.min(3, draft.drawPile.length));
      const sharedWith = nextSeatId(draft.players, active.id, draft.turn.direction);
      draft.phase = {kind: "sharing-future", cards: top, sharedWith};
      return null;
    })
    .with("draw-from-the-bottom", () => {
      performDraw(draft, true, events);
      return null;
    })
    .with("mark", () => {
      if (!command.target) return {type: "missing-target"} satisfies GameError;
      const target = draft.players.find((p) => p.id === command.target);
      if (!target || target.id === active.id)
        return {type: "illegal-target", player: command.target} satisfies GameError;
      if (target.hand.length === 0)
        return {type: "illegal-target", player: command.target} satisfies GameError;

      // Mark reveals a face-down card, so skip ones already revealed.
      const unmarked = target.hand.filter((c) => !target.marks.includes(c.id));
      const pool = unmarked.length > 0 ? unmarked : target.hand;
      const pick = int(draft.rng, pool.length);
      draft.rng = {seed: pick.state.seed};
      const picked = pool[pick.value]!;
      if (!target.marks.includes(picked.id)) target.marks.push(picked.id);
      events.push({type: "card-marked", owner: target.id, card: picked});
      return null;
    })
    .with("bury", () => {
      const top = draft.drawPile.shift();
      if (!top) {
        endTurn(draft, events);
        return null;
      }
      draft.phase = {kind: "burying-card", card: top};
      return null;
    })
    .with(
      "exploding-kitten",
      "imploding-kitten-open",
      "imploding-kitten-closed",
      "defuse",
      "streaking-kitten",
      () => ({type: "card-not-playable"}) satisfies GameError,
    )
    .exhaustive();
}

function drawCard(game: GameState): Step {
  if (game.phase.kind !== "awaiting-action") return err({type: "wrong-phase", actual: game.phase.kind});
  const draft = clone(game);
  const events: Event[] = [];
  performDraw(draft, false, events);
  return ok({state: seal(draft), events});
}

function playCard(game: GameState, command: PlayCommand): Step {
  if (game.phase.kind !== "awaiting-action") return err({type: "wrong-phase", actual: game.phase.kind});

  const draft = clone(game);
  const events: Event[] = [];
  const active = activePlayer(draft);

  const idx = active.hand.findIndex((c) => c.id === command.card);
  if (idx < 0) return err({type: "card-not-in-hand", card: command.card});
  const card = active.hand[idx]!;
  if (!isPlayable(card.name)) return err({type: "card-not-playable"});

  active.hand.splice(idx, 1);
  active.marks = active.marks.filter((mark) => mark !== card.id);
  draft.discardPile.push(card);
  events.push({type: "card-played", by: active.id, card: card.name, target: command.target});

  const effectError = applyCardEffect(draft, card.name, command, events);
  if (effectError) return err(effectError);
  return ok({state: seal(draft), events});
}

function provideDefuse(game: GameState, command: Extract<Command, {type: "provide-defuse"}>): Step {
  if (game.phase.kind !== "defusing") return err({type: "wrong-phase", actual: game.phase.kind});

  const draft = clone(game);
  const events: Event[] = [];
  const active = activePlayer(draft);

  const idx = active.hand.findIndex((c) => c.id === command.card && c.name === "defuse");
  if (idx < 0) return err({type: "card-not-in-hand", card: command.card});

  const [defuse] = active.hand.splice(idx, 1);
  active.marks = active.marks.filter((mark) => mark !== defuse!.id);
  draft.discardPile.push(defuse!);

  const phase = draft.phase;
  if (phase.kind !== "defusing") return err({type: "wrong-phase", actual: phase.kind});
  events.push({type: "card-played", by: active.id, card: "defuse"});
  draft.phase = {kind: "inserting-exploding-kitten", card: phase.card};
  return ok({state: seal(draft), events});
}

function insertKitten(
  game: GameState,
  kind: "inserting-exploding-kitten" | "inserting-imploding-kitten",
  position: number,
): Step {
  if (game.phase.kind !== kind) return err({type: "wrong-phase", actual: game.phase.kind});

  const draft = clone(game);
  const events: Event[] = [];
  const phase = draft.phase;
  if (phase.kind !== kind) return err({type: "wrong-phase", actual: phase.kind});

  if (position < 0 || position > draft.drawPile.length)
    return err({type: "invalid-position", position});

  draft.drawPile.splice(position, 0, phase.card);
  draft.phase = {kind: "awaiting-action"};
  // The kitten draw completes the turn.
  endTurn(draft, events);
  return ok({state: seal(draft), events});
}

function submitFutureOrder(game: GameState, command: Extract<Command, {type: "submit-future-order"}>): Step {
  if (game.phase.kind !== "altering-future" && game.phase.kind !== "sharing-future")
    return err({type: "wrong-phase", actual: game.phase.kind});

  const draft = clone(game);
  const events: Event[] = [];
  const phase = draft.phase;
  if (phase.kind !== "altering-future" && phase.kind !== "sharing-future")
    return err({type: "wrong-phase", actual: phase.kind});

  const want = [...command.order].sort();
  const have = phase.cards.map((c) => c.id).sort();
  if (want.length !== have.length || want.some((id, i) => id !== have[i]))
    return err({type: "invalid-future-order"});

  const byId = new Map(phase.cards.map((c) => [c.id, c]));
  const ordered = command.order.map((id) => byId.get(id)!);
  draft.drawPile = [...ordered, ...draft.drawPile];
  draft.phase = {kind: "awaiting-action"};
  events.push({type: "deck-reordered", by: command.by});
  // A peek does not end your turn.
  return ok({state: seal(draft), events});
}

function buryCard(game: GameState, command: Extract<Command, {type: "bury-card"}>): Step {
  if (game.phase.kind !== "burying-card") return err({type: "wrong-phase", actual: game.phase.kind});

  const draft = clone(game);
  const events: Event[] = [];
  const phase = draft.phase;
  if (phase.kind !== "burying-card") return err({type: "wrong-phase", actual: phase.kind});

  if (command.position < 0 || command.position > draft.drawPile.length)
    return err({type: "invalid-position", position: command.position});

  draft.drawPile.splice(command.position, 0, phase.card);
  draft.phase = {kind: "awaiting-action"};
  events.push({type: "deck-reordered", by: command.by});
  // Bury ends your turn without drawing.
  endTurn(draft, events);
  return ok({state: seal(draft), events});
}

function applyTimeout(game: GameState): Step {
  const draft = clone(game);
  const events: Event[] = [];

  let reason: DefeatReason = "was-inactive-for-too-long";
  if (draft.phase.kind === "defusing") {
    // You did not defuse in time, so the kitten explodes.
    events.push({type: "player-exploded", player: draft.turn.active, by: "ek"});
    draft.removed.push(draft.phase.card);
    draft.phase = {kind: "awaiting-action"};
    reason = "exploded-by-ek";
  }
  eliminate(draft, draft.turn.active, reason, events);
  return ok({state: seal(draft), events});
}

function applyConcede(game: GameState, by: PlayerId): Step {
  const draft = clone(game);
  const events: Event[] = [];
  if (!draft.players.some((p) => p.id === by)) return err({type: "illegal-target", player: by});

  // Leaving returns any held cards to the deck instead of detonating.
  eliminate(draft, by, "left-game", events);
  return ok({state: seal(draft), events});
}

/**
 * The single entry point that advances a Game. It never mutates the input and never
 * throws; an illegal command comes back as an error value.
 */
export function reduce(game: GameState, command: Command): Step {
  if (game.outcome.status === "ended") return err({type: "game-over"});

  if (command.type === "timeout") return applyTimeout(game);
  if (command.type === "concede") return applyConcede(game, command.by);

  if (command.by !== game.turn.active) return err({type: "not-your-turn"});

  return match(command)
    .with({type: "draw-card"}, () => drawCard(game))
    .with({type: "play-card"}, (c) => playCard(game, c))
    .with({type: "provide-defuse"}, (c) => provideDefuse(game, c))
    .with({type: "insert-exploding-kitten"}, (c) => insertKitten(game, "inserting-exploding-kitten", c.position))
    .with({type: "insert-imploding-kitten"}, (c) => insertKitten(game, "inserting-imploding-kitten", c.position))
    .with({type: "submit-future-order"}, (c) => submitFutureOrder(game, c))
    .with({type: "bury-card"}, (c) => buryCard(game, c))
    .exhaustive();
}

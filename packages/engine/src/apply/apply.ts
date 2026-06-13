import type { Card, Command, DomainEvent, PlayerId } from "@ekittens/contract";
import { gameError, isCatCard } from "@ekittens/contract";
import { type Rng, type Timestamp, pick, shuffle, unreachable } from "@ekittens/lib";
import type { MatchState, PendingAction, Phase, Player } from "../state/state.ts";
import {
  type Outcome,
  aliveCount,
  cardInHand,
  endTurn,
  fail,
  findPlayer,
  isAlive,
  nextTurn,
  removeFromHand,
  succeed,
  withHand,
} from "./helpers.ts";

/** Injected, deterministic dependencies (ENGINEERING_RULES #13). */
export interface Deps {
  readonly rng: Rng;
  readonly now: Timestamp;
}

/** How long the nope-window stays open (ms). Tunable by the shell via state deadline. */
export const NOPE_WINDOW_MS = 4000;

const SEE_THE_FUTURE_COUNT = 3;

const single = <T>(value: T): readonly T[] => [value];

// ── nope eligibility ───────────────────────────────────────────────────────

const holdsNope = (player: Player): boolean => player.hand.some((card) => card.name === "nope");

/**
 * Who may respond in the nope-window. On the opening window (even parity) the
 * actor is excluded — they would only be cancelling their own action; after a
 * Nope anyone holding a Nope may "Yup".
 */
const nopeEligible = (state: MatchState, actor: PlayerId, parity: number): readonly PlayerId[] =>
  state.players
    .filter((player) => isAlive(state, player.id) && holdsNope(player))
    .filter((player) => parity % 2 === 1 || player.id !== actor)
    .map((player) => player.id);

// ── effect application (a pending action that survived the nope-window) ──────

const applyEffect = (
  state: MatchState,
  pending: PendingAction,
  actor: PlayerId,
  deps: Deps,
): Outcome => {
  switch (pending.kind) {
    case "attack": {
      const turn = nextTurn(state, actor);
      return succeed({ ...state, turn, pendingTurns: 2, phase: { tag: "waiting-for-action" } }, [
        { type: "turn-changed", turn },
      ]);
    }
    case "skip": {
      const ended = endTurn(state);
      return succeed(
        {
          ...state,
          turn: ended.turn,
          pendingTurns: ended.pendingTurns,
          phase: { tag: "waiting-for-action" },
        },
        ended.events,
      );
    }
    case "shuffle":
      return succeed({
        ...state,
        drawPile: shuffle(state.drawPile, deps.rng),
        phase: { tag: "waiting-for-action" },
      });
    case "see-the-future": {
      const cards = state.drawPile.slice(0, SEE_THE_FUTURE_COUNT);
      return succeed({ ...state, phase: { tag: "waiting-for-action" } }, [
        { type: "future-seen", by: actor, cards },
      ]);
    }
    case "favor": {
      const target = findPlayer(state, pending.target);
      if (!target || target.hand.length === 0) {
        return succeed({ ...state, phase: { tag: "waiting-for-action" } });
      }
      return succeed({
        ...state,
        phase: { tag: "awaiting-favor", from: pending.target, to: actor },
      });
    }
    case "combo-pair":
      return stealRandom(state, pending.target, actor, deps);
    case "combo-triple":
      return stealNamed(state, pending.target, actor, pending.named);
    case "combo-five":
      return succeed({ ...state, phase: { tag: "picking-from-discard", actor } });
    default:
      return unreachable(pending);
  }
};

const stealRandom = (
  state: MatchState,
  targetId: PlayerId,
  actor: PlayerId,
  deps: Deps,
): Outcome => {
  const target = findPlayer(state, targetId);
  if (!target || target.hand.length === 0) {
    return succeed({ ...state, phase: { tag: "waiting-for-action" } });
  }
  const stolen = pick(target.hand, deps.rng) as Card;
  return moveCard(state, stolen, targetId, actor);
};

const stealNamed = (
  state: MatchState,
  targetId: PlayerId,
  actor: PlayerId,
  named: Card["name"],
): Outcome => {
  const target = findPlayer(state, targetId);
  const stolen = target?.hand.find((card) => card.name === named);
  if (!target || !stolen) {
    return succeed({ ...state, phase: { tag: "waiting-for-action" } });
  }
  return moveCard(state, stolen, targetId, actor);
};

const moveCard = (state: MatchState, card: Card, fromId: PlayerId, toId: PlayerId): Outcome => {
  const from = findPlayer(state, fromId);
  const to = findPlayer(state, toId);
  if (!from || !to) return fail(gameError("invalid-target"));
  let players = withHand(state.players, fromId, removeFromHand(from.hand, [card.id]));
  players = withHand(players, toId, [
    ...(findPlayer({ ...state, players }, toId)?.hand ?? []),
    card,
  ]);
  return succeed({ ...state, players, phase: { tag: "waiting-for-action" } }, [
    { type: "stolen", from: fromId, to: toId },
  ]);
};

// ── nope-window entry & resolution ──────────────────────────────────────────

const enterNopeWindow = (
  state: MatchState,
  actor: PlayerId,
  pending: PendingAction,
  discarded: readonly Card[],
  primary: Card,
  deps: Deps,
): Outcome => {
  const withDiscard: MatchState = { ...state, discard: [...state.discard, ...discarded] };
  const eligible = nopeEligible(withDiscard, actor, 0);
  const played: DomainEvent = { type: "card-played", by: actor, card: primary.name };
  if (eligible.length === 0) {
    const resolved = applyEffect(withDiscard, pending, actor, deps);
    return resolved.ok
      ? succeed(resolved.value.state, [played, ...resolved.value.events])
      : resolved;
  }
  return succeed(
    {
      ...withDiscard,
      phase: {
        tag: "nope-window",
        pending,
        actor,
        parity: 0,
        eligible,
        responded: [],
        deadline: (deps.now + NOPE_WINDOW_MS) as Timestamp,
      },
    },
    [played],
  );
};

const resolveNopeWindow = (
  state: MatchState,
  phase: Extract<Phase, { tag: "nope-window" }>,
  deps: Deps,
): Outcome => {
  const noped = phase.parity % 2 === 1;
  const events: readonly DomainEvent[] =
    phase.parity > 0 ? [{ type: "noped", by: phase.actor, cancelled: noped }] : [];
  if (noped) {
    // Cancelled: the actor's turn simply continues.
    return succeed({ ...state, phase: { tag: "waiting-for-action" } }, events);
  }
  const resolved = applyEffect(state, phase.pending, phase.actor, deps);
  return resolved.ok
    ? succeed(resolved.value.state, [...events, ...resolved.value.events])
    : resolved;
};

// ── drawing ─────────────────────────────────────────────────────────────────

const drawCard = (state: MatchState): Outcome => {
  const [top, ...rest] = state.drawPile;
  if (!top) return fail(gameError("illegal-move", "draw pile is empty"));
  const drawer = state.turn;

  if (top.name === "exploding-kitten") {
    const player = findPlayer(state, drawer);
    const hasDefuse = player?.hand.some((card) => card.name === "defuse") ?? false;
    if (hasDefuse) {
      return succeed(
        { ...state, drawPile: rest, phase: { tag: "defusing", actor: drawer, kitten: top } },
        [{ type: "card-drawn", by: drawer }],
      );
    }
    return eliminate({ ...state, drawPile: rest, discard: [...state.discard, top] }, drawer);
  }

  const player = findPlayer(state, drawer);
  if (!player) return fail(gameError("internal"));
  const withCard: MatchState = {
    ...state,
    drawPile: rest,
    players: withHand(state.players, drawer, [...player.hand, top]),
  };
  const ended = endTurn(withCard);
  return succeed(
    {
      ...withCard,
      turn: ended.turn,
      pendingTurns: ended.pendingTurns,
      phase: { tag: "waiting-for-action" },
    },
    [{ type: "card-drawn", by: drawer }, ...ended.events],
  );
};

/** Eliminate a player (no defuse / exploded), discarding their hand. Ends the game at one survivor. */
const eliminate = (state: MatchState, victim: PlayerId): Outcome => {
  const player = findPlayer(state, victim);
  const discard = player ? [...state.discard, ...player.hand] : state.discard;
  const out = [...state.out, victim];
  const players = withHand(state.players, victim, []);
  const base: MatchState = { ...state, players, out, discard };
  const events: DomainEvent[] = [
    { type: "exploded", player: victim },
    { type: "player-out", player: victim },
  ];

  if (players.length - out.length === 1) {
    const winner = players.map((p) => p.id).find((id) => !out.includes(id)) as PlayerId;
    return succeed({ ...base, phase: { tag: "game-over", winner } }, [
      ...events,
      { type: "match-ended", winner },
    ]);
  }
  const turn = nextTurn(base, victim);
  return succeed({ ...base, turn, pendingTurns: 1, phase: { tag: "waiting-for-action" } }, [
    ...events,
    { type: "turn-changed", turn },
  ]);
};

// ── play-card (waiting-for-action) ───────────────────────────────────────────

const NOPEABLE_SINGLES = new Set(["attack", "skip", "shuffle", "see-the-future"]);

const singlePending = (name: string): PendingAction => {
  switch (name) {
    case "attack":
      return { kind: "attack" };
    case "skip":
      return { kind: "skip" };
    case "shuffle":
      return { kind: "shuffle" };
    default:
      return { kind: "see-the-future" };
  }
};

const playCard = (
  state: MatchState,
  command: Extract<Command, { type: "play-card" }>,
  deps: Deps,
): Outcome => {
  if (command.by !== state.turn) return fail(gameError("not-your-turn"));
  const actor = findPlayer(state, state.turn);
  if (!actor) return fail(gameError("internal"));
  const card = cardInHand(actor, command.card);
  if (!card) return fail(gameError("card-not-in-hand"));

  if (card.name === "exploding-kitten" || card.name === "defuse" || card.name === "nope") {
    return fail(gameError("illegal-move", `cannot play ${card.name} here`));
  }

  // A combo is requested (a cat pair/three-of-a-kind, or a five-distinct combo),
  // or a lone cat card was played (which `playCombo` correctly rejects).
  const isCombo = (command.combo?.length ?? 0) > 0;
  if (isCatCard(card.name) || isCombo) return playCombo(state, command, actor, card, deps);

  const discardOne = (pending: PendingAction): Outcome => {
    const players = withHand(state.players, actor.id, removeFromHand(actor.hand, [card.id]));
    return enterNopeWindow({ ...state, players }, actor.id, pending, single(card), card, deps);
  };

  if (NOPEABLE_SINGLES.has(card.name)) {
    return discardOne(singlePending(card.name));
  }

  if (card.name === "favor") {
    if (command.target === undefined)
      return fail(gameError("invalid-target", "favor needs a target"));
    if (command.target === actor.id)
      return fail(gameError("invalid-target", "cannot favor yourself"));
    if (!isAlive(state, command.target) || !findPlayer(state, command.target)) {
      return fail(gameError("invalid-target"));
    }
    return discardOne({ kind: "favor", target: command.target });
  }

  return fail(gameError("illegal-move", `unplayable card ${card.name}`));
};

const playCombo = (
  state: MatchState,
  command: Extract<Command, { type: "play-card" }>,
  actor: Player,
  primary: Card,
  deps: Deps,
): Outcome => {
  const ids = [command.card, ...(command.combo ?? [])];
  if (new Set(ids).size !== ids.length)
    return fail(gameError("invalid-combo", "duplicate card ids"));
  const cards = ids.map((id) => cardInHand(actor, id));
  if (cards.some((card) => card === undefined)) return fail(gameError("card-not-in-hand"));
  const present = cards as Card[];

  const validTarget = (): boolean =>
    command.target !== undefined &&
    command.target !== actor.id &&
    isAlive(state, command.target) &&
    findPlayer(state, command.target) !== undefined;

  const removeAndEnter = (pending: PendingAction): Outcome => {
    const players = withHand(state.players, actor.id, removeFromHand(actor.hand, ids));
    return enterNopeWindow({ ...state, players }, actor.id, pending, present, primary, deps);
  };

  const sameName = present.every((card) => card.name === primary.name);

  if (present.length === 2 && sameName) {
    if (!validTarget()) return fail(gameError("invalid-target"));
    return removeAndEnter({ kind: "combo-pair", target: command.target as PlayerId });
  }
  if (present.length === 3 && sameName) {
    if (!validTarget()) return fail(gameError("invalid-target"));
    if (command.named === undefined)
      return fail(gameError("invalid-combo", "three-of-a-kind names a card"));
    return removeAndEnter({
      kind: "combo-triple",
      target: command.target as PlayerId,
      named: command.named,
    });
  }
  if (present.length === 5 && new Set(present.map((card) => card.name)).size === 5) {
    return removeAndEnter({ kind: "combo-five" });
  }
  return fail(gameError("invalid-combo"));
};

// ── phase handlers ───────────────────────────────────────────────────────────

const applyWaiting = (state: MatchState, command: Command, deps: Deps): Outcome => {
  switch (command.type) {
    case "draw-card":
      return command.by === state.turn ? drawCard(state) : fail(gameError("not-your-turn"));
    case "play-card":
      return playCard(state, command, deps);
    default:
      return fail(gameError("wrong-phase"));
  }
};

const applyNopeWindow = (
  state: MatchState,
  phase: Extract<Phase, { tag: "nope-window" }>,
  command: Command,
  deps: Deps,
): Outcome => {
  switch (command.type) {
    case "nope": {
      if (!isAlive(state, command.by)) return fail(gameError("not-eligible"));
      const player = findPlayer(state, command.by);
      const nope = player?.hand.find((card) => card.name === "nope");
      if (!player || !nope || nope.id !== command.card) return fail(gameError("card-not-in-hand"));
      const players = withHand(state.players, command.by, removeFromHand(player.hand, [nope.id]));
      const parity = phase.parity + 1;
      const next: MatchState = {
        ...state,
        players,
        discard: [...state.discard, nope],
        phase: {
          ...phase,
          parity,
          responded: [],
          eligible: nopeEligible({ ...state, players }, phase.actor, parity),
          deadline: (deps.now + NOPE_WINDOW_MS) as Timestamp,
        },
      };
      const eligibleNow = (next.phase as Extract<Phase, { tag: "nope-window" }>).eligible;
      return eligibleNow.length === 0
        ? resolveNopeWindow(next, next.phase as Extract<Phase, { tag: "nope-window" }>, deps)
        : succeed(next);
    }
    case "pass-nope": {
      if (!phase.eligible.includes(command.by)) return fail(gameError("not-eligible"));
      if (phase.responded.includes(command.by))
        return fail(gameError("illegal-move", "already responded"));
      const responded = [...phase.responded, command.by];
      const next: MatchState = { ...state, phase: { ...phase, responded } };
      return responded.length >= phase.eligible.length
        ? resolveNopeWindow(next, next.phase as Extract<Phase, { tag: "nope-window" }>, deps)
        : succeed(next);
    }
    default:
      return fail(gameError("wrong-phase"));
  }
};

const applyAwaitingFavor = (
  state: MatchState,
  phase: Extract<Phase, { tag: "awaiting-favor" }>,
  command: Command,
): Outcome => {
  if (command.type !== "give-card") return fail(gameError("wrong-phase"));
  if (command.by !== phase.from) return fail(gameError("not-eligible"));
  const giver = findPlayer(state, phase.from);
  const card = giver ? cardInHand(giver, command.card) : undefined;
  if (!giver || !card) return fail(gameError("card-not-in-hand"));
  const receiver = findPlayer(state, phase.to);
  if (!receiver) return fail(gameError("internal"));
  let players = withHand(state.players, phase.from, removeFromHand(giver.hand, [card.id]));
  players = withHand(players, phase.to, [...receiver.hand, card]);
  return succeed({ ...state, players, phase: { tag: "waiting-for-action" } }, [
    { type: "favor", from: phase.from, to: phase.to },
    { type: "stolen", from: phase.from, to: phase.to },
  ]);
};

const applyPicking = (
  state: MatchState,
  phase: Extract<Phase, { tag: "picking-from-discard" }>,
  command: Command,
): Outcome => {
  if (command.type !== "pick-from-discard") return fail(gameError("wrong-phase"));
  if (command.by !== phase.actor) return fail(gameError("not-eligible"));
  const card = state.discard.find((held) => held.id === command.card);
  if (!card) return fail(gameError("invalid-card", "not in discard"));
  const actor = findPlayer(state, phase.actor);
  if (!actor) return fail(gameError("internal"));
  return succeed({
    ...state,
    discard: state.discard.filter((held) => held.id !== card.id),
    players: withHand(state.players, phase.actor, [...actor.hand, card]),
    phase: { tag: "waiting-for-action" },
  });
};

const applyDefusing = (
  state: MatchState,
  phase: Extract<Phase, { tag: "defusing" }>,
  command: Command,
): Outcome => {
  if (command.type !== "play-defuse") return fail(gameError("wrong-phase"));
  if (command.by !== phase.actor) return fail(gameError("not-your-turn"));
  const actor = findPlayer(state, phase.actor);
  const defuse = actor ? cardInHand(actor, command.card) : undefined;
  if (!actor || !defuse || defuse.name !== "defuse") return fail(gameError("card-not-in-hand"));
  return succeed(
    {
      ...state,
      players: withHand(state.players, phase.actor, removeFromHand(actor.hand, [defuse.id])),
      discard: [...state.discard, defuse],
      phase: { tag: "inserting-exploding-kitten", actor: phase.actor, kitten: phase.kitten },
    },
    [{ type: "defused", by: phase.actor }],
  );
};

const applyInserting = (
  state: MatchState,
  phase: Extract<Phase, { tag: "inserting-exploding-kitten" }>,
  command: Command,
): Outcome => {
  if (command.type !== "insert-exploding-kitten") return fail(gameError("wrong-phase"));
  if (command.by !== phase.actor) return fail(gameError("not-your-turn"));
  if (command.position < 0 || command.position > state.drawPile.length) {
    return fail(gameError("invalid-position"));
  }
  const drawPile = [
    ...state.drawPile.slice(0, command.position),
    phase.kitten,
    ...state.drawPile.slice(command.position),
  ];
  const ended = endTurn(state);
  return succeed({
    ...state,
    drawPile,
    turn: ended.turn,
    pendingTurns: ended.pendingTurns,
    phase: { tag: "waiting-for-action" },
  });
};

/**
 * The pure reducer: given a state, a command, and injected deterministic deps,
 * produce the next state plus emitted events, or a `GameError`. `throw` is never
 * used for expected failures (ENGINEERING_RULES #9).
 */
export const apply = (state: MatchState, command: Command, deps: Deps): Outcome => {
  const phase = state.phase;
  switch (phase.tag) {
    case "waiting-for-action":
      return applyWaiting(state, command, deps);
    case "nope-window":
      return applyNopeWindow(state, phase, command, deps);
    case "awaiting-favor":
      return applyAwaitingFavor(state, phase, command);
    case "picking-from-discard":
      return applyPicking(state, phase, command);
    case "defusing":
      return applyDefusing(state, phase, command);
    case "inserting-exploding-kitten":
      return applyInserting(state, phase, command);
    case "game-over":
      return fail(gameError("wrong-phase", "the match is over"));
    default:
      return unreachable(phase);
  }
};

/**
 * Advance the current timed/blocking phase as if its deadline lapsed — the
 * shell calls this when a turn or nope-window timer fires (AFK handling). It
 * auto-plays the safest legal action so the table keeps moving.
 */
export const timeout = (state: MatchState, deps: Deps): Outcome => {
  const phase = state.phase;
  switch (phase.tag) {
    case "waiting-for-action":
      return drawCard(state); // safest: draw
    case "nope-window":
      return resolveNopeWindow(state, phase, deps);
    case "defusing": {
      const actor = findPlayer(state, phase.actor);
      const defuse = actor?.hand.find((card) => card.name === "defuse");
      if (!actor || !defuse) return eliminate(state, phase.actor);
      return applyDefusing(state, phase, { type: "play-defuse", by: phase.actor, card: defuse.id });
    }
    case "inserting-exploding-kitten":
      return applyInserting(state, phase, {
        type: "insert-exploding-kitten",
        by: phase.actor,
        position: deps.rng.int(state.drawPile.length + 1),
      });
    case "awaiting-favor": {
      const giver = findPlayer(state, phase.from);
      const card = giver ? pick(giver.hand, deps.rng) : undefined;
      if (!giver || !card) return succeed({ ...state, phase: { tag: "waiting-for-action" } });
      return applyAwaitingFavor(state, phase, { type: "give-card", by: phase.from, card: card.id });
    }
    case "picking-from-discard": {
      const card = state.discard[state.discard.length - 1];
      if (!card) return succeed({ ...state, phase: { tag: "waiting-for-action" } });
      return applyPicking(state, phase, {
        type: "pick-from-discard",
        by: phase.actor,
        card: card.id,
      });
    }
    case "game-over":
      return succeed(state);
    default:
      return unreachable(phase);
  }
};

export const isOver = (state: MatchState): boolean => state.phase.tag === "game-over";

export { aliveCount };

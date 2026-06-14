import {z} from "zod";

import type {DeepReadonly} from "@ekittens/lib/types";
import type {RngState} from "@ekittens/lib/rng";

export const PlayerIdSchema = z.string().min(1).brand<"PlayerId">();
export type PlayerId = z.infer<typeof PlayerIdSchema>;

export const GameIdSchema = z.string().min(1).brand<"GameId">();
export type GameId = z.infer<typeof GameIdSchema>;

export const CardIdSchema = z.string().min(1).brand<"CardId">();
export type CardId = z.infer<typeof CardIdSchema>;

/** The 21 card faces. Nope is intentionally absent (ADR 0003). */
export const CardSchema = z.enum([
  "exploding-kitten",
  "imploding-kitten-closed",
  "imploding-kitten-open",
  "defuse",
  "streaking-kitten",
  "attack",
  "targeted-attack",
  "personal-attack",
  "skip",
  "super-skip",
  "reverse",
  "shuffle",
  "swap-top-and-bottom",
  "catomic-bomb",
  "see-the-future-3x",
  "see-the-future-5x",
  "alter-the-future-3x",
  "share-the-future-3x",
  "draw-from-the-bottom",
  "mark",
  "bury",
]);
export type Card = DeepReadonly<z.infer<typeof CardSchema>>;

export const CardInstanceSchema = z.object({
  id: CardIdSchema,
  name: CardSchema,
});
export type CardInstance = DeepReadonly<z.infer<typeof CardInstanceSchema>>;

const HAZARDS = new Set<Card>([
  "exploding-kitten",
  "imploding-kitten-open",
  "imploding-kitten-closed",
]);

/** Cards that never enter a hand by play — they act when drawn. */
export function isHazard(card: Card): boolean {
  return HAZARDS.has(card);
}

const UNPLAYABLE = new Set<Card>([...HAZARDS, "defuse", "streaking-kitten"]);

/** Can this card be played from hand on your turn? */
export function isPlayable(card: Card): boolean {
  return !UNPLAYABLE.has(card);
}

/** How many top cards a peek card reveals, or null if it is not a peek. */
export function peekDepth(card: Card): number | null {
  switch (card) {
    case "see-the-future-3x":
    case "alter-the-future-3x":
    case "share-the-future-3x":
      return 3;
    case "see-the-future-5x":
      return 5;
    default:
      return null;
  }
}

const RngStateSchema = z.object({seed: z.number().int()});

/**
 * A fully-resolved, mode-agnostic recipe for one Game (ADR 0001). The lobby
 * resolves a "mode" into this; the engine only validates and executes it.
 * `cards` is the total count of each card face that exists in the Game.
 */
export const GameConfigSchema = z.object({
  players: z.array(PlayerIdSchema).min(2).max(10),
  cards: z.record(CardSchema, z.number().int().nonnegative()),
  handSize: z.number().int().positive(),
  defusesPerPlayer: z.number().int().nonnegative(),
  seed: z.number().int(),
});
export type GameConfig = DeepReadonly<z.infer<typeof GameConfigSchema>>;

export const DefeatReasonSchema = z.enum([
  "exploded-by-ek",
  "exploded-by-ik",
  "was-inactive-for-too-long",
  "left-game",
  "could-not-draw",
]);
export type DefeatReason = DeepReadonly<z.infer<typeof DefeatReasonSchema>>;

export const PlayerSchema = z.object({
  id: PlayerIdSchema,
  hand: z.array(CardInstanceSchema),
  /** Ids of this player's own cards currently revealed to everyone via `mark`. */
  marks: z.array(CardIdSchema),
});
export type Player = DeepReadonly<z.infer<typeof PlayerSchema>>;

export const DefeatedPlayerSchema = PlayerSchema.extend({reason: DefeatReasonSchema});
export type DefeatedPlayer = DeepReadonly<z.infer<typeof DefeatedPlayerSchema>>;

/** Follow-up states that pause the Game until a specific resolving command. */
export const PhaseSchema = z.discriminatedUnion("kind", [
  z.object({kind: z.literal("awaiting-action")}),
  z.object({kind: z.literal("defusing"), card: CardInstanceSchema}),
  z.object({kind: z.literal("inserting-exploding-kitten"), card: CardInstanceSchema}),
  z.object({kind: z.literal("inserting-imploding-kitten"), card: CardInstanceSchema}),
  z.object({kind: z.literal("altering-future"), cards: z.array(CardInstanceSchema)}),
  z.object({
    kind: z.literal("sharing-future"),
    cards: z.array(CardInstanceSchema),
    sharedWith: PlayerIdSchema,
  }),
  z.object({kind: z.literal("burying-card"), card: CardInstanceSchema}),
]);
export type Phase = DeepReadonly<z.infer<typeof PhaseSchema>>;
export type PhaseKind = Phase["kind"];

/**
 * The inactivity budget the active player has in the given phase, in
 * milliseconds. A declared rule — the engine never measures time; the server
 * runs the clock and injects a `timeout` command when this elapses.
 */
export function timeoutFor(phase: Phase): number {
  return phase.kind === "defusing" ? 10_000 : 45_000;
}

export const TurnStateSchema = z.object({
  active: PlayerIdSchema,
  direction: z.enum(["forward", "backward"]),
  /** Turns the active player still owes before play passes (≥1 while ongoing). */
  pendingTurns: z.number().int().positive(),
});
export type TurnState = DeepReadonly<z.infer<typeof TurnStateSchema>>;

export const OutcomeSchema = z.discriminatedUnion("status", [
  z.object({status: z.literal("ongoing")}),
  z.object({
    status: z.literal("ended"),
    winner: PlayerIdSchema,
    /** Winner first, then defeated players in reverse elimination order. */
    finishOrder: z.array(PlayerIdSchema),
  }),
]);
export type Outcome = DeepReadonly<z.infer<typeof OutcomeSchema>>;

/** The complete, god-view state of one Game. Clients receive a `redact`ed view. */
export const GameStateSchema = z.object({
  id: GameIdSchema,
  config: GameConfigSchema,
  players: z.array(PlayerSchema),
  defeated: z.array(DefeatedPlayerSchema),
  spectators: z.array(PlayerIdSchema),
  drawPile: z.array(CardInstanceSchema),
  discardPile: z.array(CardInstanceSchema),
  /** Cards permanently out of play — detonated exploding/imploding kittens. */
  removed: z.array(CardInstanceSchema),
  turn: TurnStateSchema,
  phase: PhaseSchema,
  rng: RngStateSchema,
  outcome: OutcomeSchema,
});
export type GameState = DeepReadonly<z.infer<typeof GameStateSchema>>;

const PositionSchema = z.number().int().nonnegative();

/**
 * Everything that can change a Game. Player commands carry `by`; `timeout` is a
 * system command the server injects when the active player's clock expires.
 */
export const CommandSchema = z.discriminatedUnion("type", [
  z.object({type: z.literal("draw-card"), by: PlayerIdSchema}),
  z.object({
    type: z.literal("play-card"),
    by: PlayerIdSchema,
    card: CardIdSchema,
    /** Required by targeted-attack and mark; ignored otherwise. */
    target: PlayerIdSchema.optional(),
  }),
  z.object({type: z.literal("provide-defuse"), by: PlayerIdSchema, card: CardIdSchema}),
  z.object({type: z.literal("insert-exploding-kitten"), by: PlayerIdSchema, position: PositionSchema}),
  z.object({type: z.literal("insert-imploding-kitten"), by: PlayerIdSchema, position: PositionSchema}),
  z.object({type: z.literal("submit-future-order"), by: PlayerIdSchema, order: z.array(CardIdSchema)}),
  z.object({type: z.literal("bury-card"), by: PlayerIdSchema, position: PositionSchema}),
  z.object({type: z.literal("concede"), by: PlayerIdSchema}),
  z.object({type: z.literal("timeout")}),
]);
export type Command = DeepReadonly<z.infer<typeof CommandSchema>>;

/**
 * Domain facts emitted by `reduce` (ADR 0002): advisory cues for the client and
 * the channel for transient reveals. The redacted snapshot — not these — is the
 * authoritative state; events carry god-view detail and the server redacts them.
 */
export const EventSchema = z.discriminatedUnion("type", [
  z.object({type: z.literal("card-drawn"), by: PlayerIdSchema, card: CardInstanceSchema}),
  z.object({
    type: z.literal("card-played"),
    by: PlayerIdSchema,
    card: CardSchema,
    target: PlayerIdSchema.optional(),
  }),
  z.object({type: z.literal("future-revealed"), to: PlayerIdSchema, cards: z.array(CardInstanceSchema)}),
  z.object({type: z.literal("deck-reordered"), by: PlayerIdSchema}),
  z.object({type: z.literal("turn-changed"), active: PlayerIdSchema, pendingTurns: z.number().int().positive()}),
  z.object({type: z.literal("direction-reversed"), direction: z.enum(["forward", "backward"])}),
  z.object({type: z.literal("card-marked"), owner: PlayerIdSchema, card: CardInstanceSchema}),
  z.object({type: z.literal("player-exploded"), player: PlayerIdSchema, by: z.enum(["ek", "ik"])}),
  z.object({type: z.literal("player-defeated"), player: PlayerIdSchema, reason: DefeatReasonSchema}),
  z.object({type: z.literal("game-ended"), winner: PlayerIdSchema, finishOrder: z.array(PlayerIdSchema)}),
]);
export type Event = DeepReadonly<z.infer<typeof EventSchema>>;

/**
 * Why a command was rejected — returned as a value, never thrown. Structured so
 * the client can react; messages stay lowercase and name what failed when rendered.
 */
export const GameErrorSchema = z.discriminatedUnion("type", [
  z.object({type: z.literal("invalid-config"), reason: z.string()}),
  z.object({type: z.literal("game-over")}),
  z.object({type: z.literal("not-your-turn")}),
  z.object({type: z.literal("wrong-phase"), actual: z.string()}),
  z.object({type: z.literal("card-not-in-hand"), card: CardIdSchema}),
  z.object({type: z.literal("card-not-playable")}),
  z.object({type: z.literal("missing-target")}),
  z.object({type: z.literal("illegal-target"), player: PlayerIdSchema.optional()}),
  z.object({type: z.literal("invalid-position"), position: z.number().int()}),
  z.object({type: z.literal("invalid-future-order")}),
]);
export type GameError = DeepReadonly<z.infer<typeof GameErrorSchema>>;

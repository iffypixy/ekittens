import { z as zod } from "zod";
import { CARD_NAMES } from "./cards.ts";
import type { GameError } from "./errors.ts";
import type { DomainEvent } from "./events.ts";
import type { MatchId } from "./ids.ts";
import type { MatchView } from "./views.ts";

/**
 * Wire schemas for untrusted client input. Game commands arrive **without** a
 * `by` field — the server injects the authenticated player id, never trusting
 * the client's claim. Parsed at the boundary
 * (parse, don't validate).
 */

const cardId = zod.string().min(1).max(32);
const playerId = zod.string().min(1).max(32);
const cardName = zod.enum([...CARD_NAMES] as [string, ...string[]]);

export const commandWire = zod.discriminatedUnion("type", [
  zod.object({ type: zod.literal("draw-card") }),
  zod.object({
    type: zod.literal("play-card"),
    card: cardId,
    combo: zod.array(cardId).max(5).optional(),
    target: playerId.optional(),
    named: cardName.optional(),
  }),
  zod.object({ type: zod.literal("play-defuse"), card: cardId }),
  zod.object({
    type: zod.literal("insert-exploding-kitten"),
    position: zod.number().int().nonnegative().max(100),
  }),
  zod.object({ type: zod.literal("nope"), card: cardId }),
  zod.object({ type: zod.literal("pass-nope") }),
  zod.object({ type: zod.literal("give-card"), card: cardId }),
  zod.object({ type: zod.literal("pick-from-discard"), card: cardId }),
]);

export type CommandWire = zod.infer<typeof commandWire>;

/** Messages a client may send over the socket. */
export const clientMessage = zod.discriminatedUnion("type", [
  zod.object({ type: zod.literal("ping") }),
  zod.object({
    type: zod.literal("match:command"),
    matchId: zod.string().min(1).max(32),
    command: commandWire,
  }),
]);

export type ClientMessage = zod.infer<typeof clientMessage>;

/**
 * Messages the server pushes to a client. The authoritative truth is always the
 * projected `MatchView`; `match:event` carries animation/notification hints.
 * Defined once here so client and server can never drift.
 */
export type ServerMessage =
  | { type: "match:start"; matchId: MatchId }
  | { type: "match:view"; matchId: MatchId; view: MatchView }
  | { type: "match:event"; matchId: MatchId; event: DomainEvent }
  | { type: "match:error"; matchId: MatchId; error: GameError }
  | { type: "pong" }
  | { type: "error"; error: GameError };

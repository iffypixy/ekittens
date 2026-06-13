import type { Brand } from "@ekittens/lib";

/** A specific physical card instance within a match. */
export type CardId = Brand<string, "CardId">;

/**
 * The canonical Base-game card vocabulary (researched from the official
 * rulebook). Shared on the wire, so it lives in `contract`; the `engine`
 * imports these names type-only and attaches behaviour.
 */
export const CARD_NAMES = [
  "exploding-kitten",
  "defuse",
  "nope",
  "attack",
  "skip",
  "favor",
  "shuffle",
  "see-the-future",
  "tacocat",
  "cattermelon",
  "hairy-potato-cat",
  "rainbow-ralphing-cat",
  "beard-cat",
] as const;

export type CardName = (typeof CARD_NAMES)[number];

/** The five cat cards, playable only in combos (pairs / three-of-a-kind / five-distinct). */
export const CAT_CARD_NAMES = [
  "tacocat",
  "cattermelon",
  "hairy-potato-cat",
  "rainbow-ralphing-cat",
  "beard-cat",
] as const satisfies readonly CardName[];

export type CatCardName = (typeof CAT_CARD_NAMES)[number];

const CAT_CARD_SET: ReadonlySet<CardName> = new Set(CAT_CARD_NAMES);

export const isCatCard = (name: CardName): name is CatCardName => CAT_CARD_SET.has(name);

/** A card instance: an identity plus what it is. */
export interface Card {
  readonly id: CardId;
  readonly name: CardName;
}

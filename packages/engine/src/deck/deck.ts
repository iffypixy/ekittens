import type { Card, CardName } from "@ekittens/contract";
import { type Rng, idFromRng, shuffle } from "@ekittens/lib";

/** Physical counts in the full 56-card Base deck (official rulebook). */
export const BASE_DECK_COUNTS = {
  "exploding-kitten": 4,
  defuse: 6,
  nope: 5,
  attack: 4,
  skip: 4,
  favor: 4,
  shuffle: 4,
  "see-the-future": 5,
  tacocat: 4,
  cattermelon: 4,
  "hairy-potato-cat": 4,
  "rainbow-ralphing-cat": 4,
  "beard-cat": 4,
} as const satisfies Record<CardName, number>;

export const HAND_SIZE_BEFORE_DEFUSE = 4;
export const DEFUSE_PER_PLAYER = 1;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;

const mint = (name: CardName, rng: Rng): Card => ({ id: idFromRng(rng), name });

/** Every non-kitten, non-defuse card, expanded to its full multiplicity. */
const actionCardNames = (): CardName[] => {
  const names: CardName[] = [];
  for (const [name, count] of Object.entries(BASE_DECK_COUNTS) as [CardName, number][]) {
    if (name === "exploding-kitten" || name === "defuse") continue;
    for (let i = 0; i < count; i++) names.push(name);
  }
  return names;
};

export interface Deal {
  readonly hands: readonly (readonly Card[])[];
  readonly drawPile: readonly Card[];
}

/**
 * Deal a Base-game match for `players` (2–5), deterministically given `rng`.
 *
 * Official setup: shuffle the action cards and deal 4 to each player, add 1
 * Defuse to each hand (a 5-card opening hand), then put the remaining Defuses
 * (6 − players) and (players − 1) Exploding Kittens into the draw pile and
 * shuffle it.
 */
export const deal = (players: number, rng: Rng): Deal => {
  const actions = shuffle(actionCardNames(), rng).map((name) => mint(name, rng));

  const hands: Card[][] = [];
  let cursor = 0;
  for (let player = 0; player < players; player++) {
    const hand = actions.slice(cursor, cursor + HAND_SIZE_BEFORE_DEFUSE);
    cursor += HAND_SIZE_BEFORE_DEFUSE;
    hand.push(mint("defuse", rng));
    hands.push(hand);
  }

  const drawPile: Card[] = actions.slice(cursor);

  const remainingDefuse = BASE_DECK_COUNTS.defuse - players * DEFUSE_PER_PLAYER;
  for (let i = 0; i < remainingDefuse; i++) drawPile.push(mint("defuse", rng));

  for (let i = 0; i < players - 1; i++) drawPile.push(mint("exploding-kitten", rng));

  return { hands, drawPile: shuffle(drawPile, rng) };
};

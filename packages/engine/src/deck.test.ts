import type { Card } from "@ekittens/contract";
import { seededRng } from "@ekittens/lib";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BASE_DECK_COUNTS, MAX_PLAYERS, MIN_PLAYERS, deal } from "./deck.ts";

const allCards = (deal: {
  hands: readonly (readonly Card[])[];
  drawPile: readonly Card[];
}): Card[] => [...deal.hands.flat(), ...deal.drawPile];

const playerCounts = fc.integer({ min: MIN_PLAYERS, max: MAX_PLAYERS });
const seeds = fc.integer({ min: 0, max: 2 ** 31 });

describe("dealing a match", () => {
  it("total deck adds up to 56 across all card types", () => {
    const total = Object.values(BASE_DECK_COUNTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(56);
  });

  it("gives every player a 5-card opening hand with exactly one Defuse", () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const result = deal(players, seededRng(seed));
        expect(result.hands).toHaveLength(players);
        for (const hand of result.hands) {
          expect(hand).toHaveLength(5);
          expect(hand.filter((c) => c.name === "defuse")).toHaveLength(1);
          expect(hand.filter((c) => c.name === "exploding-kitten")).toHaveLength(0);
        }
      }),
    );
  });

  it("draw pile holds (players - 1) Exploding Kittens and none reach hands", () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const result = deal(players, seededRng(seed));
        const kittens = result.drawPile.filter((c) => c.name === "exploding-kitten");
        expect(kittens).toHaveLength(players - 1);
        expect(result.hands.flat().some((c) => c.name === "exploding-kitten")).toBe(false);
      }),
    );
  });

  it("conserves cards: total in play = 51 + players, draw = 51 - 4 * players", () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const result = deal(players, seededRng(seed));
        expect(allCards(result)).toHaveLength(51 + players);
        expect(result.drawPile).toHaveLength(51 - 4 * players);
      }),
    );
  });

  it("uses exactly 6 Defuses total (1 per player + the rest in the draw pile)", () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const result = deal(players, seededRng(seed));
        const defuses = allCards(result).filter((c) => c.name === "defuse");
        expect(defuses).toHaveLength(6);
      }),
    );
  });

  it("mints unique card ids across the whole deal", () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const ids = allCards(deal(players, seededRng(seed))).map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
      }),
    );
  });

  it("is deterministic for a given seed", () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        expect(deal(players, seededRng(seed))).toEqual(deal(players, seededRng(seed)));
      }),
    );
  });
});

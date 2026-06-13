import { describe, expect, it } from "vitest";
import { CARD_NAMES, CAT_CARD_NAMES, isCatCard } from "./cards.ts";

describe("cards", () => {
  it("has the 13 canonical Base-game card names", () => {
    expect(CARD_NAMES).toHaveLength(13);
    expect(new Set(CARD_NAMES).size).toBe(13);
  });

  it("identifies the five cat cards", () => {
    expect(CAT_CARD_NAMES).toHaveLength(5);
    for (const name of CAT_CARD_NAMES) expect(isCatCard(name)).toBe(true);
  });

  it("does not treat action cards as cat cards", () => {
    for (const name of ["exploding-kitten", "defuse", "nope", "attack", "skip"] as const) {
      expect(isCatCard(name)).toBe(false);
    }
  });
});

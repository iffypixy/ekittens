import { describe, expect, it } from "vitest";
import { isId } from "../id/id.ts";
import { idFromRng, pick, seededRng, shuffle } from "./random.ts";

describe("random", () => {
  it("seededRng is deterministic for a given seed", () => {
    const a = seededRng(42);
    const b = seededRng(42);
    const seqA = Array.from({ length: 10 }, () => a.int(1000));
    const seqB = Array.from({ length: 10 }, () => b.int(1000));
    expect(seqA).toEqual(seqB);
  });

  it("seededRng produces ints within bounds and floats in [0,1)", () => {
    const rng = seededRng(1);
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(6);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
      const f = rng.float();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it("shuffle preserves all elements and does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const frozen = [...input];
    const out = shuffle(input, seededRng(7));
    expect(out).toHaveLength(input.length);
    expect([...out].sort((x, y) => x - y)).toEqual(frozen);
    expect(input).toEqual(frozen); // unchanged
  });

  it("shuffle is deterministic for a given seed", () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffle(input, seededRng(99))).toEqual(shuffle(input, seededRng(99)));
  });

  it("pick returns an element, or undefined when empty", () => {
    expect(pick([], seededRng(1))).toBeUndefined();
    const item = pick(["a", "b", "c"], seededRng(1));
    expect(["a", "b", "c"]).toContain(item);
  });

  it("idFromRng yields valid, deterministic ids", () => {
    const id = idFromRng(seededRng(123));
    expect(isId(id)).toBe(true);
    expect(idFromRng(seededRng(123))).toBe(id);
  });
});

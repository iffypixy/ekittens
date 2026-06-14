import {describe, expect, it} from "vitest";

import {int, next, rng, shuffle} from "./rng";

function sequence(seed: number, n: number): number[] {
  const out: number[] = [];
  let state = rng(seed);
  for (let i = 0; i < n; i++) {
    const step = next(state);
    out.push(step.value);
    state = step.state;
  }
  return out;
}

describe("rng", () => {
  it("is deterministic: same seed yields the same sequence", () => {
    expect(sequence(123, 10)).toEqual(sequence(123, 10));
  });

  it("different seeds yield different sequences", () => {
    expect(sequence(1, 10)).not.toEqual(sequence(2, 10));
  });

  it("produces floats in [0, 1)", () => {
    for (const v of sequence(99, 1000)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("int stays within [0, max)", () => {
    let s = rng(7);
    for (let i = 0; i < 1000; i++) {
      const r = int(s, 5);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(5);
      s = r.state;
    }
  });

  it("shuffle is a permutation that preserves the multiset", () => {
    const items = Array.from({length: 52}, (_, i) => i);
    const {items: shuffled} = shuffle(items, rng(42));
    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });

  it("shuffle does not mutate its input", () => {
    const items = [1, 2, 3, 4, 5];
    const snapshot = [...items];
    shuffle(items, rng(5));
    expect(items).toEqual(snapshot);
  });

  it("shuffle is deterministic per seed and varies across seeds", () => {
    const items = Array.from({length: 20}, (_, i) => i);
    expect(shuffle(items, rng(1)).items).toEqual(shuffle(items, rng(1)).items);
    expect(shuffle(items, rng(1)).items).not.toEqual(shuffle(items, rng(2)).items);
  });
});

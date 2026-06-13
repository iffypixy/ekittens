import { CROCKFORD_ALPHABET, ID_LENGTH, type Id } from "./id.ts";
import type { Rng } from "./ports.ts";

/** A pure Fisher–Yates shuffle. Does not mutate the input. */
export const shuffle = <T>(items: readonly T[], rng: Rng): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const atI = result[i] as T;
    const atJ = result[j] as T;
    result[i] = atJ;
    result[j] = atI;
  }
  return result;
};

/** Pick a uniformly random element, or `undefined` for an empty array. */
export const pick = <T>(items: readonly T[], rng: Rng): T | undefined => {
  if (items.length === 0) return undefined;
  return items[rng.int(items.length)];
};

/**
 * Generate a Crockford-Base32 id from an injected `Rng` — deterministic given
 * the seed, so the pure engine can mint card ids without touching the wall
 * clock or a global RNG.
 */
export const idFromRng = <B extends string>(rng: Rng): Id<B> => {
  let out = "";
  for (let i = 0; i < ID_LENGTH; i++) {
    out += CROCKFORD_ALPHABET[rng.int(CROCKFORD_ALPHABET.length)];
  }
  return out as Id<B>;
};

/**
 * A small, fast, seeded PRNG (mulberry32). Deterministic: the same seed always
 * yields the same sequence — used by the engine and by tests.
 */
export const seededRng = (seed: number): Rng => {
  let state = seed >>> 0;
  const float = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    float,
    int: (bound: number) => Math.floor(float() * bound),
  };
};

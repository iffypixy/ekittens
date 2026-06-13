import type { Brand } from "./id.ts";

/**
 * A source of randomness, injected so domain logic stays deterministic and
 * trivial to test. Implementations may be seeded.
 */
export interface Rng {
  /** A uniformly distributed integer in `[0, bound)`. `bound` must be > 0. */
  int(bound: number): number;
  /** A uniformly distributed float in `[0, 1)`. */
  float(): number;
}

/** A point in time, in milliseconds since the Unix epoch. */
export type Timestamp = Brand<number, "Timestamp">;

/**
 * A source of the current time, injected at the imperative shell so the pure
 * core never reads the wall clock itself.
 */
export interface Clock {
  now(): Timestamp;
}

/** The real, non-deterministic clock — used only at the composition root. */
export const systemClock: Clock = {
  now: () => Date.now() as Timestamp,
};

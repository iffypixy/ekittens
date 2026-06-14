/**
 * Seeded, pure PRNG (mulberry32). The determinism backbone of the engine: state
 * is a single value threaded explicitly, so the same seed always yields the same
 * sequence and any game replays exactly. Nothing downstream uses Math.random.
 */
export type RngState = {readonly seed: number};

export function rng(seed: number): RngState {
  return {seed: seed | 0};
}

/** Advance the generator: a float in [0, 1) plus the next state. */
export function next(state: RngState): {readonly value: number; readonly state: RngState} {
  const a = (state.seed + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return {value, state: {seed: a}};
}

/** A non-negative integer in [0, maxExclusive). */
export function int(
  state: RngState,
  maxExclusive: number,
): {readonly value: number; readonly state: RngState} {
  const advanced = next(state);
  return {value: Math.floor(advanced.value * maxExclusive), state: advanced.state};
}

/** A deterministic Fisher–Yates shuffle returning a new array; input is untouched. */
export function shuffle<T>(
  items: readonly T[],
  state: RngState,
): {readonly items: readonly T[]; readonly state: RngState} {
  const out = items.slice();
  let current = state;
  for (let i = out.length - 1; i > 0; i--) {
    const pick = int(current, i + 1);
    current = pick.state;
    const j = pick.value;
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return {items: out, state: current};
}

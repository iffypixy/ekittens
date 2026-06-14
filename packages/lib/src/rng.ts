/**
 * Seeded pseudo-random generator (mulberry32). The state is threaded by hand, so the
 * same seed always gives the same sequence and a Game can replay exactly.
 */
export type RngState = {readonly seed: number};

export function rng(seed: number): RngState {
  return {seed: seed | 0};
}

export function next(state: RngState): {readonly value: number; readonly state: RngState} {
  const a = (state.seed + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return {value, state: {seed: a}};
}

export function int(
  state: RngState,
  maxExclusive: number,
): {readonly value: number; readonly state: RngState} {
  const advanced = next(state);
  return {value: Math.floor(advanced.value * maxExclusive), state: advanced.state};
}

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

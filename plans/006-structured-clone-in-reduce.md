# Plan 006: Replace the JSON round-trip clone in `reduce` with `structuredClone`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 47fed6b..HEAD -- packages/engine/src/engine.ts`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `47fed6b`, 2026-06-14

## Why this matters

`reduce` clones the entire `GameState` on every command so the input is never
mutated. The clone uses a JSON round-trip:

```ts
function clone(game: GameState): Draft {
  return JSON.parse(JSON.stringify(game)) as Draft;
}
```

This serializes the whole state to a string and re-parses it on every single
command — the most allocation-heavy thing the engine does, paid per move on a
server that may run many concurrent games. It is also brittle: if `GameState`
ever gains a value JSON cannot represent (a `Map`, a `Date`, `undefined` fields),
the round-trip would silently corrupt state. `structuredClone` is a Node built-in
(available since Node 17; the repo runs Node 24), is faster, and clones a wider
range of values faithfully — with no new dependency, which fits `CONVENTIONS.md`
rule 13 ("own what is small", no needless deps).

This is a low-priority correctness-adjacent cleanup, not a hot fix. The engine is
already correct; this makes the clone faster and less fragile.

## Current state

- `packages/engine/src/engine.ts`, lines 339–351:

  ```ts
  // Draft is the mutable twin of GameState: reduce mutates a clone, then seals it back.
  type Draft = z.infer<typeof GameStateSchema>;
  type DraftPlayer = Draft["players"][number];
  type PlayCommand = Extract<Command, {type: "play-card"}>;
  type Step = Result<{state: GameState; events: readonly Event[]}, GameError>;

  // A deep clone, so the input game is never mutated; the state is plain JSON.
  function clone(game: GameState): Draft {
    return JSON.parse(JSON.stringify(game)) as Draft;
  }
  function seal(draft: Draft): GameState {
    return draft as unknown as GameState;
  }
  ```

- `clone` is called inside the per-command handlers (`drawCard`, `playCard`,
  `provideDefuse`, `insertKitten`, `submitFutureOrder`, `buryCard`, `applyTimeout`,
  `applyConcede`). The contract that matters is tested by
  `engine.test.ts:584-589` ("does not mutate the input game") — keep it green.
- `GameState` is currently plain JSON (objects, arrays, strings, numbers); see
  `GameStateSchema` in `model.ts:152-167`. `structuredClone` handles all of these.

## Commands you will need

| Purpose            | Command                                  | Expected on success |
|--------------------|------------------------------------------|---------------------|
| Typecheck (all)    | `pnpm typecheck`                         | exit 0              |
| Test (engine only) | `pnpm --filter @ekittens/engine test`    | all pass            |

## Scope

**In scope**:
- `packages/engine/src/engine.ts` — only the body of the `clone` function.

**Out of scope** (do NOT touch):
- `seal`, the `Draft` types, or any handler — only the clone implementation changes.
- `model.ts` / the schema.
- Anything that would change observable behaviour.

## Git workflow

- Branch: `advisor/006-structured-clone`
- Commit message style: conventional commits (e.g. `perf: use structuredClone in reduce`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Swap the clone implementation

Replace the body of `clone`, and update its comment to record the *why*
(`CONVENTIONS.md` rule 20):

```ts
// A deep clone, so the input game is never mutated. structuredClone is a native,
// dependency-free deep copy; the state is plain data that it reproduces faithfully.
function clone(game: GameState): Draft {
  return structuredClone(game) as Draft;
}
```

`structuredClone` is a global in Node ≥17 and in the test runtime (vitest on
Node 24). No import is needed.

**Verify**: `pnpm typecheck` → exit 0. If the TS lib complains that
`structuredClone` is not defined, STOP (the `tsconfig` `lib` is `ES2022`, which
does not include DOM/Node globals) — see STOP conditions for the resolution.

### Step 2: Confirm behaviour is unchanged

The whole engine + simulation suite is the behavioural guard: determinism,
replay, conservation invariants, and the explicit "does not mutate the input
game" test all exercise the clone.

**Verify**: `pnpm --filter @ekittens/engine test` → all pass, including
`engine.test.ts:584` ("does not mutate the input game") and the
`simulate.test.ts` property/replay tests.

## Test plan

- No new test is required; the existing immutability test
  (`engine.test.ts:584-589`) and the determinism/replay property tests
  (`simulate.test.ts:40-58`) fully cover the clone contract.
- Verification: `pnpm --filter @ekittens/engine test` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm --filter @ekittens/engine test` exits 0; all existing tests pass
- [ ] `grep -n "JSON.parse(JSON.stringify" packages/engine/src/engine.ts` returns nothing
- [ ] `grep -n "structuredClone" packages/engine/src/engine.ts` returns the clone
- [ ] Only `packages/engine/src/engine.ts` is modified, and only the `clone` function (`git diff`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm typecheck` errors with `Cannot find name 'structuredClone'`. The fix is a
  one-line tsconfig change (add Node types or widen `lib`), but that is a
  toolchain decision outside this plan's scope — report it and propose adding
  `"types": ["node"]` (requires `@types/node`) or keeping the JSON clone.
- Any existing test fails after the swap — that would mean the state holds a value
  `structuredClone` treats differently than the JSON round-trip; report it.

## Maintenance notes

- If `GameState` ever gains a non-plain value (Map/Set/Date), `structuredClone`
  handles them whereas the old JSON clone would not — but the `Draft`/`seal` cast
  assumes the shape is unchanged, so revisit the types then.
- A reviewer should confirm the diff touches only `clone` and that no behaviour
  changed (the test suite proves it).

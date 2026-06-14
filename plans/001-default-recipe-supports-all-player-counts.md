# Plan 001: `defaultRecipe` produces a startable Game for every supported player count (2–10)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 47fed6b..HEAD -- packages/engine/src/engine.ts`
> Note: when this plan was written, `packages/engine/src/engine.ts` had
> **uncommitted working-tree edits** (cosmetic renames). The "Current state"
> excerpt below is from that working tree. If the live code does not match the
> excerpt, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `47fed6b`, 2026-06-14

## Why this matters

The game advertises 2–10 players: `RULES.md` says "for 2 to 10 players" and
`GameConfigSchema` enforces `.min(2).max(10)` (`packages/engine/src/model.ts:81`).
But `defaultRecipe` returns a fixed deck whose dealable pool is only 52 cards,
while dealing every opening hand needs `players × (handSize − defusesPerPlayer)
= 7 × n` cards. For `n ≥ 8` that is 56–70 cards, so `createGame(defaultRecipe(...))`
fails its own `validateConfig` check and returns `{type: "invalid-config",
reason: "not enough cards to deal every hand"}`. Any lobby that picks the
default recipe with 8, 9, or 10 players cannot start a Game at all.

Verified empirically (dealable pool = 52; needs 56 at n=8, 63 at n=9, 70 at n=10).

After this plan, `createGame(defaultRecipe(players, seed), id)` returns an `ok`
result for every `n` in 2..10, and leaves a non-trivial draw pile.

## Current state

- `packages/engine/src/engine.ts` — the engine. Relevant pieces:
  - `defaultRecipe` (lines 40–71) returns a `GameConfig` with fixed card counts.
    Only `exploding-kitten` (`n − 1`) and `defuse` (`n + 2`) scale with `n`; every
    other count is constant, so the dealable pool never grows.
  - `validateConfig` (lines 73–101) rejects a recipe whose dealable pool is too
    small. The relevant gate (lines 94–99):

    ```ts
    const dealablePool = CardSchema.options.reduce(
      (sum, name) => (name === "defuse" || isSetAside(name) ? sum : sum + countOf(config, name)),
      0,
    );
    if (dealablePool < players * (config.handSize - config.defusesPerPlayer))
      return {type: "invalid-config", reason: "not enough cards to deal every hand"};
    ```

  - The current `defaultRecipe` body (lines 40–71):

    ```ts
    /** A reasonable default recipe scaled to the player count. The counts are tunable. */
    export function defaultRecipe(players: readonly PlayerId[], seed: number): GameConfig {
      const n = players.length;
      return {
        players: [...players],
        seed,
        handSize: 8,
        defusesPerPlayer: 1,
        cards: {
          "exploding-kitten": Math.max(1, n - 1),
          "imploding-kitten-closed": 1,
          "imploding-kitten-open": 0,
          defuse: n + 2,
          "streaking-kitten": 2,
          attack: 4,
          "targeted-attack": 3,
          "personal-attack": 2,
          skip: 4,
          "super-skip": 2,
          reverse: 4,
          shuffle: 4,
          "swap-top-and-bottom": 2,
          "catomic-bomb": 1,
          "see-the-future-3x": 5,
          "see-the-future-5x": 2,
          "alter-the-future-3x": 4,
          "share-the-future-3x": 3,
          "draw-from-the-bottom": 4,
          mark: 2,
          bury: 4,
        },
      };
    }
    ```

- `packages/engine/src/engine.test.ts` — engine unit tests; the `createGame`
  describe block is at lines 102–152. Test helpers `players(n)` and `recipe(n, seed)`
  are at lines 35–40. Use these.

Conventions that apply (from `CONVENTIONS.md`): keep the function pure and
deterministic (no clock, no `Math.random` — randomness is the seed only;
`defaultRecipe` builds counts, it does not shuffle); comment the *why* not the
*what* (rule 20); prefer immutable construction (rule 5).

## Commands you will need

| Purpose            | Command                                              | Expected on success |
|--------------------|-----------------------------------------------------|---------------------|
| Install            | `pnpm install`                                      | exit 0              |
| Typecheck (all)    | `pnpm typecheck`                                    | exit 0, no errors   |
| Test (engine only) | `pnpm --filter @ekittens/engine test`               | all pass            |
| Test (one file)    | `pnpm --filter @ekittens/engine exec vitest run engine.test` | all pass    |

## Scope

**In scope** (the only files you should modify):
- `packages/engine/src/engine.ts` — only the `defaultRecipe` function body
- `packages/engine/src/engine.test.ts` — add tests

**Out of scope** (do NOT touch, even though they look related):
- `validateConfig` — it is correct; the recipe is what is wrong. Do not relax
  validation to paper over the bug.
- `GameConfigSchema` / `model.ts` — the 2..10 bound is correct.
- The simulation files (`simulate.ts`, `simulate.test.ts`).

## Git workflow

- Branch: `advisor/001-default-recipe-player-counts`
- Commit message style: conventional commits (e.g. `fix: scale default recipe to player count`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Scale the dealable card counts with player count

In `defaultRecipe`, make the non-kitten, non-defuse card counts grow with `n` so
the dealable pool always covers `7 × n` opening-hand cards plus a comfortable
draw pile. Keep the base counts as the per-table baseline and multiply them by a
small integer factor.

Replace the `defaultRecipe` body so that:
- A multiplier `const mult = Math.max(1, Math.ceil(n / 4));` is computed from `n`.
  (n≤4 → ×1, n 5–8 → ×2, n 9–10 → ×3.)
- `exploding-kitten` stays `Math.max(1, n - 1)`, `imploding-kitten-closed` stays
  `1`, `imploding-kitten-open` stays `0`, `defuse` stays `n + 2`.
- Every **other** card count is its current base value multiplied by `mult`.

Target shape (preserve the existing base numbers; only the multiplier is new):

```ts
/** A reasonable default recipe scaled to the player count. The counts are tunable. */
export function defaultRecipe(players: readonly PlayerId[], seed: number): GameConfig {
  const n = players.length;
  // The dealable pool must cover handSize-1 cards per player; the baseline 52-card
  // pool runs out past 7 players, so the non-kitten cards scale with the table.
  const mult = Math.max(1, Math.ceil(n / 4));
  return {
    players: [...players],
    seed,
    handSize: 8,
    defusesPerPlayer: 1,
    cards: {
      "exploding-kitten": Math.max(1, n - 1),
      "imploding-kitten-closed": 1,
      "imploding-kitten-open": 0,
      defuse: n + 2,
      "streaking-kitten": 2 * mult,
      attack: 4 * mult,
      "targeted-attack": 3 * mult,
      "personal-attack": 2 * mult,
      skip: 4 * mult,
      "super-skip": 2 * mult,
      reverse: 4 * mult,
      shuffle: 4 * mult,
      "swap-top-and-bottom": 2 * mult,
      "catomic-bomb": 1 * mult,
      "see-the-future-3x": 5 * mult,
      "see-the-future-5x": 2 * mult,
      "alter-the-future-3x": 4 * mult,
      "share-the-future-3x": 3 * mult,
      "draw-from-the-bottom": 4 * mult,
      mark: 2 * mult,
      bury: 4 * mult,
    },
  };
}
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Add a regression test that every supported count is startable

In `packages/engine/src/engine.test.ts`, inside the existing `describe("createGame", ...)`
block (after the test at line 151, before the closing `});` at line 152), add:

```ts
  it("produces a startable game for every supported player count (2..10)", () => {
    for (let n = 2; n <= 10; n++) {
      const result = createGame(recipe(n, n * 3 + 1), gid("g"));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        for (const player of result.value.players) expect(player.hand).toHaveLength(8);
        // A real game needs cards left to draw after the deal.
        expect(result.value.drawPile.length).toBeGreaterThan(n);
      }
    }
  });
```

`isOk`, `createGame`, `recipe`, and `gid` are already imported/defined in this
file (`isOk` from `./index` at line 1; `recipe`/`gid`/`players` are local helpers
at lines 23–40). If `isOk` is not in the import list at the top of the file, add
it to the existing `import {...} from "@ekittens/lib/result"` line — but check
first; do not duplicate an import.

**Verify**: `pnpm --filter @ekittens/engine exec vitest run engine.test` →
all pass, including the new test.

### Step 3: Full verification

**Verify**:
- `pnpm typecheck` → exit 0
- `pnpm --filter @ekittens/engine test` → all pass (the property/simulation
  tests in `simulate.test.ts` still only run n=2..5 and must stay green).

## Test plan

- New test (Step 2): `createGame(recipe(n, …))` is `ok` for every n in 2..10,
  each player holds 8 cards, and the draw pile is non-empty.
- Structural pattern: model after the existing `createGame` tests at
  `engine.test.ts:139-151`.
- Verification: `pnpm --filter @ekittens/engine test` → all pass, one new test.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm --filter @ekittens/engine test` exits 0; the new "every supported
      player count" test exists and passes
- [ ] The following one-liner prints `valid=true` for n=2..10:
      `node -e 'const m=n=>Math.max(1,Math.ceil(n/4));const base={"streaking-kitten":2,attack:4,"targeted-attack":3,"personal-attack":2,skip:4,"super-skip":2,reverse:4,shuffle:4,"swap-top-and-bottom":2,"catomic-bomb":1,"see-the-future-3x":5,"see-the-future-5x":2,"alter-the-future-3x":4,"share-the-future-3x":3,"draw-from-the-bottom":4,mark:2,bury:4};for(let n=2;n<=10;n++){let pool=0;for(const v of Object.values(base))pool+=v*m(n);console.log("n="+n,"valid="+(pool>=n*7));}'`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The live `defaultRecipe` body does not match the "Current state" excerpt
  (the code drifted since this plan was written).
- After Step 1, any existing test in `simulate.test.ts` fails (the multiplier
  must not change behaviour for n=2..5 in a way that breaks determinism — it
  changes deck *contents*, which is expected to change simulation outcomes; if a
  determinism/replay property test fails, that is a real problem — stop).
- Typecheck reports that `cards` no longer satisfies `GameConfigSchema`'s record
  type.

## Maintenance notes

- The multiplier is a coarse fix for validity, not a balance pass. If the deck
  is later rebalanced, keep the invariant that the dealable pool ≥ `n ×
  (handSize − defusesPerPlayer)` for n up to 10 — Plan 003 adds a standing test
  for this.
- A reviewer should confirm `validateConfig` was not weakened and that the 2..10
  schema bound is unchanged.

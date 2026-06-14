# Plan 003: Add direct tests for untested critical engine paths

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 47fed6b..HEAD -- packages/engine/src`
> Excerpts are from the working tree as it stood at this commit (with the
> uncommitted cosmetic renames applied). On a mismatch, treat it as a STOP
> condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-default-recipe-supports-all-player-counts.md
  (the "recipe valid for all counts" assertion will fail until 001 lands)
- **Category**: tests
- **Planned at**: commit `47fed6b`, 2026-06-14

## Why this matters

The engine has strong property and simulation coverage, but a few critical paths
are exercised only indirectly or not at all:

1. **Empty-deck elimination** (`could-not-draw`). `performDraw` eliminates the
   active player when the deck is empty (`engine.ts:429-432`), but no unit test
   covers it directly; the random simulations rarely empty the deck (kittens get
   shielded or defused back), so this branch can silently rot.
2. **`defaultRecipe` across player counts.** The simulations only run n=2..5
   (`simulate.test.ts:42,114`). The default recipe being unusable for 8–10
   players went undetected for exactly this reason (see Plan 001). A standing test
   across the full 2..10 range guards against regressions.
3. **`availableActions` contract.** It is a public export (`index.ts:44`) used by
   any client/bot to know what a player may do, yet it has no direct test — only
   indirect exercise through `randomMove`.

These are cheap to add and turn three implicit assumptions into explicit,
machine-checked guarantees.

## Current state

- `packages/engine/src/engine.ts`:
  - Empty-deck path in `performDraw` (lines 428–433):

    ```ts
    function performDraw(draft: Draft, fromBottom: boolean, events: Event[]): void {
      if (draft.drawPile.length === 0) {
        // If you must draw but the deck is empty, you are out.
        eliminate(draft, draft.turn.active, "could-not-draw", events);
        return;
      }
      ...
    ```

  - `availableActions(game, player)` (lines 250–288) returns
    `{canConcede, draw, playable, resolve}`. Key behaviours to lock in:
    - a non-active living player gets `{...NO_ACTIONS, canConcede: true}` (line 254);
    - the active player in `awaiting-action` gets `draw: true` and a `playable`
      list of the **playable** cards in hand (lines 257–262);
    - `defusing` exposes `resolve.kind === "defuse"` with the defuse card ids
      (lines 263–268).

- `packages/engine/src/engine.test.ts`:
  - Helpers `makeGame`, `handOf`, `run`, `names`, `pid`, `cid`, `ci` (lines 23–100).
  - `availableActions` is **not currently imported**. You will add it to the
    import from `./index` (the export exists at `index.ts:44`).
  - Existing `createGame` describe block (lines 102–152) is where the recipe
    coverage test belongs.
  - Existing `drawing` describe block (lines 154–235) is where the empty-deck
    test belongs.

Conventions: test the contract, not the implementation (`CONVENTIONS.md` rule 22)
— assert observable outputs (`outcome`, `defeated`, `availableActions` return
value), not internal calls. Follow the existing test style exactly (rule 19).

## Commands you will need

| Purpose            | Command                                              | Expected on success |
|--------------------|-----------------------------------------------------|---------------------|
| Install            | `pnpm install`                                      | exit 0              |
| Typecheck (all)    | `pnpm typecheck`                                    | exit 0, no errors   |
| Test (engine only) | `pnpm --filter @ekittens/engine test`               | all pass            |
| Test (one file)    | `pnpm --filter @ekittens/engine exec vitest run engine.test` | all pass    |

## Scope

**In scope**:
- `packages/engine/src/engine.test.ts` — add tests and, if needed, extend the
  import of `availableActions` from `./index`.

**Out of scope** (do NOT touch):
- `packages/engine/src/engine.ts` and all other source files — this plan adds
  tests only. If a test reveals a bug, STOP and report; do not fix source here.
- `simulate.test.ts` — leave the simulation suite as is.

## Git workflow

- Branch: `advisor/003-critical-path-tests`
- Commit message style: conventional commits (e.g. `test: cover empty-deck, recipe range, and availableActions`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Import `availableActions`

At the top of `engine.test.ts`, add `availableActions` to the existing
`import {...} from "./index"` block (lines 4–21). Insert it alphabetically near
`createGame`. Do not create a second import statement.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Empty-deck elimination test

In `describe("drawing", ...)`, before its closing `});` (line 235), add:

```ts
  it("drawing from an empty deck knocks the active player out", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}, {id: "p2", hand: []}],
      drawPile: [],
    });
    const {state, events} = run(game, {type: "draw-card", by: pid("p0")});
    expect(state.defeated[0]?.reason).toBe("could-not-draw");
    expect(state.players.some((p) => p.id === pid("p0"))).toBe(false);
    expect(events.some((e) => e.type === "player-defeated")).toBe(true);
  });
```

**Verify**: `pnpm --filter @ekittens/engine exec vitest run engine.test` → passes.

### Step 3: `availableActions` contract tests

Add a new describe block after the `redaction` block (after line 622, at the end
of the file):

```ts
describe("availableActions", () => {
  it("offers draw and the playable cards to the active player when awaiting action", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("skip", "s"), ci("defuse", "d")]}, {id: "p1", hand: []}],
    });
    const actions = availableActions(game, pid("p0"));
    expect(actions.draw).toBe(true);
    expect(actions.playable).toEqual([cid("s")]); // defuse is not playable from hand
    expect(actions.resolve.kind).toBe("none");
  });

  it("lets a non-active player only concede", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: [ci("skip", "s")]}],
    });
    const actions = availableActions(game, pid("p1"));
    expect(actions).toEqual({canConcede: true, draw: false, playable: [], resolve: {kind: "none"}});
  });

  it("asks the active player to defuse during a defusing phase", () => {
    const game = makeGame({
      players: [{id: "p0", hand: [ci("defuse", "d")]}, {id: "p1", hand: []}],
      phase: {kind: "defusing", card: ci("exploding-kitten", "ek")},
    });
    const actions = availableActions(game, pid("p0"));
    expect(actions.draw).toBe(false);
    expect(actions.resolve).toEqual({kind: "defuse", defuses: [cid("d")]});
  });
});
```

**Verify**: `pnpm --filter @ekittens/engine exec vitest run engine.test` → passes.

### Step 4: Recipe-range coverage (depends on Plan 001)

> If Plan 001 has **not** landed yet, this step's assertion will fail for n≥8.
> In that case, STOP and report that 001 is a prerequisite — do not weaken the
> assertion.

If Plan 001 already added a "produces a startable game for every supported player
count" test, **skip this step** (do not duplicate it). Otherwise, add to
`describe("createGame", ...)` before line 152:

```ts
  it("produces a startable game for every supported player count (2..10)", () => {
    for (let n = 2; n <= 10; n++) {
      const result = createGame(recipe(n, n * 3 + 1), gid("g"));
      expect(isOk(result)).toBe(true);
    }
  });
```

(`isOk` is imported at line 1; `recipe`/`gid` are local helpers.)

**Verify**: `pnpm --filter @ekittens/engine test` → all pass.

## Test plan

- Empty deck → `could-not-draw` elimination (Step 2).
- `availableActions` for: active+awaiting, non-active (concede-only), defusing
  (Step 3).
- `createGame` ok for all 2..10 (Step 4, if not already present from Plan 001).
- Structural pattern: the whole file `engine.test.ts` is the pattern; match its
  helper usage and assertion style.
- Verification: `pnpm --filter @ekittens/engine test` → all pass, ~4–5 new tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm --filter @ekittens/engine test` exits 0 with the new tests present
- [ ] `grep -c "availableActions" packages/engine/src/engine.test.ts` returns ≥ 4
- [ ] Only `packages/engine/src/engine.test.ts` is modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any new test fails because the source behaves differently than described — that
  is a real bug; report it, do not edit source in this plan.
- Step 4's recipe test fails for n≥8 and Plan 001 is not yet merged (expected;
  report that 001 must land first).
- `availableActions` is not exported from `./index` (it should be at
  `index.ts:44`).

## Maintenance notes

- When new phases or cards are added, extend the `availableActions` describe block
  with the new resolve kinds.
- The empty-deck test is the only direct guard on the `could-not-draw` branch;
  keep it if `performDraw` is refactored.

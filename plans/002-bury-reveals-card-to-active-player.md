# Plan 002: `bury` reveals the buried card to the active player

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 47fed6b..HEAD -- packages/engine/src/engine.ts`
> Note: `packages/engine/src/engine.ts` had **uncommitted working-tree edits**
> when this plan was written; excerpts below are from that working tree. On a
> mismatch with the live code, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `47fed6b`, 2026-06-14

## Why this matters

The `bury` card's entire ability is the private look: `RULES.md:54` —
"Bury | Look at the top card and secretly put it back anywhere in the deck, then
end your turn." The engine moves the top card into a `burying-card` phase and
lets the active player pick a position, but it **never surfaces the card's
identity to that player**. `peekFor` only reveals during `altering-future` and
`sharing-future`, and the `bury` entry of `AvailableActions.resolve` carries only
`maxPosition`. So a player who plays `bury` chooses where to hide a card they
were never shown — the card is functionally pointless.

`see-the-future`, `alter-the-future`, and `share-the-future` all reveal the deck
cards they touch (via the `future-revealed` event or the `peek` field). `bury`
is the lone deck-peek card whose reveal is missing. ADR `docs/adr/0002-reduce-returns-state-and-events.md`
establishes the redacted snapshot's `peek` field as the channel for "look at
deck cards" reveals; this plan routes `bury` through that same channel.

After this plan, `redact(game, active).peek` returns the single buried card while
the `burying-card` phase is open, and returns `null` for everyone else — matching
how `altering-future` already behaves.

## Current state

- `packages/engine/src/engine.ts`:
  - `peekFor` (lines 200–208) decides what deck cards a viewer may see. It
    currently handles only two phases:

    ```ts
    function peekFor(game: GameState, viewer: PlayerId | null): readonly CardInstance[] | null {
      if (viewer === null) return null;
      return match(game.phase)
        .with({kind: "altering-future"}, (phase) => (viewer === game.turn.active ? phase.cards : null))
        .with({kind: "sharing-future"}, (phase) =>
          viewer === game.turn.active || viewer === phase.sharedWith ? phase.cards : null,
        )
        .otherwise(() => null);
    }
    ```

  - `redact` (lines 211–230) calls `peek: peekFor(game, viewer)` and returns the
    `PlayerView` whose `peek` field is documented (lines 195–196) as "Top cards a
    peek has revealed to this viewer."
  - The `burying-card` phase holds the card at `game.phase.card`. Its shape is
    defined in `model.ts:122`:
    `z.object({kind: z.literal("burying-card"), card: CardInstanceSchema})`.
  - For reference, `buryCard` (lines 703–720) is the resolver: it reinserts
    `phase.card` at the chosen position and ends the turn. Do **not** change it.

- `packages/engine/src/engine.test.ts`:
  - The `redaction` describe block is at lines 592–622 and already tests the
    `altering-future` and `sharing-future` peeks (lines 604–621). Model the new
    test on those.
  - The `makeGame` helper (lines 46–84) accepts a `phase` field and tallies cards
    for the conservation invariant, so a `burying-card` phase works out of the box.

Conventions that apply: match exhaustively with `ts-pattern` (`CONVENTIONS.md`
rule 9 — `peekFor` uses `.otherwise()` which is acceptable here since most phases
share the `null` result); keep the change minimal and consistent with the
existing two cases (rule 19 "do each thing one way").

## Commands you will need

| Purpose            | Command                                              | Expected on success |
|--------------------|-----------------------------------------------------|---------------------|
| Install            | `pnpm install`                                      | exit 0              |
| Typecheck (all)    | `pnpm typecheck`                                    | exit 0, no errors   |
| Test (engine only) | `pnpm --filter @ekittens/engine test`               | all pass            |
| Test (one file)    | `pnpm --filter @ekittens/engine exec vitest run engine.test` | all pass    |

## Scope

**In scope** (the only files you should modify):
- `packages/engine/src/engine.ts` — only the `peekFor` function
- `packages/engine/src/engine.test.ts` — add a test

**Out of scope** (do NOT touch):
- `buryCard`, `applyCardEffect`'s `"bury"` branch, or the `burying-card` phase
  schema — the state transitions are correct; only the *view* is missing.
- `AvailableActions` / the `Resolve` type — the bot picks a position without
  needing the card identity; the reveal belongs in `peek`, not in `resolve`.
- `model.ts` — no schema change is needed.

## Git workflow

- Branch: `advisor/002-bury-reveal`
- Commit message style: conventional commits (e.g. `fix: reveal buried card to the active player`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Surface the buried card through `peekFor`

Add a `burying-card` case to the `match` in `peekFor`, returning the held card to
the active player only (as a one-element array, matching the array return type):

```ts
function peekFor(game: GameState, viewer: PlayerId | null): readonly CardInstance[] | null {
  if (viewer === null) return null;
  return match(game.phase)
    .with({kind: "altering-future"}, (phase) => (viewer === game.turn.active ? phase.cards : null))
    .with({kind: "sharing-future"}, (phase) =>
      viewer === game.turn.active || viewer === phase.sharedWith ? phase.cards : null,
    )
    .with({kind: "burying-card"}, (phase) => (viewer === game.turn.active ? [phase.card] : null))
    .otherwise(() => null);
}
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Add a redaction test for the bury peek

In `packages/engine/src/engine.test.ts`, inside `describe("redaction", ...)`
(after the test ending at line 621, before the closing `});` at line 622), add:

```ts
  it("shows the buried card only to the active player", () => {
    const game = makeGame({
      players: [{id: "p0", hand: []}, {id: "p1", hand: []}],
      phase: {kind: "burying-card", card: ci("skip", "x")},
    });
    expect(names(redact(game, pid("p0")).peek ?? [])).toEqual(["skip"]);
    expect(redact(game, pid("p1")).peek).toBeNull();
    expect(redact(game, null).peek).toBeNull();
  });
```

`makeGame`, `ci`, `names`, `redact`, and `pid` are all already defined/imported
in this file (helpers at lines 23–100; `redact` from `./index` at line 1).

**Verify**: `pnpm --filter @ekittens/engine exec vitest run engine.test` →
all pass, including the new test.

### Step 3: Full verification

**Verify**:
- `pnpm typecheck` → exit 0
- `pnpm --filter @ekittens/engine test` → all pass.

## Test plan

- New test (Step 2): during a `burying-card` phase, `redact(...).peek` reveals the
  single buried card to the active player, `null` to a non-active player, `null`
  to a spectator (`viewer === null`).
- Structural pattern: model after `engine.test.ts:604-611` ("shows an alter peek
  only to the active player").
- Verification: `pnpm --filter @ekittens/engine test` → all pass, one new test.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm --filter @ekittens/engine test` exits 0; the new bury-peek test passes
- [ ] `grep -n "burying-card" packages/engine/src/engine.ts` shows the new case in
      `peekFor` (in addition to the existing resolver)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The live `peekFor` does not match the "Current state" excerpt.
- Typecheck complains about the return type of the new arm — the other arms
  return `phase.cards` (a `readonly CardInstance[]`); `[phase.card]` must unify
  with that. If it does not, STOP rather than casting.
- You find yourself needing to change `model.ts`, `buryCard`, or the `Resolve`
  type to make the reveal work — that means the chosen approach is wrong; stop
  and report.

## Maintenance notes

- If a future card also performs a private single-card look at the deck, route it
  through `peekFor` the same way rather than adding a new field.
- The wire shape of `peek` (whether it travels in the snapshot or a side channel)
  is deferred to the server milestone per ADR 0002; this change keeps `peek` as
  the single source for deck reveals, so that decision stays open.
- A reviewer should confirm the buried card is shown to the active player **only**
  and never leaks to opponents or spectators.

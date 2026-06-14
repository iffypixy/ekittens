# Plan 008: Rename `lib/types.ts` to `readonly.ts` so the filename is a promise

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 47fed6b..HEAD -- packages/lib packages/engine/src/model.ts`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `47fed6b`, 2026-06-14

## Why this matters

`CONVENTIONS.md` rule 14: "Make every file name a promise about its contents.
Group by capability, like `async.ts` or `result.ts`, and never create a
`utils.ts`, `helpers.ts`, or any other dumping ground." `packages/lib/src/types.ts`
holds exactly one thing — the `DeepReadonly` type utility — but `types.ts` is a
generic catch-all name that invites future unrelated types to pile in. Renaming
it to `readonly.ts` makes the filename describe its capability and matches the
sibling convention (`result.ts`, `rng.ts`, `assert.ts`, `tc.ts`).

This is a small consistency fix, not a behaviour change. It touches the lib's
public subpath export, so it must be done atomically with its one importer.

## Current state

- `packages/lib/src/types.ts` — the only content:

  ```ts
  type Primitive = string | number | boolean | bigint | symbol | null | undefined;

  /** Deeply readonly version of a type. Primitives, including branded ids, pass through unchanged so branding survives. */
  export type DeepReadonly<T> = T extends Primitive
    ? T
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepReadonly<U>>
      : {readonly [K in keyof T]: DeepReadonly<T[K]>};
  ```

- `packages/lib/package.json` exposes it as a subpath export (lines 6–12):

  ```json
  "exports": {
    "./result": "./src/result.ts",
    "./tc": "./src/tc.ts",
    "./assert": "./src/assert.ts",
    "./rng": "./src/rng.ts",
    "./types": "./src/types.ts"
  },
  ```

- The **only** importer is `packages/engine/src/model.ts:3`:

  ```ts
  import type {DeepReadonly} from "@ekittens/lib/types";
  ```

  (Confirmed: `grep -rn "@ekittens/lib/types" --include=*.ts` returns only this
  one line. There is no other importer and no barrel/index re-export in lib.)

## Commands you will need

| Purpose         | Command                  | Expected on success |
|-----------------|--------------------------|---------------------|
| Find importers  | `grep -rn "@ekittens/lib/types" --include=*.ts .` | only `model.ts:3` before, nothing after |
| Typecheck (all) | `pnpm typecheck`         | exit 0              |
| Test            | `pnpm test`              | all pass            |

## Scope

**In scope**:
- `packages/lib/src/types.ts` → rename to `packages/lib/src/readonly.ts`
- `packages/lib/package.json` — update the export key/path
- `packages/engine/src/model.ts` — update the import specifier (line 3)

**Out of scope** (do NOT touch):
- The `DeepReadonly` definition itself — content is unchanged.
- Any other lib file or export.

## Git workflow

- Branch: `advisor/008-rename-lib-types`
- Commit message style: conventional commits (e.g. `refactor: rename lib/types to readonly`).
- Use `git mv` so history follows the file.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rename the file

```
git mv packages/lib/src/types.ts packages/lib/src/readonly.ts
```

**Verify**: `ls packages/lib/src/readonly.ts` exists; `ls packages/lib/src/types.ts`
does not.

### Step 2: Update the lib export map

In `packages/lib/package.json`, change the export entry from:

```json
    "./types": "./src/types.ts"
```

to:

```json
    "./readonly": "./src/readonly.ts"
```

Keep the trailing-comma/format consistent with the surrounding entries.

**Verify**: `grep -n "readonly" packages/lib/package.json` shows the new entry;
`grep -n "types" packages/lib/package.json` shows none.

### Step 3: Update the importer

In `packages/engine/src/model.ts` line 3, change:

```ts
import type {DeepReadonly} from "@ekittens/lib/types";
```

to:

```ts
import type {DeepReadonly} from "@ekittens/lib/readonly";
```

**Verify**: `grep -rn "@ekittens/lib/types" --include=*.ts .` returns nothing.

### Step 4: Reinstall (workspace export map changed) and verify

The subpath export map changed, so refresh the workspace link:

```
pnpm install
```

**Verify**:
- `pnpm typecheck` → exit 0
- `pnpm test` → all pass

## Test plan

- No new tests; the existing engine + lib suites compile against the renamed
  export and prove the rename is wired correctly (a broken import fails typecheck).
- Verification: `pnpm typecheck` and `pnpm test` both succeed.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `packages/lib/src/readonly.ts` exists; `packages/lib/src/types.ts` does not
- [ ] `grep -rn "@ekittens/lib/types" --include=*.ts .` returns nothing
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] Only the three in-scope files are changed (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `grep` finds an importer of `@ekittens/lib/types` other than `model.ts` (the
  codebase drifted and there are more call sites than this plan accounts for).
- `pnpm typecheck` cannot resolve `@ekittens/lib/readonly` after `pnpm install` —
  report it (the export map or workspace link may need attention) rather than
  reverting to the old name silently.

## Maintenance notes

- If more readonly/immutability utilities are added later, they belong in
  `readonly.ts` alongside `DeepReadonly`; do not recreate a generic `types.ts`.
- A reviewer should confirm the export map and the single importer moved together
  (an export rename without the import update would fail typecheck — which is the
  guard).

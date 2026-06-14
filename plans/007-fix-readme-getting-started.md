# Plan 007: Correct the README getting-started instructions

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 47fed6b..HEAD -- README.md package.json`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `47fed6b`, 2026-06-14

## Why this matters

The README's "Getting started" tells a new contributor to run `npm i` and
`npm run start`, but the repo is a **pnpm** workspace (`pnpm-workspace.yaml`,
`pnpm-lock.yaml`) and root `package.json` has **no `start` script** — only `test`
and `typecheck`. It also says `cd ./ekittens-[branch]`, which is not a real
directory. Wrong setup docs are worse than none: they send the first command a
contributor runs into a dead end. This is the entry point to the whole repo,
including the `packages/` the rest of these plans touch.

After this plan, the README's setup steps are commands that actually work for the
current repo state.

## Current state

- `README.md`, "Getting started" section (lines 24–51):

  ```markdown
  ### Steps

  Clone the repository:

  ```
  git clone https://github.com/iffypixy/ekittens
  cd ./ekittens-[branch]
  ```

  Insert your env variables:

  ```
  cp .env.sample .env
  ```

  Install dependencies and run:

  ```
  npm i
  npm run start
  ```
  ```

- Root `package.json` scripts (lines 5–8): only `test` and `typecheck`. There is
  no `start` script and no `.env.sample` at the repo root (confirm:
  `ls .env.sample` → not found).
- The runnable surface today is the `packages/*` workspaces (engine, lib); the
  `apps/*` are present but the root exposes no run command. Do **not** invent a
  `start` script — document what exists.

## Commands you will need

| Purpose       | Command          | Expected on success |
|---------------|------------------|---------------------|
| Verify scripts| `cat package.json` | shows the available root scripts (`test`, `typecheck`) |
| Sanity        | `pnpm install`   | exit 0              |
| Sanity        | `pnpm test`      | all pass            |

## Scope

**In scope**:
- `README.md` — only the "Getting started" section (lines ~24–51).

**Out of scope** (do NOT touch):
- The "Features" and "Overview" sections (they describe product intent; leave them).
- `package.json` — do **not** add a `start` script to make the old text true;
  document reality instead.
- Any `apps/**` README or docs.

## Git workflow

- Branch: `advisor/007-readme`
- Commit message style: conventional commits (e.g. `docs: fix getting-started for pnpm workspace`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm the true setup commands

Run `cat package.json` and confirm the available root scripts. Confirm there is
no `.env.sample` (`ls .env.sample`). Confirm pnpm is the package manager
(`pnpm-workspace.yaml` exists).

**Verify**: confirm the root scripts (currently `test`, `typecheck`); document
whatever exists. No `.env.sample` at the repo root.

### Step 2: Rewrite the "Steps" subsection

Replace the body of the "### Steps" subsection (the clone/env/install-and-run
blocks shown in "Current state") with text that matches reality:

```markdown
### Steps

Clone the repository:

```
git clone https://github.com/iffypixy/ekittens
cd ekittens
```

Install dependencies (this is a pnpm workspace):

```
pnpm install
```

Run the workspace checks:

```
pnpm typecheck
pnpm test
```
```

Notes for the executor:
- Keep the "### Requirements" subsection above it as is unless it references
  tooling that does not exist; if it mentions PostgreSQL/Redis (needed only by the
  `apps/*`, not the `packages/*`), leave it — it is true for the full stack.
- Do **not** mention `pnpm start` or `npm run start` — no such script exists.
- Only mention `cp .env.sample .env` if `.env.sample` actually exists; it does
  not at the repo root, so omit that block (or point at the relevant `apps/*`
  directory only if a sample file is found there via `find . -name ".env.sample" -not -path '*/node_modules/*'`).

**Verify**: `pnpm install` then `pnpm test` succeed — i.e. the documented
commands actually work.

## Test plan

- No automated tests. Verification: every command written in the README runs
  successfully from a fresh clone state (`pnpm install`, `pnpm typecheck`,
  `pnpm test`).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "npm run start" README.md` returns nothing
- [ ] `grep -n "ekittens-\[branch\]" README.md` returns nothing
- [ ] `grep -n "pnpm install" README.md` returns the new instruction
- [ ] The commands quoted in the README's Steps section all exit 0 when run
- [ ] Only `README.md` is modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- A root `start` script or `.env.sample` actually exists (drift since this plan) —
  then the original text may be partly correct; reconcile rather than overwrite.
- `pnpm install` or `pnpm test` fails on a clean checkout — that is a separate
  problem; report it rather than documenting a broken command.

## Maintenance notes

- When the `apps/*` gain a documented run command (a root `dev`/`start` script),
  extend this section then — but only document scripts that exist.
- Keep README setup commands in sync with root `package.json` scripts.

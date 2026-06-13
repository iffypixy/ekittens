# ekittens

A world-class web adaptation of **Exploding Kittens** — a server-authoritative,
real-time multiplayer card game built as a TypeScript monorepo.

Draw cards until someone draws an Exploding Kitten. They explode and are out —
unless they have a Defuse. Last player standing wins. Every other card bends the
odds.

## Architecture

A pnpm monorepo with a pure functional game core shared by client and server.

```
packages/
  lib/        building blocks — Result, Crockford ids, assert, random, ports
  contract/   the shared wire vocabulary — cards, commands, events, MatchView, zod schemas
  engine/     PURE game engine — MatchState, apply reducer, per-viewer projection
apps/
  server/     Fastify + Drizzle/Postgres + Redis; raw WebSocket; hexagonal services
  web/        React 19 + Vite + Tailwind; typed REST/WS clients; Zustand + TanStack Query
e2e/          Playwright end-to-end
```

**Principles** (see `ENGINEERING_RULES.md`, `CONTEXT.md`, `docs/adr/`): illegal
states unrepresentable; parse-don't-validate at every boundary; expected failures
as `Result` values; a pure core wrapped in a thin imperative shell; hidden
information enforced by projection so cheating is impossible by construction.

Services (bounded contexts): `users` (argon2id auth, guest upgrade), `matches`
(wraps the engine over WS), `matchmaking`, `relationships` (social graph),
`ratings` (OpenSkill), `presence`. Lobbies and chat are scaffolded for follow-up.

## Getting started

Requires Node 24 + pnpm, and Docker (for Postgres/Redis/MinIO). With Nix:
`nix develop` (or `direnv allow`) provides the pinned toolchain.

```bash
pnpm install
docker compose up -d                       # postgres + redis + minio
cp apps/server/.env.example apps/server/.env

pnpm --filter @ekittens/server db:migrate  # apply migrations
pnpm --filter @ekittens/server dev         # API + WS on :8000
pnpm --filter @ekittens/web dev            # client on :5173 (proxies to the API)
```

Open http://localhost:5173, play as a guest, hit **Find a match** in two browser
windows.

## Quality gates

```bash
pnpm typecheck   # tsc --noEmit across every package (strict)
pnpm test        # Vitest + fast-check property tests + Testcontainers integration
pnpm check       # Biome lint + format
pnpm build       # build every app
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

# Pure, deterministic game engine at the core

Status: accepted

The Exploding Kittens rules are implemented as a pure, framework-agnostic, deterministic reducer in `packages/engine` — `reduce(game, command) → Result<{ state, events }, GameError>` — with all randomness driven by a seed carried *inside* `GameState` and no wall clock or IO anywhere in the engine. Players are opaque ids; identity, ratings (Elo), persistence, timing, and transport all live outside the engine. The server maps player ids to users, owns the clock, and builds the validated `GameConfig` deck recipe (modes are resolved server-side; the engine is mode-agnostic).

## Why

This makes the rules exhaustively testable — property tests, deterministic replay from `seed + command log`, and 100k+ self-played simulations asserting invariants — and lets the surrounding stack be chosen in a later milestone without touching the rules. The old code fused the rules into a 2,170-line Socket.io/Redis/Bull gateway with a mutable state class, untestable in isolation; this is the deliberate inversion of that.

## Consequences

There is an explicit boundary the server must marshal across every request: id↔user mapping, owning the inactivity clock (the engine only *declares* per-phase timeout budgets), and assembling the deck recipe from a lobby's chosen mode.

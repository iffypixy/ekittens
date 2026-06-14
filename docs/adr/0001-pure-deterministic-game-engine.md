# Pure, deterministic game engine at the core

Status: accepted

The Exploding Kittens rules are implemented as a pure, framework-agnostic, deterministic reducer in `packages/engine`. `reduce(game, command)` returns a `Result` holding the next state and the events it produced. All randomness comes from a seed carried inside `GameState`, and the engine touches no wall clock and no IO. Players are opaque ids; identity, ratings, persistence, timing, and transport all live outside the engine. The server maps player ids to users, owns the clock, and builds the validated `GameConfig` deck recipe, so the engine itself is mode-agnostic.

## Why

This makes the rules exhaustively testable through property tests, deterministic replay from a seed and command log, and large self-played simulations that assert invariants. It also lets the surrounding stack be chosen in a later milestone without touching the rules.

## Consequences

There is an explicit boundary the server must marshal across every request: id↔user mapping, owning the inactivity clock (the engine only *declares* per-phase timeout budgets), and assembling the deck recipe from a lobby's chosen mode.

# 2. Pure functional reducer engine + view projection

Status: accepted

## Context

The old rules engine was a ~2000-line WebSocket gateway with an ad-hoc string
state field — untestable and leaky. The rules must be correct, hidden
information must be airtight, and the same types must serve client and server.

## Decision

A pure `engine` package: `MatchState` as a discriminated union of phases (illegal
states unrepresentable), `apply(state, command, {rng, now}) -> Result<{state,
events}>` as the only mutator (deterministic via injected rng/now), and
`project(state, viewer) -> MatchView` as the only thing ever sent to a client.
Errors are returned as `Result`, never thrown.

## Consequences

- The whole rule set is testable in milliseconds with no I/O; verified by
  fast-check property tests over thousands of random games.
- Cheating via devtools is impossible by construction — full state never leaves
  the server.
- The imperative shell (matches service) stays thin: load → apply → persist →
  broadcast projections.

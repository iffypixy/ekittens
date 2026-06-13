# 5. Single authoritative node + in-process timers

Status: accepted

## Context

A live match has authoritative state and time-driven deadlines (turn timeout,
nope-window). These must be low-latency and cancelable.

## Decision

Each match is owned by the node that created it; its `MatchState` is held
in-process, and turn/nope deadlines run on an injected, cancelable in-process
scheduler (AFK auto-play via the engine's `timeout`). Matchmaking is in-process
too.

## Consequences

- Lowest latency and simplest reasoning; the scheduler is injectable so timing
  is deterministic in tests.
- The server is currently single-node for match authority. Horizontal scale is a
  documented path: match-ownership routing + Redis pub/sub for cross-node
  delivery of non-authoritative traffic (chat/social/presence).

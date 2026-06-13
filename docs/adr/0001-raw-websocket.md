# 1. Raw WebSocket over Socket.IO

Status: accepted

## Context

The live game needs a real-time channel: rooms, reconnection, and — per the
engineering rules — every inbound message parsed/validated at the boundary with
end-to-end type safety. Socket.IO is mature but adds a protocol layer, a client
dependency, and untyped events.

## Decision

Use a raw `ws` server with our own typed envelope (`{type, correlationId?,
payload}`), validated by zod schemas from `packages/contract`. The session
cookie authenticates the upgrade. Heartbeat ping/pong; reconnection re-syncs by
sending a fresh `MatchView`.

## Consequences

- Full control and minimal dependencies; one source of truth for wire types.
- We hand-roll rooms, heartbeat, and (for horizontal scale) Redis pub/sub
  fan-out, which Socket.IO would have provided.
- Match authority stays single-node for now (see ADR 0005).

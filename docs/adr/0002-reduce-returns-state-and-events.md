# `reduce` returns state and events; the snapshot is authoritative

Status: accepted

`reduce` returns both the new `GameState` and a list of domain `Event`s. The **redacted `GameState` snapshot** is the authoritative thing clients render and reconcile against; **`Event`s are advisory** semantic cues (for animation, sound, toasts) and the channel for transient reveals. Clients never derive authoritative state from events; reconnection and spectator-join just resend a fresh redacted snapshot.

## Why

We considered a snapshot-only design (one channel, simplest) and rejected it for two reasons. First, some actions produce no durable state change yet must still surface something. See the future reveals the top cards to one player transiently, and that reveal has nowhere to live except an event: putting it in `GameState` would create a field that is meaningful for a single instant and illegal otherwise. Second, asserting the emitted events tests behaviour rather than state shape, which keeps refactors free.

## Consequences

The `Event` union is kept small and domain-meaningful, not one event per micro-mutation. The wire shape, whether events travel as a separate stream or are folded into the snapshot, is deferred to the server milestone. Returning the state and events together keeps that choice open without re-touching the core.

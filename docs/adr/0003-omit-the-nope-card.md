# Omit the Nope card

Status: accepted

The online edition ships **without** the Nope card, permanently. This diverges from canonical Exploding Kittens.

## Why

Nope is the only card played out of turn and the only one that stops an action from resolving immediately. Supporting it forces a real-time reaction window and a pending-action state machine into the core reducer, pulling wall-clock timing and out-of-turn authorization into what is otherwise a pure, synchronous function of state and command. Online it also imposes an attention tax, since every player must watch every opponent's turn to react in time, for a payoff our analysis judged acceptable but rarely great.

## Consequences

The engine still routes every action card through a single resolution choke point, so Nope could be reintroduced later as a window layer without reworking each card's effect. It is intentionally absent from the ruleset for now.

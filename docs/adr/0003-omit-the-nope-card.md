# Omit the Nope card

Status: accepted

The online edition ships **without** the Nope card, permanently — diverging from canonical Exploding Kittens.

## Why

Nope is the only card played out of turn and the only one that prevents an action from resolving immediately. Supporting it forces a real-time reaction window and a pending-action state machine into the core reducer, dragging wall-clock timing and out-of-turn authorization into what is otherwise a pure, synchronous `(state, command)` function. Online, it also imposes an attention tax — every player must watch every opponent's turn, finger hovering — for a payoff our analysis judged "acceptable, rarely awesome." Tellingly, the prior codebase had already disabled Nope (card commented out of the deck, the reaction-window queue commented out).

## Consequences

The engine still routes every action card through a single resolution choke point, so Nope *could* be reintroduced later as a window layer without reworking each card's effect — but it is intentionally absent from the ruleset, and `noped`/vote/`votes` state and the card-action delay queue are gone entirely.

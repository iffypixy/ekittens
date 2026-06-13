# Context — ubiquitous language

The shared glossary for ekittens. Terms here have one precise meaning across the
whole codebase. This file is a glossary, not a spec — no implementation details.

## Core

- **Match** — one game of Exploding Kittens (2–5 players). Has a full lifecycle:
  forming → ongoing → over. The authoritative `MatchState` is held by the single
  node that owns the match; clients only ever see a **View**.
- **MatchState** — the complete, authoritative state of a match. Never serialised
  to a client. Lives in the pure `engine`.
- **View (MatchView)** — a *projection* of a Match for one **Viewer**: exactly
  what that viewer is allowed to see (own hand in full; opponents as counts;
  deck as a size). A View is **not an entity** — it has no identity or
  invariants. It is the sole wire shape sent to clients.
- **Viewer** — whoever is looking at a Match: a **Player** (has a seat) or a
  **Spectator** (no seat → public projection only).
- **Player** — a User participating in a Match (identified by their `UserId`).
- **User** — a person/account. Owned by the `users` service. A **Guest** is a
  User with a handle but no credentials; **registering** upgrades the same User
  in place.
- **Command** — an input to the engine reducer (draw, play, nope, …). Always
  carries `by` (the issuing player); the server injects this, never the client.
- **Domain event** — an animation/notification hint emitted alongside a new
  state. *Not* the source of truth — the pushed View is.

## Game vocabulary

- **Phase** — what a Match is currently waiting for: `waiting-for-action`,
  `nope-window`, `awaiting-favor`, `picking-from-discard`, `defusing`,
  `inserting-exploding-kitten`, `game-over`.
- **Nope-window** — the brief interruptible window after a nopeable action where
  eligible players may Nope (cancel) or Pass; a Nope may itself be Noped ("Yup").
  Resolved by **parity** (even = action stands, odd = cancelled).
- **Combo** — cat cards played together: a **pair** (steal random), a
  **three-of-a-kind** (name a card), or **five-distinct** (take from discard).
- **Finishing order** — the ranking a Match produces (winner first, then reverse
  elimination order). Consumed by `ratings`.
- **Deck recipe** — the data (counts, hand size) that configures a Match's deck;
  every rule is data, never hard-coded lore.

## Architecture

- **Service** — a bounded context defined by *ownership*: it owns a set of
  invariants and the data enforcing them, and nothing outside touches that data.
  Services integrate only by id and through public ports. If it owns no
  invariants, it is not a service (see *View*).
- **Read-side view** (`views/`) — read-only composition across services via their
  public read ports (never their tables). A profile/leaderboard is a View.
- **Building block** (`lib/`) — a small, reusable, single-purpose primitive.
  Never a grab-bag (`utils`/`helpers`/`common` are banned).
- **Port** — an injected interface (Rng, Clock, repository, publisher) that keeps
  the core pure and testable.

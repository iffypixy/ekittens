# ekittens

An online multiplayer adaptation of the Exploding Kittens card game. This glossary defines the domain language shared across the engine, server, and client.

## Language

### Participants

**Player**:
A participant taking turns in a Game, identified to the engine only by an opaque id. Carries no identity, display, or rating data inside the engine.
_Avoid_: Competitor.

**User**:
A registered account (name, avatar, rating, friends). A server/client concept; the server maps a Player to a User. The engine never sees a User.
_Avoid_: Account, member.

**Spectator**:
A participant who observes a Game without taking turns. Sees only the public (redacted) view.
_Avoid_: Watcher, observer.

### Play

**Game**:
One live playthrough, from the initial deal to the last player standing. The engine's central value (`GameState`); the engine reduces commands over a Game.
_Avoid_: Match, session, bout.

**Turn**:
A single player's go, lasting until play passes to the next player.

**Round**:
One full cycle through all players. Reserved; may not be needed.

**Lobby**:
The pre-game room where players gather and choose the setup before a Game begins. A server-side concept, not part of the engine.
_Avoid_: Room, waiting room.

# Game Rules — the engine's source of truth

This is the canonical ruleset the engine implements and the oracle the test suite asserts
against. It is mined from the old gateway's behaviour and reconciled to official Exploding
Kittens (base + Imploding / Streaking / Barking Kittens), with bugs fixed. Where this
document and the old code disagree, **this document wins** — see [Deviations](#deviations-from-the-old-code).

Terminology follows [`/CONTEXT.md`](../../CONTEXT.md): a **Game** is one playthrough; a
**Player** is opaque to the engine; the engine is clockless and reduces **Commands** into a
new **GameState** plus advisory **Events**. Nope is permanently omitted (see ADR 0003).

> **Decisions flagged ⚑ need a sanity-check** before the reducer is written — they are
> debatable or niche. Everything else is settled.

---

## 1. Cards (21)

Hazards are never "played" from hand; they act when **drawn**. Everything else is played on your turn.

| Card | Kind | One-line effect |
| --- | --- | --- |
| `exploding-kitten` | hazard | Drawing it eliminates you unless you defuse (or are shielded by a streaking kitten). |
| `imploding-kitten-closed` | hazard | First time it surfaces: drawn face-down, you must put it back **face-up**. |
| `imploding-kitten-open` | hazard | Drawn face-up: you are eliminated immediately. Cannot be defused. |
| `defuse` | reactive | Spends to survive a drawn exploding kitten; you then reinsert the kitten. |
| `streaking-kitten` | passive | Held in hand; lets you survive holding exploding kittens (see §6.3). |
| `attack` | turn | End your turn(s) without drawing; next player takes extra turns (stacks). |
| `targeted-attack` | turn | Like `attack`, but you choose which player takes the turns. |
| `personal-attack` | turn | End your turn without drawing, then take 3 turns yourself. ⚑ |
| `skip` | turn | End **one** of your turns without drawing. |
| `super-skip` | turn | End **all** your remaining turns without drawing. |
| `shuffle` | deck | Shuffle the draw pile. |
| `reverse` | turn | Reverse the seating direction **and** end one of your turns without drawing. ⚑ |
| `see-the-future-3x` | peek | Privately look at the top 3 cards of the draw pile. |
| `see-the-future-5x` | peek | Privately look at the top 5 cards of the draw pile. |
| `alter-the-future-3x` | peek | Privately reorder the top 3 cards. |
| `share-the-future-3x` | peek | Reorder the top 3; they are also shown to the next player. |
| `draw-from-the-bottom` | turn | Take your turn's draw from the **bottom** of the pile. |
| `swap-top-and-bottom` | deck | Swap the top and bottom cards of the draw pile. |
| `catomic-bomb` | deck | Reveal & gather every exploding kitten to the **top**, shuffle the rest, then end your turn without drawing. |
| `mark` | target | Pick a random **unmarked** (face-down) card from a target's hand; it becomes publicly visible to all. |
| `bury` | deck | Look at the top card and secretly reinsert it anywhere in the pile, then end your turn. |

The two imploding-kitten faces represent **one** physical card in its two states (closed →
open). A recipe includes **at most one** imploding kitten; it always enters the pile closed.

---

## 2. Game setup

The engine receives an already-resolved, validated `GameConfig`; it never knows about
"modes". Setup is fully deterministic from `config.seed`.

`GameConfig` =
- `players: PlayerId[]` — seating order, 2–10.
- `cards: Record<Card, number>` — how many of each card type exist in total (hazards + actions).
- `handSize: number` — cards in each opening hand **including** the dealt defuse(s).
- `defusesPerPlayer: number` — defuses dealt into each opening hand (default 1).
- `seed: number`.

Deal procedure (deterministic):
1. Pull aside the `exploding-kitten`s and one `imploding-kitten` (if present) — they are **not** dealt.
2. From the remaining cards, give each player `defusesPerPlayer` defuses, then deal them up to `handSize` from the shuffled remainder.
3. Shuffle leftover defuses and action cards into the draw pile.
4. Shuffle the set-aside exploding kittens (and the closed imploding kitten, if present) into the draw pile.
5. Seat players in `players` order; `turn.active = players[0]`, `direction = "forward"`, `pendingTurns = 1`; phase = `awaiting-action`.

**Validation** (engine returns a `GameError`, never silently fixes — CONVENTIONS):
- 2 ≤ players ≤ 10.
- `exploding-kitten` count ≥ 1 and ≤ players − 1 for a finishable game. ⚑ *(default recipe uses exactly players − 1.)*
- `imploding-kitten` count ∈ {0, 1}.
- Enough non-hazard cards exist to deal every opening hand.
- `defusesPerPlayer ≤ handSize`.

**Default recipe** (a recommendation the lobby may use; not baked into the engine):
exploding kittens = players − 1; imploding kitten = 1; defuses = players + 2 (1 dealt each,
rest in pile); `handSize` = 8 (1 defuse + 7); each action card type scaled to keep the pile
roughly `players × 9` cards. Exact per-type counts are tunable and do not affect engine
correctness — only the deal/validation rules above do.

---

## 3. Turn structure

A player's turn is: optionally play any number of cards, then **end the turn by drawing one
card** (the mandatory draw). Drawing is the only thing that advances play, except for the
skip/attack family which end turns *without* drawing.

`turn.pendingTurns` (≥1 while it is your turn) = how many turns you still owe. Ending a turn
(by drawing, skipping, etc.) decrements it; at 0, play passes to the next seat with
`pendingTurns = 1`.

"Next seat" respects `direction`. `reverse` flips `direction`.

---

## 4. Attacks (stacking)

Attacks change *who* draws and *how many times*, never forcing an immediate draw.

- **`attack`**: end your turn(s) immediately without drawing; the **next** player's
  `pendingTurns` becomes `2` if you were on a normal turn, or `pendingTurns + 2` if you were
  already attacked. This yields the canonical **2 → 4 → 6 …** stack when attacks chain.
  *Example:* P1 attacks → P2 owes 2; P2 attacks → P3 owes 4; P3 attacks → P4 owes 6.
- **`targeted-attack`**: identical, but you name the recipient instead of the next seat.
- **`personal-attack`**: a self-attack — you take **3 turns total** (official card). You do
  **not** end without drawing; you keep playing and drawing. Implemented as `pendingTurns += 2`
  on a fresh turn (the current turn + 2 more = 3); play does not pass.
- **`skip`**: end one turn without drawing (`pendingTurns − 1`; pass at 0).
- **`super-skip`**: end **all** your turns without drawing; pass immediately.
- **`reverse`**: flip `direction`, then end one turn without drawing (a skip + reverse —
  official). In a **2-player** game it is a plain skip (the flip is a no-op).

A drawn card always decrements `pendingTurns` and passes at 0.

---

## 5. Phases (follow-up states)

Most actions resolve instantly (phase stays `awaiting-action`). These require a follow-up
command from a specific player before the game continues:

| Phase | Entered by | Resolving command | Effect |
| --- | --- | --- | --- |
| `defusing {card}` | drawing an exploding kitten while holding a defuse | `ProvideDefuse` | discard a defuse → go to `inserting-exploding-kitten` (or resolve if pile empty) |
| `inserting-exploding-kitten` | resolving `defusing` | `InsertExplodingKitten {position}` | place the kitten at `position`; end the turn |
| `inserting-imploding-kitten` | drawing the **closed** imploding kitten | `InsertImplodingKitten {position}` | place it back **open** at `position`; end the turn |
| `altering-future {cards}` | `alter-the-future-3x` | `SubmitFutureOrder {order}` | write the new order onto the top 3; stay on turn |
| `sharing-future {cards, sharedWith}` | `share-the-future-3x` | `SubmitFutureOrder {order}` | as above; the cards were also revealed to `sharedWith` |
| `burying-card {card}` | `bury` | `BuryCard {position}` | reinsert the looked-at top card at `position`; end the turn |

`see-the-future-3x/5x` do **not** enter a phase — they emit a `FutureRevealed` event to the
acting player and the game stays in `awaiting-action` (instantaneous, non-blocking).

While in a follow-up phase, only that player's resolving command (or a `TimeoutActivePlayer`
/ `ConcedeGame`) is legal; everything else returns a `WrongPhase` error.

---

## 6. Drawing a card (the core sequence)

Triggered by `DrawCard` (top) or playing `draw-from-the-bottom` (bottom). Let `c` be the card removed from the pile.

1. **Imploding kitten, closed** → enter `inserting-imploding-kitten`. (Turn not yet ended.)
2. **Imploding kitten, open** → you are eliminated (`exploded-by-ik`); it is removed from the game. Cannot be defused. Then resolve elimination (§7).
3. **Exploding kitten** →
   - **3.1** If you are shielded by a streaking kitten (§6.3) → the kitten goes into your **hand**; the turn ends normally.
   - **3.2** Else if you hold ≥1 defuse → enter `defusing {card}`.
   - **3.3** Else → you are eliminated (`exploded-by-ek`); the kitten is removed. Resolve elimination (§7).
4. **Any other card** → it goes into your hand; the turn ends normally (decrement `pendingTurns`, pass at 0).

"The turn ends normally" = `pendingTurns − 1`; if 0, pass to the next seat.

**Empty deck.** If a player must draw but the draw pile is empty (possible once the only
kittens have been shielded into hands), they cannot draw and are eliminated
(`could-not-draw`). This is a backstop that guarantees every game terminates; in normal play
the kittens keep the deck lethal long before it empties.

### 6.3 Streaking-kitten shield
A player is *shielded* when the number of `streaking-kitten`s in their hand is **greater
than** the number of `exploding-kitten`s already in their hand. A shielded player who draws
an exploding kitten keeps it in hand instead of exploding (§3.1). (This is the Streaking
Kittens mechanic: a streaking kitten "covers" one exploding kitten you are carrying.) ⚑
*Holding an exploding kitten has no other effect in this ruleset — it is dead weight unless a
future card moves it.*

---

## 7. Elimination, victory, end

When a player is eliminated (drew an undefused exploding/imploding kitten, timed out, or
conceded):
- Remove them from `players`, append to `defeated` with the `DefeatReason`.
- Emit `PlayerExploded` (for kitten deaths) and `PlayerDefeated {reason}`.
- If exactly **one** player remains → emit `GameEnded {winner, finishOrder}` and the game is over.
  - `finishOrder` = winner first, then the `defeated` list in **reverse** elimination order (last out = runner-up).
- Otherwise, if the eliminated player was the active player, play passes to the next seat with `pendingTurns = 1` and phase `awaiting-action`.

`DefeatReason` = `exploded-by-ek` | `exploded-by-ik` | `was-inactive-for-too-long` | `left-game`.

The engine knows nothing about ratings; the server computes Elo from `finishOrder`.

---

## 8. Timeouts (declared, not measured)

The engine is clockless. It declares a budget per phase via `timeoutFor(phase)`; the server
runs the real clock and sends `TimeoutActivePlayer` on expiry, which eliminates the active
player with `was-inactive-for-too-long`.

- `defusing` → 10s (tense, short).
- every other phase → 45s.

---

## 9. Redaction (what each viewer sees)

`redact(game, viewer)` is a pure projection — it never mutates state (fixing the old
aliasing bug). A viewer sees:
- Their own hand in full. Other players' hands as **counts only**, *except* cards revealed by `mark`, which are shown by identity to everyone. ⚑
- The draw pile as a **count** only — never its contents — *except* the transient peek a
  `see-the-future`/`alter`/`share` delivers to the entitled player(s) (carried by the phase
  payload or the `FutureRevealed` event, not by durable state).
- Discard pile, seating, turn, direction, `pendingTurns`, defeated list, and phase **kind** in full.
- Spectators (`viewer = null`) see the same as a player but with **no** hand revealed and no peeks.

---

## 10. Invariants (asserted continuously in tests)

- **Card conservation**: every `CardId` minted at setup is, at all times, in exactly one of:
  a hand, the draw pile, the discard pile, a phase payload, or the `removed` zone (detonated
  exploding/imploding kittens) — never duplicated, never lost. The total count across all
  zones always equals the minted total, which the engine asserts.
- Exactly one `turn.active`, and it is a current (non-defeated) player.
- `pendingTurns ≥ 1` whenever the game is ongoing.
- `players.length ≥ 1` while ongoing; `GameEnded` iff `players.length === 1`.
- At most one `imploding-kitten` (closed or open) exists across the whole game.
- A `position` for any insert/bury is within `[0, drawPile.length]`.

---

## Deviations from the old code

| Area | Old code | This ruleset |
| --- | --- | --- |
| Nope | half-implemented, disabled | **removed entirely** (ADR 0003) |
| Defuses in pile | computed `players × 2` then **never added** (bug) | extra defuses **are** shuffled into the pile (§2) |
| Imploding kitten | included 50% via `Math.random()` | **deterministic**: present iff the recipe includes it |
| `mark` | added an id to a `marked[]` array nothing consumed | marked card is **publicly revealed** to all viewers (§9) ⚑ |
| Attack count | `+2` decrement-then-check forced **3** draws (off-by-one) | clean **2 → 4 → 6** stack (§4) |
| Deck size | truncated to `players × 8` arbitrarily | composition is explicit `GameConfig`, validated (§2) |
| Opening hand | 4 cards (1 defuse + 3) | default **8** (1 defuse + 7), canonical; configurable |
| State mutation | mutable class; `public(pID)` mutated shared state | immutable state; pure `redact` |
| RNG / clock | `Math.random()` / `Date.now()` inside transitions | seeded RNG in state; timeouts injected as commands |

---

## Resolved decisions (researched against official rules)

All seven open questions were settled against the official rulebooks and corroborating
sources (Exploding Kittens base + Imploding / Streaking / Barking Kittens):

1. **Attack stack** = `next.pendingTurns = remaining + 2` → the canonical **2 → 4 → 6** chain (§4).
2. **`personal-attack`** = self-attack to 3 total turns; keep drawing, no pass (§4).
3. **`reverse`** = flip direction + skip (no draw); 2-player ⇒ plain skip (§4).
4. **`catomic-bomb`** = gather EKs to the top, shuffle the rest, end turn without drawing — the player is protected (§1).
5. **`mark`** = engine picks a **random unmarked** (face-down) card from the target; it is revealed to everyone until it leaves the hand (§9). Physically you pick from the face-down cards, so already-marked cards are excluded.
6. **Streaking kitten** = exactly **1 EK held per streaking kitten** (the `streaking > exploding` threshold, §6.3).
7. **Exploding kittens = players − 1** (one guaranteed survivor); hand/defuse counts are edition-dependent, hence config-driven (§2).

> Edition note: original (2015) base game deals a 5-card hand (4 + 1 defuse) with 6 defuse and
> 4 EKs; later printings differ. The engine takes these as `GameConfig`, so any edition is a
> recipe. The default recipe uses a roomier 8-card hand to suit the full 21-card set.

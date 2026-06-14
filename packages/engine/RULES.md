# Game Rules

This is the complete ruleset the engine implements. It is the source of truth: the
code follows this document, and the tests check the code against it. Terms used here
(Game, Player, Turn, Lobby) are defined in the glossary at `/CONTEXT.md`.

A Game is one playthrough of Exploding Kittens for 2 to 10 players. Players take turns
drawing from a shared deck. Drawing an exploding kitten knocks you out unless you can
defuse it. The last player left in the Game wins. This edition has no nope card.

## 1. Cards

There are 21 cards. Hazards act the moment they are drawn and are never played from
hand. Every other card is played on your turn.

### Hazards

| Card | Effect |
| --- | --- |
| Exploding kitten | Drawing it knocks you out, unless you defuse it or a streaking kitten shields you. |
| Imploding kitten (closed) | The first time it surfaces you draw it face down and put it back face up anywhere you like. |
| Imploding kitten (open) | Drawing it face up knocks you out at once. It cannot be defused. |

### Held cards

| Card | Effect |
| --- | --- |
| Defuse | Spent to survive an exploding kitten you have just drawn. You then put the kitten back into the deck. |
| Streaking kitten | Kept in hand. While you hold it you may also hold one exploding kitten without being knocked out. |

### Turn cards

| Card | Effect |
| --- | --- |
| Attack | End your turn without drawing and make the next player take extra turns. |
| Targeted attack | Like attack, but you choose who takes the turns. |
| Personal attack | Take three turns in a row yourself. |
| Skip | End one of your turns without drawing. |
| Super skip | End all of your turns without drawing. |
| Reverse | Reverse the seating direction and end one turn without drawing. |
| Draw from the bottom | Take your turn's draw from the bottom of the deck instead of the top. |

### Deck cards

| Card | Effect |
| --- | --- |
| Shuffle | Shuffle the deck. |
| Swap top and bottom | Swap the top and bottom cards of the deck. |
| Catomic bomb | Gather every exploding kitten onto the top of the deck, then end your turn without drawing. |
| See the future (3x / 5x) | Privately look at the top three or five cards. |
| Alter the future | Privately look at the top three cards and put them back in any order. |
| Share the future | Look at the top three cards and reorder them. The next player also sees them. |
| Mark | Reveal one of another player's cards face up to everyone. |
| Bury | Look at the top card and secretly put it back anywhere in the deck, then end your turn. |

The imploding kitten is a single card with two faces. A Game has at most one, and it
always starts closed.

## 2. Setting up a Game

Setup follows a recipe and a seed, and is fully repeatable: the same recipe and seed
always produce the same Game. The recipe gives the players, how many of each card the
deck holds, the opening hand size, and how many defuses each player starts with.

The deal:

1. Set the exploding kittens and the imploding kitten aside.
2. Give each player their starting defuses, then deal the rest of their opening hand from the shuffled remaining cards.
3. Shuffle whatever is left, together with the set-aside kittens, to form the deck.
4. The first player begins.

A recipe is rejected if it cannot make a sound Game: fewer than 2 or more than 10
players; fewer than one exploding kitten or more than one per missing player; more than
one imploding kitten; not enough defuses or other cards to deal every opening hand.

## 3. Turns

On your turn you may play any number of cards, then end the turn by drawing one card.
Drawing is the only thing that ends a normal turn. The skip and attack family end turns
without drawing.

You owe a number of turns, normally one. Ending a turn lowers what you owe; when you owe
nothing, play passes to the next player, who then owes one. Reverse changes which player
is next.

## 4. Attacks

Attacks change who draws and how often. They never force an immediate draw.

- Attack and targeted attack end your turn at once and hand turns to another player. A fresh attack makes them take two turns. If you were already under attack, your remaining turns are added on, so attacks stack to two, then four, then six, and so on. Attack passes to the next player; targeted attack passes to a player you choose.
- Personal attack gives you three turns in a row. Play stays with you.
- Skip ends one of your turns. Super skip ends all of them.
- Reverse flips the seating direction and ends one turn. With two players it is simply a skip.

## 5. Phases

Most cards resolve at once. A few pause the Game and wait for the active player to finish
them before play continues:

| Phase | Begins when | Resolved by |
| --- | --- | --- |
| Defusing | You draw an exploding kitten and hold a defuse | Playing a defuse, which then sends you to place the kitten |
| Placing the exploding kitten | You have defused | Choosing where in the deck the kitten goes; your turn then ends |
| Placing the imploding kitten | You draw the closed imploding kitten | Choosing where it goes back, now face up; your turn then ends |
| Altering the future | You play alter the future | Submitting the new order of the top cards |
| Sharing the future | You play share the future | Submitting the new order; the next player has also seen the cards |
| Burying a card | You play bury | Choosing where the top card goes back; your turn then ends |

While a phase is open, only the active player can act, and only to resolve it.

See the future does not open a phase. It reveals the cards and play continues at once.

## 6. Drawing a card

When you draw, whether from the top or, with draw from the bottom, from the bottom:

- The closed imploding kitten sends you to place it back face up.
- The open imploding kitten knocks you out immediately. It cannot be defused.
- An exploding kitten knocks you out, unless a streaking kitten shields you (see below) or you hold a defuse. With a defuse you survive and then place the kitten back. Without one, you are out.
- Any other card goes into your hand and your turn ends.

If you must draw but the deck is empty, you cannot, and you are out. This can only happen
once every kitten has been shielded away into a hand.

### The streaking kitten

You are shielded against an exploding kitten while you hold more streaking kittens than
exploding kittens. A shielded player who draws an exploding kitten keeps it in hand
instead of being knocked out, and the turn ends as normal.

## 7. Being knocked out, and winning

A player is knocked out by drawing an undefused exploding kitten, by drawing the open
imploding kitten, by running out of time, by leaving the Game, or by being unable to draw
from an empty deck. A knocked-out kitten is removed from the Game for good.

When only one player remains, the Game ends and that player wins. The final standing
lists the winner first, then the others in the reverse of the order they were knocked
out, so the last to go is the runner-up.

When a player leaves while a phase is open, the cards that phase was holding go back into
the deck.

## 8. Time limits

A player has 45 seconds to act, or 10 seconds while defusing. Running out of time knocks
you out. Running out of time while defusing means the kitten goes off.

## 9. What each player sees

A player sees their own hand in full. They see other players only as a hand count, plus
any cards that mark has revealed. They see how many cards are in the deck but not which,
except for the cards a see, alter, or share reveals to them. The discard pile, the
seating, whose turn it is, and the current phase are open to everyone. A spectator sees
the same public view with no hand of their own.

## 10. What always holds

- Every card minted at setup is, at any moment, in exactly one place: a hand, the deck, the discard pile, an open phase, or removed from the Game. None is ever duplicated or lost.
- Exactly one player is active, and that player is still in the Game.
- The Game ends precisely when one player remains.
- At most one imploding kitten exists.

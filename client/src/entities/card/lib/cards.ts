import explodingkitten from "@shared/assets/cards/exploding-kitten.png";
import defuse from "@shared/assets/cards/defuse.png";
import favor from "@shared/assets/cards/favor.png";
import attack from "@shared/assets/cards/attack.png";
import nope from "@shared/assets/cards/nope.png";
import shuffle from "@shared/assets/cards/shuffle.png";
import skip from "@shared/assets/cards/skip.png";
import seethefuture from "@shared/assets/cards/see-the-future.png";
import beardcat from "@shared/assets/cards/beard-cat.png";
import cattermelon from "@shared/assets/cards/cattermelon.png";
import rainbowralphingcat from "@shared/assets/cards/rainbow-ralphing-cat.png";
import tacocat from "@shared/assets/cards/tacocat.png";
import hairypotatocat from "@shared/assets/cards/hairy-potato-cat.png";

export type CardType =
  | "exploding-kitten"
  | "defuse"
  | "favor"
  | "attack"
  | "nope"
  | "shuffle"
  | "skip"
  | "see-the-future"
  | "beard-cat"
  | "cattermelon"
  | "rainbow-ralphing-cat"
  | "tacocat"
  | "hairy-potato-cat";

export interface CardDetails {
  name: string;
  tone: string;
  description: string;
  avatar: string;
}

export const cards: Record<CardType, CardDetails> = {
  "exploding-kitten": {
    name: "Exploding kitten",
    tone: "#5C5C5C",
    description:
      "If you drew an Exploding Kitten, you can play this card instead of dying. Place your Defuse Card in the Discard Pile.",
    avatar: explodingkitten,
  },
  defuse: {
    name: "Defuse",
    tone: "#8FBC5C",
    description:
      "You must show this card immediately. Unless you have a Defuse Card, you're dead. Discard all of your cards, including the Exploding Kitten.",
    avatar: defuse,
  },
  favor: {
    name: "Favor",
    tone: "#2C2C2C",
    description:
      "Force any other player to give you 1 card from their hand. They choose which card to give you.",
    avatar: favor,
  },
  attack: {
    name: "Attack",
    tone: "#F69A23",
    description:
      "Immediately end your turn(s) without drawing and force the next player to take 2 turns in a row. The victim of this card takes a turn as normal (play-or-pass, then draw). Then, when their first turn is oevr, it's their turn again.",
    avatar: attack,
  },
  nope: {
    name: "Nope",
    tone: "#DC1934",
    description:
      "Stop any action except for an Exploding Kitten or a Defuse Card.",
    avatar: nope,
  },
  shuffle: {
    name: "Shuffle",
    tone: "#736357",
    description: "Shuffle the Draw Pile thoroughly.",
    avatar: shuffle,
  },
  skip: {
    name: "Skip",
    tone: "#4290D0",
    description: "Immediately end your turn without drawing a card.",
    avatar: skip,
  },
  "see-the-future": {
    name: "See the future",
    tone: "#ED3F8C",
    description:
      "Privately view the top 3 cards from the Draw Pile and put them back in the same order.",
    avatar: seethefuture,
  },
  "beard-cat": {
    name: "Beard cat",
    tone: "#D0D0D0",
    description:
      "This card is powerless on its own, but if you collect any 2 matching cards, you can play them as a Pair to steal a random card from any player.",
    avatar: beardcat,
  },
  cattermelon: {
    name: "Cattermelon",
    tone: "#D0D0D0",
    description:
      "This card is powerless on its own, but if you collect any 2 matching cards, you can play them as a Pair to steal a random card from any player.",
    avatar: cattermelon,
  },
  "rainbow-ralphing-cat": {
    name: "Rainbow ralphing cat",
    tone: "#D0D0D0",
    description:
      "This card is powerless on its own, but if you collect any 2 matching cards, you can play them as a Pair to steal a random card from any player.",
    avatar: rainbowralphingcat,
  },
  tacocat: {
    name: "Tacocat",
    tone: "#D0D0D0",
    description:
      "This card is powerless on its own, but if you collect any 2 matching cards, you can play them as a Pair to steal a random card from any player.",
    avatar: tacocat,
  },
  "hairy-potato-cat": {
    name: "Hairy potato cat",
    tone: "#D0D0D0",
    description:
      "This card is powerless on its own, but if you collect any 2 matching cards, you can play them as a Pair to steal a random card from any player.",
    avatar: hairypotatocat,
  },
};

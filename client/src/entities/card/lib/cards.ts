import {CardName, CardDetails} from "./typings";

import explodingkitten from "@shared/assets/cards/exploding-kitten.png";
import defuse from "@shared/assets/cards/defuse.png";
import attack from "@shared/assets/cards/attack.png";
import nope from "@shared/assets/cards/nope.png";
import shuffle from "@shared/assets/cards/shuffle.png";
import skip from "@shared/assets/cards/skip.png";
import seethefuture from "@shared/assets/cards/see-the-future.png";
import alterthefuture from "@shared/assets/cards/alter-the-future.png";
import bury from "@shared/assets/cards/bury.png";
import catomicbomb from "@shared/assets/cards/catomic-bomb.png";
import drawfromthebottom from "@shared/assets/cards/draw-from-the-bottom.png";
import implodingkitten from "@shared/assets/cards/imploding-kitten.png";
import mark from "@shared/assets/cards/mark.png";
import personalattack from "@shared/assets/cards/personal-attack.png";
import reverse from "@shared/assets/cards/reverse.png";
import sharethefuture from "@shared/assets/cards/share-the-future.png";
import streakingkitten from "@shared/assets/cards/streaking-kitten.png";
import superskip from "@shared/assets/cards/super-skip.png";
import swaptopandbottom from "@shared/assets/cards/swap-top-and-bottom.png";
import targetedattack from "@shared/assets/cards/targeted-attack.png";

const details: Record<CardName, CardDetails> = {
  "exploding-kitten": {
    name: "exploding kitten",
    tone: "#484848",
    description:
      "if you drew an exploding kitten, you can play this card instead of dying. place your defuse card in the discard pile.",
    image: explodingkitten,
  },
  defuse: {
    name: "defuse",
    tone: "#A1CE39",
    description:
      "you must show this card immediately. unless you have a defuse card, you're dead. discard all of your cards, including the exploding kitten.",
    image: defuse,
  },
  attack: {
    name: "attack",
    tone: "#AA6427",
    description:
      "immediately end your turn(s) without drawing and force the next player to take 2 turns in a row. the victim of this card takes a turn as normal (play-or-pass, then draw). then, when their first turn is oevr, it's their turn again.",
    image: attack,
  },
  nope: {
    name: "nope",
    tone: "#7B2223",
    description:
      "stop any action except for an exploding kitten or a defuse card.",
    image: nope,
  },
  shuffle: {
    name: "shuffle",
    tone: "#736357",
    description: "shuffle the draw pile thoroughly.",
    image: shuffle,
  },
  skip: {
    name: "skip",
    tone: "#24A4DE",
    description: "immediately end your turn without drawing a card.",
    image: skip,
  },
  "see-the-future-3x": {
    name: "see the future (3x)",
    tone: "#D2227C",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: seethefuture,
  },
  "alter-the-future-3x": {
    name: "alter the future (3x)",
    tone: "#472266",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: alterthefuture,
  },
  bury: {
    name: "bury",
    tone: "#777769",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: bury,
  },
  "catomic-bomb": {
    name: "catomic bomb",
    tone: "#F7D75F",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: catomicbomb,
  },
  "draw-from-the-bottom": {
    name: "draw from the bottom",
    tone: "#4C4C4C",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: drawfromthebottom,
  },
  "imploding-kitten": {
    name: "imploding kitten",
    tone: "#82C1D6",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: implodingkitten,
  },
  mark: {
    name: "mark",
    tone: "#E0CD1F",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: mark,
  },
  "personal-attack": {
    name: "personal attack",
    tone: "#AA6427",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: personalattack,
  },
  reverse: {
    name: "reverse",
    tone: "#7BB760",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: reverse,
  },
  "share-the-future-3x": {
    name: "share the future (3x)",
    tone: "#7E1137",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: sharethefuture,
  },
  "streaking-kitten": {
    name: "streaking kitten",
    tone: "#3DB54B",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: streakingkitten,
  },
  "super-skip": {
    name: "super skip",
    tone: "#F7F037",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: superskip,
  },
  "swap-top-and-bottom": {
    name: "swap top and bottom",
    tone: "#CC9893",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: swaptopandbottom,
  },
  "targeted-attack": {
    name: "targeted attack",
    tone: "#AA6427",
    description:
      "privately view the top 3 cards from the draw pile and put them back in the same order.",
    image: targetedattack,
  },
  "see-the-future-5x": {
    name: "see the future (5x)",
    tone: "#D2227C",
    description:
      "privately view the top 5 cards from the draw pile and put them back in the same order.",
    image: seethefuture,
  },
};

const collection = Object.keys(details) as CardName[];

export const cards = {details, collection};

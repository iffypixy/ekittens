import {shuffle} from "@lib/utils";

export type Card =
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

const cards: {
  all: Card[];
  special: Card[];
  ordinary: Card[];
} = {
  all: [
    "exploding-kitten",
    "defuse",
    "favor",
    "attack",
    "nope",
    "shuffle",
    "skip",
    "see-the-future",
    "beard-cat",
    "cattermelon",
    "rainbow-ralphing-cat",
    "tacocat",
    "hairy-potato-cat",
  ],
  special: ["exploding-kitten", "defuse"],
  ordinary: [
    "favor",
    "attack",
    "nope",
    "shuffle",
    "skip",
    "see-the-future",
    "beard-cat",
    "cattermelon",
    "rainbow-ralphing-cat",
    "tacocat",
    "hairy-potato-cat",
  ],
};

const INITIAL_CARDS_QUANTITY = 4;

const init = (players: number) => {
  const total = players * 10;

  const deck = new Array(Math.ceil(total / cards.ordinary.length))
    .fill(shuffle(cards.ordinary))
    .flat();

  deck.length = total;

  const shuffled = shuffle<Card>(deck);

  const individual: Card[][] = Array.from<[], Card[]>(
    new Array(players),
    () => ["defuse"],
  );

  const CARDS_TO_RANDOMIZE = INITIAL_CARDS_QUANTITY - 1;

  for (let i = 0; i < players; i++) {
    for (let j = 0; j < CARDS_TO_RANDOMIZE; j++) {
      const idx = j + i * CARDS_TO_RANDOMIZE;

      individual[i].push(shuffled[idx]);
    }
  }

  shuffled.splice(0, players * INITIAL_CARDS_QUANTITY);

  const TOTAL_EXPLODING_KITTEN_CARDS = players - 1;
  const TOTAL_DEFUSE_CARDS = players * 2;

  const exploding = new Array(TOTAL_EXPLODING_KITTEN_CARDS).fill(
    "exploding-kitten",
  );
  const defuse = new Array(TOTAL_DEFUSE_CARDS).fill("defuse");

  shuffled.push(...exploding);
  shuffled.push(...defuse);

  return {
    individual: individual.map((cards) => shuffle(cards)),
    main: shuffle(shuffled),
  };
};

export const deck = {init};

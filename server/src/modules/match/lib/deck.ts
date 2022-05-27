import {shuffle} from "@lib/shuffle";

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

export const cards: Card[] = [
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
];

const special: Card[] = ["exploding-kitten", "defuse"];

const ordinary = cards.filter((card) => !special.includes(card));

const INITIAL_CARDS_QUANTITY = 4;

interface DeckGenerateOutput {
  individual: Card[][];
  main: Card[];
}

const generate = (quantity: number): DeckGenerateOutput => {
  const total = quantity * 10;

  const deck = new Array(Math.ceil(total / ordinary.length))
    .fill(ordinary)
    .flat();

  deck.length = total;

  const shuffled = shuffle(deck);

  const individual: Card[][] = new Array(quantity).fill([]);

  for (let i = 0; i < quantity; i++) {
    for (let j = 0; j < INITIAL_CARDS_QUANTITY; j++) {
      const idx = j + i * INITIAL_CARDS_QUANTITY;

      individual[i].push(shuffled[idx]);
    }
  }

  shuffled.splice(0, quantity * INITIAL_CARDS_QUANTITY);

  const exploding = new Array(quantity).fill("exploding-kitten");
  const defuse = new Array(quantity - 1).fill("defuse");

  shuffled.push([...exploding, ...defuse]);

  return {
    individual,
    main: shuffle(shuffled),
  };
};

export const deck = {generate};

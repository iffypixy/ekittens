import {shuffle} from "@lib/shuffle";

export type Card =
  | "exploding-kitten"
  | "defuse"
  | "attack"
  | "nope"
  | "shuffle"
  | "skip"
  | "see-the-future";

export const cards: Card[] = [
  "exploding-kitten",
  "defuse",
  "attack",
  "nope",
  "shuffle",
  "skip",
  "see-the-future",
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

  const individual: Card[][] = Array.from(new Array(quantity), () => []);

  for (let i = 0; i < quantity; i++) {
    for (let j = 0; j < INITIAL_CARDS_QUANTITY; j++) {
      const idx = j + i * INITIAL_CARDS_QUANTITY;

      individual[i].push(shuffled[idx]);
    }
  }

  shuffled.splice(0, quantity * INITIAL_CARDS_QUANTITY);

  const exploding = new Array(quantity - 1).fill("exploding-kitten");
  const defuse = new Array(quantity).fill("defuse");

  shuffled.push(...exploding);
  shuffled.push(...defuse);

  return {
    individual,
    main: shuffle(shuffled),
  };
};

export const deck = {generate};

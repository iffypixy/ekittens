import {nanoid} from "nanoid";

import {utils} from "@lib/utils";

import {NUMBER_OF_INITIAL_CARDS} from "./constants";
import {Card, CardDetails} from "./typings";

const cards: Card[] = [
  "exploding-kitten",
  "defuse",
  "attack",
  // "nope",
  "shuffle",
  "skip",
  "see-the-future-3x",
  "targeted-attack",
  "alter-the-future-3x",
  "draw-from-the-bottom",
  "imploding-kitten-open",
  "imploding-kitten-closed",
  "reverse",
  "streaking-kitten",
  "super-skip",
  "see-the-future-5x",
  "swap-top-and-bottom",
  "catomic-bomb",
  "mark",
  "bury",
  "personal-attack",
  "share-the-future-3x",
];

const playable = cards.filter(
  (card) =>
    !(
      [
        "exploding-kitten",
        "imploding-kitten-closed",
        "imploding-kitten-open",
      ] as Card[]
    ).includes(card),
);

interface GenerateDeckOptions {
  exclude: Card[];
  cards: Card[];
}

const generate = (players: number, options?: Partial<GenerateDeckOptions>) => {
  const total = players * 10;

  const current = (options?.cards || playable)
    .filter((card) => playable.includes(card))
    .filter((card) => !options?.exclude?.includes(card));

  const length = current.length === 0 ? 0 : total / current.length;

  let deck: Card[] = Array.from({length: Math.ceil(length)})
    .fill(utils.shuffle(current))
    .flat() as Card[];

  deck.length = players * 8;

  deck = deck.filter(Boolean);

  const withoutDefuse = options?.exclude?.includes("defuse");

  const shuffled = utils.shuffle<Card>(deck);

  const individual: CardDetails[][] = Array.from<[], CardDetails[]>(
    new Array(players),
    () => (withoutDefuse ? [] : [{id: nanoid(), name: "defuse"}]),
  );

  const initial = withoutDefuse
    ? NUMBER_OF_INITIAL_CARDS
    : NUMBER_OF_INITIAL_CARDS - 1;

  const CARDS_TO_RANDOMIZE = initial;

  if (current.length !== 0) {
    for (let i = 0; i < players; i++) {
      for (let j = 0; j < CARDS_TO_RANDOMIZE; j++) {
        const idx = j + i * CARDS_TO_RANDOMIZE;

        const card = shuffled[idx] || shuffled[0];

        individual[i].push({id: nanoid(), name: card});

        shuffled.splice(shuffled.indexOf(card), 1);
      }
    }
  }

  // shuffled.splice(0, players * initial);

  const TOTAL_EXPLODING_KITTEN_CARDS = players - 1;
  const TOTAL_DEFUSE_CARDS = players * 2;

  const streakings = deck.filter((card) => card === "streaking-kitten").length;

  const exploding = new Array(TOTAL_EXPLODING_KITTEN_CARDS + streakings).fill(
    "exploding-kitten",
  );

  const defuse = new Array(TOTAL_DEFUSE_CARDS).fill("defuse");

  shuffled.push(...exploding);

  // if (!withoutDefuse) shuffled.push(...defuse);

  const withoutIK = options?.exclude?.some(
    (c) => c === "imploding-kitten-closed" || c === "imploding-kitten-open",
  );

  const toAddIK = !withoutIK && Math.floor(Math.random() * 10) % 2 === 0;

  if (toAddIK) shuffled.push("imploding-kitten-closed");

  return {
    individual: individual.map((cards) => utils.shuffle(cards)),
    main: utils.shuffle(shuffled),
  };
};

export const deck = {generate, cards, playable};

import {utils} from "@lib/utils";
import {nanoid} from "nanoid";
import {NUMBER_OF_INITIAL_CARDS} from "./constants";
import {Card, CardDetails} from "./typings";

const cards: Card[] = [
  "exploding-kitten",
  "defuse",
  "attack",
  "nope",
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
  disabled: Card[];
}

const generate = (players: number, options?: Partial<GenerateDeckOptions>) => {
  const total = players * 10;

  const current = playable.filter((card) => !options?.disabled?.includes(card));

  const deck: Card[] = new Array(Math.ceil(total / current.length))
    .fill(utils.shuffle(current))
    .flat();

  deck.length = total;

  const shuffled = utils.shuffle<Card>(deck);

  const individual: CardDetails[][] = Array.from<[], CardDetails[]>(
    new Array(players),
    () => [{id: nanoid(), name: "defuse"}],
  );

  const CARDS_TO_RANDOMIZE = NUMBER_OF_INITIAL_CARDS - 1;

  for (let i = 0; i < players; i++) {
    for (let j = 0; j < CARDS_TO_RANDOMIZE; j++) {
      const idx = j + i * CARDS_TO_RANDOMIZE;

      const card = current[idx];

      individual[i].push({id: nanoid(), name: card});

      shuffled.splice(shuffled.indexOf(card), 1);
    }
  }

  shuffled.splice(0, players * NUMBER_OF_INITIAL_CARDS);

  const TOTAL_EXPLODING_KITTEN_CARDS = players - 1;
  const TOTAL_DEFUSE_CARDS = players * 2;

  const streakings = deck.filter((card) => card === "streaking-kitten").length;

  const exploding = new Array(TOTAL_EXPLODING_KITTEN_CARDS + streakings).fill(
    "exploding-kitten",
  );
  const defuse = new Array(TOTAL_DEFUSE_CARDS).fill("defuse");

  shuffled.push(...exploding);
  if (!options?.disabled?.includes("defuse")) shuffled.push(...defuse);

  const toAddIK =
    Math.floor(Math.random() * 10) % 2 === 0 &&
    !options?.disabled?.includes("imploding-kitten" as Card);

  if (toAddIK) shuffled.push("imploding-kitten-closed");

  return {
    individual: individual.map((cards) => utils.shuffle(cards)),
    main: utils.shuffle(shuffled),
  };
};

export const deck = {generate, cards};

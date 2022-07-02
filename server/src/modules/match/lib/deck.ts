import {utils} from "@lib/utils";
import {NUMBER_OF_INITIAL_CARDS} from "./constants";
import {Card} from "./typings";

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

const generate = (players: number) => {
  const total = players * 10;

  const deck = new Array(Math.ceil(total / cards.length))
    .fill(utils.shuffle(cards))
    .flat();

  deck.length = total;

  const shuffled = utils.shuffle<Card>(deck);

  const individual: Card[][] = Array.from<[], Card[]>(
    new Array(players),
    () => ["defuse"],
  );

  const CARDS_TO_RANDOMIZE = NUMBER_OF_INITIAL_CARDS - 1;

  for (let i = 0; i < players; i++) {
    for (let j = 0; j < CARDS_TO_RANDOMIZE; j++) {
      const idx = j + i * CARDS_TO_RANDOMIZE;

      individual[i].push(shuffled[idx]);
    }
  }

  shuffled.splice(0, players * NUMBER_OF_INITIAL_CARDS);

  const TOTAL_EXPLODING_KITTEN_CARDS = players - 1;
  const TOTAL_DEFUSE_CARDS = players * 2;

  const exploding = new Array(TOTAL_EXPLODING_KITTEN_CARDS).fill(
    "exploding-kitten",
  );
  const defuse = new Array(TOTAL_DEFUSE_CARDS).fill("defuse");

  shuffled.push(...exploding);
  shuffled.push(...defuse);

  return {
    individual: individual.map((cards) => utils.shuffle(cards)),
    main: utils.shuffle(shuffled),
  };
};

export const deck = {generate, cards};

import {utils} from "@lib/utils";
import {deck} from "./deck";
import {Card, LobbyModeType} from "./typings";

export const LOBBY_MODES: LobbyModeType[] = [
  "default",
  "core",
  "random",
  "custom",
];

export const LOBBY_MODE = utils.AssertRecordType<Card[]>()({
  DEFAULT: deck.cards,
  CORE: [
    "exploding-kitten",
    "defuse",
    "skip",
    "attack",
    "see-the-future-3x",
    "shuffle",
  ],
  RATED: deck.cards.filter(
    (c) =>
      !(
        [
          "streaking-kitten",
          "imploding-kitten-closed",
          "imploding-kitten-open",
        ] as Card[]
      ).includes(c),
  ),
});

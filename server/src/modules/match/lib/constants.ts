import {utils} from "@lib/utils";
import {MatchStatusType, MatchType} from "./typings";

export const NUMBER_OF_MATCH_PLAYERS = {
  MIN: 2,
  MAX: 10,
};

export const QUEUE = {
  MATCHMAKING: {
    NAME: "matchmaking",
    REPEAT: 5000,
  },
  CARD_ACTION: {
    NAME: "card-action",
    DELAY: 5000,
  },
  INACTIVITY: {
    NAME: "inactivity",
    DELAY: 45000,
  },
};

export const NUMBER_OF_INITIAL_CARDS = 4;

export const MATCH_STATUS = utils.AssertRecordType<MatchStatusType>()({
  EXPLODING_KITTEN_DEFUSE: "exploding-kitten-defuse",
  EXPLODING_KITTEN_INSERTION: "exploding-kitten-insertion",
  FUTURE_CARDS_ALTER: "future-cards-alter",
  FUTURE_CARDS_SHARE: "future-cards-share",
  CARD_BURY: "card-bury",
  IMPLODING_KITTEN_INSERTION: "imploding-kitten-insertion",
  WAITING_FOR_ACTION: "waiting-for-action",
  ACTION_DELAY: "action-delay",
});

export const MATCH_TYPES: MatchType[] = ["public", "private"];

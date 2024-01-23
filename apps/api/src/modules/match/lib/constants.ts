import {utils} from "@lib/utils";
import {MatchStateType, MatchType, MatchStatus, DefeatReason} from "./typings";

export const NUMBER_OF_INITIAL_CARDS = 4;

export const MAX_NUMBER_OF_MATCH_PLAYERS = 10;
export const MIN_NUMBER_OF_MATCH_PLAYERS = 2;

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
    DELAY: {
      COMMON: 45000,
      DEFUSE: 10000,
    },
  },
};

export const MATCH_TYPES: MatchType[] = ["public", "private"];
export const MATCH_STATUSES: MatchStatus[] = ["ongoing", "completed"];

export const MATCH_STATE = utils.AssertRecordType<MatchStateType>()({
  DEK: "defuse-exploding-kitten",
  IEK: "insert-exploding-kitten",
  ATF: "alter-the-future",
  STF: "share-the-future",
  BC: "bury-card",
  IIK: "insert-imploding-kitten",
  WFA: "waiting-for-action",
});

export const DEFEAT_REASON = utils.AssertRecordType<DefeatReason>()({
  EBEK: "exploded-by-ek",
  EBIK: "exploded-by-ik",
  WIFTL: "was-inactive-for-too-long",
  LM: "left-match",
});

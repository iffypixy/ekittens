import {AssertRecordType} from "@shared/lib/typings";

import {MatchStateType} from "./typings";

export const MATCH_STATE = AssertRecordType<MatchStateType>()({
  DEK: "defuse-exploding-kitten",
  IEK: "insert-exploding-kitten",
  ATF: "alter-the-future",
  STF: "share-the-future",
  BC: "bury-card",
  IIK: "insert-imploding-kitten",
  WFA: "waiting-for-action",
});

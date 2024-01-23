import {AssertRecordType} from "@shared/lib/typings";

import {MatchResult} from "./typings";

export const MATCH_RESULT = AssertRecordType<MatchResult>()({
  VICTORY: "victory",
  DEFEAT: "defeat",
});

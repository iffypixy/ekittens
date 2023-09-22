import {AssertRecordType} from "@shared/lib/typings";

import {DefeatReason} from "@entities/match";

export const DEFEAT_REASON = AssertRecordType<DefeatReason>()({
  EBEK: "exploded-by-ek",
  EBIK: "exploded-by-ik",
  WIFTL: "was-inactive-for-too-long",
  LM: "left-match",
});

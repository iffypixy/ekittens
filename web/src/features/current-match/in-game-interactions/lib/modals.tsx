import {AssertRecordType} from "@shared/lib/typings";

import {MatchModal} from "./typings";

export const MODAL = AssertRecordType<MatchModal>()({
  SEE_THE_FUTURE: "see-the-future",
  ALTER_THE_FUTURE: "alter-the-future",
  SHARE_THE_FUTURE: "share-the-future",
  BURY_CARD: "bury-card",
  DEFUSE_EXPLODING_KITTEN: "defuse-exploding-kitten",
  INSERT_EXPLODING_KITTEN: "insert-exploding-kitten",
  INSERT_IMPLODING_KITTEN: "insert-imploding-kitten",
  MARK_CARD: "mark-card",
  SELECT_PLAYER: "select-player",
  SHARED_CARDS: "shared-cards",
});

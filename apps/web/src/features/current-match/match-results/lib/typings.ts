import {User} from "@entities/user";
import {DefeatReason, MatchResult} from "@entities/match";

import {Nullable} from "@shared/lib/typings";

export interface PersonalResults {
  type: MatchResult;
  shift: number;
  rating: number;
  reason: Nullable<DefeatReason>;
}

export interface GeneralResults {
  winner: User;
  rating: number;
  shift: number;
}

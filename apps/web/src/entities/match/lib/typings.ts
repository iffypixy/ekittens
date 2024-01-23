import {User} from "@entities/user";
import {CardName, CardUnit} from "@entities/card";

export interface MatchPlayer extends User {
  rating: number;
  shift: number;
}

export type MatchResult = "victory" | "defeat";

export type MatchType = "public" | "private";

export interface Match {
  id: string;
  player: MatchPlayer;
  result: MatchResult;
  type: MatchType;
  opponents: MatchPlayer[];
  createdAt: Date;
}

export interface OngoingMatchPlayer extends User {
  cards: string[];
  marked: CardUnit[];
}

export interface OngoingMatchOutPlayer extends OngoingMatchPlayer {
  reason: DefeatReason;
}

export interface MatchState {
  type: MatchStateType;
  at: number;
  payload?: any;
}

export type MatchStateType =
  | "defuse-exploding-kitten"
  | "insert-exploding-kitten"
  | "alter-the-future"
  | "share-the-future"
  | "bury-card"
  | "insert-imploding-kitten"
  | "waiting-for-action";

export interface OngoingMatchContext {
  reversed: boolean;
  attacks: number;
  ikspot: number | null;
}

export interface OngoingMatch {
  id: string;
  players: OngoingMatchPlayer[];
  out: OngoingMatchOutPlayer[];
  spectators: User[];
  discard: CardName[];
  draw: number;
  turn: number;
  state: MatchState;
  context: OngoingMatchContext;
  type: MatchType;
  last: string | null;
  me: {
    as: "player" | "spectator";
    cards?: CardUnit[];
    marked?: CardUnit[];
  };
}

export type DefeatReason =
  | "exploded-by-ek"
  | "exploded-by-ik"
  | "was-inactive-for-too-long"
  | "left-match";

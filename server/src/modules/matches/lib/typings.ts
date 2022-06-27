import {User, UserPublic} from "@modules/users";

export type Card =
  | "exploding-kitten"
  | "defuse"
  | "attack"
  | "nope"
  | "shuffle"
  | "skip"
  | "see-the-future-3x"
  | "targeted-attack"
  | "alter-the-future-3x"
  | "draw-from-the-bottom"
  | "imploding-kitten-open"
  | "imploding-kitten-closed"
  | "reverse"
  | "streaking-kitten"
  | "super-skip"
  | "see-the-future-5x"
  | "swap-top-and-bottom"
  | "catomic-bomb"
  | "mark"
  | "bury"
  | "personal-attack"
  | "share-the-future-3x";

export interface OngoingMatchPlayer extends User {
  cards: Card[];
  marked: number[];
}

export interface OngoingMatch {
  id: string;
  players: OngoingMatchPlayer[];
  out: OngoingMatchPlayer[];
  draw: Card[];
  discard: Card[];
  turn: number;
  votes: {
    skip: OngoingMatchPlayer["id"][];
  };
  status: {
    type: MatchStatusType;
    at: number;
    payload?: any;
  };
  context: {
    noped: boolean;
    reversed: boolean;
    attacks: number;
  };
}

export interface OngoingMatchPlayerPublic extends UserPublic {}

export interface OngoingMatchPublic {
  id: string;
  players: OngoingMatchPlayerPublic[];
  out: OngoingMatchPlayerPublic[];
  discard: Card[];
  turn: number;
  votes: {
    skip: OngoingMatchPlayerPublic["id"][];
  };
  status: {
    type: MatchStatusType;
    at: number;
    payload?: any;
  };
  context: {
    noped: boolean;
    reversed: boolean;
    attacks: number;
  };
}

export interface CardActionQueuePayload {
  matchId: string;
  card: Card;
  payload: any;
}

export interface InactivityQueuePayload {
  matchId: string;
}

export type MatchStatusType =
  | "exploding-kitten-defuse"
  | "exploding-kitten-insertion"
  | "future-cards-alter"
  | "future-cards-share"
  | "card-bury"
  | "imploding-kitten-insertion"
  | "action-delay"
  | "waiting-for-action";

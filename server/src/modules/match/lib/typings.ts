import {User, UserPublic} from "@modules/user";

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

export interface OngoingMatchPlayerData {
  user: User;
  cards: CardDetails[];
  marked: string[];
  reason?: DefeatReason;
}

export type DefeatReason =
  | "ek-explosion"
  | "ik-explosion"
  | "inactivity"
  | "left-match";

export interface OngoingMatchData {
  id: string;
  players: OngoingMatchPlayerData[];
  out: OngoingMatchPlayerData[];
  spectators: User[];
  draw: Card[];
  discard: Card[];
  turn: number;
  votes: OngoingMatchVotes;
  state: OngoingMatchState;
  context: OngoingMatchContext;
  type: MatchType;
  last: string | null;
}

export interface OngoingMatchPlayerPublic extends UserPublic {
  cards: number;
  marked: number[];
}

export interface OngoingMatchPublic {
  id: string;
  players: OngoingMatchPlayerPublic[];
  out: OngoingMatchPlayerPublic[];
  spectators: UserPublic[];
  discard: Card[];
  turn: number;
  votes: OngoingMatchVotes;
  state: OngoingMatchState;
  context: OngoingMatchContext;
  type: MatchType;
  last: string | null;
}

export interface OngoingMatchVotes {
  skip: string[];
}

export interface OngoingMatchContext {
  noped: boolean;
  reversed: boolean;
  attacks: number;
  ikspot: number | null;
}

export interface OngoingMatchState {
  type: OngoingMatchStateType;
  at: number;
  payload?: any;
}

export interface CardDetails {
  id: string;
  name: Card;
}

export type OngoingMatchStateType =
  | "exploding-kitten-defuse"
  | "exploding-kitten-insertion"
  | "future-cards-alter"
  | "future-cards-share"
  | "card-bury"
  | "imploding-kitten-insertion"
  | "action-delay"
  | "waiting-for-action";

export interface MatchPublic {
  id: string;
  status: MatchStatus;
  type: MatchType;
}

export interface MatchPlayerPublic extends UserPublic {
  isWinner: boolean;
  rating: number;
  shift: number;
}

export type MatchType = "public" | "private";
export type MatchStatus = "ongoing" | "completed";

export interface LobbyParticipantData {
  user: User;
  role: "leader" | "member";
  as: "player" | "spectator";
}

export interface LobbyData {
  id: string;
  participants: LobbyParticipantData[];
  disabled: Card[];
}

export interface LobbyParticipantPublic extends UserPublic {
  role: "leader" | "member";
  as: "player" | "spectator";
}

export interface LobbyPublic {
  id: string;
  participants: LobbyParticipantPublic[];
  disabled: Card[];
}

export interface CardActionQueuePayload {
  matchId: string;
  card: Card;
  payload: any;
}

export interface InactivityQueuePayload {
  matchId: string;
  reason?: "ek-explosion" | "ik-explosion";
}

export type MatchResult = "victory" | "defeat";

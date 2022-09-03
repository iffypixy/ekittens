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
  | "exploded-by-ek"
  | "exploded-by-ik"
  | "was-inactive-for-too-long"
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
  type: MatchStateType;
  at: number;
  payload?: any;
}

export interface CardDetails {
  id: string;
  name: Card;
}

export type MatchStateType =
  | "defuse-exploding-kitten"
  | "insert-exploding-kitten"
  | "alter-the-future"
  | "share-the-future"
  | "bury-card"
  | "insert-imploding-kitten"
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
  mode: LobbyMode;
}

export interface LobbyMode {
  type: LobbyModeType;
  payload?: {
    disabled?: Card[];
  };
}

export type LobbyModeType = "default" | "random" | "core" | "custom";

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
  reason?: DefeatReason;
}

export type MatchResult = "victory" | "defeat";

export interface Enqueued {
  id: string;
  at: number;
}

import {CardName} from "@entities/card";

export interface User {
  id: string;
  username: string;
  avatar: string;
  rating: number;
}

export interface UserSupplemental {
  activity: {
    type: "in-match" | "in-lobby" | "spectate";
    matchId: string | null;
    lobbyId: string | null;
  };
  status: "online" | "offline";
}

export interface Match {
  id: string;
  player: User & {
    rating: number;
    shift: number;
  };
  result: "victory" | "defeat";
  opponents: {
    user: User;
    rating: number;
    shift: number;
  }[];
  createdAt: Date;
}

export interface ProfileStatistics {
  rating: number;
  winrate: number;
  played: number;
  won: number;
  lost: number;
}

export type Credentials = User;

export interface FormVerification {
  ok: boolean;
}

export interface Profile extends User {
  relationship: number;
}

export interface OngoingMatchPlayer extends User {
  cards: string[];
  marked: CardUnit[];
  reason?: DefeatReason;
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

export type MatchType = "public" | "private";

export interface OngoingMatchState {
  type: OngoingMatchStateType;
  at: number;
  payload?: any;
}

export interface CardUnit {
  id: string;
  name: CardName;
}

export interface OngoingMatchContext {
  noped: boolean;
  reversed: boolean;
  attacks: number;
  ikspot: number | null;
}

export type MatchResult = "victory" | "defeat";

export interface OngoingMatch {
  id: string;
  players: OngoingMatchPlayer[];
  out: OngoingMatchPlayer[];
  spectators: User[];
  discard: CardName[];
  draw: number;
  turn: number;
  votes: {
    skip: string[];
  };
  state: OngoingMatchState;
  context: OngoingMatchContext;
  type: MatchType;
  cards?: CardUnit[];
  marked?: CardUnit[];
  last: string | null;
  as: "player" | "spectator";
}

export type Leaderboard = (User & {
  winrate: number;
  history: MatchResult[];
})[];

export type DefeatReason =
  | "ek-explosion"
  | "ik-explosion"
  | "inactivity"
  | "left-match";

export interface ChatMessage {
  id: string;
  text: string;
  sender: User;
  createdAt: Date;
}

export interface Lobby {
  id: string;
  participants: LobbyParticipant[];
  disabled: CardName[];
}

export interface LobbyParticipant extends User {
  as: "player" | "spectator";
  role: "leader" | "member";
}

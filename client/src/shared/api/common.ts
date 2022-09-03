import {CardName} from "@entities/card";
import {MatchState, DefeatReason} from "@entities/match";

import {Nullable} from "@shared/lib/typings";

export interface User {
  id: string;
  username: string;
  avatar: string;
  rating: number;
}

export type ActivityType = "in-match" | "in-lobby" | "spectation";
export type UserStatus = "online" | "offline";

export interface Activity {
  type: ActivityType;
  matchId: Nullable<string>;
  lobbyId: Nullable<string>;
}

export interface UserInterim {
  activity: Activity;
  status: UserStatus;
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

export type Credentials = User;

export interface FormVerification {
  ok: boolean;
}

export type RelationshipType = number;

export interface Profile extends User {
  relationship: RelationshipType;
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
  type: MatchState;
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
  state: MatchState;
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

export interface ChatMessage {
  id: string;
  text: string;
  sender: User;
  createdAt: Date;
}

export interface Lobby {
  id: string;
  participants: LobbyParticipant[];
  mode: LobbyMode;
}

export interface LobbyMode {
  type: LobbyModeType;
  payload?: {
    disabled?: CardName[];
  };
}

export type LobbyModeType = "default" | "core" | "random" | "custom";

export interface LobbyParticipant extends User {
  as: "player" | "spectator";
  role: "leader" | "member";
}

export interface UserStats {
  rating: number;
  winrate: number;
  played: number;
  won: number;
  lost: number;
}

export interface UserWithRelationship extends User {
  relationship: RelationshipType;
}

export interface UserWithInterim extends User {
  interim?: UserInterim;
}

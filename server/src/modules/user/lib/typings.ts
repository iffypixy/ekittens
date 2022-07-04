import {User} from "../entities";

export interface UserInterim {
  matchId: string | null;
  lobbyId: string | null;
  isOnline: boolean;
}

export type RelationshipStatus =
  | "FRIEND_REQ: 1-2"
  | "FRIEND_REQ: 2-1"
  | "FRIENDS"
  | "BLOCKED: 2-1"
  | "BLOCKED: 1-2"
  | "BLOCKED"
  | "NONE";

export interface UserPublic {
  id: string;
  username: string;
  rating: number;
}

export interface UserRT extends User {
  isOnline: boolean;
}

export interface UserPublicRT extends UserPublic {
  isOnline: boolean;
}

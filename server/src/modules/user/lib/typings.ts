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

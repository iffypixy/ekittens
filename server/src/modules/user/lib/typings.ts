import {Nullable} from "@lib/types";

export type UserActivityType = "in-lobby" | "in-match" | "spectate";

export interface UserActivity {
  type: UserActivityType | null;
  matchId?: string;
  lobbyId?: string;
}

export type UserStatus = "online" | "offline";

export type UserInterim = Partial<{
  status: UserStatus;
  activity: UserActivity;
}>;

export interface UserSupplemental {
  status: UserStatus;
  activity: Nullable<UserActivity>;
}

export interface UserPublic {
  id: string;
  username: string;
  rating: number;
  avatar: string;
}

export type RelationshipPublic = number;

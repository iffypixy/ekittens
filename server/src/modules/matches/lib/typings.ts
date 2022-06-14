import {User, UserPublic} from "@modules/users";

export interface OngoingMatch {
  id: string;
  participants: User[];
}

export interface OngoingMatchPublic {
  id: string;
  participants: UserPublic[];
}

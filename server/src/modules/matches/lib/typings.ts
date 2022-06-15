import {User, UserPublic} from "@modules/users";
import {Card} from "./deck";

export interface OngoingMatchParticipant extends User {
  cards: Card[];
}

export interface OngoingMatch {
  id: string;
  participants: OngoingMatchParticipant[];
  deck: Card[];
  pile: Card[];
  turn: number;
  context: {
    nope: boolean;
    attacks: number;
  };
}

export interface OngoingMatchParticipantPublic extends UserPublic {}

export interface OngoingMatchPublic {
  id: string;
  participants: OngoingMatchParticipantPublic[];
  pile: Card[];
}

import {User, UserPublic} from "@modules/users";
import {Card} from "./deck";

export interface OngoingMatchPlayer extends User {
  cards: Card[];
}

export interface OngoingMatch {
  id: string;
  players: OngoingMatchPlayer[];
  deck: Card[];
  pile: Card[];
  turn: number;
  context: {
    nope: boolean;
    attacks: number;
  };
}

export interface OngoingMatchPlayerPublic extends UserPublic {}

export interface OngoingMatchPublic {
  id: string;
  players: OngoingMatchPlayerPublic[];
  pile: Card[];
}

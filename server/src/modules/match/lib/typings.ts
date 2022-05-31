import {Card} from "./deck";

export interface MatchPlayer {
  id: string;
  username: string;
  avatar: number;
  cards: Card[];
}

export interface Match {
  id: string;
  deck: Card[];
  players: MatchPlayer[];
  pile: Card[];
  turn: number;
  locked: boolean;
  context: {
    attacks: number;
    nope: boolean;
  };
}

export interface MatchPlayerPublic {
  id: string;
  username: string;
  avatar: number;
  left: number;
}

export interface MatchPublic {
  id: string;
  left: number;
  pile: Card[];
  players: MatchPlayerPublic[];
  turn: number;
}

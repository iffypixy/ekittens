import {User, UserPublic} from "@modules/users";
import {Card} from "./deck";

export interface OngoingMatchPlayer extends User {
  cards: Card[];
}

export interface OngoingMatch {
  id: string;
  players: OngoingMatchPlayer[];
  out: OngoingMatchPlayer[];
  deck: Card[];
  pile: Card[];
  turn: number;
  playedBy: OngoingMatchPlayer["id"] | null;
  votes: {
    nopeSkip: OngoingMatchPlayer["id"][];
  };
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

export interface CardActionQueuePayload {
  matchId: string;
  card: Card;
  payload: Partial<{
    playerId: string;
  }>;
}

export interface InactiveQueuePayload {
  matchId: string;
}

export interface FavorQueuePayload {
  matchId: string;
  requestedId: string;
  requesterId: string;
}

export interface ExplodingKittenDefusePayload {
  matchId: string;
  addedAt: number;
}

export interface ExplodingKittenInsertionPayload {
  matchId: string;
}

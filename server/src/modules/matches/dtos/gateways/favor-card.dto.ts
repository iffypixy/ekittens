import {IsString, IsIn} from "class-validator";

import {Card, deck} from "@modules/matches/lib/deck";

export class FavorCardDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsString({
    message: "Requested player id must be a type of string",
  })
  requestedId: string;

  @IsString({
    message: "Requester player id must be a type of string",
  })
  requesterId: string;

  @IsIn(deck.cards.ordinary)
  card: Card;
}
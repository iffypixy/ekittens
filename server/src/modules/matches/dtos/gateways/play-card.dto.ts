import {IsIn, IsOptional, IsString} from "class-validator";

import {Card, cards} from "@modules/matches/lib/deck";
export class PlayCardDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsIn(cards.ordinary)
  card: Card;

  @IsOptional()
  @IsString({
    message: "Player id must be a type of string",
  })
  playerId?: string;
}

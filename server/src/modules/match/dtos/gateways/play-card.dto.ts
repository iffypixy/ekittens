import {IsIn, IsOptional, IsString} from "class-validator";

import {Card, cards} from "@modules/match/lib/deck";

export class PlayCardDto {
  @IsString({
    message: "MatchID must be a type of string",
  })
  matchId: string;

  @IsIn(cards, {
    message: "Card type must be valid",
  })
  card: Card;

  @IsString({
    message: "PlayerID must be a type of string",
  })
  @IsOptional()
  playerId: string;
}

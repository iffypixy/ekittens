import {IsOptional, IsString} from "class-validator";

export class PlayCardDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsString({
    message: "Card id must be a type of string",
  })
  cardId: string;

  @IsOptional()
  payload?: any;
}

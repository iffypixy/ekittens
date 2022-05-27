import {IsString} from "class-validator";

export class DrawCardDto {
  @IsString({
    message: "MatchID must be a type of string",
  })
  matchId: string;
}

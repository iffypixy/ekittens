import {IsString} from "class-validator";

export class PlayDefuseDto {
  @IsString({
    message: "MatchID must be a type of string",
  })
  matchId: string;
}

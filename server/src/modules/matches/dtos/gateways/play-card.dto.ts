import {IsString} from "class-validator";

export class PlayCardDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;
}

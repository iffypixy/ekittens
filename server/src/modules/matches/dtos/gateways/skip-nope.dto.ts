import {IsString} from "class-validator";

export class SkipNopeDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;
}

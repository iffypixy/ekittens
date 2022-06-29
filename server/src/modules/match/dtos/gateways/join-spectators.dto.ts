import {IsString} from "class-validator";

export class JoinSpectatorsDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;
}

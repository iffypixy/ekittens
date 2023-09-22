import {IsString} from "class-validator";

export class JoinMatchDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;
}

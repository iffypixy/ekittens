import {IsString} from "class-validator";

export class LeaveSpectatorsDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;
}

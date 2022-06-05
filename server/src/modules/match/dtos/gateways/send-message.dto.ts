import {IsString} from "class-validator";

export class SendMessageDto {
  @IsString({
    message: "MatchID must be a type of string",
  })
  matchId: string;

  @IsString({
    message: "Messge must be a type of string",
  })
  message: string;
}

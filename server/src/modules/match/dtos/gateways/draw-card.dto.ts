import {IsString} from "class-validator";

export class DrawCardDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;
}

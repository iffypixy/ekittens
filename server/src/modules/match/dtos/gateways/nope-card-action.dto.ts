import {IsString} from "class-validator";

export class NopeCardActionDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsString({
    message: "Card id must be a type of string",
  })
  cardId: string;
}

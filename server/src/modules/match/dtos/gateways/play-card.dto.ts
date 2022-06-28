import {IsNumberString, IsOptional, IsString} from "class-validator";

export class PlayCardDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsNumberString(null, {
    message: "Card index must be a type of number",
  })
  cardIndex: number;

  @IsOptional()
  payload?: any;
}

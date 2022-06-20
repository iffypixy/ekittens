import {IsString, IsNumberString} from "class-validator";

export class DrawPileCardDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsNumberString(null, {
    message: "Card index must be a type of number",
  })
  index: number;
}

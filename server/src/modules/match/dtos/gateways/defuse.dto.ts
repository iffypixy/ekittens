import {IsNumberString, IsString} from "class-validator";

export class DefuseDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsNumberString(null, {
    message: "Card index must be a type of number",
  })
  cardIndex: number;
}

import {IsString, IsNumberString} from "class-validator";

export class BuryCardDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsNumberString(null, {
    message: "Spot must be a type of number",
  })
  spotIndex: number;
}

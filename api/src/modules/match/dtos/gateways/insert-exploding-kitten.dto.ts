import {IsNumberString, IsString} from "class-validator";

export class InsertExplodingKittenDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsNumberString(null, {
    message: "Spot index must be a type of number",
  })
  spotIndex: number;
}

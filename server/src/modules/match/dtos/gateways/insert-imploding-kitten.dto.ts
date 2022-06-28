import {IsString, IsNumberString} from "class-validator";

export class InsertImplodingKittenDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsNumberString(null, {
    message: "Spot index must be a type of number",
  })
  spotIndex: number;
}

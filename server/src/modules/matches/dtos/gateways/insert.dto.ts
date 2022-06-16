import {IsNumberString, IsString} from "class-validator";

export class InsertDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsNumberString(null, {
    message: "Spot must be a number",
  })
  spot: string;
}

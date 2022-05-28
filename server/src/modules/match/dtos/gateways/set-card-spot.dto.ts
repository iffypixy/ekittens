import {IsNumberString, IsString} from "class-validator";

export class SetCardSpotDto {
  @IsString({
    message: "MatchID must be a type of string",
  })
  matchId: string;

  @IsNumberString(null, {
    message: "Spot must be a type of number",
  })
  spot: string;
}

import {IsString} from "class-validator";

export class SpeedUpExplosionDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;
}

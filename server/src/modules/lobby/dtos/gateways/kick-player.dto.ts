import {IsString} from "class-validator";

export class KickPlayerDto {
  @IsString({
    message: "LobbyID must be a type of string",
  })
  lobbyId: string;

  @IsString({
    message: "PlayerID must be a type of string",
  })
  playerId: string;
}

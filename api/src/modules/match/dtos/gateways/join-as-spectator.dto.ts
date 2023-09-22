import {IsString} from "class-validator";

export class JoinAsSpectatorDto {
  @IsString({
    message: "Lobby id must be a type of string",
  })
  lobbyId: string;
}

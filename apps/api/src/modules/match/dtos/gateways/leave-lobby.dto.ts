import {IsString} from "class-validator";

export class LeaveLobbyDto {
  @IsString({
    message: "Lobby id must be a type of string",
  })
  lobbyId: string;
}

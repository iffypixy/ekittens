import {IsString} from "class-validator";

export class StartDto {
  @IsString({
    message: "LobbyID must be a type of string",
  })
  lobbyId: string;
}

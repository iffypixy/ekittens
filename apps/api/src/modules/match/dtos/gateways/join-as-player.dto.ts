import {IsString} from "class-validator";

export class JoinAsPlayerDto {
  @IsString({
    message: "Lobby id must be a type of string",
  })
  lobbyId: string;
}

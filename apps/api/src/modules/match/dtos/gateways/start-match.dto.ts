import {IsString} from "class-validator";

export class StartMatchDto {
  @IsString({
    message: "Lobby id must be a type of string",
  })
  lobbyId: string;
}

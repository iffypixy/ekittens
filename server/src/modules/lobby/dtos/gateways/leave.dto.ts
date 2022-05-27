import {IsString} from "class-validator";

export class LeaveDto {
  @IsString({
    message: "LobbyID must be a type of string",
  })
  lobbyId: string;
}

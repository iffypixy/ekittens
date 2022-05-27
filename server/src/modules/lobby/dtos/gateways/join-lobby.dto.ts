import {IsNumberString, IsString} from "class-validator";

export class JoinLobbyDto {
  @IsString({
    message: "LobbyID must be a type of string",
  })
  lobbyId: string;

  @IsString({
    message: "Username must be a type of string",
  })
  username: string;

  @IsNumberString(null, {
    message: "Avatar must be a type of number",
  })
  avatar: number;
}

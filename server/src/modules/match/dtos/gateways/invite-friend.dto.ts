import {IsString} from "class-validator";

export class InviteFriendDto {
  @IsString({
    message: "Lobby id must be a type of string",
  })
  lobbyId: string;

  @IsString({
    message: "User id must be a type of string",
  })
  userId: string;
}

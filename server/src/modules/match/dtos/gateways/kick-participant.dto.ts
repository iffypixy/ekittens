import {IsString} from "class-validator";

export class KickParticipantDto {
  @IsString({
    message: "Lobby id must be a type of string",
  })
  lobbyId: string;

  @IsString({
    message: "Participant id must be a type of string",
  })
  participantId: string;
}

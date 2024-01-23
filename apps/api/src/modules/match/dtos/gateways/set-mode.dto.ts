import {IsIn, IsString} from "class-validator";

import {LobbyModeType} from "@modules/match/lib/typings";
import {LOBBY_MODES} from "@modules/match/lib/modes";

export class SetModeDto {
  @IsString({
    message: "Lobby id must be a type of string",
  })
  lobbyId: string;

  @IsIn(LOBBY_MODES)
  type: LobbyModeType;
}

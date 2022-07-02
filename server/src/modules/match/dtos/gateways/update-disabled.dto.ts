import {IsIn, IsString} from "class-validator";

import {deck} from "@modules/match/lib/deck";
import {Card} from "@modules/match/lib/typings";

export class UpdateDisabledDto {
  @IsString({
    message: "Lobby id must be a type of string",
  })
  lobbyId: string;

  @IsIn(deck.cards, {
    message: "Cards must be valid",
  })
  disabled: Card[];
}

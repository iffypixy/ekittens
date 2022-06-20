import {IsString, IsIn, IsNumberString, IsArray} from "class-validator";
import {Optional} from "@nestjs/common";

import {Card, Combo, deck} from "@modules/matches/lib/deck";

export class PlayComboDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsIn(deck.combos)
  combo: Combo;

  @IsString({
    message: "Player id must be a type of string",
  })
  playerId: string;

  @IsIn(deck.cards.ordinary)
  card: Card;

  @Optional()
  @IsNumberString(null, {
    message: "Card idx must be a type of number",
  })
  idx: number;

  @Optional()
  @IsIn(deck.cards.default, {
    each: true,
  })
  different: Card[];
}

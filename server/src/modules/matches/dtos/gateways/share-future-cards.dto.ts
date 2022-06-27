import {IsIn, IsString} from "class-validator";

import {Card} from "@modules/matches/lib/typings";
import {deck} from "@modules/matches/lib/deck";

export class ShareFutureCardsDto {
  @IsString({
    message: "Match id must be a type of string",
  })
  matchId: string;

  @IsIn(deck.cards, {
    each: true,
    message: "Card must be valid",
  })
  order: Card[];
}

import {IsIn, IsString} from "class-validator";

import {Card} from "@modules/match/lib/typings";
import {deck} from "@modules/match/lib/deck";

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

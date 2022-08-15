import {User} from "@modules/user";
import {
  CardDetails,
  DefeatReason,
  OngoingMatchPlayerData,
} from "../lib/typings";

export class OngoingMatchPlayer {
  user: User;
  cards: CardDetails[];
  marked: string[];
  reason?: DefeatReason;

  constructor(player: OngoingMatchPlayerData) {
    this.user = User.create(player.user);
    this.cards = player.cards;
    this.marked = player.marked;
    this.reason = player.reason;
  }

  get public() {
    const {user, cards, marked, reason} = this;

    return {
      ...user.public,
      cards: cards.map((card) => card.id),
      reason,
      marked: cards
        .map((card) => (marked.includes(card.id) ? card : null))
        .filter(Boolean),
    };
  }
}

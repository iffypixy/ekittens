import {Match, MatchPublic} from "./typings";

export const plain = {
  match: (match: Match): MatchPublic => {
    const {id, deck, pile, players, turn} = match;

    const mapped = players.map((player) => ({
      id: player.id,
      username: player.username,
      avatar: player.avatar,
      left: player.cards.length,
    }));

    return {
      id,
      pile,
      turn,
      left: deck.length,
      players: mapped,
    };
  },
};

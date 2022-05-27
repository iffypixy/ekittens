import {Match, MatchPublic} from "./typings";

export const plain = {
  match: (match: Match): MatchPublic => {
    const {id, deck, pile, players} = match;

    const mapped = players.map((player) => ({
      id: player.id,
      username: player.username,
      avatar: player.avatar,
    }));

    return {
      id,
      pile,
      left: deck.length,
      players: mapped,
    };
  },
};

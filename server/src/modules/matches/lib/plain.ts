import {OngoingMatch, OngoingMatchPublic} from "./typings";

const match = (match: OngoingMatch): OngoingMatchPublic => {
  const {id, players, pile} = match;

  return {
    id,
    pile,
    players: players.map((player) => player.public),
  };
};

export const plain = {match};

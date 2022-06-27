import {OngoingMatch, OngoingMatchPublic} from "./typings";

const match = (match: OngoingMatch): OngoingMatchPublic => {
  const {id, players, out, discard, turn, votes, status, context} = match;

  return {
    id,
    discard,
    votes,
    context,
    turn,
    status,
    out: out.map((player) => player.public),
    players: players.map((player) => player.public),
  };
};

export const plain = {match};

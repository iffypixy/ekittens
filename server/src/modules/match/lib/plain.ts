import {OngoingMatch, OngoingMatchPublic} from "./typings";

const match = (match: OngoingMatch): OngoingMatchPublic => {
  const {id, players, out, discard, turn, votes, status, context, type} = match;

  return {
    id,
    discard,
    votes,
    context,
    turn,
    status,
    type,
    out: out.map(({user}) => user.public),
    players: players.map(({user, cards, marked}) => ({
      ...user.public,
      cards: cards.length,
      marked: marked,
    })),
  };
};

export const plain = {match};

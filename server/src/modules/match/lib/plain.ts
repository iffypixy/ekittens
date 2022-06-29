import {OngoingMatch, OngoingMatchPublic} from "./typings";

const match = (match: OngoingMatch): OngoingMatchPublic => {
  const {
    id,
    players,
    out,
    discard,
    turn,
    votes,
    state,
    context,
    type,
    spectators,
  } = match;

  return {
    id,
    discard,
    votes,
    context,
    turn,
    state,
    type,
    spectators: spectators.map((user) => user.public),
    out: out.map(({user, cards, marked}) => ({
      ...user.public,
      cards: cards.length,
      marked: marked,
    })),
    players: players.map(({user, cards, marked}) => ({
      ...user.public,
      cards: cards.length,
      marked: marked,
    })),
  };
};

export const plain = {match};

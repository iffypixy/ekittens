import {OngoingMatch, OngoingMatchPublic} from "./typings";

const match = (match: OngoingMatch): OngoingMatchPublic => {
  const {id, participants, pile} = match;

  return {
    id,
    pile,
    participants: participants.map((participant) => participant.public),
  };
};

export const plain = {match};

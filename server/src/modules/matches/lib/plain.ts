import {OngoingMatch} from "./typings";

const match = (match: OngoingMatch) => {
  const {id, participants} = match;

  return {
    id,
    participants: participants.map((participant) => participant.public),
  };
};

export const plain = {match};

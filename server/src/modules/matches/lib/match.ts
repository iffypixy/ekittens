import {OngoingMatch} from "./typings";

const changeTurn = (match: OngoingMatch) => {
  const next = match.players[match.turn + 1];

  if (!!next) match.turn++;
  else match.turn = 0;
};

const updateTurn = (match: OngoingMatch) => {
  const next = match.players[match.turn];

  if (!next) match.turn = 0;
};

export const match = {changeTurn, updateTurn};
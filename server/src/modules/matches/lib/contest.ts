import {MATCH_STATUS} from "./constants";
import {OngoingMatch, OngoingMatchPlayer} from "./typings";

const changeTurn = (match: OngoingMatch) => {
  if (match.context.reversed) {
    const previous = match.players[match.turn - 1];

    if (!!previous) match.turn--;
    else match.turn = match.players.length - 1;

    return;
  }

  const next = match.players[match.turn + 1];

  if (!!next) match.turn++;
  else match.turn = 0;
};

const updateTurn = (match: OngoingMatch) => {
  if (match.context.reversed) {
    const previous = match.players[match.turn - 1];

    if (!!previous) match.turn--;
    else match.turn = match.players.length - 1;

    return;
  }

  const next = match.players[match.turn];

  if (!next) match.turn = 0;
};

const reverse = (match: OngoingMatch) => {
  match.context.reversed = !match.context.reversed;
};

const lessenAttacks = (match: OngoingMatch) => {
  const isAttacked = match.context.attacks > 0;

  if (isAttacked) match.context.attacks--;
};

const resetAttacks = (match: OngoingMatch) => {
  match.context.attacks = 0;
};

const isAttacked = (match: OngoingMatch) => match.context.attacks > 0;

const swapTopAndBottom = (match: OngoingMatch) => {
  const top = match.draw.shift();
  const bottom = match.draw.pop();

  match.draw.unshift(bottom);
  match.draw.push(top);
};

const resetStatus = (match: OngoingMatch) => {
  match.status = {
    type: MATCH_STATUS.WAITING_FOR_ACTION,
    at: Date.now(),
    payload: null,
  };
};

const setStatus = (
  match: OngoingMatch,
  status: Omit<OngoingMatch["status"], "at">,
) => {
  match.status = {
    ...status,
    at: Date.now(),
  };
};

const addAttacks = (match: OngoingMatch, amount: number) => {
  match.context.attacks += amount;
};

const resetNope = (match: OngoingMatch) => {
  match.context.noped = false;
};

const toggleNoped = (match: OngoingMatch) => {
  match.context.noped = !match.context.noped;
};

const removePlayer = (match: OngoingMatch, id: OngoingMatchPlayer["id"]) => {
  const player = match.players.find((player) => player.id === id);

  match.players = match.players.filter((p) => p.id !== player.id);
  match.out.push(player);
};

const isEnd = (match: OngoingMatch) => match.players.length === 1;

const isStatus = (match: OngoingMatch, status: string) =>
  match.status.type === status;

const resetSkipVotes = (match: OngoingMatch) => {
  match.votes.skip = [];
};

export const contest = {
  changeTurn,
  updateTurn,
  reverse,
  lessenAttacks,
  resetAttacks,
  isAttacked,
  swapTopAndBottom,
  resetStatus,
  setStatus,
  addAttacks,
  resetNope,
  toggleNoped,
  removePlayer,
  isEnd,
  isStatus,
  resetSkipVotes,
};

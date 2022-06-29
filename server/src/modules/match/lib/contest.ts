import {MATCH_STATE} from "./constants";
import {OngoingMatch, OngoingMatchPlayer, OngoingMatchState} from "./typings";

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
  match.state = {
    type: MATCH_STATE.WAITING_FOR_ACTION,
    at: Date.now(),
    payload: null,
  };
};

const setState = (
  match: OngoingMatch,
  state: Omit<OngoingMatchState, "at">,
) => {
  match.state = {
    ...state,
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

const removePlayer = (
  match: OngoingMatch,
  id: OngoingMatchPlayer["user"]["id"],
) => {
  const player = match.players.find((player) => player.user.id === id);

  match.players = match.players.filter((p) => p.user.id !== player.user.id);
  match.out.push(player);
};

const isEnd = (match: OngoingMatch) => match.players.length === 1;

const isState = (match: OngoingMatch, status: string) =>
  match.state.type === status;

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
  setState,
  addAttacks,
  resetNope,
  toggleNoped,
  removePlayer,
  isEnd,
  isState,
  resetSkipVotes,
};

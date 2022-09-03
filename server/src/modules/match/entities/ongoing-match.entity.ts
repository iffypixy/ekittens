import {User} from "@modules/user";
import {OngoingMatchPlayer} from "./ongoing-match-player.entity";
import {
  OngoingMatchVotes,
  OngoingMatchState,
  OngoingMatchContext,
  MatchType,
  Card,
  OngoingMatchData,
  OngoingMatchPlayerData,
  MatchStateType,
} from "../lib/typings";
import {MATCH_STATE} from "../lib/constants";

export class OngoingMatch {
  id: string;
  turn: number;
  players: OngoingMatchPlayer[];
  out: OngoingMatchPlayer[];
  spectators: User[];
  draw: Card[];
  discard: Card[];
  type: MatchType;
  votes: OngoingMatchVotes;
  state: OngoingMatchState;
  context: OngoingMatchContext;
  last: string | null;

  constructor(match: OngoingMatchData) {
    this.id = match.id;
    this.turn = match.turn;
    this.players = match.players.map((p) => new OngoingMatchPlayer(p));
    this.out = match.out.map((p) => new OngoingMatchPlayer(p));
    this.spectators = match.spectators.map((spectator) =>
      User.create(spectator),
    );
    this.draw = match.draw;
    this.discard = match.discard;
    this.type = match.type;
    this.votes = match.votes;
    this.state = match.state;
    this.context = match.context;
    this.last = match.last;
  }

  public changeTurn() {
    const isReversed = this.context.reversed;

    if (isReversed) {
      const previous = this.players[this.turn - 1];

      if (!!previous) this.turn--;
      else this.turn = this.players.length - 1;

      return;
    }

    const next = this.players[this.turn + 1];

    if (!!next) this.turn++;
    else this.turn = 0;
  }

  public updateTurn() {
    const isReversed = this.context.reversed;

    if (isReversed) {
      const previous = this.players[this.turn - 1];

      if (!!previous) this.turn--;
      else this.turn = this.players.length - 1;

      return;
    }

    const next = this.players[this.turn];

    if (!next) this.turn = 0;
  }

  public lessenAttacks() {
    this.context.attacks--;
  }

  public resetAttacks() {
    this.context.attacks = 0;
  }

  public addAttacks(amount: number) {
    this.context.attacks += amount;
  }

  public swapTopAndBottom() {
    const top = this.draw.shift();
    const bottom = this.draw.pop();

    this.draw.unshift(bottom);
    this.draw.push(top);
  }

  public resetState() {
    this.state = {
      type: MATCH_STATE.WFA,
      at: Date.now(),
      payload: null,
    };
  }

  public setState(state: Omit<OngoingMatchState, "at">) {
    this.state = {
      ...state,
      at: Date.now(),
    };
  }

  public resetNope() {
    this.context.noped = false;
  }

  public toggleNoped() {
    this.context.noped = !this.context.noped;
  }

  public toggleReversed() {
    this.context.reversed = !this.context.reversed;
  }

  public removePlayer(id: string) {
    this.players = this.players.filter((player) => player.user.id !== id);
  }

  public addLoser(data: OngoingMatchPlayerData) {
    this.out.push(new OngoingMatchPlayer(data));
  }

  public isState(type: MatchStateType) {
    return this.state.type === type;
  }

  public resetSkipVotes() {
    this.votes.skip = [];
  }

  get nextTurn() {
    const isReversed = this.context.reversed;

    if (isReversed) {
      const previous = this.players[this.turn - 1];

      if (!!previous) return this.turn - 1;
      else return this.players.length - 1;
    }

    const next = this.players[this.turn + 1];

    if (!!next) return this.turn + 1;
    else return 0;
  }

  get isAttacked() {
    return this.context.attacks > 0;
  }

  get isReversed() {
    return this.context.reversed;
  }

  get isEnd() {
    return this.players.length === 1;
  }

  public(pID?: string) {
    const {
      id,
      players,
      out,
      discard,
      draw,
      turn,
      votes,
      state,
      context,
      type,
      spectators,
      last,
    } = this;

    const isTurn = players[turn].user.id === pID;

    if (this.isState(MATCH_STATE.ATF)) {
      if (!isTurn) state.payload = null;
    } else if (this.isState(MATCH_STATE.STF)) {
      const isNext = players[this.nextTurn].user.id === pID;

      if (!isTurn || isNext) state.payload = null;
    }

    const player = players.find((player) => player.user.id === pID);

    return {
      id,
      discard,
      votes,
      context,
      turn,
      state,
      type,
      last,
      draw: draw.length,
      out: out.map((player) => player.public),
      players: players.map((player) => player.public),
      spectators: spectators.map((user) => user.public),
      cards: player?.cards,
      marked: player?.marked,
      as: player ? "player" : "spectator",
    };
  }
}

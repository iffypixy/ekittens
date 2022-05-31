import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {DrawCardOutput, Match} from "@shared/api";
import {CardType} from "@entities/card";
import * as actions from "./actions";

export interface MatchState {
  match: Match | null;
  isMatchBeingStarted: boolean;
  cards: CardType[] | null;
}

export const reducer = createReducer<MatchState>(
  {
    match: null,
    isMatchBeingStarted: false,
    cards: null,
  },
  {
    [actions.startMatch.pending.type]: (state) => {
      state.isMatchBeingStarted = true;
    },

    [actions.startMatch.fulfilled.type]: (state) => {
      state.isMatchBeingStarted = false;
    },

    [actions.startMatch.rejected.type]: (state) => {
      state.isMatchBeingStarted = false;
    },

    [actions.setCards.type]: (
      state,
      {payload}: PayloadAction<actions.SetCardsPayload>,
    ) => {
      state.cards = payload.cards;
    },

    [actions.setMatch.type]: (
      state,
      {payload}: PayloadAction<actions.SetMatchPayload>,
    ) => {
      state.match = payload.match;
    },

    [actions.drawCard.fulfilled.type]: (
      state,
      {payload}: PayloadAction<DrawCardOutput>,
    ) => {
      state.cards!.push(payload.card);
    },

    [actions.updatePlayer.type]: (
      state,
      {payload}: PayloadAction<actions.UpdatePlayerPayload>,
    ) => {
      state.match!.players = state.match!.players.map((player) =>
        player.id === payload.playerId
          ? {...player, ...payload.update}
          : player,
      );
    },

    [actions.updateMatch.type]: (
      state,
      {payload}: PayloadAction<actions.UpdateMatchPayload>,
    ) => {
      state.match = {...state.match!, ...payload};
    },

    [actions.continueTurn.type]: (state) => {
      const active = state.match!.players.filter(
        (player) => !player.defeated && !player.kicked,
      );

      const next = active[state.match!.turn + 1];

      if (next) state.match!.turn++;
      else state.match!.turn = 0;
    },
  },
);

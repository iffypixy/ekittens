import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {DrawCardOutput, Match, PlayCardData} from "@shared/api";
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
      if (payload.card !== "exploding-kitten") state.cards!.push(payload.card);

      if (payload.card === "exploding-kitten") state.match!.hasToDefuse = true;
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

    [actions.playCard.fulfilled.type]: (
      state,
      {meta: {arg}}: PayloadAction<void, string, {arg: PlayCardData}>,
    ) => {
      const idx = state.cards!.findIndex((card) => card === arg.card);

      state.cards!.splice(idx, 1);

      state.match!.pile.push(arg.card);
    },

    [actions.addPileCard.type]: (
      state,
      {payload}: PayloadAction<actions.AddPileCardPayload>,
    ) => {
      state.match!.pile.push(payload.card);
    },

    [actions.playDefuse.fulfilled.type]: (state) => {
      const idx = state.cards!.findIndex((card) => card === "defuse");

      state.cards!.splice(idx, 1);

      state.match!.pile.push("defuse");

      state.match!.hasToDefuse = false;
      state.match!.hasToChooseSpot = true;
    },

    [actions.decrementLeft.type]: (state) => {
      state.match!.left--;
    },

    [actions.setCardSpot.fulfilled.type]: (state) => {
      state.match!.hasToChooseSpot = false;
    },

    [actions.incrementLeft.type]: (state) => {
      state.match!.left++;
    },
  },
);

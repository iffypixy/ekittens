import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {OngoingMatch} from "@shared/api/common";
import {Nullable} from "@shared/lib/typings";

import * as actions from "./actions";

export interface CurrentMatchStore {
  match: Nullable<OngoingMatch>;
}

export const store = createReducer<CurrentMatchStore>(
  {
    match: null,
  },
  {
    [actions.setMatch.type]: (
      state,
      {payload}: PayloadAction<actions.SetMatchPayload>,
    ) => {
      state.match = payload.match;
    },

    [actions.addDiscardPileCard.type]: (
      state,
      {payload}: PayloadAction<actions.AddDiscardPileCardPayload>,
    ) => {
      state.match!.discard.push(payload.card);
    },

    [actions.removeDeckCard.type]: (
      state,
      {payload}: PayloadAction<actions.RemoveDeckCardPayload>,
    ) => {
      state.match!.cards = state.match!.cards!.filter(
        (card) => card.id !== payload.cardId,
      );
    },

    [actions.removeActivePlayer.type]: (
      state,
      {payload}: PayloadAction<actions.RemoveActivePlayerPayload>,
    ) => {
      state.match!.players = state.match!.players.filter(
        (p) => p.id !== payload.playerId,
      );
    },

    [actions.addInactivePlayer.type]: (
      state,
      {payload}: PayloadAction<actions.AddInactivePlayerPayload>,
    ) => {
      state.match!.out.push(payload.player);
    },

    [actions.addMarkedCard.type]: (
      state,
      {payload}: PayloadAction<actions.AddMarkedCardPayload>,
    ) => {
      state.match!.players = state.match!.players.map((p) =>
        p.id === payload.playerId
          ? {...p, marked: [...p.marked, payload.card]}
          : p,
      );
    },

    [actions.setContext.type]: (
      state,
      {payload}: PayloadAction<actions.SetContextPayload>,
    ) => {
      state.match!.context = {...state.match!.context, ...payload.context};
    },

    [actions.setState.type]: (
      state,
      {payload}: PayloadAction<actions.SetStatePayload>,
    ) => {
      state.match!.state = payload.state;
    },

    [actions.incrementDrawPileCards.type]: (state) => {
      state.match!.draw++;
    },

    [actions.decrementDrawPileCards.type]: (state) => {
      state.match!.draw--;
    },

    [actions.incrementPlayerCards.type]: (
      state,
      {payload}: PayloadAction<actions.IncrementPlayerCardsPayload>,
    ) => {
      state.match!.players = state.match!.players.map((p) =>
        p.id === payload.playerId
          ? {...p, cards: [...p.cards, payload.cardId]}
          : p,
      );
    },

    [actions.decrementPlayerCards.type]: (
      state,
      {payload}: PayloadAction<actions.DecrementPlayerCardsPayload>,
    ) => {
      state.match!.players = state.match!.players.map((p) =>
        p.id === payload.playerId
          ? {...p, cards: p.cards.filter((id) => id !== payload.cardId)}
          : p,
      );
    },

    [actions.addDeckCard.type]: (
      state,
      {payload}: PayloadAction<actions.AddDeckCardPayload>,
    ) => {
      state.match!.cards!.push(payload.card);
    },

    [actions.setTurn.type]: (
      state,
      {payload}: PayloadAction<actions.SetTurnPayload>,
    ) => {
      state.match!.turn = payload.turn;
    },

    [actions.addSpectator.type]: (
      state,
      {payload}: PayloadAction<actions.AddSpectatorPayload>,
    ) => {
      state.match!.spectators.push(payload.spectator);
    },

    [actions.removeSpectator.type]: (
      state,
      {payload}: PayloadAction<actions.RemoveSpectatorPayload>,
    ) => {
      state.match!.spectators = state.match!.spectators.filter(
        (s) => s.id !== payload.spectatorId,
      );
    },

    [actions.setLast.type]: (
      state,
      {payload}: PayloadAction<actions.SetLastPayload>,
    ) => {
      state.match!.last = payload.last;
    },
  },
);

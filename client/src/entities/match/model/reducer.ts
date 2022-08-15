import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {CardName} from "@entities/card";
import {DefeatReason, Lobby, OngoingMatch} from "@shared/api/common";
import * as actions from "./actions";

export interface MatchState {
  match: OngoingMatch | null;
  future: CardName[];
  result: {
    type: "victory" | "defeat";
    shift: number;
    reason?: DefeatReason;
    rating: number;
  } | null;
  losers: {
    id: string;
    reason: DefeatReason;
  }[];
  lobby: Lobby | null;
}

export const reducer = createReducer<MatchState>(
  {
    match: null,
    future: [],
    result: null,
    losers: [],
    lobby: null,
  },
  {
    [actions.setMatch.type]: (
      state,
      {payload}: PayloadAction<actions.SetMatchPayload>,
    ) => {
      state.match = payload;
    },

    [actions.joinMatch.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.JoinMatchPayload>,
    ) => {
      state.match = payload.match;
    },

    [actions.setCards.type]: (
      state,
      {payload}: PayloadAction<actions.SetCardsPayload>,
    ) => {
      state.match!.cards = payload;
    },

    [actions.setTurn.type]: (
      state,
      {payload}: PayloadAction<actions.SetTurnPayload>,
    ) => {
      state.match!.turn = payload;
    },

    [actions.setState.type]: (
      state,
      {payload}: PayloadAction<actions.SetStatePayload>,
    ) => {
      state.match!.state = payload;
    },

    [actions.incrementCardsNumber.type]: (
      state,
      {payload}: PayloadAction<actions.IncrementCardsNumberPayload>,
    ) => {
      state.match!.players = state.match!.players.map((player) =>
        player.id === payload.playerId
          ? {...player, cards: [...player.cards, payload.cardId]}
          : player,
      );
    },

    [actions.decrementCardsNumber.type]: (
      state,
      {payload}: PayloadAction<actions.IncrementCardsNumberPayload>,
    ) => {
      state.match!.last = payload.playerId;

      state.match!.players = state.match!.players.map((player) =>
        player.id === payload.playerId
          ? {
              ...player,
              cards: player.cards.filter((id) => id !== payload.cardId),
            }
          : player,
      );
    },

    [actions.setContext.type]: (
      state,
      {payload}: PayloadAction<actions.SetContextPayload>,
    ) => {
      state.match!.context = {...state.match!.context, ...payload};
    },

    [actions.addCard.type]: (
      state,
      {payload}: PayloadAction<actions.AddCardPayload>,
    ) => {
      state.match!.cards!.push(payload);
    },

    [actions.removeCard.type]: (
      state,
      {payload}: PayloadAction<actions.RemoveCardPayload>,
    ) => {
      state.match!.cards = state.match!.cards!.filter(
        (card) => card.id !== payload.id,
      );
    },

    [actions.incrementDrawCards.type]: (state) => {
      state.match!.draw = state.match!.draw + 1;
    },

    [actions.decrementDrawCards.type]: (state) => {
      state.match!.draw = state.match!.draw - 1;
    },

    [actions.addDiscardCard.type]: (
      state,
      {payload}: PayloadAction<actions.AddDiscardCardPayload>,
    ) => {
      state.match!.discard.push(payload);
    },

    [actions.setFuture.type]: (
      state,
      {payload}: PayloadAction<actions.SetFuturePayload>,
    ) => {
      state.future = payload;
    },

    [actions.addMarked.type]: (
      state,
      {payload}: PayloadAction<actions.AddMarkedPayload>,
    ) => {
      state.match!.players = state.match!.players.map((player) =>
        player.id === payload.playerId
          ? {...player, marked: [...player.marked, payload.card]}
          : player,
      );
    },

    [actions.removePlayer.type]: (
      state,
      {payload}: PayloadAction<actions.RemovePlayerPayload>,
    ) => {
      state.match!.players = state.match!.players.filter(
        (player) => player.id !== payload.playerId,
      );
    },

    [actions.addLoser.type]: (
      state,
      {payload}: PayloadAction<actions.AddLoserPayload>,
    ) => {
      state.match!.out.push(payload);
    },

    [actions.setResult.type]: (
      state,
      {payload}: PayloadAction<actions.SetResultPayload>,
    ) => {
      state.result = payload;
    },

    [actions.addSpectator.type]: (
      state,
      {payload}: PayloadAction<actions.AddSpectatorPayload>,
    ) => {
      state.match?.spectators.push(payload);
    },

    [actions.removeSpectator.type]: (
      state,
      {payload}: PayloadAction<actions.RemoveSpectatorPayload>,
    ) => {
      state.match!.spectators = state.match!.spectators.filter(
        (spectator) => spectator.id !== payload,
      );
    },

    [actions.setLobby.type]: (
      state,
      {payload}: PayloadAction<actions.SetLobbyPayload>,
    ) => {
      state.lobby = payload;
    },

    [actions.addPlayer.type]: (
      state,
      {payload}: PayloadAction<actions.AddPlayerPayload>,
    ) => {
      state.lobby?.participants.push(payload);
    },

    [actions.removeLobbyPlayer.type]: (
      state,
      {payload}: PayloadAction<actions.RemoveLobbyPlayerPayload>,
    ) => {
      state.lobby!.participants = state.lobby!.participants.filter(
        (participant) => participant.id !== payload,
      );
    },

    [actions.setDisabled.type]: (
      state,
      {payload}: PayloadAction<actions.SetDisabledPayload>,
    ) => {
      state.lobby!.disabled = payload;
    },

    [actions.setRole.type]: (
      state,
      {payload}: PayloadAction<actions.SetRolePayload>,
    ) => {
      state.lobby!.participants = state.lobby!.participants.map((participant) =>
        participant.id === payload.id
          ? {...participant, role: payload.role}
          : participant,
      );
    },
  },
);

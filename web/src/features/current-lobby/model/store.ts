import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Lobby} from "@shared/api/common";
import {Nullable} from "@shared/lib/typings";

import * as actions from "./actions";

export interface CurrentLobbyStore {
  lobby: Nullable<Lobby>;
}

export const store = createReducer<CurrentLobbyStore>(
  {
    lobby: null,
  },
  {
    [actions.setLobby.type]: (
      state,
      {payload}: PayloadAction<actions.SetLobbyPayload>,
    ) => {
      state.lobby = payload.lobby;
    },

    [actions.setDisabledCards.type]: (
      state,
      {payload}: PayloadAction<actions.SetDisabledCardsPayload>,
    ) => {
      state.lobby!.mode.payload = {
        disabled: payload.cards,
      };
    },

    [actions.setMode.type]: (
      state,
      {payload}: PayloadAction<actions.SetModePayload>,
    ) => {
      state.lobby!.mode = payload.mode;
    },

    [actions.addParticipant.type]: (
      state,
      {payload}: PayloadAction<actions.AddParticipantPayload>,
    ) => {
      state.lobby!.participants.push(payload.participant);
    },

    [actions.removeParticipant.type]: (
      state,
      {payload}: PayloadAction<actions.RemoveParticipantPayload>,
    ) => {
      state.lobby!.participants = state.lobby!.participants.filter(
        (p) => p.id !== payload.participantId,
      );
    },

    [actions.setParticipantRole.type]: (
      state,
      {payload}: PayloadAction<actions.SetParticipantRolePayload>,
    ) => {
      state.lobby!.participants = state.lobby!.participants.map((p) =>
        p.id === payload.participantId ? {...p, role: payload.role} : p,
      );
    },
  },
);

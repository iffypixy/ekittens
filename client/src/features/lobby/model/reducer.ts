import {createReducer, PayloadAction} from "@reduxjs/toolkit";
import {CreateLobbyOutput, JoinLobbyOutput, Lobby} from "@shared/api";

import * as actions from "./actions";

export interface LobbyState {
  isLobbyBeingCreated: boolean;
  lobby: Lobby | null;
  isJoiningLobby: boolean;
}

export const reducer = createReducer<LobbyState>(
  {
    isLobbyBeingCreated: false,
    lobby: null,
    isJoiningLobby: false,
  },
  {
    [actions.createLobby.pending.type]: (state) => {
      state.isLobbyBeingCreated = true;
    },

    [actions.createLobby.fulfilled.type]: (
      state,
      {payload}: PayloadAction<CreateLobbyOutput>,
    ) => {
      state.isLobbyBeingCreated = false;
      state.lobby = payload.lobby;
    },

    [actions.createLobby.rejected.type]: (state) => {
      state.isLobbyBeingCreated = false;
    },

    [actions.joinLobby.pending.type]: (state) => {
      state.isJoiningLobby = true;
    },

    [actions.joinLobby.fulfilled.type]: (
      state,
      {payload}: PayloadAction<JoinLobbyOutput>,
    ) => {
      state.isJoiningLobby = false;
      state.lobby = payload.lobby;
    },

    [actions.joinLobby.rejected.type]: (state) => {
      state.isJoiningLobby = false;
    },

    [actions.addPlayer.type]: (
      state,
      {payload}: PayloadAction<actions.AddPlayerData>,
    ) => {
      state.lobby!.players.push(payload.player);
    },
  },
);

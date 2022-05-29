import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {
  CreateLobbyData,
  CreateLobbyOutput,
  JoinLobbyData,
  JoinLobbyOutput,
  KickLobbyPlayerData,
  LeaveLobbyData,
  lobbyApi,
  LobbyPlayer,
} from "@shared/api";

const prefix = "lobby";

export const createLobby = createAsyncThunk<CreateLobbyOutput, CreateLobbyData>(
  `${prefix}/createLobby`,
  async (data) => {
    const output = await lobbyApi.create(data);

    return output;
  },
);

export const joinLobby = createAsyncThunk<JoinLobbyOutput, JoinLobbyData>(
  `${prefix}/joinLobby`,
  async (data) => {
    const output = await lobbyApi.join(data);

    return output;
  },
);

export const kickPlayerFromLobby = createAsyncThunk<void, KickLobbyPlayerData>(
  `${prefix}/kickPlayerFromLobby`,
  async (data) => {
    const output = await lobbyApi.kickPlayer(data);

    return output;
  },
);

export const leaveLobby = createAsyncThunk<void, LeaveLobbyData>(
  `${prefix}/leaveLobby`,
  async (data) => {
    const output = await lobbyApi.leave(data);

    return output;
  },
);

export interface AddPlayerData {
  player: LobbyPlayer;
}

export const addPlayer = createAction<AddPlayerData>(`${prefix}/addPlayer`);

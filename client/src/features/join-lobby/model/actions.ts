import {createAsyncThunk} from "@reduxjs/toolkit";

import {JoinLobbyData, JoinLobbyResponse, matchApi} from "@shared/api/match";

const prefix = "join-lobby";

export type JoinAsPlayerOptions = JoinLobbyData;
export type JoinAsPlayerPayload = JoinLobbyResponse;

export const joinAsPlayer = createAsyncThunk<
  JoinAsPlayerPayload,
  JoinAsPlayerOptions
>(`${prefix}/joinAsPlayer`, async (options) => {
  return matchApi.joinLobbyAsPlayer(options);
});

export type JoinAsSpectatorOptions = JoinLobbyData;
export type JoinAsSpectatorPayload = JoinLobbyResponse;

export const joinAsSpectator = createAsyncThunk<
  JoinAsSpectatorPayload,
  JoinAsSpectatorOptions
>(`${prefix}/joinAsSpectator`, async (options) => {
  return matchApi.joinLobbyAsPlayer(options);
});

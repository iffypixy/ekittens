import {createAsyncThunk} from "@reduxjs/toolkit";

import {
  LeaveLobbyData,
  matchApi,
  StartMatchData,
  StartMatchResponse,
} from "@shared/api/match";

const prefix = "lobby-interactions";

export type LeaveLobbyPayload = void;
export type LeaveLobbyOptions = LeaveLobbyData;

export const leaveLobby = createAsyncThunk<
  LeaveLobbyPayload,
  LeaveLobbyOptions
>(`${prefix}/leaveLobby`, async (options) => {
  return matchApi.leaveLobby(options);
});

export type StartMatchPayload = StartMatchResponse;
export type StartMatchOptions = StartMatchData;

export const startMatch = createAsyncThunk<
  StartMatchPayload,
  StartMatchOptions
>(`${prefix}/startMatch`, async (options) => {
  return matchApi.startMatch(options);
});

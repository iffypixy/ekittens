import {createAsyncThunk} from "@reduxjs/toolkit";

import {
  JoinMatchData,
  JoinMatchResponse,
  matchApi,
  SpectateMatchData,
  SpectateMatchResponse,
} from "@shared/api/match";

const prefix = "join-match";

export type JoinAsPlayerOptions = JoinMatchData;
export type JoinAsPlayerPayload = JoinMatchResponse;

export const joinAsPlayer = createAsyncThunk<
  JoinAsPlayerPayload,
  JoinAsPlayerOptions
>(`${prefix}/joinAsPlayer`, (options) => {
  return matchApi.joinMatch(options);
});

export type JoinAsSpectatorOptions = SpectateMatchData;
export type JoinAsSpectatorPayload = SpectateMatchResponse;

export const joinAsSpectator = createAsyncThunk<
  JoinAsSpectatorPayload,
  JoinAsSpectatorOptions
>(`${prefix}/joinAsSpectator`, async (options) => {
  return matchApi.spectateMatch(options);
});

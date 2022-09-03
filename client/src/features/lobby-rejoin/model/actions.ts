import {createAction, createAsyncThunk} from "@reduxjs/toolkit";
import {GetCurrentLobbyResponse, matchApi} from "@shared/api/match";

const prefix = "lobby-rejoin";

export type FetchCurrentLobbyPayload = GetCurrentLobbyResponse;
export type FetchCurrentLobbyOptions = void;

export const fetchCurrentLobby = createAsyncThunk<
  FetchCurrentLobbyPayload,
  FetchCurrentLobbyOptions
>(`${prefix}/fetchCurrentLobby`, async () => {
  return matchApi.getCurrentLobby();
});

export interface SetShouldCheckPayload {
  shouldCheck: boolean;
}

export const setShouldCheck = createAction<SetShouldCheckPayload>(
  `${prefix}/setShouldCheck`,
);

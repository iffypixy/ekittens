import {createAsyncThunk} from "@reduxjs/toolkit";

import {CreateLobbyResponse, matchApi} from "@shared/api/match";

const prefix = "create-lobby";

export type CreateLobbyOptions = void;
export type CreateLobbyPayload = CreateLobbyResponse;

export const createLobby = createAsyncThunk<
  CreateLobbyPayload,
  CreateLobbyOptions
>(`${prefix}/createLobby`, async () => {
  return matchApi.createLobby();
});

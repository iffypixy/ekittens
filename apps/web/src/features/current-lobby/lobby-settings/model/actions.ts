import {createAsyncThunk} from "@reduxjs/toolkit";

import {
  KickParticipantData,
  matchApi,
  SetGameModeData,
  UpdateDisabledData,
} from "@shared/api/match";

const prefix = "lobby-settings";

export type SetModeAsyncPayload = void;
export type SetModeAsyncOptions = SetGameModeData;

export const setModeAsync = createAsyncThunk<
  SetModeAsyncPayload,
  SetModeAsyncOptions
>(`${prefix}/setModeAsync`, async (options) => {
  return matchApi.setGameMode(options);
});

export type SetDisabledCardsAsyncPayload = void;
export type SetDisabledCardsAsyncOptions = UpdateDisabledData;

export const setDisabledCardsAsync = createAsyncThunk<
  SetDisabledCardsAsyncPayload,
  SetDisabledCardsAsyncOptions
>(`${prefix}/setDisabledCardsAsync`, async (options) => {
  return matchApi.updateDisabled(options);
});

export type KickParticipantOptions = KickParticipantData;
export type KickParticipantPayload = void;

export const kickParticipant = createAsyncThunk<
  KickParticipantPayload,
  KickParticipantOptions
>(`${prefix}/removeParticipant`, async (options) => {
  return matchApi.kickParticipant(options);
});

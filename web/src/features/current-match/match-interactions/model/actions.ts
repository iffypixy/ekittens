import {createAsyncThunk} from "@reduxjs/toolkit";
import {
  LeaveMatchAsPlayerData,
  LeaveMatchAsSpectatorData,
  matchApi,
} from "@shared/api/match";

const prefix = "match-interactions";

export type LeaveAsPlayerPayload = void;
export type LeaveAsPlayerOptions = LeaveMatchAsPlayerData;

export const leaveAsPlayer = createAsyncThunk<
  LeaveAsPlayerPayload,
  LeaveAsPlayerOptions
>(`${prefix}/leaveAsPlayer`, async (options) => {
  return matchApi.leaveMatchAsPlayer(options);
});

export type LeaveAsSpectatorPayload = void;
export type LeaveAsSpectatorOptions = LeaveMatchAsSpectatorData;

export const leaveAsSpectator = createAsyncThunk<
  LeaveAsSpectatorPayload,
  LeaveAsSpectatorOptions
>(`${prefix}/leaveAsSpectator`, async (options) => {
  return matchApi.leaveMatchAsSpectator(options);
});

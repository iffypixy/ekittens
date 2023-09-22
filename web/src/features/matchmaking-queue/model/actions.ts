import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {GetQueueStatusResponse, matchApi} from "@shared/api/match";

import {MatchmakingQueueStore} from "./store";

const prefix = "matchmaking-queue";

export interface SetIsEnqueuedPayload {
  isEnqueued: MatchmakingQueueStore["isEnqueued"];
}

export const setIsEnqueued = createAction<SetIsEnqueuedPayload>(
  `${prefix}/setIsEnqueued`,
);

export interface SetEnqueuedAtPayload {
  enqueuedAt: MatchmakingQueueStore["enqueuedAt"];
}

export const setEnqueuedAt = createAction<SetEnqueuedAtPayload>(
  `${prefix}/setEnqueuedAt`,
);

export type FetchQueueStatusPayload = GetQueueStatusResponse;
export type FetchQueueStatusOptions = void;

export const fetchQueueStatus = createAsyncThunk<
  FetchQueueStatusPayload,
  FetchQueueStatusOptions
>(`${prefix}/fetchQueueStatus`, async () => {
  const {data} = await matchApi.getQueueStatus();

  return data;
});

export type JoinQueuePayload = void;
export type JoinQueueOptions = void;

export const joinQueue = createAsyncThunk<JoinQueuePayload, JoinQueueOptions>(
  `${prefix}/joinQueue`,
  async () => {
    return matchApi.joinQueue();
  },
);

export type LeaveQueuePayload = void;
export type LeaveQueueOptions = void;

export const leaveQueue = createAsyncThunk<
  LeaveQueuePayload,
  LeaveQueueOptions
>(`${prefix}/leaveQueue`, async () => {
  return matchApi.leaveQueue();
});

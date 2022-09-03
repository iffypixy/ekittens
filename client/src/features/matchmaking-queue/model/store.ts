import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Nullable} from "@shared/lib/typings";

import * as actions from "./actions";

export interface MatchmakingQueueStore {
  isEnqueued: boolean;
  enqueuedAt: Nullable<number>;
}

export const store = createReducer<MatchmakingQueueStore>(
  {
    isEnqueued: false,
    enqueuedAt: null,
  },
  {
    [actions.setEnqueuedAt.type]: (
      state,
      {payload}: PayloadAction<actions.SetEnqueuedAtPayload>,
    ) => {
      state.enqueuedAt = payload.enqueuedAt;
    },

    [actions.setIsEnqueued.type]: (
      state,
      {payload}: PayloadAction<actions.SetIsEnqueuedPayload>,
    ) => {
      state.isEnqueued = payload.isEnqueued;
    },

    [actions.fetchQueueStatus.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchQueueStatusPayload>,
    ) => {
      state.isEnqueued = payload.isEnqueued;
      state.enqueuedAt = payload.enqueuedAt;
    },
  },
);

import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import * as actions from "./actions";

export interface MatchRejoinStore {
  shouldCheck: boolean;
}

export const store = createReducer<MatchRejoinStore>(
  {
    shouldCheck: true,
  },
  {
    [actions.setShouldCheck.type]: (
      state,
      {payload}: PayloadAction<actions.SetShouldCheckPayload>,
    ) => {
      state.shouldCheck = payload.shouldCheck;
    },
  },
);

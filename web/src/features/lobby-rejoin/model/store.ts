import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import * as actions from "./actions";

export interface LobbyRejoinStore {
  shouldCheck: boolean;
}

export const store = createReducer<LobbyRejoinStore>(
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

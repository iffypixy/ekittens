import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Match, StartMatchOutput} from "@shared/api";
import * as actions from "./actions";

export interface MatchState {
  match: Match | null;
  isMatchBeingStarted: boolean;
}

export const reducer = createReducer<MatchState>(
  {
    match: null,
    isMatchBeingStarted: false,
  },
  {
    [actions.startMatch.pending.type]: (state) => {
      state.isMatchBeingStarted = true;
    },

    [actions.startMatch.fulfilled.type]: (
      state,
      {payload}: PayloadAction<StartMatchOutput>,
    ) => {
      state.match = payload.match;
      state.isMatchBeingStarted = false;
    },

    [actions.startMatch.rejected.type]: (state) => {
      state.isMatchBeingStarted = false;
    },
  },
);

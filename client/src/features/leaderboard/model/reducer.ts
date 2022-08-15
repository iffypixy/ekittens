import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Leaderboard} from "@shared/api/common";
import * as actions from "./actions";

export interface LeaderboardState {
  leaderboard: Leaderboard;
}

export const reducer = createReducer<LeaderboardState>(
  {
    leaderboard: [],
  },
  {
    [actions.fetchLeaderboard.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchLeaderboardPayload>,
    ) => {
      state.leaderboard = payload.leaderboard;
    },
  },
);

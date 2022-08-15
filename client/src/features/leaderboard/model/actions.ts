import {createAsyncThunk} from "@reduxjs/toolkit";

import {GetLeaderboardResponse, leaderboardApi} from "@shared/api/leaderboard";

const prefix = "leaderboard";

export type FetchLeaderboardPayload = GetLeaderboardResponse;

export const fetchLeaderboard = createAsyncThunk<FetchLeaderboardPayload, void>(
  `${prefix}/fetchLeaderboard`,
  async () => {
    const {data} = await leaderboardApi.getLeaderboard();

    return data;
  },
);

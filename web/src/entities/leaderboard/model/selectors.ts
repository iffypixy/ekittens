import {RootState} from "@app/store";

const state = (state: RootState) => state.leaderboard;

export const leaderboard = (s: RootState) => state(s).leaderboard;

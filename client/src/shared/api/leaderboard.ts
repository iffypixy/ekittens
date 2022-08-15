import {AxiosPromise} from "axios";

import {request} from "@shared/lib/request";
import {Leaderboard} from "./common";

export interface GetLeaderboardResponse {
  leaderboard: Leaderboard;
}

const getLeaderboard = (): AxiosPromise<GetLeaderboardResponse> =>
  request({url: "/leaderboard", method: "GET"});

export const leaderboardApi = {getLeaderboard};

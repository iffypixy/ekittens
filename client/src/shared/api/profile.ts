import {AxiosPromise} from "axios";

import {request} from "@shared/lib/request";
import {User, Match, ProfileStatistics, Profile} from "./common";

export interface GetMeResponse {
  user: User;
}

const getMe = (): AxiosPromise<GetMeResponse> => request({url: "/profile/me"});

export interface GetMyMatchesResponse {
  matches: Match[];
}

const getMyMatches = (): AxiosPromise<GetMyMatchesResponse> =>
  request({url: "/profile/me/matches"});

export interface GetMyFriendsResponse {
  friends: User[];
}

const getMyFriends = (): AxiosPromise<GetMyFriendsResponse> =>
  request({url: "/profile/me/friends"});

export interface GetMyStatsResponse {
  stats: ProfileStatistics;
}

const getMyStats = (): AxiosPromise<GetMyStatsResponse> =>
  request({url: "/profile/me/stats"});

export interface GetUserData {
  username: string;
}

export interface GetUserResponse {
  user: Profile;
}

const getUser = (data: GetUserData): AxiosPromise<GetUserResponse> =>
  request({url: `/profile/${data.username}`});

export interface GetMatchesData {
  username: string;
}

export interface GetMatchesResponse {
  matches: Match[];
}

const getMatches = (data: GetMatchesData): AxiosPromise<GetMatchesResponse> =>
  request({url: `/profile/${data.username}/matches`});

export interface GetFriendsData {
  username: string;
}

export interface GetFriendsResponse {
  friends: User[];
}

const getFriends = (data: GetFriendsData): AxiosPromise<GetFriendsResponse> =>
  request({url: `/profile/${data.username}/friends`});

export interface GetStatsData {
  username: string;
}

export interface GetStatsResponse {
  stats: ProfileStatistics;
}

const getStats = (data: GetStatsData): AxiosPromise<GetStatsResponse> =>
  request({url: `/profile/${data.username}/stats`});

export const profileApi = {
  getMe,
  getMyMatches,
  getMyFriends,
  getMyStats,
  getUser,
  getMatches,
  getFriends,
  getStats,
};

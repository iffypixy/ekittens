import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {
  profileApi,
  GetFriendsData,
  GetFriendsResponse,
  GetMatchesData,
  GetMatchesResponse,
  GetUserData,
  GetUserResponse,
  GetStatsData,
  GetStatsResponse,
} from "@shared/api/profile";

const prefix = "profile";

export type FetchUserPayload = GetUserResponse;
export type FetchUserData = GetUserData;

export const fetchUser = createAsyncThunk<FetchUserPayload, FetchUserData>(
  `${prefix}/fetchUser`,
  async (options) => {
    const {data} = await profileApi.getUser(options);

    return data;
  },
);

export type FetchMatchesPayload = GetMatchesResponse;
export type FetchMatchesData = GetMatchesData;

export const fetchMatches = createAsyncThunk<
  FetchMatchesPayload,
  FetchMatchesData
>(`${prefix}/fetchMatches`, async (options) => {
  const {data} = await profileApi.getMatches(options);

  return data;
});

export type FetchFriendsPayload = GetFriendsResponse;
export type FetchFriendsData = GetFriendsData;

export const fetchFriends = createAsyncThunk<
  FetchFriendsPayload,
  FetchFriendsData
>(`${prefix}/fetchFriends`, async (options) => {
  const {data} = await profileApi.getFriends(options);

  return data;
});

export type FetchStatsPayload = GetStatsResponse;
export type FetchStatsData = GetStatsData;

export const fetchStats = createAsyncThunk<FetchStatsPayload, FetchStatsData>(
  `${prefix}/fetchStats`,
  async (options) => {
    const {data} = await profileApi.getStats(options);

    return data;
  },
);

export type SetRelationshipPayload = number;

export const setRelationship = createAction<SetRelationshipPayload>(
  `${prefix}/setRelationship`,
);

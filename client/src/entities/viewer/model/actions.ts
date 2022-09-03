import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {Credentials, User} from "@shared/api/common";

import {
  GetMeResponse,
  GetMyFriendsResponse,
  GetMyMatchesResponse,
  GetMyOngoingMatchData,
  GetMyOngoingMatchResponse,
  GetMyStatsResponse,
  profileApi,
} from "@shared/api/profile";

const prefix = "viewer";

export type FetchProfilePayload = GetMeResponse;
export type FetchProfileOptions = void;

export const fetchProfile = createAsyncThunk<
  FetchProfilePayload,
  FetchProfileOptions
>(`${prefix}/fetchProfile`, async () => {
  const {data} = await profileApi.getMe();

  return data;
});

export type FetchMatchesPayload = GetMyMatchesResponse;
export type FetchMatchesOptions = void;

export const fetchMatches = createAsyncThunk<
  FetchMatchesPayload,
  FetchMatchesOptions
>(`${prefix}/fetchMatches`, async () => {
  const {data} = await profileApi.getMyMatches();

  return data;
});

export type FetchFriendsPayload = GetMyFriendsResponse;
export type FetchFriendsOptions = void;

export const fetchFriends = createAsyncThunk<
  FetchFriendsPayload,
  FetchFriendsOptions
>(`${prefix}/fetchFriends`, async () => {
  const {data} = await profileApi.getMyFriends();

  return data;
});

export type FetchStatsPayload = GetMyStatsResponse;
export type FetchStatsOptions = void;

export const fetchStats = createAsyncThunk<
  FetchStatsPayload,
  FetchStatsOptions
>(`${prefix}/fetchStats`, async () => {
  const {data} = await profileApi.getMyStats();

  return data;
});

export type FetchOngoingMatchPayload = GetMyOngoingMatchResponse;
export type FetchOngoingMatchOptions = GetMyOngoingMatchData;

export const fetchOngoingMatch = createAsyncThunk<
  FetchOngoingMatchPayload,
  FetchOngoingMatchOptions
>(`${prefix}/fetchOngoingMatch`, async () => {
  const {data} = await profileApi.getMyOngoingMatch();

  return data;
});

export interface SetCredentialsPayload {
  credentials: Credentials;
}

export const setCredentials = createAction<SetCredentialsPayload>(
  `${prefix}/setCredentials`,
);

export interface AddFriendPayload {
  friend: User;
}

export const addFriend = createAction<AddFriendPayload>(`${prefix}/addFriend`);

export interface RemoveFriendPayload {
  friendId: string;
}

export const removeFriend = createAction<RemoveFriendPayload>(
  `${prefix}/removeFriend`,
);

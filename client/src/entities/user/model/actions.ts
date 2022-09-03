import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {RelationshipType, UserInterim} from "@shared/api/common";
import {
  GetFriendsData,
  GetFriendsResponse,
  GetMatchesData,
  GetMatchesResponse,
  GetStatsData,
  GetStatsResponse,
  GetUserData,
  GetUserResponse,
  profileApi,
} from "@shared/api/profile";
import {
  AcceptFriendRequestData,
  GetInterimData,
  GetInterimResponse,
  RejectFriendRequestData,
  RelationshipRequestResponse,
  RevokeFriendRequestData,
  SendFriendRequestData,
  UnfriendData,
  userApi,
} from "@shared/api/user";
import {WsError} from "@shared/lib/ws";

const prefix = "user";

export type FetchInterimPayload = GetInterimResponse;
export type FetchInterimOptions = GetInterimData;

export const fetchInterim = createAsyncThunk<
  FetchInterimPayload,
  FetchInterimOptions
>(`${prefix}/fetchInterim`, async (options) => {
  return userApi.getInterim(options);
});

export type RelationshipActionPayload = RelationshipRequestResponse;

export type SendFriendRequestPayload = RelationshipActionPayload;
export type SendFriendRequestOptions = SendFriendRequestData;

export const sendFriendRequest = createAsyncThunk<
  SendFriendRequestPayload,
  SendFriendRequestOptions
>(`${prefix}/sendFriendRequest`, async (options, {rejectWithValue}) => {
  try {
    return userApi.sendFriendRequest(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

export type RevokeFriendRequestPayload = RelationshipActionPayload;
export type RevokeFriendRequestOptions = RevokeFriendRequestData;

export const revokeFriendRequest = createAsyncThunk<
  RevokeFriendRequestPayload,
  RevokeFriendRequestOptions
>(`${prefix}/revokeFriendRequest`, async (options, {rejectWithValue}) => {
  try {
    return userApi.revokeFriendRequest(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

export type AcceptFriendRequestPayload = RelationshipActionPayload;
export type AcceptFriendRequestOptions = AcceptFriendRequestData;

export const acceptFriendRequest = createAsyncThunk<
  AcceptFriendRequestPayload,
  AcceptFriendRequestOptions
>(`${prefix}/acceptFriendRequest`, async (options, {rejectWithValue}) => {
  try {
    return userApi.acceptFriendRequest(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

export type RejectFriendRequestPayload = RelationshipActionPayload;
export type RejectFriendRequestOptions = RejectFriendRequestData;

export const rejectFriendRequest = createAsyncThunk<
  RejectFriendRequestPayload,
  RejectFriendRequestOptions
>(`${prefix}/rejectFriendRequest`, async (options, {rejectWithValue}) => {
  try {
    return userApi.rejectFriendRequest(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

export type UnfriendFriendPayload = RelationshipActionPayload;
export type UnfriendFriendOptions = UnfriendData;

export const unfriendFriend = createAsyncThunk<
  UnfriendFriendPayload,
  UnfriendFriendOptions
>(`${prefix}/unfriendFriend`, async (options, {rejectWithValue}) => {
  try {
    return userApi.unfriend(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

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

export interface SetRelationshipPayload {
  relationship: RelationshipType;
}

export const setRelationship = createAction<SetRelationshipPayload>(
  `${prefix}/setRelationship`,
);

export interface SetInterimPayload {
  userId: string;
  interim: Partial<UserInterim>;
}

export const setInterim = createAction<SetInterimPayload>(
  `${prefix}/setInterim`,
);

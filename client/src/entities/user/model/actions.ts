import {createAction, createAsyncThunk} from "@reduxjs/toolkit";
import {User} from "@shared/api/common";

import {
  profileApi,
  GetMeResponse,
  GetMyFriendsResponse,
  GetMyStatsResponse,
  GetMyMatchesResponse,
} from "@shared/api/profile";
import {
  AcceptFriendRequestData,
  RejectFriendRequestData,
  RelationshipRequestResponse,
  RevokeFriendRequestData,
  SendFriendRequestData,
  UnfriendData,
  userApi,
} from "@shared/api/user";
import {WsError} from "@shared/lib/ws";

const prefix = "user";

export type FetchMePayload = GetMeResponse;

export const fetchMe = createAsyncThunk<FetchMePayload, void>(
  `${prefix}/fetchUser`,
  async () => {
    const {data} = await profileApi.getMe();

    return data;
  },
);

export type FetchMyFriendsPayload = GetMyFriendsResponse;

export const fetchMyFriends = createAsyncThunk<FetchMyFriendsPayload, void>(
  `${prefix}/fetchMyFriends`,
  async () => {
    const {data} = await profileApi.getMyFriends();

    return data;
  },
);

export type FetchMyStatsPayload = GetMyStatsResponse;

export const fetchMyStats = createAsyncThunk<FetchMyStatsPayload, void>(
  `${prefix}/fetchMyStats`,
  async () => {
    const {data} = await profileApi.getMyStats();

    return data;
  },
);

export type FetchMyMatchesPayload = GetMyMatchesResponse;

export const fetchMyMatches = createAsyncThunk<FetchMyMatchesPayload, void>(
  `${prefix}/fetchMyMatches`,
  async () => {
    const {data} = await profileApi.getMyMatches();

    return data;
  },
);

export type RelationshipActionPayload = RelationshipRequestResponse;

export const sendFriendRequest = createAsyncThunk<
  RelationshipActionPayload,
  SendFriendRequestData
>(`${prefix}/sendFriendRequest`, async (options, {rejectWithValue}) => {
  try {
    return userApi.sendFriendRequest(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

export const revokeFriendRequest = createAsyncThunk<
  RelationshipActionPayload,
  RevokeFriendRequestData
>(`${prefix}/revokeFriendRequest`, async (options, {rejectWithValue}) => {
  try {
    return userApi.revokeFriendRequest(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

export const acceptFriendRequest = createAsyncThunk<
  RelationshipActionPayload,
  AcceptFriendRequestData
>(`${prefix}/acceptFriendRequest`, async (options, {rejectWithValue}) => {
  try {
    return userApi.acceptFriendRequest(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

export const rejectFriendRequest = createAsyncThunk<
  RelationshipActionPayload,
  RejectFriendRequestData
>(`${prefix}/rejectFriendRequest`, async (options, {rejectWithValue}) => {
  try {
    return userApi.rejectFriendRequest(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

export const unfriend = createAsyncThunk<
  RelationshipActionPayload,
  UnfriendData
>(`${prefix}/unfriend`, async (options, {rejectWithValue}) => {
  try {
    return userApi.unfriend(options);
  } catch (error) {
    return rejectWithValue((error as WsError).msg);
  }
});

export type AddFriendPayload = User;

export const addFriend = createAction<AddFriendPayload>(`${prefix}/addFriend`);

export interface RemoveFriendPayload {
  id: string;
}

export const removeFriend = createAction<RemoveFriendPayload>(
  `${prefix}/removeFriend`,
);

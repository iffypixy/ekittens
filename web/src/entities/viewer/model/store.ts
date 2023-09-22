import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Credentials, Match, User, UserStats} from "@shared/api/common";
import {Nullable, Fetchable} from "@shared/lib/typings";

import * as actions from "./actions";

export interface ViewerStore {
  credentials: Nullable<Credentials>;
  profile: Fetchable<Nullable<User>>;
  matches: Fetchable<Nullable<Match[]>>;
  friends: Fetchable<Nullable<User[]>>;
  stats: Fetchable<Nullable<UserStats>>;
}

export const store = createReducer<ViewerStore>(
  {
    credentials: null,
    profile: {
      data: null,
      fetching: false,
    },
    matches: {
      data: null,
      fetching: false,
    },
    friends: {
      data: null,
      fetching: false,
    },
    stats: {
      data: null,
      fetching: false,
    },
  },
  {
    [actions.setCredentials.type]: (
      state,
      {payload}: PayloadAction<actions.SetCredentialsPayload>,
    ) => {
      state.credentials = payload.credentials;
    },

    [actions.fetchProfile.pending.type]: (state) => {
      state.profile.fetching = true;
    },

    [actions.fetchProfile.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchProfilePayload>,
    ) => {
      state.profile.data = payload.user;
      state.profile.fetching = false;
    },

    [actions.fetchProfile.rejected.type]: (state) => {
      state.profile.fetching = false;
    },

    [actions.fetchMatches.pending.type]: (state) => {
      state.matches.fetching = true;
    },

    [actions.fetchMatches.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchMatchesPayload>,
    ) => {
      state.matches.data = payload.matches;
      state.matches.fetching = false;
    },

    [actions.fetchMatches.rejected.type]: (state) => {
      state.matches.fetching = false;
    },

    [actions.fetchFriends.pending.type]: (state) => {
      state.friends.fetching = true;
    },

    [actions.fetchFriends.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchFriendsPayload>,
    ) => {
      state.friends.data = payload.friends;
      state.friends.fetching = false;
    },

    [actions.fetchFriends.rejected.type]: (state) => {
      state.friends.fetching = false;
    },

    [actions.fetchStats.pending.type]: (state) => {
      state.stats.fetching = true;
    },

    [actions.fetchStats.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchStatsPayload>,
    ) => {
      state.stats.data = payload.stats;
      state.stats.fetching = false;
    },

    [actions.fetchStats.rejected.type]: (state) => {
      state.stats.fetching = false;
    },

    [actions.addFriend.type]: (
      state,
      {payload}: PayloadAction<actions.AddFriendPayload>,
    ) => {
      state.friends.data!.push(payload.friend);
    },

    [actions.removeFriend.type]: (
      state,
      {payload}: PayloadAction<actions.RemoveFriendPayload>,
    ) => {
      state.friends.data = state.friends.data!.filter(
        (friend) => friend.id !== payload.friendId,
      );
    },
  },
);

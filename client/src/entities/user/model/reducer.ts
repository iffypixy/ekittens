import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Match, ProfileStatistics, User} from "@shared/api/common";
import * as actions from "./actions";

export interface UserState {
  user: {
    data: User | null;
    fetching: boolean;
  };
  friends: {
    data: User[] | null;
    fetching: boolean;
  };
  stats: {
    data: ProfileStatistics | null;
    fetching: boolean;
  };
  matches: {
    data: Match[] | null;
    fetching: boolean;
  };
}

export const reducer = createReducer<UserState>(
  {
    user: {
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
    matches: {
      data: null,
      fetching: false,
    },
  },
  {
    [actions.fetchMe.pending.type]: (state) => {
      state.user.fetching = true;
    },

    [actions.fetchMe.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchMePayload>,
    ) => {
      state.user.data = payload.user;
      state.user.fetching = false;
    },

    [actions.fetchMe.rejected.type]: (state) => {
      state.user.fetching = false;
    },

    [actions.fetchMyFriends.pending.type]: (state) => {
      state.friends.fetching = true;
    },

    [actions.fetchMyFriends.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchMyFriendsPayload>,
    ) => {
      state.friends.data = payload.friends;
      state.friends.fetching = false;
    },

    [actions.fetchMyFriends.rejected.type]: (state) => {
      state.friends.fetching = false;
    },

    [actions.fetchMyStats.pending.type]: (state) => {
      state.stats.fetching = true;
    },

    [actions.fetchMyStats.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchMyStatsPayload>,
    ) => {
      state.stats.data = payload.stats;
      state.stats.fetching = false;
    },

    [actions.fetchMyStats.rejected.type]: (state) => {
      state.stats.fetching = false;
    },

    [actions.fetchMyMatches.pending.type]: (state) => {
      state.matches.fetching = true;
    },

    [actions.fetchMyMatches.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchMyMatchesPayload>,
    ) => {
      state.matches.data = payload.matches;
      state.matches.fetching = false;
    },

    [actions.fetchMyMatches.rejected.type]: (state) => {
      state.matches.fetching = false;
    },

    [actions.addFriend.type]: (
      state,
      {payload}: PayloadAction<actions.AddFriendPayload>,
    ) => {
      state.friends.data = state.friends.data
        ? [...state.friends.data, payload]
        : [payload];
    },

    [actions.removeFriend.type]: (
      state,
      {payload}: PayloadAction<actions.RemoveFriendPayload>,
    ) => {
      state.friends.data = state.friends.data!.filter(
        (friend) => friend.id !== payload.id,
      );
    },
  },
);

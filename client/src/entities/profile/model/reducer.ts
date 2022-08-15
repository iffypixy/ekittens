import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Match, User, ProfileStatistics, Profile} from "@shared/api/common";
import * as actions from "./actions";

export interface ProfileState {
  user: {
    data: Profile | null;
    fetching: boolean;
  };
  matches: {
    data: Match[] | null;
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
}

export const reducer = createReducer<ProfileState>(
  {
    user: {
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
    [actions.fetchUser.pending.type]: (state) => {
      state.user.fetching = true;
    },

    [actions.fetchUser.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchUserPayload>,
    ) => {
      state.user.data = payload.user;
      state.user.fetching = false;
    },

    [actions.fetchUser.rejected.type]: (state) => {
      state.user.fetching = false;
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

    [actions.setRelationship.type]: (
      state,
      {payload}: PayloadAction<actions.SetRelationshipPayload>,
    ) => {
      if (state.user?.data) state.user.data!.relationship = payload;
    },
  },
);

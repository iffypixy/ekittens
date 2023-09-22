import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {
  Match,
  UserInterim,
  UserStats,
  UserWithRelationship,
} from "@shared/api/common";
import {Fetchable, Nullable} from "@shared/lib/typings";
import * as actions from "./actions";

export interface UserStore {
  interims: Record<string, UserInterim>;
  user: Fetchable<Nullable<UserWithRelationship>>;
  matches: Fetchable<Nullable<Match[]>>;
  friends: Fetchable<Nullable<UserWithRelationship[]>>;
  stats: Fetchable<Nullable<UserStats>>;
}

export const store = createReducer<UserStore>(
  {
    interims: {},
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
    [actions.fetchInterim.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchInterimPayload>,
    ) => {
      state.interims = {...state.interims, ...payload.supplementals};
    },

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
      state.user.data!.relationship = payload.relationship;
    },

    [actions.setInterim.type]: (
      state,
      {payload}: PayloadAction<actions.SetInterimPayload>,
    ) => {
      const interim = state.interims[payload.userId] || {};

      state.interims[payload.userId] = {
        ...interim,
        ...payload.interim,
      };
    },
  },
);

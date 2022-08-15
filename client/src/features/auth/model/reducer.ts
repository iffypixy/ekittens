import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Credentials} from "@shared/api/common";
import * as actions from "./actions";

export interface AuthState {
  isAuthenticated: boolean;
  credentials: {
    data: Credentials | null;
    fetching: boolean;
  };
}

export const reducer = createReducer<AuthState>(
  {
    isAuthenticated: false,
    credentials: {
      data: null,
      fetching: true,
    },
  },
  {
    [actions.fetchCredentials.pending.type]: (state) => {
      state.credentials.fetching = true;
    },

    [actions.fetchCredentials.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchCredentialsPayload>,
    ) => {
      state.credentials.data = payload.credentials;
      state.credentials.fetching = false;
      state.isAuthenticated = true;
    },

    [actions.fetchCredentials.rejected.type]: (state) => {
      state.credentials.fetching = false;
    },

    [actions.signUp.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.SignUpPayload>,
    ) => {
      state.credentials.data = payload.credentials;
      state.isAuthenticated = true;
    },

    [actions.signIn.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.SignInPayload>,
    ) => {
      state.credentials.data = payload.credentials;
      state.isAuthenticated = true;
    },
  },
);

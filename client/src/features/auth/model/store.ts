import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import * as actions from "./actions";

export interface AuthState {
  isAuthenticated: boolean;
  areCredentialsFetching: boolean;
}

export const store = createReducer<AuthState>(
  {
    isAuthenticated: false,
    areCredentialsFetching: true,
  },
  {
    [actions.fetchCredentials.fulfilled.type]: (state) => {
      state.isAuthenticated = true;
    },

    [actions.signUp.fulfilled.type]: (state) => {
      state.isAuthenticated = true;
    },

    [actions.signIn.fulfilled.type]: (state) => {
      state.isAuthenticated = true;
    },

    [actions.setAreCredentialsFetching.type]: (
      state,
      {payload}: PayloadAction<actions.SetAreCredentialsFetchingPayload>,
    ) => {
      state.areCredentialsFetching = payload.areFetching;
    },
  },
);

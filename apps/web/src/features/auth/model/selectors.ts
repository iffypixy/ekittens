import {RootState} from "@app/store";

const state = (state: RootState) => state.auth;

export const isAuthenticated = (s: RootState) => state(s).isAuthenticated;
export const areCredentialsFetching = (s: RootState) =>
  state(s).areCredentialsFetching;

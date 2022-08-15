import {RootState} from "@app/store";

const state = (state: RootState) => state.auth;

export const credentials = (s: RootState) => state(s).credentials.data;
export const isAuthenticated = (s: RootState) => state(s).isAuthenticated;
export const areCredentialsFetching = (s: RootState) =>
  state(s).credentials.fetching;

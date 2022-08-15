import {RootState} from "@app/store";

const state = (state: RootState) => state.user;

export const user = (s: RootState) => state(s).user.data;
export const isUserFetching = (s: RootState) => state(s).user.fetching;

export const friends = (s: RootState) => state(s).friends;
export const stats = (s: RootState) => state(s).stats;
export const matches = (s: RootState) => state(s).matches;

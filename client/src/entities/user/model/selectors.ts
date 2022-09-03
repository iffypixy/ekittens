import {RootState} from "@app/store";

const state = (state: RootState) => state.user;

export const user = (s: RootState) => state(s).user;
export const matches = (s: RootState) => state(s).matches;
export const friends = (s: RootState) => state(s).friends;
export const stats = (s: RootState) => state(s).stats;
export const interims = (s: RootState) => state(s).interims;

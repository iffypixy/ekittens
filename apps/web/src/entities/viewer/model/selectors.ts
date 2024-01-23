import {RootState} from "@app/store";

const state = (state: RootState) => state.viewer;

export const credentials = (s: RootState) => state(s).credentials;
export const profile = (s: RootState) => state(s).profile;
export const matches = (s: RootState) => state(s).matches;
export const friends = (s: RootState) => state(s).friends;
export const stats = (s: RootState) => state(s).stats;

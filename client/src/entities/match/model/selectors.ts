import {RootState} from "@app/store";

const state = (state: RootState) => state.match;

export const match = (s: RootState) => state(s).match;
export const future = (s: RootState) => state(s).future;
export const result = (s: RootState) => state(s).result;
export const losers = (s: RootState) => state(s).losers;
export const lobby = (s: RootState) => state(s).lobby;

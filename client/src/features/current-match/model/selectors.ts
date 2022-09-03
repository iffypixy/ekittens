import {RootState} from "@app/store";

const state = (state: RootState) => state.currentMatch;

export const match = (s: RootState) => state(s).match;

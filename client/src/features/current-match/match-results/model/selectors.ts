import {RootState} from "@app/store";

const state = (state: RootState) => state.matchResults;

export const personal = (s: RootState) => state(s).personal;
export const general = (s: RootState) => state(s).general;

import {RootState} from "@app/store";

const state = (state: RootState) => state.interim;

export const supplementals = (s: RootState) => state(s).users;

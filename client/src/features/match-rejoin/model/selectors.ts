import {RootState} from "@app/store";

const state = (state: RootState) => state.matchRejoin;

export const shouldCheck = (s: RootState) => state(s).shouldCheck;

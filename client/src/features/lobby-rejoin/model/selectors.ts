import {RootState} from "@app/store";

const state = (state: RootState) => state.lobbyRejoin;

export const shouldCheck = (s: RootState) => state(s).shouldCheck;

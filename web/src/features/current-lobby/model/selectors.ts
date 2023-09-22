import {RootState} from "@app/store";

const state = (state: RootState) => state.currentLobby;

export const lobby = (s: RootState) => state(s).lobby;

import {RootState} from "@shared/lib/store";

const current = (state: RootState) => state.lobby;

export const lobby = (state: RootState) => current(state).lobby;

export const isLobbyBeingCreated = (state: RootState) =>
  current(state).isLobbyBeingCreated;

export const isJoiningLobby = (state: RootState) =>
  current(state).isJoiningLobby;

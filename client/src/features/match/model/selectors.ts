import {RootState} from "@shared/lib/store";

const current = (state: RootState) => state.match;

export const match = (state: RootState) => current(state).match;

export const isMatchBeingCreated = (state: RootState) =>
  current(state).isMatchBeingStarted;

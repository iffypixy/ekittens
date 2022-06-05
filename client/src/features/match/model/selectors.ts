import {RootState} from "@shared/lib/store";

const current = (state: RootState) => state.match;

export const match = (state: RootState) => current(state).match;

export const isMatchBeingCreated = (state: RootState) =>
  current(state).isMatchBeingStarted;

export const cards = (state: RootState) => current(state).cards;

export const messages = (state: RootState) => current(state).messages;

import {RootState} from "@app/store";

const state = (state: RootState) => state.preferences;

export const isPreferencesModalOpen = (s: RootState) =>
  state(s).isPreferencesModalOpen;

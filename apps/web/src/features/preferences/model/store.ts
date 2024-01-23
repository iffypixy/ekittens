import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import * as actions from "./actions";

export interface PreferencesStore {
  isPreferencesModalOpen: boolean;
}

export const store = createReducer<PreferencesStore>(
  {
    isPreferencesModalOpen: false,
  },
  {
    [actions.setIsPreferencesModalOpen.type]: (
      state,
      {payload}: PayloadAction<actions.SetIsPreferencesMoadlOpenPayload>,
    ) => {
      state.isPreferencesModalOpen = payload.isOpen;
    },
  },
);

import {createAction} from "@reduxjs/toolkit";

const prefix = "preferences";

export interface SetIsPreferencesMoadlOpenPayload {
  isOpen: boolean;
}

export const setIsPreferencesModalOpen =
  createAction<SetIsPreferencesMoadlOpenPayload>(
    `${prefix}/setIsPreferencesModalOpen`,
  );

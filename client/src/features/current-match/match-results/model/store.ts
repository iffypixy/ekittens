import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Nullable} from "@shared/lib/typings";

import * as actions from "./actions";
import {PersonalResults, GeneralResults} from "../lib/typings";

export interface MatchResultsStore {
  personal: Nullable<PersonalResults>;
  general: Nullable<GeneralResults>;
}

export const store = createReducer<MatchResultsStore>(
  {
    personal: null,
    general: null,
  },
  {
    [actions.setPersonalResults.type]: (
      state,
      {payload}: PayloadAction<actions.SetPersonalResultsPayload>,
    ) => {
      state.personal = payload.results;
    },

    [actions.setGeneralResults.type]: (
      state,
      {payload}: PayloadAction<actions.SetGeneralResultsPayload>,
    ) => {
      state.general = payload.results;
    },
  },
);

import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {UserSupplemental} from "@shared/api/common";
import * as actions from "./actions";

export interface InterimState {
  users: Record<string, UserSupplemental>;
}

export const reducer = createReducer<InterimState>(
  {
    users: {},
  },
  {
    [actions.fetchUserSupplemental.fulfilled.type]: (
      state,
      {payload}: PayloadAction<actions.FetchUserSupplementalPayload>,
    ) => {
      state.users = {...state.users, ...payload.supplementals};
    },

    [actions.setUserSupplemental.type]: (
      state,
      {payload}: PayloadAction<actions.SetUserSupplemental>,
    ) => {
      state.users[payload.id] = {
        ...state.users[payload.id],
        ...payload.supplemental,
      };
    },
  },
);

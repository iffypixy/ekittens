import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Nullable} from "@shared/lib/typings";

import * as actions from "./actions";

export interface CardPlayStore {
  heldCardId: Nullable<string>;
}

export const store = createReducer<CardPlayStore>(
  {
    heldCardId: null,
  },
  {
    [actions.setHeldCardId.type]: (
      state,
      {payload}: PayloadAction<actions.SetHeldCardIdPayload>,
    ) => {
      state.heldCardId = payload.cardId;
    },
  },
);

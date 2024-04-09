import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {Nullable} from "@shared/lib/typings";

import * as actions from "./actions";

export interface CardPlayStore {
  heldCardId: Nullable<string>;
  isCardDroppable: boolean;
}

export const store = createReducer<CardPlayStore>(
  {
    heldCardId: null,
    isCardDroppable: false,
  },
  {
    [actions.setHeldCardId.type]: (
      state,
      {payload}: PayloadAction<actions.SetHeldCardIdPayload>,
    ) => {
      state.heldCardId = payload.cardId;
    },
    [actions.setIsCardDroppable.type]: (
      state,
      {payload}: PayloadAction<actions.SetIsCardDroppablePayload>,
    ) => {
      state.isCardDroppable = payload.isDroppable;
    },
  },
);

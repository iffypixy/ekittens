import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {matchApi, PlayCardData} from "@shared/api/match";
import {CardPlayStore} from "./store";

const prefix = "card-play";

export type PlayCardPayload = void;
export type PlayCardOptions = PlayCardData;

export const playCard = createAsyncThunk<PlayCardPayload, PlayCardOptions>(
  `${prefix}/playCard`,
  async (options) => {
    return matchApi.playCard(options);
  },
);

export interface SetHeldCardIdPayload {
  cardId: CardPlayStore["heldCardId"];
}

export const setHeldCardId = createAction<SetHeldCardIdPayload>(
  `${prefix}/setHeldCardId`,
);

export interface SetIsCardDroppablePayload {
  isDroppable: boolean;
}

export const setIsCardDroppable = createAction<SetIsCardDroppablePayload>(
  `${prefix}/setIsCardDroppable`,
);

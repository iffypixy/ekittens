import {createAsyncThunk} from "@reduxjs/toolkit";

import {matchApi, PlayCardData} from "@shared/api/match";

const prefix = "card-play";

export type PlayCardPayload = void;
export type PlayCardOptions = PlayCardData;

export const playCard = createAsyncThunk<PlayCardPayload, PlayCardOptions>(
  `${prefix}/playCard`,
  async (options) => {
    return matchApi.playCard(options);
  },
);

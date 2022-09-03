import {createAsyncThunk} from "@reduxjs/toolkit";

import {DrawCardData, DrawCardResponse, matchApi} from "@shared/api/match";

const prefix = "card-draw";

export type DrawCardPayload = DrawCardResponse;
export type DrawCardOptions = DrawCardData;

export const drawCard = createAsyncThunk<DrawCardPayload, DrawCardOptions>(
  `${prefix}/drawCard`,
  async (options) => {
    return matchApi.drawCard(options);
  },
);

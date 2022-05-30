import {createAsyncThunk} from "@reduxjs/toolkit";

import {
  matchApi,
  StartMatchOutput,
  StartMatchData,
  DrawCardData,
  DrawCardOutput,
  PlayCardData,
  PlayDefuseData,
  SetCardSpotData,
} from "@shared/api";

const prefix = "match";

export const startMatch = createAsyncThunk<StartMatchOutput, StartMatchData>(
  `${prefix}/startMatch`,
  async (data) => {
    const output = await matchApi.start(data);

    return output;
  },
);

export const drawCard = createAsyncThunk<DrawCardOutput, DrawCardData>(
  `${prefix}/drawCard`,
  async (data) => {
    const output = await matchApi.drawCard(data);

    return output;
  },
);

export const playCard = createAsyncThunk<void, PlayCardData>(
  `${prefix}/playCard`,
  async (data) => {
    const output = await matchApi.playCard(data);

    return output;
  },
);

export const playDefuse = createAsyncThunk<void, PlayDefuseData>(
  `${prefix}/playDefuse`,
  async (data) => {
    const output = await matchApi.playDefuse(data);

    return output;
  },
);

export const setCardSpot = createAsyncThunk<void, SetCardSpotData>(
  `${prefix}/setCardSpot`,
  async (data) => {
    const output = await matchApi.setCardSpot(data);

    return output;
  },
);

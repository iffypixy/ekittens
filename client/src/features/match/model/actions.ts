import {CardType} from "@entities/card";
import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {
  matchApi,
  StartMatchOutput,
  StartMatchData,
  DrawCardData,
  DrawCardOutput,
  PlayCardData,
  PlayDefuseData,
  SetCardSpotData,
  Match,
  MatchPlayer,
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

export interface SetCardsPayload {
  cards: CardType[];
}

export const setCards = createAction<SetCardsPayload>(`${prefix}/setCards`);

export interface SetMatchPayload {
  match: Match;
}

export const setMatch = createAction<SetMatchPayload>(`${prefix}/setMatch`);

export interface UpdatePlayerPayload {
  playerId: string;
  update: Partial<MatchPlayer>;
}

export const updatePlayer = createAction<UpdatePlayerPayload>(
  `${prefix}/updatePlayer`,
);

export interface UpdateMatchPayload extends Partial<Match> {}

export const updateMatch = createAction<UpdateMatchPayload>(
  `${prefix}/updateMatch`,
);

export const continueTurn = createAction(`${prefix}/continueTurn`);

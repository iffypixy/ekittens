import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {
  AlterFutureCardsData,
  BuryCardData,
  DefuseExplodingKittenData,
  InsertExplodingKittenData,
  InsertImplodingKittenData,
  matchApi,
  ShareFutureCardsData,
} from "@shared/api/match";

import {MatchModal, ModalData} from "../lib/typings";

const prefix = "card-interactions";

export interface SetModalDataPayload {
  data: Partial<ModalData<any>>;
  modal: MatchModal;
}

export const setModalData = createAction<SetModalDataPayload>(
  `${prefix}/setModalData`,
);

export type AlterTheFuturePayload = void;
export type AlterTheFutureOptions = AlterFutureCardsData;

export const alterTheFuture = createAsyncThunk<
  AlterTheFuturePayload,
  AlterTheFutureOptions
>(`${prefix}/alterTheFuture`, async (options) => {
  return matchApi.alterFutureCards(options);
});

export type BuryCardPayload = void;
export type BuryCardOptions = BuryCardData;

export const buryCard = createAsyncThunk<BuryCardPayload, BuryCardOptions>(
  `${prefix}/buryCard`,
  async (options) => {
    return matchApi.buryCard(options);
  },
);

export type DefuseEKPayload = void;
export type DefuseEKOptions = DefuseExplodingKittenData;

export const defuseEK = createAsyncThunk<DefuseEKPayload, DefuseEKOptions>(
  `${prefix}/defuseEK`,
  async (options) => {
    return matchApi.defuse(options);
  },
);

export type InsertEKPayload = void;
export type InsertEKOptions = InsertExplodingKittenData;

export const insertEK = createAsyncThunk<InsertEKPayload, InsertEKOptions>(
  `${prefix}/insertEK`,
  async (options) => {
    return matchApi.insertExplodingKitten(options);
  },
);

export type InsertIKPayload = void;
export type InsertIKOptions = InsertImplodingKittenData;

export const insertIK = createAsyncThunk<InsertIKPayload, InsertIKOptions>(
  `${prefix}/insertIK`,
  async (options) => {
    return matchApi.insertImplodingKitten(options);
  },
);

export type ShareTheFuturePayload = void;
export type ShareTheFutureOptions = ShareFutureCardsData;

export const shareTheFuture = createAsyncThunk<
  ShareTheFuturePayload,
  ShareTheFutureOptions
>(`${prefix}/shareTheFuture`, async (options) => {
  return matchApi.shareFutureCards(options);
});

export const resetModals = createAction(`${prefix}/resetModals`);

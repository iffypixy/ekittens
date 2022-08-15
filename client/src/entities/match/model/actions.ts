import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {
  CardUnit,
  Lobby,
  LobbyParticipant,
  OngoingMatch,
  OngoingMatchContext,
  OngoingMatchPlayer,
  OngoingMatchState,
  User,
} from "@shared/api/common";
import {CardName} from "@entities/card";
import {
  AlterFutureCardsData,
  BuryCardData,
  CreateLobbyResponse,
  DefuseExplodingKittenData,
  DrawCardData,
  DrawCardResponse,
  InsertExplodingKittenData,
  InsertImplodingKittenData,
  JoinLobbyData,
  JoinLobbyResponse,
  JoinMatchData,
  JoinMatchResponse,
  LeaveLobbyData,
  LeaveMatchAsPlayerData,
  LeaveMatchAsSpectatorData,
  matchApi,
  NopeCardData,
  PlayCardData,
  ShareFutureCardsData,
  SpectateMatchData,
  SpectateMatchResponse,
  StartMatchData,
  StartMatchResponse,
  UpdateDisabledData,
} from "@shared/api/match";
import type {MatchState} from "./reducer";

const prefix = "match";

export const joinQueue = createAsyncThunk(`${prefix}/joinQueue`, async () => {
  return matchApi.joinQueue();
});

export type SetMatchPayload = OngoingMatch;

export const setMatch = createAction<SetMatchPayload>(`${prefix}/setMatch`);

export type JoinMatchOptions = JoinMatchData;
export type JoinMatchPayload = JoinMatchResponse;

export const joinMatch = createAsyncThunk<JoinMatchPayload, JoinMatchOptions>(
  `${prefix}/joinMatch`,
  (options) => {
    return matchApi.joinMatch(options);
  },
);

export type SetCardsPayload = CardUnit[];

export const setCards = createAction<SetCardsPayload>(`${prefix}/setCards`);

export type DrawCardOptions = DrawCardData;
export type DrawCardPayload = DrawCardResponse;

export const drawCard = createAsyncThunk<DrawCardPayload, DrawCardOptions>(
  `${prefix}/drawCard`,
  (options) => {
    return matchApi.drawCard(options);
  },
);

export type SetTurnPayload = number;

export const setTurn = createAction<SetTurnPayload>(`${prefix}/setTurn`);

export type SetStatePayload = OngoingMatchState;

export const setState = createAction<SetStatePayload>(`${prefix}/setState`);

export type AddCardPayload = CardUnit;

export const addCard = createAction<AddCardPayload>(`${prefix}/addCard`);

export interface IncrementCardsNumberPayload {
  playerId: string;
  cardId: string;
}

export const incrementCardsNumber = createAction<IncrementCardsNumberPayload>(
  `${prefix}/incrementCardsNumber`,
);

export interface DecrementCardsNumberPayload {
  playerId: string;
  cardId: string;
}

export const decrementCardsNumber = createAction<DecrementCardsNumberPayload>(
  `${prefix}/decrementCardsNumber`,
);

export type SetContextPayload = Partial<OngoingMatchContext>;

export const setContext = createAction<SetContextPayload>(
  `${prefix}/setContext`,
);

export type DefuseOptions = DefuseExplodingKittenData;

export const defuse = createAsyncThunk<void, DefuseOptions>(
  `${prefix}/defuse`,
  async (options) => {
    return matchApi.defuse(options);
  },
);

export type InsertExplodingKittenOptions = InsertExplodingKittenData;

export const insertExplodingKitten = createAsyncThunk<
  void,
  InsertExplodingKittenOptions
>(`${prefix}/insertExplodingKitten`, async (options) => {
  return matchApi.insertExplodingKitten(options);
});

export interface RemoveCardPayload {
  id: string;
}

export const removeCard = createAction<RemoveCardPayload>(
  `${prefix}/removeCard`,
);

export const incrementDrawCards = createAction(`${prefix}/incrementDrawCards`);
export const decrementDrawCards = createAction(`${prefix}/decrementDrawCards`);

export type PlayCardOptions = PlayCardData;

export const playCard = createAsyncThunk<void, PlayCardOptions>(
  `${prefix}/playCard`,
  async (options) => {
    return matchApi.playCard(options);
  },
);

export type AddDiscardCardPayload = CardName;

export const addDiscardCard = createAction<AddDiscardCardPayload>(
  `${prefix}/addDiscardCard`,
);

export type SetFuturePayload = CardName[];

export const setFuture = createAction<SetFuturePayload>(`${prefix}/setFuture`);

export type AlterFutureCardsOptions = AlterFutureCardsData;

export const alterFutureCards = createAsyncThunk<void, AlterFutureCardsOptions>(
  `${prefix}/alterFutureCards`,
  async (options) => {
    return matchApi.alterFutureCards(options);
  },
);

export type ShareFutureCardsOptions = ShareFutureCardsData;

export const shareFutureCards = createAsyncThunk<void, ShareFutureCardsOptions>(
  `${prefix}/shareFutureCards`,
  async (options) => {
    return matchApi.shareFutureCards(options);
  },
);

export type BuryCardOptions = BuryCardData;

export const buryCard = createAsyncThunk<void, BuryCardOptions>(
  `${prefix}/buryCard`,
  async (options) => {
    return matchApi.buryCard(options);
  },
);

export type InsertImplodingKittenOptions = InsertImplodingKittenData;

export const insertImplodingKitten = createAsyncThunk<
  void,
  InsertImplodingKittenOptions
>(`${prefix}/insertImplodingKitten`, async (options) => {
  return matchApi.insertImplodingKitten(options);
});

export type SetIsSelectPlayerModalOpenPayload = boolean;

export const setIsSelectPlayerModalOpen =
  createAction<SetIsSelectPlayerModalOpenPayload>(
    `${prefix}/setIsSelectPlayerModalOpen`,
  );

export interface AddMarkedPayload {
  card: CardUnit;
  playerId: string;
}

export const addMarked = createAction<AddMarkedPayload>(`${prefix}/addMarked`);

export type NopeCardOptions = NopeCardData;

export const nopeCard = createAsyncThunk<void, NopeCardOptions>(
  `${prefix}/nopeCard`,
  async (options) => {
    return matchApi.nopeCard(options);
  },
);

export interface RemovePlayerPayload {
  playerId: string;
}

export const removePlayer = createAction<RemovePlayerPayload>(
  `${prefix}/removePlayer`,
);

export type AddLoserPayload = OngoingMatchPlayer;

export const addLoser = createAction<AddLoserPayload>(`${prefix}/addLoser`);

export type SetResultPayload = MatchState["result"];

export const setResult = createAction<SetResultPayload>(`${prefix}/setResult`);

export type SpectateMatchOptions = SpectateMatchData;
export type SpectateMatchPayload = SpectateMatchResponse;

export const spectateMatch = createAsyncThunk<
  SpectateMatchPayload,
  SpectateMatchOptions
>(`${prefix}/spectateMatch`, async (options) => {
  return matchApi.spectateMatch(options);
});

export type AddSpectatorPayload = User;

export const addSpectator = createAction<AddSpectatorPayload>(
  `${prefix}/addSpectator`,
);

export type RemoveSpectatorPayload = string;

export const removeSpectator = createAction<RemoveSpectatorPayload>(
  `${prefix}/removeSpectator`,
);

export type LeaveMatchAsPlayerOptions = LeaveMatchAsPlayerData;

export const leaveMatchAsPlayer = createAsyncThunk<
  void,
  LeaveMatchAsPlayerOptions
>(`${prefix}/leaveMatchAsPlayer`, async (options) => {
  return matchApi.leaveMatchAsPlayer(options);
});

export type LeaveMatchAsSpectatorOptions = LeaveMatchAsSpectatorData;

export const leaveMatchAsSpectator = createAsyncThunk<
  void,
  LeaveMatchAsSpectatorOptions
>(`${prefix}/leaveMatchAsSpectator`, async (options) => {
  return matchApi.leaveMatchAsSpectator(options);
});

export type SetLobbyPayload = Lobby;

export const setLobby = createAction<SetLobbyPayload>(`${prefix}/setLobby`);

export type CreateLobbyPayload = CreateLobbyResponse;

export const createLobby = createAsyncThunk<CreateLobbyPayload, void>(
  `${prefix}/createLobby`,
  async () => {
    return matchApi.createLobby();
  },
);

export type JoinLobbyOptions = JoinLobbyData;
export type JoinLobbyPayload = JoinLobbyResponse;

export const joinLobby = createAsyncThunk<JoinLobbyPayload, JoinLobbyOptions>(
  `${prefix}/joinLobby`,
  async (options) => {
    return matchApi.joinLobbyAsPlayer(options);
  },
);

export type LeaveLobbyOptions = LeaveLobbyData;

export const leaveLobby = createAsyncThunk<void, LeaveLobbyOptions>(
  `${prefix}/leaveLobby`,
  async (options) => {
    return matchApi.leaveLobby(options);
  },
);

export type StartMatchOptions = StartMatchData;
export type StartMatchPayload = StartMatchResponse;

export const startMatch = createAsyncThunk<
  StartMatchPayload,
  StartMatchOptions
>(`${prefix}/startMatch`, async (options) => {
  return matchApi.startMatch(options);
});

// lobby player
export type AddPlayerPayload = LobbyParticipant;

export const addPlayer = createAction<AddPlayerPayload>(`${prefix}/addPlayer`);

export type RemoveLobbyPlayerPayload = string;

export const removeLobbyPlayer = createAction<RemoveLobbyPlayerPayload>(
  `${prefix}/removeLobbyPlayer`,
);

export type UpdateDisabledOptions = UpdateDisabledData;

export const updateDisabled = createAsyncThunk<void, UpdateDisabledOptions>(
  `${prefix}/updateDisabled`,
  async (options) => {
    return matchApi.updateDisabled(options);
  },
);

export type SetDisabledPayload = CardName[];

export const setDisabled = createAction<SetDisabledPayload>(
  `${prefix}/setDisabled`,
);

export interface SetRolePayload {
  id: string;
  role: "leader" | "member";
}

export const setRole = createAction<SetRolePayload>(`${prefix}/setRole`);

export const leaveQueue = createAsyncThunk(`${prefix}/leaveQueue`, async () => {
  return matchApi.leaveQueue();
});

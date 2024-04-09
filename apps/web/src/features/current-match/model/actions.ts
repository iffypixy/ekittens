import {createAction} from "@reduxjs/toolkit";

import {CardName, CardUnit} from "@entities/card";
import {
  OngoingMatchContext,
  MatchState,
  OngoingMatchOutPlayer,
} from "@entities/match";
import {User} from "@entities/user";

import {CurrentMatchStore} from "./store";

const prefix = "current-match";

export interface SetMatchPayload {
  match: CurrentMatchStore["match"];
}

export const setMatch = createAction<SetMatchPayload>(`${prefix}/setMatch`);

export interface AddDiscardPileCardPayload {
  card: CardName;
}

export const addDiscardPileCard = createAction<AddDiscardPileCardPayload>(
  `${prefix}/addDiscardPileCard`,
);

export interface RemoveDeckCardPayload {
  cardId: string;
}

export const removeDeckCard = createAction<RemoveDeckCardPayload>(
  `${prefix}/removeDeckCard`,
);

export interface RemoveActivePlayerPayload {
  playerId: string;
}

export const removeActivePlayer = createAction<RemoveActivePlayerPayload>(
  `${prefix}/removeActivePlayer`,
);

export interface AddInactivePlayerPayload {
  player: OngoingMatchOutPlayer;
}

export const addInactivePlayer = createAction<AddInactivePlayerPayload>(
  `${prefix}/addInactivePlayer`,
);

export interface AddMarkedCardPayload {
  card: CardUnit;
  playerId: string;
}

export const addMarkedCard = createAction<AddMarkedCardPayload>(
  `${prefix}/addMarkedCard`,
);

export interface SetContextPayload {
  context: Partial<OngoingMatchContext>;
}

export const setContext = createAction<SetContextPayload>(
  `${prefix}/setContext`,
);

export interface SetStatePayload {
  state: MatchState;
}

export const setState = createAction<SetStatePayload>(`${prefix}/setState`);

export const incrementDrawPileCards = createAction<void>(
  `${prefix}/incrementDrawPileCards`,
);

export const decrementDrawPileCards = createAction<void>(
  `${prefix}/decrementDrawPileCards`,
);

export interface IncrementPlayerCardsPayload {
  cardId: string;
  playerId: string;
}

export const incrementPlayerCards = createAction<IncrementPlayerCardsPayload>(
  `${prefix}/incrementPlayerCards`,
);

export interface DecrementPlayerCardsPayload {
  cardId: string;
  playerId: string;
}

export const decrementPlayerCards = createAction<DecrementPlayerCardsPayload>(
  `${prefix}/decrementPlayerCards`,
);

export interface AddDeckCardPayload {
  card: CardUnit;
}

export const addDeckCard = createAction<AddDeckCardPayload>(
  `${prefix}/addDeckCard`,
);

export interface SetTurnPayload {
  turn: number;
}

export const setTurn = createAction<SetTurnPayload>(`${prefix}/setTurn`);

export interface AddSpectatorPayload {
  spectator: User;
}

export const addSpectator = createAction<AddSpectatorPayload>(
  `${prefix}/addSpectator`,
);

export interface RemoveSpectatorPayload {
  spectatorId: string;
}

export const removeSpectator = createAction<RemoveSpectatorPayload>(
  `${prefix}/removeSpectator`,
);

export interface SetLastPayload {
  last: string;
}

export const setLast = createAction<SetLastPayload>(`${prefix}/setLast`);

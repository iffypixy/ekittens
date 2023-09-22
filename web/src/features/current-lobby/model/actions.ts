import {createAction} from "@reduxjs/toolkit";

import {CardName} from "@entities/card";
import {Lobby, LobbyMode, LobbyParticipant} from "@entities/lobby";

import {Nullable} from "@shared/lib/typings";

const prefix = "current-lobby";

export interface SetLobbyPayload {
  lobby: Nullable<Lobby>;
}

export const setLobby = createAction<SetLobbyPayload>(`${prefix}/setLobby`);

export interface SetDisabledCardsPayload {
  cards: CardName[];
}

export const setDisabledCards = createAction<SetDisabledCardsPayload>(
  `${prefix}/setDisabledCards`,
);

export interface SetModePayload {
  mode: LobbyMode;
}

export const setMode = createAction<SetModePayload>(`${prefix}/setMode`);

export interface AddParticipantPayload {
  participant: LobbyParticipant;
}

export const addParticipant = createAction<AddParticipantPayload>(
  `${prefix}/addParticipant`,
);

export interface RemoveParticipantPayload {
  participantId: string;
}

export const removeParticipant = createAction<RemoveParticipantPayload>(
  `${prefix}/removeParticipant`,
);

export interface SetParticipantRolePayload {
  participantId: string;
  role: LobbyParticipant["role"];
}

export const setParticipantRole = createAction<SetParticipantRolePayload>(
  `${prefix}/setParticipantRole`,
);

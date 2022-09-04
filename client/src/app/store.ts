import {configureStore, combineReducers} from "@reduxjs/toolkit";
import {useDispatch as useRootDispatch} from "react-redux";

import {themingModel} from "@shared/lib/theming";
import {authModel} from "@features/auth";
import {matchmakingQueueModel} from "@features/matchmaking-queue";
import {userModel} from "@entities/user";
import {leaderboardModel} from "@entities/leaderboard";
import {chatModel} from "@features/chat";
import {viewerModel} from "@entities/viewer";
import {currentLobbyModel} from "@features/current-lobby";
import {matchResultsModel} from "@features/current-match/match-results";
import {currentMatchModel} from "@features/current-match";
import {inGameInteractionsModel} from "@features/current-match/in-game-interactions";
import {preferencesModel} from "@features/preferences";
import {matchRejoinModel} from "@features/match-rejoin";
import {lobbyRejoinModel} from "@features/lobby-rejoin";
import {cardPlayModel} from "@features/current-match/card-play";

export const rootReducer = combineReducers({
  theming: themingModel.store,
  matchmakingQueue: matchmakingQueueModel.store,
  user: userModel.store,
  auth: authModel.store,
  leaderboard: leaderboardModel.reducer,
  chat: chatModel.store,
  viewer: viewerModel.store,
  currentLobby: currentLobbyModel.store,
  matchResults: matchResultsModel.store,
  currentMatch: currentMatchModel.store,
  inGameInteractions: inGameInteractionsModel.store,
  preferences: preferencesModel.store,
  matchRejoin: matchRejoinModel.store,
  lobbyRejoin: lobbyRejoinModel.store,
  cardPlay: cardPlayModel.store,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type RootDispatch = typeof store.dispatch;

export const useDispatch = (): RootDispatch => useRootDispatch<RootDispatch>();

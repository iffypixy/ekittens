import {configureStore, combineReducers} from "@reduxjs/toolkit";
import {useDispatch as useRootDispatch} from "react-redux";

import {themingModel} from "@features/theming";
import {authModel} from "@features/auth";
import {profileModel} from "@entities/profile";
import {userModel} from "@entities/user";
import {matchModel} from "@entities/match";
import {interimModel} from "@shared/lib/interim";
import {leaderboardModel} from "@features/leaderboard";
import {chatModel} from "@features/chat";

export const rootReducer = combineReducers({
  theming: themingModel.reducer,
  profile: profileModel.reducer,
  user: userModel.reducer,
  auth: authModel.reducer,
  match: matchModel.reducer,
  interim: interimModel.reducer,
  leaderboard: leaderboardModel.reducer,
  chat: chatModel.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type RootDispatch = typeof store.dispatch;

export const useDispatch = (): RootDispatch => useRootDispatch<RootDispatch>();

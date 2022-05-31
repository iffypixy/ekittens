import {combineReducers} from "@reduxjs/toolkit";

import {lobbyModel} from "@features/lobby";
import {matchModel} from "@features/match";

export const rootReducer = combineReducers({
  lobby: lobbyModel.reducer,
  match: matchModel.reducer,
});

import {combineReducers} from "@reduxjs/toolkit";

import {lobbyModel} from "@features/lobby";

export const rootReducer = combineReducers({
  lobby: lobbyModel.reducer,
});

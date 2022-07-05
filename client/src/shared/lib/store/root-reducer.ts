import {combineReducers} from "@reduxjs/toolkit";

import {themingReducer} from "@shared/lib/theming";

export const rootReducer = combineReducers({
  theming: themingReducer,
});

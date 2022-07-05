import {createReducer} from "@reduxjs/toolkit";

import {Theme} from "../lib/typings";

export interface ThemingReducer {
  theme: Theme;
}

export const reducer = createReducer<ThemingReducer>(
  {
    theme: "light",
  },
  {},
);

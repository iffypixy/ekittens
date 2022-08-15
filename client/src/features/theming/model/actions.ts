import {createAction} from "@reduxjs/toolkit";

import {Theme} from "../lib/typings";

const prefix = "theming";

export type SetThemePayload = Theme;

export const setTheme = createAction<SetThemePayload>(`${prefix}/setTheme`);

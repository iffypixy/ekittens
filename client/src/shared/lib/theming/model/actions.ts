import {createAction} from "@reduxjs/toolkit";

import {Theme} from "../lib/typings";

const prefix = "theming";

export const setTheme = createAction<Theme>(`${prefix}/setTheme`);

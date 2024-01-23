import {RootState} from "@app/store";

const s = (state: RootState) => state.theming;

export const theme = (state: RootState) => s(state).theme;

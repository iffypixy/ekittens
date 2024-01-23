import {RootState} from "@app/store";

const state = (state: RootState) => state.chat;

export const messages = (s: RootState) => state(s).messages;

import {RootState} from "@app/store";

import {MatchModal} from "../lib/typings";

const state = (state: RootState) => state.inGameInteractions;

export const modal = (type: MatchModal) => (s: RootState) => state(s)[type];

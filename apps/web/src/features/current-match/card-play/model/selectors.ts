import {RootState} from "@app/store";

const state = (state: RootState) => state.cardPlay;

export const heldCardId = (s: RootState) => state(s).heldCardId;

export const isCardDroppable = (s: RootState) => state(s).isCardDroppable;

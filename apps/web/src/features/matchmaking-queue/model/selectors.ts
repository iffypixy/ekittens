import {RootState} from "@app/store";

const state = (state: RootState) => state.matchmakingQueue;

export const isEnqueued = (s: RootState) => state(s).isEnqueued;
export const enqueuedAt = (s: RootState) => state(s).enqueuedAt;

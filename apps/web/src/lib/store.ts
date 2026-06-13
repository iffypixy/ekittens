import type { MatchId, MatchView } from "@ekittens/contract";
import { create } from "zustand";

interface MatchStore {
  matchId: MatchId | undefined;
  view: MatchView | undefined;
  lastError: string | undefined;
  setStart: (matchId: MatchId) => void;
  setView: (matchId: MatchId, view: MatchView) => void;
  setError: (code: string) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  matchId: undefined,
  view: undefined,
  lastError: undefined,
  setStart: (matchId) => set({ matchId, view: undefined, lastError: undefined }),
  setView: (matchId, view) => set({ matchId, view }),
  setError: (lastError) => set({ lastError }),
  reset: () => set({ matchId: undefined, view: undefined, lastError: undefined }),
}));

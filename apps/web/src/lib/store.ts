import type { Card, MatchId, MatchView } from "@ekittens/contract";
import { create } from "zustand";

interface MatchStore {
  matchId: MatchId | undefined;
  view: MatchView | undefined;
  lastError: string | undefined;
  /** The most recent See-the-Future peek (top cards), shown until dismissed. */
  peek: readonly Card[] | undefined;
  setStart: (matchId: MatchId) => void;
  setView: (matchId: MatchId, view: MatchView) => void;
  setError: (code: string) => void;
  setPeek: (peek: readonly Card[] | undefined) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  matchId: undefined,
  view: undefined,
  lastError: undefined,
  peek: undefined,
  setStart: (matchId) => set({ matchId, view: undefined, lastError: undefined, peek: undefined }),
  // A fresh authoritative view supersedes any stale error.
  setView: (matchId, view) => set({ matchId, view, lastError: undefined }),
  setError: (lastError) => set({ lastError }),
  setPeek: (peek) => set({ peek }),
  reset: () => set({ matchId: undefined, view: undefined, lastError: undefined, peek: undefined }),
}));

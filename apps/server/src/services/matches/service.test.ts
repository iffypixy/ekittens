import type { MatchView, PlayerId, ServerMessage } from "@ekittens/contract";
import type { Clock, Timestamp } from "@ekittens/lib";
import { describe, expect, it } from "vitest";
import { inertScheduler } from "../../lib/scheduler.ts";
import { type MatchResult, MatchesService } from "./service.ts";

const pid = (value: string): PlayerId => value as PlayerId;
const clock: Clock = { now: () => 0 as Timestamp };

interface Harness {
  views: Map<PlayerId, MatchView>;
  errors: { userId: PlayerId; code: string }[];
  starts: PlayerId[];
  result: MatchResult | undefined;
  service: MatchesService;
}

const harness = (seed = 4242): Harness => {
  const views = new Map<PlayerId, MatchView>();
  const errors: { userId: PlayerId; code: string }[] = [];
  const starts: PlayerId[] = [];
  const state = { result: undefined as MatchResult | undefined };
  const service = new MatchesService({
    clock,
    scheduler: inertScheduler,
    seed: () => seed,
    isOnline: () => true,
    onEnd: (result) => {
      state.result = result;
    },
    publish: (userId, message: ServerMessage) => {
      if (message.type === "match:view") views.set(userId, message.view);
      else if (message.type === "match:start") starts.push(userId);
      else if (message.type === "match:error") errors.push({ userId, code: message.error.code });
    },
  });
  return {
    views,
    errors,
    starts,
    get result() {
      return state.result;
    },
    service,
  };
};

describe("matches service", () => {
  it("notifies both players and sends each their own initial view on create", () => {
    const h = harness();
    const players = [pid("A"), pid("B")];
    h.service.create(players);
    expect(h.starts).toEqual(players);
    expect(h.views.get(pid("A"))?.self?.id).toBe(pid("A"));
    expect(h.views.get(pid("B"))?.self?.id).toBe(pid("B"));
    // A's view never contains B's hand contents.
    expect(h.views.get(pid("A"))?.opponents).toEqual([{ id: pid("B"), handCount: 5 }]);
  });

  it("rejects a command from the player whose turn it is not", () => {
    const h = harness();
    const players = [pid("A"), pid("B")];
    const matchId = h.service.create(players);
    const notTurn = h.views.get(pid("A"))?.turn === pid("A") ? pid("B") : pid("A");
    h.service.submit(matchId, notTurn, { type: "draw-card" });
    expect(h.errors.some((e) => e.code === "not-your-turn")).toBe(true);
  });

  it("plays a full game to a winner, driven only from the broadcast views", () => {
    const h = harness();
    const players = [pid("A"), pid("B")];
    const matchId = h.service.create(players);

    for (let step = 0; step < 5000 && h.result === undefined; step++) {
      const turn = h.views.get(players[0] as PlayerId)?.turn;
      if (turn === undefined) break;
      const view = h.views.get(turn);
      if (view === undefined) break;
      if (view.phase === "game-over") break;

      if (view.phase === "waiting-for-action") {
        h.service.submit(matchId, turn, { type: "draw-card" });
      } else if (view.phase === "defusing") {
        const defuse = view.self?.hand.find((c) => c.name === "defuse");
        if (defuse) h.service.submit(matchId, turn, { type: "play-defuse", card: defuse.id });
        else break;
      } else if (view.phase === "inserting-exploding-kitten") {
        h.service.submit(matchId, turn, { type: "insert-exploding-kitten", position: 0 });
      } else {
        break; // unreachable when only drawing
      }
    }

    expect(h.result).toBeDefined();
    expect(players).toContain(h.result?.winner);
    expect(h.result?.ranking).toHaveLength(2);
    expect(h.service.has(matchId)).toBe(false); // cleaned up after finish
  });
});

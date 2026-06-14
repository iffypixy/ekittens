import {expect as unwrap, isOk} from "@ekittens/lib/result";
import {int, rng} from "@ekittens/lib/rng";
import fc from "fast-check";
import {describe, expect, it} from "vitest";

import {
  type Command,
  type GameId,
  type GameState,
  type PlayerId,
  checkInvariants,
  createGame,
  defaultRecipe,
  playout,
  randomMove,
  reduce,
  replay,
} from "./index";

function pid(s: string): PlayerId {
  return s as PlayerId;
}
function gid(s: string): GameId {
  return s as GameId;
}
function players(n: number): PlayerId[] {
  return Array.from({length: n}, (_, i) => pid(`p${i}`));
}
function newGame(n: number, seed: number): GameState {
  return unwrap(createGame(defaultRecipe(players(n), seed), gid("g")), "createGame");
}
function check(game: GameState): void {
  const violations = checkInvariants(game);
  if (!isOk(violations)) throw new Error(`invariant violated: ${violations.error.join("; ")}`);
}

const arbSeed = fc.integer({min: 0, max: 2 ** 31 - 1});

describe("properties over random games", () => {
  it("stay valid every step, always terminate, and are deterministic & replayable", () => {
    fc.assert(
      fc.property(fc.integer({min: 2, max: 5}), arbSeed, arbSeed, (n, setupSeed, botSeed) => {
        const game = playout(newGame(n, setupSeed), botSeed, check);

        expect(game.final.outcome.status).toBe("ended");
        if (game.final.outcome.status === "ended") {
          expect(game.final.players.map((p) => p.id)).toContain(game.final.outcome.winner);
          expect(game.final.outcome.finishOrder).toHaveLength(n);
          expect(new Set(game.final.outcome.finishOrder).size).toBe(n);
        }

        // Determinism + command-log replay both reproduce the same final state.
        expect(playout(newGame(n, setupSeed), botSeed).final).toEqual(game.final);
        expect(replay(newGame(n, setupSeed), game.commands)).toEqual(game.final);
      }),
      {numRuns: 100},
    );
  });

  it("createGame is a pure function of recipe + seed", () => {
    fc.assert(
      fc.property(fc.integer({min: 2, max: 5}), arbSeed, (n, seed) => {
        expect(newGame(n, seed)).toEqual(newGame(n, seed));
      }),
      {numRuns: 100},
    );
  });
});

/**
 * Like playout, but ~8% of moves are a random timeout or concede — stressing
 * mid-phase elimination and the phase-card-return paths.
 */
function chaosPlayout(start: GameState, seed: number): GameState {
  let game = start;
  let rngState = rng(seed);
  let steps = 0;

  while (game.outcome.status === "ongoing") {
    if (++steps > 5000) throw new Error("game did not terminate");

    const roll = int(rngState, 100);
    rngState = roll.state;
    let command: Command;
    if (roll.value < 8) {
      const victim = int(rngState, game.players.length);
      rngState = victim.state;
      const which = int(rngState, 2);
      rngState = which.state;
      command = which.value === 0 ? {type: "timeout"} : {type: "concede", by: game.players[victim.value]!.id};
    } else {
      const move = randomMove(game, rngState);
      rngState = move.state;
      command = move.command;
    }

    const result = reduce(game, command);
    if (!isOk(result))
      throw new Error(`unexpected illegal command ${JSON.stringify(command)} → ${JSON.stringify(result.error)}`);
    game = result.value.state;
    check(game);
  }
  return game;
}

const env = (globalThis as {process?: {env?: Record<string, string | undefined>}}).process?.env ?? {};
const GAMES = Number(env["SIM_GAMES"] ?? 400);

describe("simulation sweep", () => {
  it(`plays ${GAMES} random games with zero invariant violations`, () => {
    let totalSteps = 0;
    let longest = 0;
    const winsBySeat = new Map<number, number>();

    for (let i = 0; i < GAMES; i++) {
      const n = 2 + (i % 4);
      const {final, steps} = playout(newGame(n, i * 7 + 1), i * 13 + 3, check);
      expect(final.outcome.status).toBe("ended");
      totalSteps += steps;
      longest = Math.max(longest, steps);
      if (final.outcome.status === "ended") {
        const seat = Number(String(final.outcome.winner).slice(1));
        winsBySeat.set(seat, (winsBySeat.get(seat) ?? 0) + 1);
      }
    }

    const dist = [...winsBySeat.entries()].sort((a, b) => a[0] - b[0]).map(([seat, wins]) => `p${seat}:${wins}`);
    // eslint-disable-next-line no-console
    console.log(`sim: ${GAMES} games | avg ${(totalSteps / GAMES).toFixed(1)} steps | longest ${longest} | wins ${dist.join(" ")}`);
    expect(winsBySeat.size).toBeGreaterThan(1);
  });

  it(`survives ${GAMES} games with random timeouts and concedes`, () => {
    for (let i = 0; i < GAMES; i++) {
      const n = 2 + (i % 4);
      const final = chaosPlayout(newGame(n, i * 9 + 2), i * 31 + 5);
      expect(final.outcome.status).toBe("ended");
    }
  });
});

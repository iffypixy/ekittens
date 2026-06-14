import {type RngState, int, rng, shuffle} from "@ekittens/lib/rng";
import {isOk} from "@ekittens/lib/result";
import {match} from "ts-pattern";

import {type AvailableActions, availableActions, reduce} from "./engine";
import type {CardId, Command, GameState, PlayerId} from "./model";

type Move = {command: Command; state: RngState};

function findCard(game: GameState, player: PlayerId, id: CardId) {
  return game.players.find((p) => p.id === player)?.hand.find((c) => c.id === id);
}

function chooseAwaitingMove(
  game: GameState,
  active: PlayerId,
  actions: AvailableActions,
  rngState: RngState,
): Move {
  const roll = int(rngState, 100);
  let state = roll.state;

  // Lean toward drawing so the Game keeps making progress.
  if (actions.playable.length === 0 || roll.value >= 40)
    return {command: {type: "draw-card", by: active}, state};

  const pick = int(state, actions.playable.length);
  state = pick.state;
  const cardId = actions.playable[pick.value]!;
  const card = findCard(game, active, cardId)!;

  if (card.name === "targeted-attack" || card.name === "mark") {
    const needsCards = card.name === "mark"; // mark needs a non-empty hand to pick from
    const others = game.players.filter((p) => p.id !== active && (!needsCards || p.hand.length > 0));
    if (others.length === 0) return {command: {type: "draw-card", by: active}, state};
    const target = int(state, others.length);
    state = target.state;
    return {command: {type: "play-card", by: active, card: cardId, target: others[target.value]!.id}, state};
  }

  return {command: {type: "play-card", by: active, card: cardId}, state};
}

/** A simple bot: picks a legal move for the active player, leaning toward drawing so Games progress. */
export function randomMove(game: GameState, rngState: RngState): Move {
  const active = game.turn.active;
  const actions = availableActions(game, active);

  return match(actions.resolve)
    .with({kind: "defuse"}, (resolve): Move => ({
      command: {type: "provide-defuse", by: active, card: resolve.defuses[0]!},
      state: rngState,
    }))
    .with({kind: "insert"}, (resolve): Move => {
      const pick = int(rngState, resolve.maxPosition + 1);
      const type =
        game.phase.kind === "inserting-exploding-kitten"
          ? "insert-exploding-kitten"
          : "insert-imploding-kitten";
      return {command: {type, by: active, position: pick.value}, state: pick.state};
    })
    .with({kind: "bury"}, (resolve): Move => {
      const pick = int(rngState, resolve.maxPosition + 1);
      return {command: {type: "bury-card", by: active, position: pick.value}, state: pick.state};
    })
    .with({kind: "reorder"}, (resolve): Move => {
      const shuffled = shuffle(resolve.cards.map((c) => c.id), rngState);
      return {command: {type: "submit-future-order", by: active, order: [...shuffled.items]}, state: shuffled.state};
    })
    .with({kind: "none"}, (): Move => chooseAwaitingMove(game, active, actions, rngState))
    .exhaustive();
}

/** `onStep` runs after each command so tests can check invariants every step. */
export function playout(
  start: GameState,
  seed: number,
  onStep?: (game: GameState, command: Command) => void,
): {final: GameState; commands: Command[]; steps: number} {
  let game = start;
  let rngState = rng(seed);
  const commands: Command[] = [];
  let steps = 0;

  while (game.outcome.status === "ongoing") {
    if (++steps > 5000) throw new Error("game did not terminate within 5000 steps");
    const move = randomMove(game, rngState);
    rngState = move.state;
    commands.push(move.command);

    const result = reduce(game, move.command);
    if (!isOk(result))
      throw new Error(`illegal move ${JSON.stringify(move.command)} -> ${JSON.stringify(result.error)}`);
    game = result.value.state;
    onStep?.(game, move.command);
  }
  return {final: game, commands, steps};
}

export function replay(start: GameState, commands: readonly Command[]): GameState {
  let game = start;
  for (const command of commands) {
    const result = reduce(game, command);
    if (!isOk(result)) throw new Error(`replay illegal: ${JSON.stringify(command)}`);
    game = result.value.state;
  }
  return game;
}

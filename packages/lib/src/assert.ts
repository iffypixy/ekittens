export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvariantError";
  }
}

/**
 * Guard an assumption that must hold. Fails loudly and early. Reserve for genuine
 * invariants — bugs if violated — not for expected/validated input, which belongs
 * in a Result.
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new InvariantError(message);
}

/** Mark an unreachable branch; fails loudly if ever reached. */
export function unreachable(value: never, message = "unreachable"): never {
  throw new InvariantError(`${message}: ${JSON.stringify(value)}`);
}

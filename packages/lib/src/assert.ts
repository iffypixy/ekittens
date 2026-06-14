export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvariantError";
  }
}

/** For a condition that must always hold. Use a Result for input that can legitimately be invalid. */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new InvariantError(message);
}

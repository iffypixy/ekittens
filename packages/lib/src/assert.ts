/**
 * Thrown when an invariant is violated. This signals a *bug* — a broken
 * assumption — not an expected failure (which would be a `Result`). The right
 * response is to fail fast and restart from a known-good state
 * (ENGINEERING_RULES #9, #11).
 */
export class InvariantViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvariantViolation";
  }
}

/** Assert a condition that must hold; narrows the type on success. */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new InvariantViolation(message);
}

/**
 * Mark a branch the type system believes is unreachable. If `switch`/`match`
 * exhaustiveness is correct this is dead code; if a case was missed it fails
 * loudly at its source instead of corrupting state far away.
 */
export function unreachable(value: never, message = "unreachable case reached"): never {
  throw new InvariantViolation(`${message}: ${JSON.stringify(value)}`);
}

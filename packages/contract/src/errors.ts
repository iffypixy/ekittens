/**
 * The single, stable, machine-readable error-code taxonomy shared across the
 * whole system. Every `Result` failure and every `GameError` carries one of
 * these codes, so clients can interpret failures.
 */
export const ERROR_CODES = [
  // engine / game rules
  "illegal-move",
  "not-your-turn",
  "wrong-phase",
  "card-not-in-hand",
  "not-eligible",
  "invalid-target",
  "invalid-combo",
  "invalid-position",
  "invalid-card",
  // boundary / app
  "invalid-id",
  "validation-failed",
  "unauthorized",
  "forbidden",
  "not-found",
  "conflict",
  "rate-limited",
  "internal",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** A failure value: a stable code plus an optional human-readable detail. */
export interface GameError {
  readonly code: ErrorCode;
  readonly detail?: string;
}

export const gameError = (code: ErrorCode, detail?: string): GameError =>
  detail === undefined ? { code } : { code, detail };

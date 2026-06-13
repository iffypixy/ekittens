import { type Result, err, ok } from "./result.ts";

/**
 * Run a fallible operation, turning a thrown error or a rejected promise into an
 * `err` instead of an exception (ENGINEERING_RULES #9 — expected failures as
 * values). Works on a sync thunk, an async thunk, or a bare promise; the caught
 * value is `unknown`, so refine it with `mapError` at the call site.
 *
 *   const parsed = tc(() => JSON.parse(input));   // Result<unknown, unknown>
 *   const row = await tc(db.query(sql));          // Promise<Result<Row, unknown>>
 */
export function tc<T>(promise: Promise<T>): Promise<Result<T, unknown>>;
export function tc<T>(fn: () => Promise<T>): Promise<Result<T, unknown>>;
export function tc<T>(fn: () => T): Result<T, unknown>;
export function tc<T>(
  input: Promise<T> | (() => T | Promise<T>),
): Result<T, unknown> | Promise<Result<T, unknown>> {
  try {
    const value = typeof input === "function" ? input() : input;
    if (value instanceof Promise) {
      return value.then((resolved) => ok(resolved)).catch((error: unknown) => err(error));
    }
    return ok(value);
  } catch (error) {
    return err(error);
  }
}

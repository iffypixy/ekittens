/**
 * A value that is either a success (`ok`) carrying a `T`, or a failure (`err`)
 * carrying an `E`. Expected, recoverable failures are modelled as values here
 * rather than thrown. `throw` is reserved for genuine
 * bugs / broken invariants.
 */
export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export function ok(): Ok<undefined>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value?: T): Ok<T | undefined> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok;

/** Transform the success value, leaving a failure untouched. */
export const map = <T, E, U>(result: Result<T, E>, transform: (value: T) => U): Result<U, E> =>
  result.ok ? ok(transform(result.value)) : result;

/** Transform the failure value, leaving a success untouched. */
export const mapError = <T, E, F>(
  result: Result<T, E>,
  transform: (error: E) => F,
): Result<T, F> => (result.ok ? result : err(transform(result.error)));

/** Chain a fallible step; the failure types accumulate as a union. */
export const andThen = <T, E, U, F>(
  result: Result<T, E>,
  next: (value: T) => Result<U, F>,
): Result<U, E | F> => (result.ok ? next(result.value) : result);

/** Extract the success value or fall back for a failure. */
export const unwrapOr = <T, E>(result: Result<T, E>, fallback: T): T =>
  result.ok ? result.value : fallback;

/** Exhaustively handle both arms, returning a unified value. */
export const match = <T, E, A, B>(
  result: Result<T, E>,
  arms: { readonly ok: (value: T) => A; readonly err: (error: E) => B },
): A | B => (result.ok ? arms.ok(result.value) : arms.err(result.error));

/** Collect an array of results into a result of array; short-circuits on the first failure. */
export const all = <T, E>(results: readonly Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }
  return ok(values);
};

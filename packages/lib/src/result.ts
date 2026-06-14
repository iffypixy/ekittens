export type Ok<T> = {readonly ok: true; readonly value: T};
export type Err<E> = {readonly ok: false; readonly error: E};

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return {ok: true, value};
}

export function err<E>(error: E): Err<E> {
  return {ok: false, error};
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

export function map<T, U, E>(result: Result<T, E>, f: (value: T) => U): Result<U, E> {
  return result.ok ? ok(f(result.value)) : result;
}

export function mapErr<T, E, F>(result: Result<T, E>, f: (error: E) => F): Result<T, F> {
  return result.ok ? result : err(f(result.error));
}

export function flatMap<T, U, E>(result: Result<T, E>, f: (value: T) => Result<U, E>): Result<U, E> {
  return result.ok ? f(result.value) : result;
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

/** Returns the value, or throws. Use only when an error genuinely cannot be handled. */
export function expect<T, E>(result: Result<T, E>, message: string): T {
  if (result.ok) return result.value;
  throw new Error(`${message}: ${String(result.error)}`);
}

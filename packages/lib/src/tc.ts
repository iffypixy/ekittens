import {type Result, err, ok} from "./result";

/** Wraps a throwing call so the outcome is a value. The error is unknown; narrow it where you handle it. */
export function tc<T>(fn: () => T): Result<T, unknown> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error);
  }
}

export async function tcAsync<T>(fn: () => Promise<T>): Promise<Result<T, unknown>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(error);
  }
}

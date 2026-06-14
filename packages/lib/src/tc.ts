import {type Result, err, ok} from "./result";

/**
 * The single owned try/catch funnel. Turns a throwing call into a Result so the
 * rest of the code never writes a raw try/catch. Error is `unknown` — the caller
 * narrows or parses it at the boundary.
 */
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

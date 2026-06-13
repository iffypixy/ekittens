import { describe, expect, it } from "vitest";
import { tc } from "./tc.ts";

describe("tc", () => {
  it("wraps a successful sync call as ok", () => {
    const result = tc(() => JSON.parse('{"a":1}'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ a: 1 });
  });

  it("captures a sync throw as err carrying the thrown value", () => {
    const boom = new Error("boom");
    const result = tc((): number => {
      throw boom;
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(boom);
  });

  it("captures a real throwing call (invalid JSON) as a SyntaxError err", () => {
    const result = tc(() => JSON.parse("{ not json"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(SyntaxError);
  });

  it("wraps a resolved promise as ok", async () => {
    const result = await tc(Promise.resolve(42));
    expect(result.ok && result.value).toBe(42);
  });

  it("captures a rejected promise as err", async () => {
    const result = await tc(Promise.reject(new Error("nope")));
    expect(result.ok).toBe(false);
    if (!result.ok) expect((result.error as Error).message).toBe("nope");
  });

  it("wraps an async thunk and captures throws inside it", async () => {
    expect((await tc(async () => 7)).ok).toBe(true);
    const failed = await tc(async () => {
      throw new Error("x");
    });
    expect(failed.ok).toBe(false);
  });
});

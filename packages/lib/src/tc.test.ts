import {describe, expect, it} from "vitest";

import {isErr, isOk} from "./result";
import {tc, tcAsync} from "./tc";

describe("tc", () => {
  it("wraps a successful call in ok", () => {
    const r = tc(() => 42);
    expect(r).toEqual({ok: true, value: 42});
  });

  it("captures a throw as err", () => {
    const r = tc(() => {
      throw new Error("boom");
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect((r.error as Error).message).toBe("boom");
  });

  it("works with async success and failure", async () => {
    expect(isOk(await tcAsync(async () => 1))).toBe(true);
    expect(
      isErr(
        await tcAsync(async () => {
          throw new Error("x");
        }),
      ),
    ).toBe(true);
  });
});

import {describe, expect, it} from "vitest";

import {InvariantError, assert, unreachable} from "./assert";

describe("assert", () => {
  it("passes through when the condition holds", () => {
    expect(() => assert(true, "should not throw")).not.toThrow();
  });

  it("throws an InvariantError when the condition fails", () => {
    expect(() => assert(false, "card count drifted")).toThrowError(InvariantError);
    expect(() => assert(0, "card count drifted")).toThrow("card count drifted");
  });

  it("narrows the type after asserting", () => {
    const x: number | undefined = 3;
    assert(x !== undefined, "x defined");
    // type-level: x is number here; runtime: no throw
    expect(x + 1).toBe(4);
  });

  it("unreachable always throws", () => {
    expect(() => unreachable("ghost" as never)).toThrowError(InvariantError);
  });
});

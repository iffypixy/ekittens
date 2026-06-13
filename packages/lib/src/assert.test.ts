import { describe, expect, it } from "vitest";
import { InvariantViolation, invariant, unreachable } from "./assert.ts";

describe("assert", () => {
  it("invariant passes a truthy condition and narrows", () => {
    const value: number | undefined = 5;
    invariant(value !== undefined, "must be defined");
    expect(value + 1).toBe(6);
  });

  it("invariant throws InvariantViolation on a falsy condition", () => {
    expect(() => invariant(false, "nope")).toThrow(InvariantViolation);
    expect(() => invariant(0, "zero")).toThrow("zero");
  });

  it("unreachable always throws", () => {
    const value = "x" as never;
    expect(() => unreachable(value)).toThrow(InvariantViolation);
  });
});

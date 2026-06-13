import { describe, expect, it } from "vitest";
import { all, andThen, err, isErr, isOk, map, mapError, match, ok, unwrapOr } from "./result.ts";

describe("result", () => {
  it("constructs ok and err", () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
    expect(ok()).toEqual({ ok: true, value: undefined });
  });

  it("narrows with isOk / isErr", () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(err("x"))).toBe(true);
    expect(isOk(err("x"))).toBe(false);
  });

  it("maps the success value only", () => {
    expect(map(ok(2), (n) => n * 3)).toEqual(ok(6));
    expect(map(err<string>("e"), (n: number) => n * 3)).toEqual(err("e"));
  });

  it("maps the error value only", () => {
    expect(mapError(err("e"), (e) => `${e}!`)).toEqual(err("e!"));
    expect(mapError(ok(1), (e: string) => `${e}!`)).toEqual(ok(1));
  });

  it("chains with andThen and accumulates error types", () => {
    const half = (n: number) => (n % 2 === 0 ? ok(n / 2) : err("odd"));
    expect(andThen(ok(8), half)).toEqual(ok(4));
    expect(andThen(ok(7), half)).toEqual(err("odd"));
    expect(andThen(err<string>("first"), half)).toEqual(err("first"));
  });

  it("unwrapOr falls back on error", () => {
    expect(unwrapOr(ok(5), 0)).toBe(5);
    expect(unwrapOr(err("e"), 0)).toBe(0);
  });

  it("match handles both arms exhaustively", () => {
    expect(match(ok(2), { ok: (n) => n + 1, err: () => -1 })).toBe(3);
    expect(match(err("e"), { ok: (n: number) => n + 1, err: (e) => e.length })).toBe(1);
  });

  it("all short-circuits on the first failure", () => {
    expect(all([ok(1), ok(2), ok(3)])).toEqual(ok([1, 2, 3]));
    expect(all([ok(1), err("bad"), ok(3)])).toEqual(err("bad"));
    expect(all<number, string>([])).toEqual(ok([]));
  });
});

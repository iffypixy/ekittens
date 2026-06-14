import {describe, expect as vexpect, it} from "vitest";

import {err, expect, flatMap, isErr, isOk, map, mapErr, ok, unwrapOr} from "./result";

describe("result", () => {
  it("constructs and narrows ok", () => {
    const r = ok(3);
    vexpect(isOk(r)).toBe(true);
    vexpect(isErr(r)).toBe(false);
    if (isOk(r)) vexpect(r.value).toBe(3);
  });

  it("constructs and narrows err", () => {
    const r = err("boom");
    vexpect(isErr(r)).toBe(true);
    if (isErr(r)) vexpect(r.error).toBe("boom");
  });

  it("maps the value only on ok", () => {
    vexpect(map(ok(2), (x) => x + 1)).toEqual(ok(3));
    vexpect(map(err<string>("e"), (x: number) => x + 1)).toEqual(err("e"));
  });

  it("maps the error only on err", () => {
    vexpect(mapErr(err("e"), (e) => `${e}!`)).toEqual(err("e!"));
    vexpect(mapErr(ok(2), (e: string) => `${e}!`)).toEqual(ok(2));
  });

  it("chains with flatMap and short-circuits on err", () => {
    const half = (x: number) => (x % 2 === 0 ? ok(x / 2) : err("odd"));
    vexpect(flatMap(ok(8), half)).toEqual(ok(4));
    vexpect(flatMap(ok(7), half)).toEqual(err("odd"));
    vexpect(flatMap(err<string>("pre"), half)).toEqual(err("pre"));
  });

  it("unwrapOr falls back on err", () => {
    vexpect(unwrapOr(ok(1), 9)).toBe(1);
    vexpect(unwrapOr(err("e"), 9)).toBe(9);
  });

  it("expect throws on err", () => {
    vexpect(() => expect(err("nope"), "wanted value")).toThrow("wanted value: nope");
    vexpect(expect(ok(5), "x")).toBe(5);
  });
});

import { describe, expect, it } from "vitest";
import { CROCKFORD_ALPHABET, ID_LENGTH, isId, newId, parseId } from "./id.ts";

describe("id", () => {
  it("has no ambiguous letters in the alphabet", () => {
    expect(CROCKFORD_ALPHABET).not.toMatch(/[ILOU]/);
    expect(CROCKFORD_ALPHABET).toHaveLength(32);
  });

  it("generates uniform-length ids from the alphabet", () => {
    for (let i = 0; i < 100; i++) {
      const id = newId();
      expect(id).toHaveLength(ID_LENGTH);
      expect(isId(id)).toBe(true);
    }
  });

  it("generates distinct ids", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(newId());
    expect(seen.size).toBe(1000);
  });

  it("parses valid ids and rejects invalid ones", () => {
    const valid = newId();
    const parsed = parseId(valid);
    expect(parsed.ok).toBe(true);

    expect(parseId("").ok).toBe(false);
    expect(parseId("tooshort").ok).toBe(false);
    expect(parseId("ILOU000000").ok).toBe(false); // ambiguous letters
    expect(parseId("abcdefghij").ok).toBe(false); // lowercase
    expect(parseId("0123456789X").ok).toBe(false); // too long
  });
});

import { customAlphabet } from "nanoid";
import { type Result, err, ok } from "../result/result.ts";

/**
 * A nominal ("branded") type: structurally a `T`, but distinct from every other
 * brand so the compiler refuses to mix, say, a `UserId` with a `MatchId`
 * (ENGINEERING_RULES #3 — branded ids over bare primitives).
 */
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

/** A public identifier — a pretty, sortable-by-creation-irrelevant Crockford id. */
export type Id<B extends string> = Brand<string, B>;

/**
 * Crockford Base32 alphabet: digits + uppercase consonant-heavy letters, with
 * I, L, O, U removed so ids are unambiguous to read and type. 32 symbols.
 */
export const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Uniform id length across every entity (see plan: "short for everything"). */
export const ID_LENGTH = 10;

const ID_PATTERN = new RegExp(`^[${CROCKFORD_ALPHABET}]{${ID_LENGTH}}$`);

const generate = customAlphabet(CROCKFORD_ALPHABET, ID_LENGTH);

/**
 * Generate a fresh public id (cryptographically random) for shell-side entities.
 * The caller supplies the brand. The engine, which must stay deterministic, uses
 * its injected `Rng` instead (see `lib/random`).
 */
export const newId = <B extends string>(): Id<B> => generate() as Id<B>;

export const isId = (value: string): boolean => ID_PATTERN.test(value);

export interface InvalidId {
  readonly code: "invalid-id";
}

/**
 * Parse an untrusted string into a branded id at a trust boundary
 * (ENGINEERING_RULES #2 — parse, don't validate). The caller supplies the brand.
 */
export const parseId = <B extends string>(value: string): Result<Id<B>, InvalidId> =>
  isId(value) ? ok(value as Id<B>) : err({ code: "invalid-id" });

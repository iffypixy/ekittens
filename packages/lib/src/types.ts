type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * Recursively `readonly` a structure. Primitives — including branded ids like
 * `PlayerId` (`string & brand`) — pass through untouched, so branding survives.
 * Applied uniformly over inferred schema types so the schema stays the single
 * source of truth while the engine sees immutable data.
 */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : {readonly [K in keyof T]: DeepReadonly<T[K]>};

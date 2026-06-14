type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/** Deeply readonly version of a type. Primitives, including branded ids, pass through unchanged so branding survives. */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : {readonly [K in keyof T]: DeepReadonly<T[K]>};

export type Nullable<T> = T | null;

export type Callback<T = void> = (...args: any[]) => T;

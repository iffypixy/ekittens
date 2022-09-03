export const AssertRecordType =
  <T>() =>
  <D extends Record<string, T>>(d: D) =>
    d;

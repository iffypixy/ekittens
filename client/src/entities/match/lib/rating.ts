const adjustShift = (shift: number) =>
  (shift > 0 ? "+" : shift < 0 ? "-" : "±") + Math.abs(shift);

export const rating = {adjustShift};

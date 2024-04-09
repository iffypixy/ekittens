export const convertRemToPx = (rem: number) =>
  rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

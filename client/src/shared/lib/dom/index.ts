const isOverlap = (a: DOMRect, b: DOMRect) =>
  !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );

export const dom = {isOverlap};

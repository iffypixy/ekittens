const PERF = 400;
const K_FACTOR = 70;

const SCORE = {
  VICTORY: 1,
  DEFEAT: 0,
};

const adjust = (shift: number, opponents: number) => shift * opponents;

const calculate = (
  rating: number,
  opponents: number[],
  score: number,
): number => {
  const average = Math.round(
    opponents.reduce((prev, rating) => prev + rating, 0) / opponents.length,
  );

  const ratingDiff = rating - average;

  const expected = 1 - 1 / (1 + Math.pow(10, ratingDiff / PERF));

  const scoreDiff = score - expected;

  let shift = K_FACTOR * scoreDiff;

  if (score === SCORE.VICTORY) shift = adjust(shift, opponents.length);

  const updated = Math.round(rating + shift);

  return updated;
};

const ifWon = (rating: number, opponents: number[]): number =>
  calculate(rating, opponents, SCORE.VICTORY);

const ifLost = (rating: number, opponents: number[]): number =>
  calculate(rating, opponents, SCORE.DEFEAT);

export const elo = {
  ifWon,
  ifLost,
  adjust,
};

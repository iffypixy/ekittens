export const splitIntoChunks = <T>(array: T[], chunks: number): T[][] => {
  return Array(Math.ceil(array.length / chunks))
    .fill(null)
    .map((_, index) => index * chunks)
    .map((begin) => array.slice(begin, begin + chunks));
};

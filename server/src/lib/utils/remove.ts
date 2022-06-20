interface RemoveOptions<T> {
  value: T;
  amount: number;
}

export const remove = <T>(array: T[], options: RemoveOptions<T>): T[] => {
  const duplicate = [...array];

  let idx = duplicate.indexOf(options.value);
  let counter = 0;

  while (idx !== -1 && counter < options.amount) {
    duplicate.splice(idx, 1);

    idx = duplicate.indexOf(options.value);
    counter++;
  }

  return duplicate;
};

export function moveElement<T>(array: T[], fromIndex: number, toIndex: number) {
  const newArray = [...array];
  const elements = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, ...elements);
  return newArray;
}

/**
 * Returns the last item of an Iterable.
 */
export function last<T>(items: Iterable<T>): T | null {
  return Iterator.from(items).reduce<T | null>((_, item) => item, null);
}

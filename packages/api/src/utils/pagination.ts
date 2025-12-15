export const RESULTS_PER_PAGE = 15;

/**
 * Processes query results for cursor-based pagination.
 *
 * Expects results from a query that fetched `pageSize + 1` items.
 * Returns the items (trimmed if there are more) and the cursor for the next page.
 *
 * @param results - The query results (should have fetched pageSize + 1 items)
 * @param getCursor - Function to extract the cursor value from an item
 * @param pageSize - The page size used (defaults to RESULTS_PER_PAGE)
 */
export function paginate<T>(
  results: T[],
  getCursor: (item: T) => string,
  pageSize: number = RESULTS_PER_PAGE,
): { items: T[]; nextCursor: string | null } {
  const hasMore = results.length > pageSize;
  const items = hasMore ? results.slice(0, -1) : results;
  const lastItem = items.at(-1);
  return {
    items,
    nextCursor: hasMore && lastItem ? getCursor(lastItem) : null,
  };
}

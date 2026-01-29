/**
 * Creates an IDBKeyRange for filtering queries.
 *
 * @example
 * ```ts
 * // Records with timestamp >= 1000
 * await store.getAll(keyRange({ lower: 1000 }));
 *
 * // Records with timestamp between 1000 and 2000 (inclusive)
 * await store.getAll(keyRange({ lower: 1000, upper: 2000 }));
 *
 * // Records with timestamp < 1000 (exclusive lower bound)
 * await store.getAll(keyRange({ upper: 1000, upperOpen: true }));
 * ```
 */
export function keyRange(options: {
  lower?: IDBValidKey;
  upper?: IDBValidKey;
  lowerOpen?: boolean;
  upperOpen?: boolean;
}): IDBKeyRange {
  const { lower, upper, lowerOpen = false, upperOpen = false } = options;

  if (lower !== undefined && upper !== undefined) {
    return IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
  }
  if (lower !== undefined) {
    return IDBKeyRange.lowerBound(lower, lowerOpen);
  }
  if (upper !== undefined) {
    return IDBKeyRange.upperBound(upper, upperOpen);
  }

  throw new Error("keyRange requires at least a lower or upper bound");
}

export interface BaseOperation<TType extends string = string> {
  readonly type: TType;
  readonly timestamp: number;
}

export interface Operation<
  TType extends string = string,
  TData = unknown,
  TInverse = TData,
> extends BaseOperation<TType> {
  /** Data needed to apply the operation */
  readonly data: TData;
  /** Data needed to undo the operation */
  readonly inverse: TInverse;
  /** Key for coalescing related operations */
  readonly coalesceKey?: string;
}

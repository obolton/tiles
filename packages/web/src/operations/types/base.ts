/**
 * An action is an atomic command that can be executed.
 * Actions are the building blocks of operations.
 */
export interface Action<TType extends string = string, TData = unknown> {
  readonly type: TType;
  readonly data: TData;
}

/**
 * An operation pairs actions with their reverse actions.
 * - apply: The actions to execute for do/redo
 * - reverse: The actions to execute for undo
 */
export interface Operation<TAction extends Action> {
  readonly apply: readonly TAction[];
  readonly reverse: readonly TAction[];
  readonly timestamp: Date;
  readonly coalesceKey?: string;
}

/**
 * Input type for recording operations - accepts single actions or arrays.
 * Single actions are normalized to arrays internally.
 * Timestamp is added automatically.
 */
export type OperationInput<TAction extends Action> = {
  readonly apply: TAction | readonly TAction[];
  readonly reverse: TAction | readonly TAction[];
  readonly coalesceKey?: string;
};

import type Editor from "@/editor/Editor";
import type { AnyAction } from "../types";

/**
 * An action executor performs a single action.
 * Each action type has exactly one executor function.
 */
export type ActionExecutor<T extends AnyAction = AnyAction> = (
  editor: Editor,
  data: T["data"],
) => Promise<void>;

/**
 * Maps each action type to its executor function.
 */
export type ActionExecutorRegistry = {
  [K in AnyAction["type"]]: ActionExecutor<Extract<AnyAction, { type: K }>>;
};

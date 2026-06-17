import type Editor from "@/editor/Editor";
import type { Action, Operation } from "../types";
import type { ActionExecutorRegistry } from "./types";

import { executors as tile } from "./tile";
import { executors as text } from "./text";
import { executors as image } from "./image";
import { executors as video } from "./video";
import { executors as link } from "./link";
import { executors as page } from "./page";

const registry: ActionExecutorRegistry = {
  ...tile,
  ...text,
  ...image,
  ...video,
  ...link,
  ...page,
};

type ExecutorFn = (editor: Editor, data: Action["data"]) => Promise<void>;

/**
 * Executes a single action.
 */
export async function executeAction(
  editor: Editor,
  action: Action,
): Promise<void> {
  const executors = registry as Record<string, ExecutorFn>;
  const executor = executors[action.type];

  if (!executor) {
    throw new Error(`No executor registered for action type: ${action.type}`);
  }

  await executor(editor, action.data);
}

/**
 * Executes an operation in the specified direction.
 *
 * @param editor - The editor instance
 * @param operation - The operation to execute
 * @param direction - "apply" for do/redo, "reverse" for undo
 */
export async function execute(
  editor: Editor,
  operation: Operation<Action>,
  direction: "apply" | "reverse",
): Promise<void> {
  const actions = direction === "apply" ? operation.apply : operation.reverse;
  for (const action of actions) {
    await executeAction(editor, action);
  }
}

export type { ActionExecutor, ActionExecutorRegistry } from "./types";

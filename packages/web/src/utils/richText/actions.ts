import Editor from "@/editor/Editor";
import { executeAction } from "@/operations/executors";
import type { Action } from "./stream";

/**
 * Execute a streamed action from the AI.
 */
export async function handleStreamAction(action: Action): Promise<void> {
  await executeAction(Editor.current, action);
}

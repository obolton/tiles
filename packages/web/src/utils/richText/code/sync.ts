import type { EditorView as CMEditorView } from "@codemirror/view";
import type { EditorView as PMEditorView } from "prosemirror-view";

/**
 * Find the minimal text change between two strings.
 * Returns the range in oldText and the replacement from newText.
 */
export function findTextChange(
  oldText: string,
  newText: string,
): { from: number; to: number; insert: string } | null {
  if (oldText === newText) {
    return null;
  }

  let start = 0;
  let oldEnd = oldText.length;
  let newEnd = newText.length;

  // Find common prefix
  while (
    start < oldEnd &&
    start < newEnd &&
    oldText[start] === newText[start]
  ) {
    start++;
  }

  // Find common suffix
  while (
    oldEnd > start &&
    newEnd > start &&
    oldText[oldEnd - 1] === newText[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }

  return {
    from: start,
    to: oldEnd,
    insert: newText.slice(start, newEnd),
  };
}

/**
 * Forward changes from CodeMirror to ProseMirror.
 */
export function forwardToProseMirror(
  cm: CMEditorView,
  pm: PMEditorView,
  getPos: () => number | undefined,
): void {
  const pos = getPos();
  if (typeof pos !== "number") {
    return;
  }

  const node = pm.state.doc.nodeAt(pos);
  if (!node) {
    return;
  }

  const change = findTextChange(node.textContent, cm.state.doc.toString());
  if (!change) {
    return;
  }

  const tr = pm.state.tr.replaceWith(
    pos + 1 + change.from,
    pos + 1 + change.to,
    change.insert ? pm.state.schema.text(change.insert) : [],
  );

  pm.dispatch(tr);
}

/**
 * Apply changes from ProseMirror to CodeMirror.
 */
export function applyToCodeMirror(cm: CMEditorView, newText: string): void {
  const change = findTextChange(cm.state.doc.toString(), newText);
  if (!change) {
    return;
  }

  cm.dispatch({
    changes: change,
  });
}

import {
  ySyncPluginKey,
  absolutePositionToRelativePosition,
} from "y-prosemirror";
import * as Y from "yjs";
import {
  encodeSelection,
  type SerializedSelection,
} from "doc/richText/selection";
import type { EditorState } from "prosemirror-state";

export function serializeSelection(
  state: EditorState,
): SerializedSelection | null {
  const ystate = ySyncPluginKey.getState(state);
  const fragment = ystate?.type;
  const mapping = ystate?.binding?.mapping;
  if (!(fragment instanceof Y.XmlFragment) || !mapping) {
    return null;
  }
  const { from, to } = state.selection;
  return encodeSelection({
    from: absolutePositionToRelativePosition(from, fragment, mapping),
    to: absolutePositionToRelativePosition(to, fragment, mapping),
  });
}

import { ySyncPluginKey, absolutePositionToRelativePosition } from "y-prosemirror";
import * as Y from "yjs";
import { encodeSelection, type SerializedSelection } from "doc/richText/selection";
import type { EditorState } from "prosemirror-state";

/** The binding-independent form of a position in a collaborative editor. */
export function toRelativePosition(state: EditorState, pos: number): Y.RelativePosition | null {
  const ystate = ySyncPluginKey.getState(state);
  const fragment = ystate?.type;
  const mapping = ystate?.binding?.mapping;
  if (!(fragment instanceof Y.XmlFragment) || !mapping) {
    return null;
  }
  return absolutePositionToRelativePosition(pos, fragment, mapping);
}

export function serializeSelection(state: EditorState): SerializedSelection | null {
  const { from, to } = state.selection;
  const start = toRelativePosition(state, from);
  const end = toRelativePosition(state, to);
  if (!start || !end) {
    return null;
  }
  return encodeSelection({ from: start, to: end });
}

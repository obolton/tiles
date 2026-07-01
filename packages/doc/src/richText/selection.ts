import * as Y from "yjs";
import { base64ToBytes, bytesToBase64 } from "../encoding";

/**
 * A selection within a fragment, as binding-independent positions. `from` and
 * `to` are equal for a collapsed selection (a caret).
 */
export interface SelectionRange {
  from: Y.RelativePosition;
  to: Y.RelativePosition;
}

/**
 * The JSON-safe form of a {@link SelectionRange} sent between client and server.
 */
export interface SerializedSelection {
  from: string;
  to: string;
}

/** Serializes a selection for transport in a JSON request. */
export function encodeSelection(range: SelectionRange): SerializedSelection {
  return {
    from: bytesToBase64(Y.encodeRelativePosition(range.from)),
    to: bytesToBase64(Y.encodeRelativePosition(range.to)),
  };
}

/**
 * Restores a selection serialized by {@link encodeSelection}. Returns null when
 * the payload is malformed so callers can fall back to default behavior.
 */
export function decodeSelection(selection: SerializedSelection): SelectionRange | null {
  try {
    return {
      from: Y.decodeRelativePosition(base64ToBytes(selection.from)),
      to: Y.decodeRelativePosition(base64ToBytes(selection.to)),
    };
  } catch {
    return null;
  }
}

import { EditorState, type Plugin } from "prosemirror-state";
import { getPlugins } from "./plugins";
import { deserialize } from "./deserialize";
import { schema } from "./schema";
import type { RichText } from "doc/types/richText";

export function createState(content: RichText | null, additionalPlugins: Plugin[] = []) {
  const plugins = additionalPlugins.concat(getPlugins());
  const config = content ? { doc: deserialize(content), plugins } : { schema, plugins };
  return EditorState.create(config);
}

import { EditorState, type Plugin } from "prosemirror-state";
import { getPlugins, type PluginOptions } from "./plugins";
import { deserialize } from "./deserialize";
import { schema } from "./schema";
import type { RichText } from "doc/types/richText";

export function createState(
  content: RichText | null,
  additionalPlugins: Plugin[] = [],
  options: PluginOptions = {},
) {
  const plugins = additionalPlugins.concat(getPlugins(options));
  const config = content ? { doc: deserialize(content), plugins } : { schema, plugins };
  return EditorState.create(config);
}

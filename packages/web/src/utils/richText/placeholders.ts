import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { schema } from "./schema";

export function placeholders() {
  return new Plugin({
    props: {
      decorations({ doc, selection }) {
        if (!selection.empty) {
          return;
        }
        const { $from } = selection;
        if ($from.parent.type === schema.nodes.heading && $from.parent.content.size === 0) {
          const decoration = Decoration.node($from.before(), $from.after(), {
            placeholder: "Heading",
          });
          return DecorationSet.create(doc, [decoration]);
        }
      },
    },
  });
}

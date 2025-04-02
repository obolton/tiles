import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { schema } from "./schema";

export function placeholders() {
  return new Plugin({
    props: {
      decorations(state) {
        const {
          doc,
          selection: { empty, $from },
        } = state;
        // Empty selection
        if (
          empty &&
          $from.parent.type === schema.nodes.heading &&
          $from.parent.content.size === 0
        ) {
          const decoration = Decoration.node($from.before(), $from.after(), {
            "data-placeholder": "Heading",
          });
          return DecorationSet.create(doc, [decoration]);
        }

        // Empty document
        if (
          doc.childCount === 1 &&
          doc.firstChild?.isTextblock &&
          doc.firstChild.content.size === 0
        ) {
          const decoration = Decoration.node(0, doc.firstChild.nodeSize, {
            "data-placeholder": "Write something…",
          });
          return DecorationSet.create(doc, [decoration]);
        }
      },
    },
  });
}

import { Plugin } from "prosemirror-state";
import { CodeNodeView } from "./CodeNodeView";

export function code() {
  return new Plugin({
    props: {
      nodeViews: {
        code(node, view, getPos) {
          return new CodeNodeView(node, view, getPos);
        },
      },
    },
  });
}

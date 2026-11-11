import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import { schema } from "./schema";

/**
 * Exposes check list items as checkboxes. The role depends on the parent list type rather than the
 * item's `checked` attribute, so items of ordinary lists are never checkboxes.
 */
function checkItemDecorations(doc: Node): DecorationSet {
  const decorations: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (node.type === schema.nodes.check_list) {
      node.forEach((item, offset) => {
        const from = pos + 1 + offset;
        decorations.push(
          Decoration.node(from, from + item.nodeSize, {
            role: "checkbox",
            "aria-checked": item.attrs.checked === true ? "true" : "false",
          }),
        );
      });
    }
    return !node.isTextblock;
  });
  return DecorationSet.create(doc, decorations);
}

class ListItemNodeView implements NodeView, EventListenerObject {
  readonly dom: HTMLLIElement;
  readonly contentDOM: HTMLLIElement;

  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;

  constructor(view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos;

    this.dom = document.createElement("li");
    this.contentDOM = this.dom;
    this.dom.addEventListener("click", this);
  }

  handleEvent(event: Event) {
    if (event.type === "click") {
      this.onClick(event as MouseEvent);
    }
  }

  update(node: Node) {
    return node.type === schema.nodes.list_item;
  }

  private onClick(event: MouseEvent) {
    if (event.defaultPrevented || event.target !== this.dom || this.dom.role !== "checkbox") {
      return;
    }

    const pos = this.getPos();
    if (typeof pos === "undefined") {
      return;
    }

    const checked = this.dom.ariaChecked === "true";
    this.view.dispatch(this.view.state.tr.setNodeAttribute(pos, "checked", !checked));
    event.preventDefault();
  }
}

export function lists() {
  return new Plugin<DecorationSet>({
    state: {
      init: (_config, state) => checkItemDecorations(state.doc),
      apply: (tr, decorations) => (tr.docChanged ? checkItemDecorations(tr.doc) : decorations),
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
      nodeViews: {
        list_item(_node, view, getPos) {
          return new ListItemNodeView(view, getPos);
        },
      },
    },
  });
}

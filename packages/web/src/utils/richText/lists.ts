import { Plugin, type Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Node } from "prosemirror-model";
import { schema } from "./schema";

const listTypes = new Set([
  schema.nodes.ordered_list,
  schema.nodes.unordered_list,
  schema.nodes.check_list,
]);

/**
 * Exposes check list items as checkboxes. The role depends on the parent list type rather than the
 * item's `checked` attribute, so items of ordinary lists are never checkboxes.
 */
function checkItemDecorations(doc: Node, from: number, to: number): Decoration[] {
  const decorations: Decoration[] = [];
  doc.nodesBetween(from, to, (node, pos) => {
    if (node.type === schema.nodes.check_list) {
      node.forEach((item, offset) => {
        const start = pos + 1 + offset;
        decorations.push(
          Decoration.node(start, start + item.nodeSize, {
            role: "checkbox",
            "aria-checked": item.attrs.checked === true ? "true" : "false",
          }),
        );
      });
    }
    return !node.isTextblock;
  });
  return decorations;
}

/** Widens a position to the bounds of its outermost enclosing list, if any. */
function outermostList(doc: Node, pos: number): { from: number; to: number } | null {
  const $pos = doc.resolve(pos);
  for (let depth = 1; depth <= $pos.depth; depth++) {
    if (listTypes.has($pos.node(depth).type)) {
      return { from: $pos.before(depth), to: $pos.after(depth) };
    }
  }
  return null;
}

/** Maps the decorations through a change and rebuilds them only for the lists it touched. */
function updateDecorations(decorations: DecorationSet, tr: Transaction, oldDoc: Node) {
  const mapped = decorations.map(tr.mapping, tr.doc);
  const start = oldDoc.content.findDiffStart(tr.doc.content);
  if (start === null) {
    return mapped;
  }
  const end = Math.max(oldDoc.content.findDiffEnd(tr.doc.content)?.b ?? start, start);
  const from = outermostList(tr.doc, start)?.from ?? start;
  const to = outermostList(tr.doc, end)?.to ?? end;
  return mapped.remove(mapped.find(from, to)).add(tr.doc, checkItemDecorations(tr.doc, from, to));
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
      init: (_config, { doc }) =>
        DecorationSet.create(doc, checkItemDecorations(doc, 0, doc.content.size)),
      apply: (tr, decorations, oldState) =>
        tr.docChanged ? updateDecorations(decorations, tr, oldState.doc) : decorations,
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

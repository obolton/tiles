import { Plugin } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Node } from "prosemirror-model";

class ListItemNodeView implements NodeView, EventListenerObject {
  readonly dom: HTMLLIElement;
  readonly contentDOM: HTMLLIElement;

  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;

  constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
    this.view = view;
    this.getPos = getPos;

    this.dom = document.createElement("li");
    this.contentDOM = this.dom;

    this.setChecked(node.attrs.checked as boolean | undefined);
    this.dom.addEventListener("click", this);
  }

  handleEvent(event: Event) {
    if (event.type === "click") {
      this.onClick(event as MouseEvent);
    }
  }

  update(node: Node) {
    this.setChecked(node.attrs.checked as boolean | undefined);
    return true;
  }

  private setChecked(checked: boolean | undefined) {
    if (typeof checked === "boolean") {
      this.dom.role = "checkbox";
      this.dom.ariaChecked = checked ? "true" : "false";
    } else {
      this.dom.role = null;
      this.dom.ariaChecked = null;
    }
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
  return new Plugin({
    props: {
      nodeViews: {
        list_item(node, view, getPos) {
          return new ListItemNodeView(node, view, getPos);
        },
      },
    },
  });
}

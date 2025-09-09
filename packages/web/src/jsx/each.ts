import { hydrateNode, render } from "./dom";
import type { Reactive } from "@/utils/reactivity";
import type { JSX } from "./jsx";

export interface EachProps<T> {
  items: Reactive<T[]>;
  children: (item: T) => JSX.Node;
}

interface Entry {
  index: number;
  nodes: Node[];
  abort: AbortController;
}

export default class Each<T> implements JSX.ElementClass {
  readonly items: Reactive<T[]>;
  readonly renderItem: (item: T) => JSX.Node;

  private readonly entries: Map<T, Entry> = new Map();
  private anchor: Node | null = null;

  constructor({ items, children }: EachProps<T>) {
    this.items = items;
    this.renderItem = children;

    if (!import.meta.env.SSR) {
      this.items.subscribe(() => this.update());
    }
  }

  hydrate(container: Element, index: number) {
    if (import.meta.env.SSR) {
      throw new Error("Requires browser environment");
    }

    let length = 0;
    const items = this.items.value;

    if (items.length === 0) {
      this.anchor = this.createPlaceholderNode();
      container.insertBefore(this.anchor, container.childNodes[index] ?? null);
      length = 1;
    } else {
      let itemIndex = 0;
      for (const value of items) {
        const abort = new AbortController();
        const itemLength = hydrateNode(
          this.renderItem(value),
          container,
          index + length,
          abort.signal,
        );
        const nodes: Node[] = [];
        for (let j = 0; j < itemLength; j++) {
          const node = container.childNodes[index + length + j]!;
          nodes.push(node);
        }
        this.entries.set(value, { index: itemIndex, nodes, abort });
        itemIndex++;
        length += itemLength;
      }

      this.anchor = container.childNodes[index]!;
    }

    return length;
  }

  render() {
    if (import.meta.env.SSR) {
      return this.items.value.map(this.renderItem);
    }

    this.entries.clear();
    return this.items.value.map((item, index) => {
      const abort = new AbortController();
      const node = render(this.renderItem(item), null, abort.signal);
      this.entries.set(item, {
        index,
        nodes:
          node instanceof DocumentFragment
            ? Array.from(node.childNodes)
            : node
              ? [node]
              : [],
        abort,
      });
      return node;
    });
  }

  private createPlaceholderNode() {
    return document.createComment("");
  }

  private update() {
    if (import.meta.env.SSR) {
      throw new Error("Requires browser environment");
    }

    const parentNode = this.anchor?.parentNode;

    if (!parentNode) {
      throw new Error("Element is disconnected");
    }

    let index = 0;
    let anchor: Node | null = null;
    let referenceNode: Node | null = this.anchor;
    const remainingItems = new Set(this.entries.keys());

    for (const item of this.items.value) {
      remainingItems.delete(item);
      let position = this.entries.get(item);

      // New item
      if (!position) {
        const abort = new AbortController();
        const node = render(this.renderItem(item), null, abort.signal);

        if (node) {
          parentNode.insertBefore(node, referenceNode);
        }

        position = {
          index,
          nodes:
            node instanceof DocumentFragment
              ? Array.from(node.childNodes)
              : node
                ? [node]
                : [],
          abort,
        };
        this.entries.set(item, position);

        // Moved item
      } else if (position.index !== index) {
        position.index = index;

        for (const node of position.nodes) {
          if (node === referenceNode) {
            referenceNode = referenceNode.nextSibling;
          } else {
            parentNode.insertBefore(node, referenceNode);
          }
        }

        // Existing node
      } else {
        referenceNode = position.nodes.at(-1)?.nextSibling ?? null;
      }

      index++;
      anchor ??= position.nodes[0] ?? null;
    }

    // Remove remaining items
    for (const item of remainingItems.values()) {
      const position = this.entries.get(item);

      if (position) {
        const { abort, nodes } = position;

        abort.abort();

        for (const node of nodes) {
          node.parentNode?.removeChild(node);
        }
      }

      this.entries.delete(item);
    }

    this.anchor = anchor;
  }
}
